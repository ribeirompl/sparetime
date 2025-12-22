# Tasks: SpareTime Task Copilot MVP

**Input**: Design documents from `/specs/001-task-copilot-mvp/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md

**Tests**: TDD approach using Vitest (unit/integration) and Playwright (E2E). Tests are written FIRST and must FAIL before implementation.

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

- [X] T001 Create project structure with src/, public/, tests/ directories per plan.md
- [X] T001a Update .gitignore to include common build artifacts and sensitive files (dist/, .env.local, node_modules/, .cache/, coverage/, .DS_Store, .vscode/, .idea/)
- [X] T002 Initialize Node.js project with package.json (Vue 3.5+, Vite 7.x, TypeScript 5.9+)
- [X] T003 [P] Install core dependencies (vue, vue-router, pinia, dexie, date-fns) per plan.md
- [X] T004 [P] Install dev dependencies (vite, vite-plugin-pwa, typescript, vitest, playwright) per plan.md
- [X] T005 [P] Install styling dependencies (tailwindcss 4.x, @headlessui/vue 1.7+) per plan.md
- [X] T006 [P] Configure TypeScript with tsconfig.json (strict mode, ES2022+) per quickstart.md
- [X] T007 [P] Configure Vite in vite.config.ts with Vue plugin and path aliases
- [X] T008 [P] Configure Tailwind CSS in tailwind.config.js with mobile-first breakpoints and touch target utilities
- [X] T009 [P] Configure ESLint and Prettier for code quality
- [X] T010 [P] Create public/icons directory with placeholder icon files (icon-192.png, icon-512.png, icon-maskable.png)
- [X] T011 Create src/main.ts entry point with Vue app initialization
- [X] T012 Create src/App.vue root component with basic layout structure
- [X] T012a [P] Configure Vitest in vitest.config.ts with jsdom environment and coverage settings
- [X] T012b [P] Configure Playwright in playwright.config.ts for PWA E2E testing (chromium, firefox, webkit)
- [X] T012c [P] Create tests/unit/, tests/integration/, tests/e2e/ directory structure
- [X] T012d [P] Add test scripts to package.json (test, test:unit, test:integration, test:e2e, test:coverage)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T013 Setup IndexedDB schema with Dexie.js in src/db/database.ts (Task, SuggestionSession, SyncState tables)
- [X] T014 [P] Define schema version 1 in src/db/schema.ts with compound indexes per data-model.md
- [X] T015 [P] Create migration infrastructure in src/db/migrations.ts for future schema versions
- [X] T016 [P] Define TypeScript interfaces for Task in src/types/task.ts (TaskType, TaskStatus, EffortLevel, Location)
- [X] T017 [P] Define TypeScript interfaces for RecurringPattern and ProjectSession in src/types/task.ts
- [X] T018 [P] Define TypeScript interfaces for SuggestionSession in src/types/suggestion.ts (SuggestionContext, TaskScore, SuggestionResult)
- [X] T019 [P] Define TypeScript interfaces for SyncState in src/types/sync.ts (EncryptedToken, PendingChange, SyncConflict)
- [X] T020 [P] Create validation utilities in src/utils/validation.ts (validateTask per data-model.md rules)
- [X] T021 [P] Create date helper utilities in src/utils/dateHelpers.ts (wrappers for date-fns functions)
- [X] T022 Configure Vite PWA Plugin in vite.config.ts with generateSW strategy per research.md
- [X] T023 [P] Create PWA manifest in public/manifest.json with app metadata per quickstart.md
- [X] T024 [P] Configure Service Worker with Workbox cache strategies (NetworkFirst for HTML, CacheFirst for assets) in vite.config.ts
- [X] T025 Setup Vue Router in src/router/index.ts with hash mode for PWA compatibility
- [X] T026 [P] Create TasksView route placeholder in src/views/TasksView.vue
- [X] T027 [P] Create SuggestionsView route placeholder in src/views/SuggestionsView.vue
- [X] T028 [P] Create SettingsView route placeholder in src/views/SettingsView.vue
- [X] T029 Initialize Pinia store structure in src/stores/taskStore.ts with basic state interface
- [X] T030 [P] Initialize Pinia store structure in src/stores/suggestionStore.ts with basic state interface
- [X] T031 [P] Initialize Pinia store structure in src/stores/syncStore.ts with basic state interface

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Capture and Estimate Tasks (Priority: P1) 🎯 MVP

**Goal**: Allow users to quickly capture tasks (one-off, recurring, projects) with mandatory time estimates, effort levels, and locations, persisted in IndexedDB for offline access

**Independent Test**: Add various task types (one-off errands, recurring chores, multi-session projects), edit time estimates, verify data persists offline in IndexedDB. Go offline and verify tasks remain editable.

### Tests for User Story 1 (Write FIRST - must FAIL before implementation) ⚠️

- [X] T032a [P] [US1] Unit test: validateTask rejects invalid time estimates (<1 or >480 min) in tests/unit/utils/validation.test.ts
- [X] T032b [P] [US1] Unit test: validateTask rejects missing mandatory fields (name, type, effort, location) in tests/unit/utils/validation.test.ts
- [X] T032c [P] [US1] Unit test: calculateNextDueDate correctly adds days/weeks/months/years in tests/unit/utils/dateHelpers.test.ts
- [X] T032d [P] [US1] Unit test: detectCircularDependency returns true for A→B→A chains in tests/unit/utils/validation.test.ts
- [X] T032e [P] [US1] Integration test: taskStore.create persists task to IndexedDB in tests/integration/stores/taskStore.test.ts
- [X] T032f [P] [US1] Integration test: taskStore.update modifies existing task in IndexedDB in tests/integration/stores/taskStore.test.ts
- [X] T032g [P] [US1] Integration test: taskStore.delete removes task from IndexedDB in tests/integration/stores/taskStore.test.ts
- [X] T032h [P] [US1] Integration test: recurring task nextDueDate auto-computed on create in tests/integration/stores/taskStore.test.ts
- [X] T032i [P] [US1] E2E test: user adds one-off task via form and sees it in list in tests/e2e/tasks.spec.ts
- [X] T032j [P] [US1] E2E test: user adds recurring task with interval pattern in tests/e2e/tasks.spec.ts
- [X] T032k [P] [US1] E2E test: user edits task and changes persist after page reload in tests/e2e/tasks.spec.ts
- [X] T032l [P] [US1] E2E test: tasks persist when app goes offline and returns in tests/e2e/offline.spec.ts

### Implementation for User Story 1

- [X] T032 [P] [US1] Create Task interface implementation in src/db/database.ts with all mandatory fields per data-model.md
- [X] T033 [P] [US1] Implement CreateTaskInput and UpdateTaskInput interfaces in src/types/task.ts
- [X] T034 [US1] Implement task CRUD operations in src/stores/taskStore.ts (create, read, update, delete, list)
- [X] T035 [US1] Add task validation logic in src/stores/taskStore.ts using validateTask utility
- [X] T036 [US1] Implement recurring task next due date calculation in src/utils/dateHelpers.ts using date-fns (note: date-fns handles month-end edge cases by rolling to next valid date, e.g., Jan 31 + 1 month = Feb 28/29)
- [X] T037 [US1] Implement dependency validation (prevent circular dependencies) in src/utils/validation.ts
- [X] T038 [P] [US1] Create TaskForm component in src/components/tasks/TaskForm.vue (name, type, time, effort, location, priority fields)
- [X] T039 [P] [US1] Create TaskCard component in src/components/tasks/TaskCard.vue to display task summary
- [X] T040 [P] [US1] Create TaskList component in src/components/tasks/TaskList.vue to render multiple TaskCard components
- [X] T041 [US1] Implement TasksView in src/views/TasksView.vue with TaskList and "Add Task" button
- [X] T042 [US1] Add form fields for recurring pattern (interval value, interval unit, last completed date) in TaskForm.vue
- [X] T043 [US1] Add form fields for project session (minimum session duration) in TaskForm.vue
- [X] T044 [US1] Add optional dependency selection dropdown in TaskForm.vue to specify dependsOnId
- [X] T045 [US1] Implement task editing flow (click task → open TaskForm with existing data → save updates)
- [X] T046 [US1] Add offline persistence verification (manual test: go offline, add/edit task, refresh page)
- [X] T047 [P] [US1] Style TaskForm with Tailwind CSS mobile-first breakpoints and ≥44x44px touch targets
- [X] T048 [P] [US1] Style TaskCard and TaskList with Tailwind CSS for mobile-first display

**Checkpoint**: At this point, User Story 1 should be fully functional - users can add, edit, and view tasks offline

---

## Phase 4: User Story 2 - Declare Available Time and Get Suggestions (Priority: P1) 🎯 MVP

**Goal**: Allow users to declare available time and receive 3-5 ranked task suggestions that fit within that window, fully offline

**Independent Test**: With tasks from US1 in the system, declare time availability (e.g., "30 minutes") and verify system returns 3-5 task suggestions that fit the time constraint, ranked by urgency. Test completely offline. Verify dependency blocking works (tasks depending on incomplete tasks don't appear).

### Tests for User Story 2 (Write FIRST - must FAIL before implementation) ⚠️

- [ ] T049a [P] [US2] Unit test: scoring algorithm returns normalized 0-1 scores in tests/unit/services/scoring.test.ts
- [ ] T049b [P] [US2] Unit test: scoring uses equal weighting for all factors in tests/unit/services/scoring.test.ts
- [ ] T049c [P] [US2] Unit test: urgency tiebreaker sorts correctly when scores are equal in tests/unit/services/scoring.test.ts
- [ ] T049d [P] [US2] Unit test: calculateUrgency returns positive for overdue, negative for future in tests/unit/services/urgency.test.ts
- [ ] T049e [P] [US2] Integration test: suggestionStore filters tasks exceeding available time in tests/integration/stores/suggestionStore.test.ts
- [ ] T049f [P] [US2] Integration test: suggestionStore excludes tasks with incomplete dependencies in tests/integration/stores/suggestionStore.test.ts
- [ ] T049g [P] [US2] Integration test: suggestionStore returns max 5 suggestions sorted by score in tests/integration/stores/suggestionStore.test.ts
- [ ] T049h [P] [US2] Integration test: completing task A makes dependent task B available in tests/integration/stores/suggestionStore.test.ts
- [ ] T049i [P] [US2] Integration test: completing recurring task resets urgency and calculates new nextDueDate in tests/integration/stores/taskStore.test.ts
- [ ] T049j [P] [US2] E2E test: user enters time and sees 3-5 suggestions in tests/e2e/suggestions.spec.ts
- [ ] T049k [P] [US2] E2E test: user marks suggestion complete and it disappears from list in tests/e2e/suggestions.spec.ts
- [ ] T049l [P] [US2] E2E test: suggestion cards show reason explanations in tests/e2e/suggestions.spec.ts
- [ ] T049m [P] [US2] E2E test: no tasks match time shows appropriate message in tests/e2e/suggestions.spec.ts

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

### Tests for User Story 3 (Write FIRST - must FAIL before implementation) ⚠️

- [ ] T066a [P] [US3] Unit test: scoring includes effortMatch factor when filter provided in tests/unit/services/scoring.test.ts
- [ ] T066b [P] [US3] Unit test: scoring includes locationMatch factor when filter provided in tests/unit/services/scoring.test.ts
- [ ] T066c [P] [US3] Unit test: location "anywhere" matches all location filters in tests/unit/services/scoring.test.ts
- [ ] T066d [P] [US3] Integration test: suggestionStore filters by effort level in tests/integration/stores/suggestionStore.test.ts
- [ ] T066e [P] [US3] Integration test: suggestionStore filters by location in tests/integration/stores/suggestionStore.test.ts
- [ ] T066f [P] [US3] Integration test: combined effort+location filters return intersection in tests/integration/stores/suggestionStore.test.ts
- [ ] T066g [P] [US3] E2E test: selecting "low effort" filter shows only low effort tasks in tests/e2e/suggestions.spec.ts
- [ ] T066h [P] [US3] E2E test: selecting "home" location filter shows home+anywhere tasks in tests/e2e/suggestions.spec.ts
- [ ] T066i [P] [US3] E2E test: no matches with filters shows context message in tests/e2e/suggestions.spec.ts

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

### Tests for User Story 4 (Write FIRST - must FAIL before implementation) ⚠️

- [ ] T074a [P] [US4] Unit test: urgency = daysOverdue for overdue recurring tasks in tests/unit/services/urgency.test.ts
- [ ] T074b [P] [US4] Unit test: urgency = -daysUntilDue for future recurring tasks in tests/unit/services/urgency.test.ts
- [ ] T074c [P] [US4] Unit test: urgency = 0 for tasks due today in tests/unit/services/urgency.test.ts
- [ ] T074d [P] [US4] Integration test: overdue tasks rank higher than due-today tasks in tests/integration/stores/suggestionStore.test.ts
- [ ] T074e [P] [US4] Integration test: completing recurring task resets urgency to 0 in tests/integration/stores/taskStore.test.ts
- [ ] T074f [P] [US4] Integration test: nextDueDate calculated from completion time, not original due in tests/integration/stores/taskStore.test.ts
- [ ] T074g [P] [US4] E2E test: overdue task shows red urgency indicator in tests/e2e/tasks.spec.ts
- [ ] T074h [P] [US4] E2E test: suggestion reason shows "X days overdue" for overdue tasks in tests/e2e/suggestions.spec.ts

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

### Tests for User Story 5 (Write FIRST - must FAIL before implementation) ⚠️

- [ ] T082a [P] [US5] Unit test: deriveKey produces consistent key from same deviceId+salt in tests/unit/utils/crypto.test.ts
- [ ] T082b [P] [US5] Unit test: encryptToken/decryptToken round-trips successfully in tests/unit/utils/crypto.test.ts
- [ ] T082c [P] [US5] Unit test: GoogleDriveBackup JSON includes version, timestamp, checksum in tests/unit/services/googleDrive.test.ts
- [ ] T082d [P] [US5] Integration test: syncStore exports all tasks to JSON format in tests/integration/stores/syncStore.test.ts
- [ ] T082e [P] [US5] Integration test: syncStore imports JSON and restores tasks to IndexedDB in tests/integration/stores/syncStore.test.ts
- [ ] T082f [P] [US5] Integration test: pendingChanges queue stores offline edits in tests/integration/stores/syncStore.test.ts
- [ ] T082g [P] [US5] Integration test: sync conflict resolution keeps newest by timestamp in tests/integration/stores/syncStore.test.ts
- [ ] T082h [P] [US5] E2E test: enable backup button triggers OAuth flow in tests/e2e/sync.spec.ts
- [ ] T082i [P] [US5] E2E test: sync status shows "Synced" after successful backup in tests/e2e/sync.spec.ts
- [ ] T082j [P] [US5] E2E test: disable backup revokes token and stops syncing in tests/e2e/sync.spec.ts

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
- [ ] T111 Optimize bundle size (establish performance budget: target ~200KB gzipped initial JS; CI warns >200KB; implement code-splitting, lazy-loading, and monitoring)
- [ ] T112 Run Lighthouse audit and verify scores ≥90 all categories
- [ ] T113 Test PWA installation on iOS Safari 15+ and Android Chrome 90+
- [ ] T114 Test offline functionality after clearing cache and going offline
- [ ] T115 Verify First Contentful Paint <1.5s on 4G throttled connection
- [ ] T116 [P] Add README.md with quickstart instructions
- [ ] T117 [P] Add inline code comments for complex logic (scoring, urgency, crypto)
- [ ] T118 Run quickstart.md validation (verify all steps work for new developer)
- [ ] T119 Create sample tasks data for demo/testing purposes
- [ ] T120 Setup GitHub Actions CI/CD pipeline in .github/workflows/ with build/deploy to GitHub Pages, unit tests, linting, TypeScript checks, Lighthouse CI for PWA validation, Dependabot config, security audits, and dependency/build caching
- [ ] T121 Final code cleanup and refactoring for consistency

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

- **Tests first** (all tests written before any implementation)
- Run tests → verify all FAIL (RED phase)
- Models/interfaces before stores (stores depend on types)
- Stores before components (components use store actions)
- Core components before views (views compose components)
- Data operations before UI styling
- Run tests after each implementation → verify progressive PASS (GREEN phase)

### Parallel Opportunities

- **Setup Phase**: T003-T005 (dependency installations), T006-T009 (config files), T010 (icons), T012a-T012d (test framework) can all run in parallel
- **Foundational Phase**: T014-T019 (type definitions), T020-T021 (utilities), T023-T024 (PWA config), T026-T028 (view placeholders), T030-T031 (store structures) can all run in parallel
- **User Story Tests**: All tests within a user story can be written in parallel before implementation
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
- T012a: Configure Vitest
- T012b: Configure Playwright
- T012c: Create test directories
- T012d: Add test scripts
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
Write all tests first (parallel):
- T032a-T032d: Unit tests (validation, dateHelpers)
- T032e-T032h: Integration tests (taskStore)
- T032i-T032l: E2E tests (tasks, offline)
→ Run tests → ALL MUST FAIL

Then implement sequentially:
- T032: Task interface implementation
- T033: Input interfaces
- T034: Task CRUD operations
- T035: Validation logic
- T036: Recurring calculations
- T037: Dependency validation

Then parallel (after core logic):
- T038: TaskForm component
- T039: TaskCard component
- T040: TaskList component
- T047: TaskForm styling
- T048: TaskCard/List styling
→ Run tests → ALL MUST PASS
```

