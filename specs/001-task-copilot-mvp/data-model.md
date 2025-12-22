# Data Model: SpareTime Task Copilot MVP

**Phase**: 1 (Design)
**Date**: 2025-12-14
**Source**: Entities from [spec.md](./spec.md) + research decisions

## Overview

This document defines the IndexedDB schema managed by Dexie.js, TypeScript interfaces, and data relationships for the SpareTime Task Copilot MVP. All data is stored client-side in IndexedDB as the single source of truth.

## Entity Relationship Diagram

```
┌─────────────────────────┐
│       Task              │
│─────────────────────────│
│ id: number (PK)         │
│ name: string            │
│ type: TaskType          │
│ timeEstimateMinutes: n  │
│ effortLevel: Effort     │
│ location: Location      │
│ status: TaskStatus      │
│ priority?: number       │
│ deadline?: Date         │
│ dependsOnId?: number    │◄─┐
│ createdAt: Date         │  │ Self-reference
│ updatedAt: Date         │──┘ (task dependencies)
│ recurringPattern?: RP   │
│ projectSession?: PS     │
└─────────────────────────┘
           │
           │ 1:many
           ▼
┌─────────────────────────┐
│  SuggestionSession      │
│─────────────────────────│
│ id: number (PK)         │
│ timestamp: Date         │
│ availableTimeMinutes: n │
│ contextFilters?: Filters│
│ suggestions: TaskScore[]│
│ actionTaken?: Action    │
└─────────────────────────┘

┌─────────────────────────┐
│      SyncState          │
│─────────────────────────│
│ id: 'singleton' (PK)    │
│ encryptedToken?: Enc    │
│ lastSyncTimestamp?: Date│
│ pendingChanges: Change[]│
│ conflicts: Conflict[]   │
└─────────────────────────┘
```

## Dexie.js Schema Definition

### Version 1 (Initial Schema)

```typescript
import Dexie, { Table } from 'dexie'

export interface Task {
  id?: number // Auto-increment primary key
  name: string
  type: 'one-off' | 'recurring' | 'project'
  timeEstimateMinutes: number // 1-480 minutes, mandatory
  effortLevel: 'low' | 'medium' | 'high' // Mandatory
  location: 'home' | 'outside' | 'anywhere' // Mandatory
  status: 'active' | 'completed' | 'archived'
  priority: number // 0-10, defaults to 5
  deadline?: string // ISO date string, optional
  dependsOnId?: number // FK to another task
  createdAt: string // ISO date string
  updatedAt: string // ISO date string

  // Recurring-specific fields
  recurringPattern?: {
    intervalValue: number // 1-999
    intervalUnit: 'hours' | 'days' | 'weeks' | 'months' | 'years'
    lastCompletedDate: string // ISO date string
    nextDueDate: string // ISO date string (computed)
  }

  // Project-specific fields
  projectSession?: {
    minSessionDurationMinutes: number // 1-480 minutes, MANDATORY for project type
    // Note: For project tasks, timeEstimateMinutes is set equal to minSessionDurationMinutes
    // since projects are ongoing and don't have a total completion time.
    // The suggestion engine uses minSessionDurationMinutes to filter by available time.
  }
}

export interface SuggestionSession {
  id?: number // Auto-increment primary key
  timestamp: string // ISO date string
  availableTimeMinutes: number // minutes declared by user
  contextFilters?: {
    effortLevel?: 'low' | 'medium' | 'high'
    location?: 'home' | 'outside' | 'anywhere'
  }
  suggestions: Array<{
    taskId: number
    score: number
    urgency: number
    reason: string
  }>
  actionTaken?: {
    type: 'completed' | 'dismissed' | 'postponed'
    taskId?: number
    timestamp: string
  }
}

export interface SyncState {
  id: 'singleton' // Always 'singleton' - only one sync state record
  encryptedToken?: {
    encrypted: ArrayBuffer
    salt: Uint8Array
    iv: Uint8Array
  }
  lastSyncTimestamp?: string // ISO date string
  pendingChanges: Array<{
    taskId: number
    operation: 'create' | 'update' | 'delete'
    timestamp: string
  }>
  conflicts: Array<{
    taskId: number
    localVersion: Task
    remoteVersion: Task
    timestamp: string
  }>
}

export class SparetimeDatabase extends Dexie {
  tasks!: Table<Task, number>
  suggestionSessions!: Table<SuggestionSession, number>
  syncState!: Table<SyncState, string>

  constructor() {
    super('SparetimeDB')

    this.version(1).stores({
      tasks: '++id, name, type, status, deadline, [status+type], dependsOnId, recurringPattern.nextDueDate, [recurringPattern.nextDueDate+status], effortLevel, location',
      suggestionSessions: '++id, timestamp',
      syncState: 'id'
    })
  }
}

export const db = new SparetimeDatabase()
```

