# Tasks: SpareTime Task Copilot MVP

**Input**: Design documents from `/specs/001-task-copilot-mvp/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md

**Tests**: Tests are NOT included - specification does not request TDD approach

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **PWA client-only**: `src/`, `public/`, `tests/` at repository root
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure with src/, public/, tests/ directories per plan.md
- [ ] T002 Initialize Node.js project with package.json (Vue 3.5+, Vite 7.x, TypeScript 5.9+)
- [ ] T003 [P] Install core dependencies (vue, vue-router, pinia, dexie, date-fns) per plan.md
- [ ] T004 [P] Install dev dependencies (vite, vite-plugin-pwa, typescript, vitest, playwright) per plan.md
- [ ] T005 [P] Install styling dependencies (tailwindcss 4.x, @headlessui/vue 1.7+) per plan.md
- [ ] T006 [P] Configure TypeScript with tsconfig.json (strict mode, ES2022+) per quickstart.md
- [ ] T007 [P] Configure Vite in vite.config.ts with Vue plugin and path aliases
- [ ] T008 [P] Configure Tailwind CSS in tailwind.config.js with mobile-first breakpoints and touch target utilities
- [ ] T009 [P] Configure ESLint and Prettier for code quality
- [ ] T010 [P] Create public/icons directory with placeholder icon files (icon-192.png, icon-512.png, icon-maskable.png)
- [ ] T011 Create src/main.ts entry point with Vue app initialization
- [ ] T012 Create src/App.vue root component with basic layout structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T013 Setup IndexedDB schema with Dexie.js in src/db/database.ts (Task, SuggestionSession, SyncState tables)
- [ ] T014 [P] Define schema version 1 in src/db/schema.ts with compound indexes per data-model.md
- [ ] T015 [P] Create migration infrastructure in src/db/migrations.ts for future schema versions
- [ ] T016 [P] Define TypeScript interfaces for Task in src/types/task.ts (TaskType, TaskStatus, EffortLevel, Location)
- [ ] T017 [P] Define TypeScript interfaces for RecurringPattern and ProjectSession in src/types/task.ts
- [ ] T018 [P] Define TypeScript interfaces for SuggestionSession in src/types/suggestion.ts (SuggestionContext, TaskScore, SuggestionResult)
- [ ] T019 [P] Define TypeScript interfaces for SyncState in src/types/sync.ts (EncryptedToken, PendingChange, SyncConflict)
- [ ] T020 [P] Create validation utilities in src/utils/validation.ts (validateTask per data-model.md rules)
- [ ] T021 [P] Create date helper utilities in src/utils/dateHelpers.ts (wrappers for date-fns functions)
- [ ] T022 Configure Vite PWA Plugin in vite.config.ts with generateSW strategy per research.md
- [ ] T023 [P] Create PWA manifest in public/manifest.json with app metadata per quickstart.md
- [ ] T024 [P] Configure Service Worker with Workbox cache strategies (NetworkFirst for HTML, CacheFirst for assets) in vite.config.ts
- [ ] T025 Setup Vue Router in src/router/index.ts with hash mode for PWA compatibility
- [ ] T026 [P] Create TasksView route placeholder in src/views/TasksView.vue
- [ ] T027 [P] Create SuggestionsView route placeholder in src/views/SuggestionsView.vue
- [ ] T028 [P] Create SettingsView route placeholder in src/views/SettingsView.vue
- [ ] T029 Initialize Pinia store structure in src/stores/taskStore.ts with basic state interface
- [ ] T030 [P] Initialize Pinia store structure in src/stores/suggestionStore.ts with basic state interface
- [ ] T031 [P] Initialize Pinia store structure in src/stores/syncStore.ts with basic state interface

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Capture and Estimate Tasks (Priority: P1) 🎯 MVP

**Goal**: Allow users to quickly capture tasks (one-off, recurring, projects) with mandatory time estimates, effort levels, and locations, persisted in IndexedDB for offline access

**Independent Test**: Add various task types (one-off errands, recurring chores, multi-session projects), edit time estimates, verify data persists offline in IndexedDB. Go offline and verify tasks remain editable.

### Implementation for User Story 1

- [ ] T032 [P] [US1] Create Task interface implementation in src/db/database.ts with all mandatory fields per data-model.md
- [ ] T033 [P] [US1] Implement CreateTaskInput and UpdateTaskInput interfaces in src/types/task.ts
- [ ] T034 [US1] Implement task CRUD operations in src/stores/taskStore.ts (create, read, update, delete, list)
- [ ] T035 [US1] Add task validation logic in src/stores/taskStore.ts using validateTask utility
- [ ] T036 [US1] Implement recurring task next due date calculation in src/utils/dateHelpers.ts using date-fns (note: date-fns handles month-end edge cases by rolling to next valid date, e.g., Jan 31 + 1 month = Feb 28/29)
- [ ] T037 [US1] Implement dependency validation (prevent circular dependencies) in src/utils/validation.ts
- [ ] T038 [P] [US1] Create TaskForm component in src/components/tasks/TaskForm.vue (name, type, time, effort, location, priority fields)
- [ ] T039 [P] [US1] Create TaskCard component in src/components/tasks/TaskCard.vue to display task summary
- [ ] T040 [P] [US1] Create TaskList component in src/components/tasks/TaskList.vue to render multiple TaskCard components
- [ ] T041 [US1] Implement TasksView in src/views/TasksView.vue with TaskList and "Add Task" button
- [ ] T042 [US1] Add form fields for recurring pattern (interval value, interval unit, last completed date) in TaskForm.vue
- [ ] T043 [US1] Add form fields for project session (minimum session duration) in TaskForm.vue
- [ ] T044 [US1] Add optional dependency selection dropdown in TaskForm.vue to specify dependsOnId
- [ ] T045 [US1] Implement task editing flow (click task → open TaskForm with existing data → save updates)
- [ ] T046 [US1] Add offline persistence verification (manual test: go offline, add/edit task, refresh page)
- [ ] T047 [P] [US1] Style TaskForm with Tailwind CSS mobile-first breakpoints and ≥44x44px touch targets
- [ ] T048 [P] [US1] Style TaskCard and TaskList with Tailwind CSS for mobile-first display

**Checkpoint**: At this point, User Story 1 should be fully functional - users can add, edit, and view tasks offline

---

## Phase 4: User Story 2 - Declare Available Time and Get Suggestions (Priority: P1) 🎯 MVP

**Goal**: Allow users to declare available time and receive 3-5 ranked task suggestions that fit within that window, fully offline

**Independent Test**: With tasks from US1 in the system, declare time availability (e.g., "30 minutes") and verify system returns 3-5 task suggestions that fit the time constraint, ranked by urgency. Test completely offline. Verify dependency blocking works (tasks depending on incomplete tasks don't appear).

### Implementation for User Story 2

- [ ] T049 [P] [US2] Create scoring algorithm in src/services/scoring.ts (equal-weighted factors per research.md)
- [ ] T050 [P] [US2] Implement urgency calculation in src/services/urgency.ts (linear decay: daysOverdue for recurring tasks)
- [ ] T051 [US2] Implement suggestion generation logic in src/stores/suggestionStore.ts (filter by time, score, rank)
- [ ] T052 [US2] Add dependency filtering in src/stores/suggestionStore.ts (exclude tasks with incomplete dependencies)
- [ ] T053 [US2] Implement suggestion session storage in src/stores/suggestionStore.ts (save to suggestionSessions table)
- [ ] T054 [US2] Add task completion action in src/stores/taskStore.ts (mark complete, remove from suggestions)
- [ ] T055 [US2] Implement recurring task completion logic (calculate next due date, reset urgency) in src/stores/taskStore.ts
- [ ] T056 [US2] Handle edge case: no tasks match available time (return message "No tasks fit in X minutes")
- [ ] T057 [P] [US2] Create TimeInput component in src/components/suggestions/TimeInput.vue (declare available minutes)
- [ ] T058 [P] [US2] Create SuggestionCard component in src/components/suggestions/SuggestionCard.vue (task name, time, urgency, reason)
- [ ] T059 [P] [US2] Create SuggestionList component in src/components/suggestions/SuggestionList.vue (display 3-5 suggestions)
- [ ] T060 [US2] Implement SuggestionsView in src/views/SuggestionsView.vue with TimeInput and SuggestionList
- [ ] T061 [US2] Add "Mark Complete" action button in SuggestionCard component
- [ ] T062 [US2] Add suggestion reason explanations in SuggestionCard (e.g., "overdue by 2 days", "fits your 30-minute window")
- [ ] T063 [US2] Verify dependency chain completion (when Task A completes, dependent Task B becomes available)
- [ ] T064 [P] [US2] Style TimeInput with Tailwind CSS mobile-first design and touch targets
- [ ] T065 [P] [US2] Style SuggestionCard and SuggestionList with Tailwind CSS

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - core MVP is complete

---

## Phase 5: User Story 3 - Add Context Filters for Better Suggestions (Priority: P2)

**Goal**: Allow users to optionally provide context filters (effort level, location) when declaring time to match current capacity and situation

**Independent Test**: Create tasks with different effort levels and locations. When requesting suggestions with context filters (e.g., "low effort" or "at home"), verify only matching tasks appear.

### Implementation for User Story 3

- [ ] T066 [P] [US3] Extend SuggestionContext interface in src/types/suggestion.ts to include optional contextFilters
- [ ] T067 [US3] Implement context filter logic in src/stores/suggestionStore.ts (filter by effort and/or location)
- [ ] T068 [US3] Update scoring algorithm in src/services/scoring.ts to include effortMatch and locationMatch factors
- [ ] T069 [P] [US3] Add effort level filter dropdown in TimeInput component (src/components/suggestions/TimeInput.vue)
- [ ] T070 [P] [US3] Add location filter dropdown in TimeInput component (src/components/suggestions/TimeInput.vue)
- [ ] T071 [US3] Update SuggestionsView in src/views/SuggestionsView.vue to pass context filters to suggestion generation
- [ ] T072 [US3] Handle edge case: no tasks match all filters (show message "No tasks match your current context")
- [ ] T073 [P] [US3] Style context filter dropdowns with Tailwind CSS and Headless UI Listbox components

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Track Urgency Over Time (Priority: P2)

**Goal**: Implement urgency tracking model where recurring tasks become more urgent over time (linear calculation for overdue tasks)

**Independent Test**: Create recurring tasks with different intervals (e.g., water plants every 3 days, vacuum every week). Advance system time or wait real days. Verify urgency scores increase for overdue tasks and are reflected in suggestion ranking.

### Implementation for User Story 4

- [ ] T074 [US4] Implement linear urgency tracking formula in src/services/urgency.ts (urgency = daysOverdue for overdue, -daysUntilDue for future)
- [ ] T075 [US4] Add urgency calculation to suggestion scoring in src/stores/suggestionStore.ts
- [ ] T076 [US4] Ensure urgency resets to zero when recurring task is completed in src/stores/taskStore.ts
- [ ] T077 [US4] Calculate next due date from completion time (not original due date) in src/stores/taskStore.ts
- [ ] T078 [P] [US4] Add visual urgency indicators in TaskCard component (colors, icons based on urgency level)
- [ ] T079 [P] [US4] Add visual urgency indicators in SuggestionCard component (highlight overdue tasks)
- [ ] T080 [US4] Update suggestion reason explanations to mention urgency level (e.g., "2 days overdue")
- [ ] T081 [P] [US4] Style urgency indicators with Tailwind CSS (red for overdue, yellow for due soon, green for not due)

**Checkpoint**: At this point, User Stories 1-4 should all work independently with urgency tracking

---

## Phase 7: User Story 5 - Enable Google Drive Backup (Priority: P3)

**Goal**: Allow users to optionally enable Google Drive backup via OAuth, storing task data as JSON in private app data folder

**Independent Test**: Enable Google Drive backup via OAuth consent flow. Verify JSON export of tasks is uploaded to private Google Drive app data folder. Clear local IndexedDB and verify restore from Drive backup. Test without affecting offline functionality.

### Implementation for User Story 5

- [ ] T082 [P] [US5] Create Web Crypto API utilities in src/utils/crypto.ts (deriveKey, encryptToken, decryptToken per research.md)
- [ ] T083 [P] [US5] Implement device fingerprinting in src/utils/crypto.ts for key derivation
- [ ] T084 [US5] Create Google Drive API service in src/services/googleDrive.ts (OAuth, upload, download, delete)
- [ ] T085 [US5] Implement OAuth consent flow in src/services/googleDrive.ts using Google Identity Services
- [ ] T086 [US5] Implement task data export to JSON in src/stores/syncStore.ts (GoogleDriveBackup interface per data-model.md)
- [ ] T087 [US5] Implement task data import/restore from JSON in src/stores/syncStore.ts
- [ ] T088 [US5] Add encrypted token storage in syncState table using Web Crypto API
- [ ] T089 [US5] Implement pending changes queue in src/stores/syncStore.ts for offline edits
- [ ] T090 [US5] Implement automatic sync when connectivity returns in src/stores/syncStore.ts
- [ ] T091 [US5] Implement sync conflict resolution using last-modified timestamp in src/stores/syncStore.ts
- [ ] T092 [P] [US5] Create GoogleDriveSync component in src/components/settings/GoogleDriveSync.vue (enable/disable backup)
- [ ] T093 [P] [US5] Create SyncStatus component in src/components/settings/SyncStatus.vue (show sync state, last sync time)
- [ ] T094 [US5] Implement SettingsView in src/views/SettingsView.vue with GoogleDriveSync and SyncStatus components
- [ ] T095 [US5] Add "Enable Google Drive Backup" button that triggers OAuth consent flow
- [ ] T096 [US5] Add "Disable Backup" button that revokes OAuth token
- [ ] T097 [US5] Add manual sync trigger button in SettingsView
- [ ] T098 [US5] Add sync/backup status indicator in App.vue (shows if changes are synced to Google Drive when backup enabled)
- [ ] T099 [P] [US5] Style SettingsView and sync components with Tailwind CSS
- [ ] T100 [US5] Add environment variable handling for VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY

**Checkpoint**: All user stories (1-5) should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T101 [P] Implement storage quota monitoring in src/utils/validation.ts (checkStorageQuota per data-model.md with 80% threshold trigger)
- [ ] T102 [P] Add storage quota warning UI in App.vue (trigger at 80% usage)
- [ ] T103 [P] Create export all data to JSON feature in SettingsView (FR-013)
- [ ] T104 [P] Create delete all local data feature in SettingsView (FR-014)
- [ ] T105 [P] Add loading states to all async operations (task CRUD, suggestions, sync)
- [ ] T106 [P] Add error boundary handling in App.vue for graceful error display
- [ ] T107 [P] Create common Button component in src/components/common/Button.vue with touch target sizes
- [ ] T108 [P] Create common Input component in src/components/common/Input.vue with validation states
- [ ] T109 [P] Create common Modal component in src/components/common/Modal.vue using Headless UI Dialog
- [ ] T110 [P] Add accessibility labels and ARIA attributes to all interactive components
- [ ] T111 Optimize bundle size (verify <200KB gzipped JS per constitution)
- [ ] T112 Run Lighthouse audit and verify scores ≥90 all categories
- [ ] T113 Test PWA installation on iOS Safari 15+ and Android Chrome 90+
- [ ] T114 Test offline functionality after clearing cache and going offline
- [ ] T115 Verify First Contentful Paint <1.5s on 4G throttled connection
- [ ] T116 [P] Add README.md with quickstart instructions
- [ ] T117 [P] Add inline code comments for complex logic (scoring, urgency, crypto)
- [ ] T118 Run quickstart.md validation (verify all steps work for new developer)
- [ ] T119 Create sample tasks data for demo/testing purposes
- [ ] T120 Final code cleanup and refactoring for consistency

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order: US1 (P1) → US2 (P1) → US3 (P2) → US4 (P2) → US5 (P3)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Integrates with US1 task data but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Extends US2 suggestion engine but independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Enhances US2 suggestions with urgency but independently testable
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Optional backup feature, fully independent

### Within Each User Story

- Models/interfaces before stores (stores depend on types)
- Stores before components (components use store actions)
- Core components before views (views compose components)
- Data operations before UI styling

### Parallel Opportunities

- **Setup Phase**: T003-T005 (dependency installations), T006-T009 (config files), T010 (icons) can all run in parallel
- **Foundational Phase**: T014-T019 (type definitions), T020-T021 (utilities), T023-T024 (PWA config), T026-T028 (view placeholders), T030-T031 (store structures) can all run in parallel
- **User Story 1**: T032-T033 (types), T038-T040 (components), T047-T048 (styling) can run in parallel after core logic
- **User Story 2**: T049-T050 (services), T057-T059 (components), T064-T065 (styling) can run in parallel after core logic
- **User Story 3**: T069-T070 (filter UI), T073 (styling) can run in parallel
- **User Story 4**: T078-T079 (urgency indicators), T081 (styling) can run in parallel
- **User Story 5**: T082-T083 (crypto utilities), T092-T093 (components), T099 (styling) can run in parallel
- **Polish Phase**: T101-T104, T107-T110, T116-T117 (documentation/components) can run in parallel

---

## Parallel Execution Examples

### Setup Phase

```text
Launch in parallel:
- T003: Install core dependencies
- T004: Install dev dependencies
- T005: Install styling dependencies
- T006: Configure TypeScript
- T007: Configure Vite
- T008: Configure Tailwind
- T009: Configure ESLint/Prettier
- T010: Create icon placeholders
```

### Foundational Phase (After Setup Complete)

```text
Launch in parallel:
- T014: Define schema version 1
- T015: Create migrations infrastructure
- T016: Task interfaces
- T017: Recurring/Project interfaces
- T018: Suggestion interfaces
- T019: Sync interfaces
- T020: Validation utilities
- T021: Date utilities
- T023: PWA manifest
- T024: Service Worker config
```

### User Story 1 (After Foundational Complete)

```text
Sequential first:
- T032: Task interface implementation
- T033: Input interfaces
- T034: Task CRUD operations
- T035: Validation logic
- T036: Recurring calculations
- T037: Dependency validation