---

## Implementation Strategy

### TDD Workflow (Per User Story)

For each user story, follow this RED-GREEN-REFACTOR cycle:

1. **Write all tests first** (tasks marked with "Tests for User Story X")
   - Run tests → ALL MUST FAIL (RED)
   - If any test passes before implementation, the test is wrong
2. **Implement functionality** (tasks marked with "Implementation for User Story X")
   - Run tests after each implementation task → tests should progressively pass (GREEN)
3. **Refactor** if needed while keeping tests green
4. **Commit** after each test+implementation pair passes

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (includes Vitest + Playwright config)
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
   - Write all 12 tests first (T032a-T032l) → verify all FAIL
   - Implement (T032-T048) → verify tests progressively PASS
4. Complete Phase 4: User Story 2
   - Write all 13 tests first (T049a-T049m) → verify all FAIL
   - Implement (T049-T065) → verify tests progressively PASS
5. **STOP and VALIDATE**: Run full test suite (`npm test`) - all 25 MVP tests must pass
6. Run basic Polish tasks (T101-T106, T111-T115)
7. Deploy/demo MVP

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready (test framework configured)
2. Add User Story 1 → Write tests → Implement → All 12 tests pass → Deploy/Demo
3. Add User Story 2 → Write tests → Implement → All 13 tests pass → Deploy/Demo (MVP! 🎯)
4. Add User Story 3 → Write tests → Implement → All 9 tests pass → Deploy/Demo
5. Add User Story 4 → Write tests → Implement → All 8 tests pass → Deploy/Demo
6. Add User Story 5 → Write tests → Implement → All 10 tests pass → Deploy/Demo
7. Complete Polish phase → Run full suite (52 tests) → Final release

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

