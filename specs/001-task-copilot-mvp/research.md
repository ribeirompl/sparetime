# Research: SpareTime Task Copilot MVP

**Phase**: 0 (Research & Architecture)
**Date**: 2025-12-14
**Purpose**: Resolve unknowns and document technology best practices

## Research Questions

### 1. Vue 3 Composition API with TypeScript for PWA

**Question**: What are the best practices for structuring a Vue 3 PWA with TypeScript and Composition API?

**Decision**: Use Composition API with `<script setup>` syntax for all components

**Rationale**:
- Composition API provides better TypeScript inference than Options API
- `<script setup>` reduces boilerplate and improves readability
- Composables pattern enables reusable logic extraction (e.g., `useTasks`, `useSuggestions`)
- Better tree-shaking support reduces bundle size (critical for the project's performance budget: target ~200KB gzipped initial JS)

**Alternatives Considered**:
- Options API: Rejected due to poor TypeScript support and less composable logic
- Class-based components: Rejected as deprecated in Vue 3

**Implementation Pattern**:
```typescript
// Example composable pattern
export function useTasks() {
  const taskStore = useTaskStore()
  const tasks = computed(() => taskStore.tasks)

  async function addTask(task: CreateTaskInput) {
    await taskStore.create(task)
  }

  return { tasks, addTask }
}
```

---

### 2. Dexie.js IndexedDB Schema Design

**Question**: How should we structure IndexedDB schemas with Dexie.js to support future migrations while maintaining offline-first integrity?

**Decision**: UUID-based schema with migration infrastructure for future changes

**Rationale**:
- Dexie.js provides declarative schema versioning via `.version()` API
- UUIDs as primary keys enable reliable cross-device sync without ID conflicts
- Support for up to 10,000 tasks requires efficient indexing strategy
- Compound indexes on frequently queried fields (status + type, nextDueDate)
- Soft delete with deletedAt field for sync conflict resolution

**Alternatives Considered**:
- Auto-increment IDs: Rejected - causes sync conflicts when same ID exists on multiple devices
- Runtime migrations: Rejected - adds complexity and offline failure points

**Implementation Pattern**:
```typescript
const db = new Dexie('SparetimeDB')

// Version 1: UUID-based IDs with soft delete
db.version(1).stores({
  tasks: 'id, name, type, status, deadline, [status+type], dependsOnId, recurringPattern.nextDueDate, [recurringPattern.nextDueDate+status], effortLevel, location, deletedAt',
  suggestionSessions: '++id, timestamp',
  syncState: 'id'
})

// Future versions can add new tables or indexes
db.version(2).stores({
  // Add new indexes or tables as needed
}).upgrade(tx => {
  // Migration logic for v1 → v2
})
```

---

### 3. Scoring Algorithm for Task Suggestions

**Question**: How should we implement the equal-weighted scoring model with urgency tiebreaker specified in clarifications?

**Decision**: Normalize each factor to 0-1 scale, sum equally, use urgency delta for ties

**Rationale**:
- Equal weighting (per spec clarification): urgency, deadline proximity, priority, postponement count, time match, effort match, location match
- Linear urgency decay (per clarification): `urgency = daysOverdue` for overdue, `urgency = -daysUntilDue` for future
- Ties broken by urgency value (higher urgency wins)
- Scoring function must execute in <500ms for 10,000 tasks (requires efficient filtering before scoring)

**Alternatives Considered**:
- Weighted scoring: Rejected per user clarification - equal weights preferred
- ML-based ranking: Rejected - too complex for MVP, no training data

**Implementation Pattern**:
```typescript
interface ScoringFactors {
  urgency: number        // Linear: daysOverdue or -daysUntilDue
  deadlineProximity: number  // 1 / daysUntilDeadline (normalized)
  priority: number       // User-set priority (0-1 scale)
  postponements: number  // Count of times dismissed (normalized)
  timeMatch: number      // How well task fits available time (0-1)
  effortMatch: number    // Match with user's current effort level (0-1)
  locationMatch: number  // Match with user's current location (0-1)
}

function calculateScore(task: Task, context: SuggestionContext): number {
  const factors = computeFactors(task, context)
  const applicableFactors = Object.values(factors).filter(v => v !== null)

  // Equal weighting - sum and average
  const score = applicableFactors.reduce((sum, val) => sum + val, 0) / applicableFactors.length

  return score
}

function compareTasks(a: TaskScore, b: TaskScore): number {
  const scoreDiff = b.score - a.score

  // If scores within 0.01 (close), use urgency as tiebreaker
  if (Math.abs(scoreDiff) < 0.01) {
    return b.urgency - a.urgency
  }

  return scoreDiff
}
```

---

### 4. Vite PWA Plugin Configuration for Offline-First

**Question**: What Vite PWA Plugin strategy ensures offline-first behavior while meeting performance constraints?

**Decision**: Use `generateSW` strategy with NetworkFirst for HTML, CacheFirst for assets

**Rationale**:
- `generateSW` (Workbox) automatically handles service worker generation
- NetworkFirst for HTML ensures fresh content when online, falls back to cache offline
- CacheFirst for static assets (JS, CSS, images) maximizes performance
- Precaching strategy for app shell ensures instant offline load
- Runtime caching for Google Drive API responses (when online)

**Alternatives Considered**:
- `injectManifest`: Rejected - manual service worker increases complexity
- CacheFirst for HTML: Rejected - users might see stale UI
- NetworkOnly: Rejected - violates offline-first principle

**Implementation Pattern**:
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'robots.txt'],
      manifest: {
        name: 'SpareTime Task Copilot',
        short_name: 'SpareTime',
        theme_color: '#4F46E5',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.googleapis\.com\/drive\/v3\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-drive-api',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 } // 24 hours
            }
          }
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
      }
    })
  ]
})
```

---

### 5. OAuth Token Storage for Google Drive Backup

**Question**: How should OAuth access tokens be stored in IndexedDB for the optional Google Drive backup feature?

**Decision**: Store tokens as plain text in IndexedDB, relying on browser security model

**Rationale**:
- IndexedDB is origin-isolated (only the app's origin can access it)
- Modern browsers provide disk encryption at the OS level
- OAuth tokens have limited scope (drive.appdata only - app's private folder)
- Tokens expire after 1 hour, limiting exposure window
- User can revoke access at any time through Google Account settings
- Follows standard practice for client-side OAuth applications
- Simplifies implementation and reduces bundle size

**Alternatives Considered**:
- Device-based encryption with Web Crypto API: Rejected - device fingerprints are unstable (browser updates, screen resolution changes, etc.) causing permanent token loss
- User password encryption: Rejected - adds UX friction for an optional feature
- SessionStorage: Rejected - requires frequent re-authentication

**Security Model**:
```typescript
// Simple storage pattern - browser provides security
export interface SyncState {
  id: number // Always 1 - only one sync state record
  accessToken?: string // Plain OAuth token
  lastSyncedAt?: string // ISO date string (renamed from lastSyncTimestamp)
  pendingChanges: Array<{
    taskId: string // UUID
    operation: 'create' | 'update' | 'delete'
    timestamp: string
    data?: Task // Optional task snapshot for conflict resolution
  }>
  conflicts: Array<{
    taskId: string // UUID
    localData: Task
    remoteData: Task
    detectedAt: string // ISO date string
  }>
}