Then parallel:
- T038: TaskForm component
- T039: TaskCard component
- T040: TaskList component
- T047: TaskForm styling
- T048: TaskCard/List styling
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Task CRUD)
4. Complete Phase 4: User Story 2 (Suggestions)
5. **STOP and VALIDATE**: Test US1+US2 independently offline
6. Run basic Polish tasks (T101-T106, T111-T115)
7. Deploy/demo MVP

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Basic task list!)
3. Add User Story 2 → Test independently → Deploy/Demo (MVP with suggestions! 🎯)
4. Add User Story 3 → Test independently → Deploy/Demo (Enhanced filtering)
5. Add User Story 4 → Test independently → Deploy/Demo (Urgency tracking)
6. Add User Story 5 → Test independently → Deploy/Demo (Full feature set with backup)
7. Complete Polish phase → Final release

### Parallel Team Strategy

With multiple developers after Foundational phase completes:

- **Developer A**: User Story 1 (Task CRUD)
- **Developer B**: User Story 2 (Suggestions) - can start in parallel since it uses IndexedDB directly
- **Developer C**: User Story 5 (Google Drive) - fully independent
- After US1+US2 complete:
  - **Developer D**: User Story 3 (Context Filters) - extends US2
  - **Developer E**: User Story 4 (Urgency Decay) - extends US2