- **Total Tasks**: 173
- **Setup Phase**: 16 tasks (includes test framework configuration)
- **Foundational Phase**: 19 tasks (BLOCKS all user stories)
- **User Story 1 (P1 MVP)**: 29 tasks (12 tests + 17 implementation) - Task CRUD with offline persistence
- **User Story 2 (P1 MVP)**: 30 tasks (13 tests + 17 implementation) - Time-based suggestions with dependency blocking
- **User Story 3 (P2)**: 17 tasks (9 tests + 8 implementation) - Context filtering for suggestions
- **User Story 4 (P2)**: 16 tasks (8 tests + 8 implementation) - Urgency tracking
- **User Story 5 (P3)**: 29 tasks (10 tests + 19 implementation) - Google Drive backup with OAuth
- **Polish Phase**: 21 tasks - Cross-cutting improvements

**Test Coverage**:
- **Unit Tests (Vitest)**: 22 tests across utils/, services/
- **Integration Tests (Vitest)**: 20 tests for store operations with IndexedDB
- **E2E Tests (Playwright)**: 20 tests for user flows across views

**TDD Workflow**:
1. Write test first (RED) - test must fail
2. Implement minimal code to pass (GREEN)
3. Refactor if needed
4. Commit after each test+implementation pair

**Parallel Opportunities**:
- 9 tasks in Setup can run in parallel
- 15+ tasks in Foundational can run in parallel
- Multiple tasks within each user story can run in parallel
- All user stories can be worked on in parallel after Foundational completes

**MVP Scope**: User Stories 1 + 2 (25 tests + 34 implementation tasks after foundation) - delivers core task copilot functionality with full test coverage

**Independent Test Criteria**:
- **US1**: Add tasks offline, edit them, refresh page - data persists
- **US2**: Declare time, get ranked suggestions, mark complete - works offline
- **US3**: Add context filters - only matching tasks appear
- **US4**: Create overdue recurring tasks - urgency increases, ranking changes
- **US5**: Enable backup, clear local data, restore - data returns from Drive

**Format Validation**: ✅ All tasks follow checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