// Store token directly
async function storeAccessToken(token: string): Promise<void> {
  await db.syncState.put({
    id: 1,
    accessToken: token,
    lastSyncedAt: undefined,
    pendingChanges: [],
    conflicts: []
  })
}

// Retrieve token
async function getAccessToken(): Promise<string | null> {
  const state = await db.syncState.get(1)
  return state?.accessToken ?? null
}
```

**Why This Is Safe**:
- Browser origin isolation prevents cross-site access
- Limited token scope minimizes impact if compromised
- Short token lifetime (1 hour) reduces exposure window
- No sensitive data in backup (only task list)
- User maintains control via Google Account settings

---

### 6. Tailwind CSS + Headless UI for Mobile-First PWA

**Question**: How should Tailwind CSS and Headless UI be configured to meet mobile-first and performance requirements?

**Decision**: Use JIT mode, purge unused styles, mobile-first breakpoints, Headless UI for accessible components

**Rationale**:
- Tailwind JIT minimizes CSS bundle size (helps meet <14KB critical CSS target)
- Tailwind JIT minimizes CSS bundle size (helps meet ~14KB critical CSS target)
- Headless UI provides accessible, unstyled components (dialogs, dropdowns, transitions)
- Mobile-first breakpoints (sm:, md:, lg:) enforce mobile-first design
- Touch target utilities ensure ≥44x44px for tap targets

**Alternatives Considered**:
- Custom CSS: Rejected - increases bundle size and development time
- Material Design components: Rejected - too heavy for the initial JS performance budget (~200KB target)
- Inline styles: Rejected - poor maintainability

**Implementation Pattern**:
```typescript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      minWidth: {
        'touch-target': '44px'
      },
      minHeight: {
        'touch-target': '44px'
      }
    }
  },
  plugins: [
    require('@headlessui/tailwindcss')
  ]
}
```

```vue
<!-- Example: Accessible modal with Headless UI + Tailwind -->
<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog @close="isOpen = false" class="relative z-50">
      <div class="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="max-w-sm rounded bg-white p-6">
          <DialogTitle class="text-lg font-medium">Add Task</DialogTitle>
          <!-- Form content -->
        </DialogPanel>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