### Index Strategy

**Compound Indexes Rationale**:

1. `[status+type]`: Filter active/completed tasks by type (used in task list views)
2. `[recurringPattern.nextDueDate+status]`: Efficiently query active recurring tasks by due date (urgency calculations)
3. `dependsOnId`: Quickly find tasks that depend on a given task (dependency checking)
4. `recurringPattern.nextDueDate`: Sort recurring tasks by urgency

**Query Performance**:
- Single task lookup: O(log n) via primary key
- Active tasks by type: O(log n) via compound index
- Dependency check: O(log n) via dependsOnId index
- Suggestion generation: Filter by status+type, then score in-memory (~1000 tasks analyzed in <100ms)

## TypeScript Interfaces

### Task Types

```typescript
export type TaskType = 'one-off' | 'recurring' | 'project'

export type TaskStatus = 'active' | 'completed' | 'archived'

export type EffortLevel = 'low' | 'medium' | 'high'

export type Location = 'home' | 'outside' | 'anywhere'

export interface RecurringPattern {
  intervalValue: number // 1-999
  intervalUnit: 'hours' | 'days' | 'weeks' | 'months' | 'years'
  lastCompletedDate: string // ISO date string
  nextDueDate: string // ISO date string (computed)
}

export interface ProjectSession {
  minSessionDurationMinutes: number // 1-480 minutes
}

export interface CreateTaskInput {
  name: string
  type: TaskType
  timeEstimateMinutes: number // 1-480
  effortLevel: EffortLevel // Mandatory
  location: Location // Mandatory
  priority: number // 0-10, required (UI defaults to 5)
  deadline?: Date
  dependsOnId?: number
  recurringPattern?: Omit<RecurringPattern, 'nextDueDate'> // nextDueDate computed automatically
  projectSession?: ProjectSession
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: number
}
```

### Suggestion Types

```typescript
export interface SuggestionContext {
  availableTimeMinutes: number // minutes
  contextFilters?: {
    effortLevel?: EffortLevel
    location?: Location
  }
}

export interface TaskScore {
  taskId: number
  task: Task
  score: number // 0-1 normalized score
  urgency: number // Linear: positive for overdue, negative for future
  reason: string // Human-readable explanation
  factors: {
    urgency: number
    deadlineProximity: number | null
    priority: number // Always present (defaults to 5)
    postponements: number
    timeMatch: number // How well task fits available time
    effortMatch: number | null // Match with user's effort filter
    locationMatch: number | null // Match with user's location filter
  }
}

export interface SuggestionResult {
  suggestions: TaskScore[]
  filteredCount: number // How many tasks matched filters
  totalActiveCount: number // Total active tasks in system
  message?: string // e.g., "No tasks fit in 30 minutes"
}
```

### Sync Types

```typescript
export interface EncryptedToken {
  encrypted: ArrayBuffer
  salt: Uint8Array
  iv: Uint8Array
}

export interface PendingChange {
  taskId: number
  operation: 'create' | 'update' | 'delete'
  timestamp: string // ISO date string
}

export interface SyncConflict {
  taskId: number
  localVersion: Task
  remoteVersion: Task
  timestamp: string
}

export interface GoogleDriveBackup {
  version: number // Schema version
  exportTimestamp: string
  tasks: Task[]
  checksum: string // SHA-256 hash for integrity verification
}
```

## Data Validation Rules

### Task Validation