---

## Summary

- **Total Tasks**: 120
- **Setup Phase**: 12 tasks
- **Foundational Phase**: 19 tasks (BLOCKS all user stories)
- **User Story 1 (P1 MVP)**: 17 tasks - Task CRUD with offline persistence
- **User Story 2 (P1 MVP)**: 17 tasks - Time-based suggestions with dependency blocking
- **User Story 3 (P2)**: 8 tasks - Context filtering for suggestions
- **User Story 4 (P2)**: 8 tasks - Urgency tracking
- **User Story 5 (P3)**: 19 tasks - Google Drive backup with OAuth
- **Polish Phase**: 20 tasks - Cross-cutting improvements

**Parallel Opportunities**:
- 9 tasks in Setup can run in parallel
- 15+ tasks in Foundational can run in parallel
- Multiple tasks within each user story can run in parallel
- All user stories can be worked on in parallel after Foundational completes

**MVP Scope**: User Stories 1 + 2 (34 implementation tasks after foundation) - delivers core task copilot functionality

**Independent Test Criteria**:
- **US1**: Add tasks offline, edit them, refresh page - data persists
- **US2**: Declare time, get ranked suggestions, mark complete - works offline
- **US3**: Add context filters - only matching tasks appear
- **US4**: Create overdue recurring tasks - urgency increases, ranking changes
- **US5**: Enable backup, clear local data, restore - data returns from Drive

**Format Validation**: ✅ All tasks follow checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