```

---

### 7. date-fns for Date Calculations

**Question**: How should date-fns be used for recurring task scheduling and urgency calculations?

**Decision**: Use tree-shakeable imports, focus on core date arithmetic functions

**Rationale**:
- date-fns is modular and tree-shakeable (helps meet the initial JS performance budget: target ~200KB gzipped)
- Provides timezone-safe date manipulation (critical for recurring tasks)
- Functions needed: `addDays`, `differenceInDays`, `startOfDay`, `isBefore`, `isAfter`, `parseISO`, `formatISO`
- Avoid moment.js (large bundle) or native Date API (timezone issues)

**Alternatives Considered**:
- Native Date API: Rejected - timezone bugs, poor API ergonomics
- moment.js: Rejected - 67KB minified, no tree-shaking
- Day.js: Considered but date-fns has better TypeScript support

**Implementation Pattern**:
```typescript
import { addDays, differenceInDays, startOfDay, parseISO } from 'date-fns'

function calculateNextDueDate(task: RecurringTask): Date {
  const lastCompleted = parseISO(task.lastCompletedDate)
  const interval = task.recurringPattern.intervalValue
  const unit = task.recurringPattern.intervalUnit // 'days' or 'weeks'

  if (unit === 'weeks') {
    return addDays(lastCompleted, interval * 7)
  }
  return addDays(lastCompleted, interval)
}

function calculateUrgency(task: RecurringTask, now: Date): number {
  const nextDue = calculateNextDueDate(task)
  const diff = differenceInDays(startOfDay(now), startOfDay(nextDue))

  // Linear urgency: positive for overdue, negative for future
  return diff
}
```

---

## Summary of Decisions

| Area | Technology | Decision |
|------|-----------|----------|
| **UI Framework** | Vue 3 Composition API | `<script setup>` with composables pattern |
| **State** | Pinia 3.x | Stores for tasks, suggestions, sync |
| **Database** | Dexie.js 4.x | Version-based schema, compound indexes |
| **PWA** | Vite PWA Plugin | `generateSW`, NetworkFirst for HTML, CacheFirst for assets |
| **Styling** | Tailwind CSS + Headless UI | JIT mode, mobile-first breakpoints, accessible components |
| **Dates** | date-fns | Tree-shakeable imports, core arithmetic functions |
| **Security** | IndexedDB + Browser Security | Plain token storage with origin isolation, limited OAuth scope |
| **Scoring** | Custom algorithm | Equal-weighted factors, urgency tiebreaker, linear decay |
| **Routing** | Vue Router 4 | Hash mode for PWA compatibility |
| **Testing** | Vitest + Playwright | Unit/integration + E2E with offline scenarios |

## Performance Budget Allocation

Based on the initial JS performance budget (~200KB gzipped):

- **Vue 3 core**: ~50KB gzipped
- **Vue Router 4**: ~12KB gzipped
- **Pinia**: ~3KB gzipped
- **Dexie.js**: ~25KB gzipped
- **date-fns** (tree-shaken): ~10KB gzipped
- **Headless UI**: ~15KB gzipped
- **Application code**: ~60KB gzipped (available budget)
- **Buffer**: ~25KB gzipped

**Total**: ~200KB gzipped (target) ✅

## Next Steps

Proceed to Phase 1:
1. Create data-model.md with Dexie.js schemas
2. Define internal TypeScript interfaces (no API contracts needed - client-only)
3. Generate quickstart.md with Vite + Vue 3 + TypeScript setup
4. Update agent context with technology decisions