```typescript
export const TaskValidation = {
  name: {
    minLength: 1,
    maxLength: 200,
    required: true
  },
  timeEstimateMinutes: {
    min: 1, // minutes
    max: 480, // 8 hours (per spec clarification)
    required: true
  },
  effortLevel: {
    values: ['low', 'medium', 'high'],
    required: true
  },
  location: {
    values: ['home', 'outside', 'anywhere'],
    required: true
  },
  priority: {
    min: 0,
    max: 10,
    default: 5,
    required: true
  },
  recurringPattern: {
    intervalValue: {
      min: 1,
      max: 999 // Support hours/days/weeks/months/years with wide range
    },
    intervalUnit: {
      values: ['hours', 'days', 'weeks', 'months', 'years']
    }
  },
  projectSession: {
    minSessionDurationMinutes: {
      min: 1, // At least 1 minute
      max: 480, // 8 hours max
      required: true // Mandatory for project type tasks
      // Note: For project tasks, this value is also used as timeEstimateMinutes
      // since projects are ongoing and the suggestion engine needs to know
      // the minimum time required for a productive work session
    }
  }
}

export function validateTask(input: CreateTaskInput): ValidationResult {
  const errors: string[] = []

  if (!input.name || input.name.length < 1 || input.name.length > 200) {
    errors.push('Task name must be 1-200 characters')
  }

  if (input.timeEstimateMinutes < 1 || input.timeEstimateMinutes > 480) {
    errors.push('Time estimate must be 1-480 minutes')
  }

  if (!input.effortLevel || !['low', 'medium', 'high'].includes(input.effortLevel)) {
    errors.push('Effort level is required and must be low, medium, or high')
  }

  if (!input.location || !['home', 'outside', 'anywhere'].includes(input.location)) {
    errors.push('Location is required and must be home, outside, or anywhere')
  }

  if (input.priority === undefined || input.priority === null) {
    errors.push('Priority is required')
  } else if (input.priority < 0 || input.priority > 10) {
    errors.push('Priority must be between 0 and 10')
  }

  // Circular dependency check
  if (input.dependsOnId) {
    const wouldCreateCycle = checkCircularDependency(input.dependsOnId, /* task being created/updated */)
    if (wouldCreateCycle) {
      errors.push('Circular dependency detected')
    }
  }

  return { valid: errors.length === 0, errors, sanitizedInput: input }
}
```

## Data Migration Strategy

### Future Schema Versions

```typescript
// Example: Version 2 might add tags or categories
db.version(2).stores({
  tasks: '++id, name, type, status, deadline, [status+type], dependsOnId, recurringPattern.nextDueDate, [recurringPattern.nextDueDate+status], *tags',
  suggestionSessions: '++id, timestamp',
  syncState: 'id',
  tags: '++id, name' // New table
}).upgrade(async tx => {
  // Migrate existing tasks to add empty tags array
  await tx.table('tasks').toCollection().modify(task => {
    task.tags = []
  })
})

// Version 3 might add completed task archive
db.version(3).stores({
  tasks: '++id, name, type, status, deadline, [status+type], dependsOnId, recurringPattern.nextDueDate, [recurringPattern.nextDueDate+status], *tags',
  suggestionSessions: '++id, timestamp',
  syncState: 'id',
  tags: '++id, name',
  archivedTasks: '++id, originalId, name, completedAt' // New table for completed tasks
}).upgrade(async tx => {
  // Move completed tasks older than 90 days to archive
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const oldCompletedTasks = await tx.table('tasks')
    .where('status').equals('completed')
    .and(task => new Date(task.updatedAt) < ninetyDaysAgo)
    .toArray()

  for (const task of oldCompletedTasks) {
    await tx.table('archivedTasks').add({
      originalId: task.id,
      name: task.name,
      completedAt: task.updatedAt
    })
    await tx.table('tasks').delete(task.id!)
  }
})
```

## Storage Estimates

**Per-entity storage**:
- Task: ~500 bytes average (200 char name + metadata + optional fields)
- SuggestionSession: ~200 bytes (timestamp + scores + action)
- SyncState: ~2KB (encrypted token + pending changes)

**10,000 task capacity**:
- Tasks: 10,000 × 500 bytes = 5MB
- Suggestion history (last 100 sessions): 100 × 200 bytes = 20KB
- Sync state: 2KB
- **Total**: ~5.2MB (well under IndexedDB limits of 50MB+ on most devices)

**Quota monitoring**:
```typescript
export async function checkStorageQuota(): Promise<StorageEstimate> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    const percentUsed = (estimate.usage! / estimate.quota!) * 100

    return {
      usage: estimate.usage!,
      quota: estimate.quota!,
      percentUsed,
      shouldWarn: percentUsed > 80 // Warn at 80% per spec
    }
  }
  return { usage: 0, quota: 0, percentUsed: 0, shouldWarn: false }
}
```

## Next Steps

1. Generate contracts/ directory (skip - no API contracts needed for client-only PWA)
2. Create quickstart.md with project setup instructions
3. Update agent context with technology stack
