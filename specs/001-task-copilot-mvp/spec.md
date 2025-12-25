# Feature Specification: SpareTime Task Copilot MVP

**Feature Branch**: `001-task-copilot-mvp`
**Created**: 2025-12-14
**Status**: Draft
**Input**: User description: "SpareTime task copilot for managing home chores and personal projects with time-based suggestions"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture and Estimate Tasks (Priority: P1) 🎯 MVP

As a busy person with limited free time, I need to quickly capture tasks (both one-off and recurring chores) with time estimates so that the system can later help me decide what to work on.

**Why this priority**: Without a task inventory, no suggestions can be made. This is the foundational data entry capability that enables all other features.

**Independent Test**: Can be fully tested by adding various task types (one-off errands, recurring chores, multi-session projects), editing time estimates, and verifying data persists offline in IndexedDB. Delivers immediate value as a simple task list.

**Acceptance Scenarios**:

1. **Given** I open the app for the first time, **When** I tap "Add Task", **Then** I see a form with fields for task name, type (one-off/recurring/project), time estimate (minutes with presets 15/30/60), effort level (low/medium/high), location (home/outside/anywhere), priority (defaults to 5), and optional notes
2. **Given** I'm adding a recurring task, **When** I select "recurring" type, **Then** I see additional fields for interval pattern (e.g., "every 5 days", "every 2 weeks", "every 1 month", "every 1 year") and last completed date (defaults to today's date). The deadline field is hidden for recurring tasks.
3. **Given** I'm adding a personal project, **When** I select "project" type, **Then** I can specify minimum session duration (the only mandatory field for projects), allowing work to be broken into repeatable chunks until the project is marked complete. The deadline field is hidden for projects.
4. **Given** I'm adding a one-off task, **When** I select "one-off" type, **Then** I can optionally set a deadline date for the task
5. **Given** I have an existing task, **When** I edit its time estimate or details, **Then** changes are saved immediately to IndexedDB
6. **Given** I'm adding or editing a task, **When** I access task details, **Then** I can optionally specify that this task depends on another task being completed first
7. **Given** I'm editing a one-off task with a deadline, **When** I change its type to recurring or project, **Then** the deadline field is cleared and hidden

---

### User Story 2 - Declare Available Time and Get Suggestions (Priority: P1) 🎯 MVP

As someone with unpredictable free time, I need to tell the system how much time I have right now and receive a short list of task suggestions that fit within that window so I can quickly decide what to work on without analysis paralysis.

**Why this priority**: This is the core copilot functionality - turning task inventory into actionable recommendations. Together with US1, this forms the Minimum Viable Product.

**Independent Test**: With tasks from US1 in the system, declare time availability (e.g., "30 minutes") and verify the system returns 3-5 task suggestions that fit the time constraint, ranked by urgency and other factors. Can be tested completely offline.

**Acceptance Scenarios**:

1. **Given** I have tasks in my list, **When** I tap "What should I do?" and enter "30 minutes available", **Then** I see 3-5 task suggestions that can be completed within 30 minutes (or fewer if less than 3 tasks match criteria)
2. **Given** I receive task suggestions, **When** I review them, **Then** each suggestion shows task name, estimated time, urgency indicator, and reason for suggestion
3. **Given** I see task suggestions, **When** I select one and mark it complete, **Then** it's removed from future suggestions and urgency tracking stops
4. **Given** I have recurring tasks overdue by different amounts, **When** I request suggestions, **Then** more overdue tasks appear higher in the ranking
5. **Given** I have no tasks that fit my available time, **When** I request suggestions, **Then** I see a message like "No tasks fit in 30 minutes. Try 45+ minutes or break projects into smaller sessions"
6. **Given** Task B depends on Task A being completed, **When** I request suggestions and Task A is not yet complete, **Then** Task B does not appear in suggestions
7. **Given** Task B depends on Task A, **When** I mark Task A as complete and request suggestions, **Then** Task B becomes available and can appear in suggestions
8. **Given** I declare "8 hours" available time, **When** I request suggestions, **Then** system returns up to 5 suggestions prioritizing project sessions and tasks that fit the full window, with message "You have time for multiple tasks - complete one and request new suggestions"

---

### User Story 3 - Add Context Filters for Better Suggestions (Priority: P2)

As a user with varying effort capacity throughout the day, I want to optionally provide context filters (effort level, location) when declaring time so that suggestions match my current capacity and situation.

**Why this priority**: Enhances suggestion quality but not essential for MVP. US1+US2 provide core value; context filtering is an enhancement.

**Independent Test**: Create tasks with different effort levels and locations. When requesting suggestions with context filters (e.g., "low effort" or "at home"), verify only matching tasks appear.

**Acceptance Scenarios**:

1. **Given** I'm declaring available time, **When** I optionally specify "low effort" as context filter, **Then** suggestions only include tasks with low effort level
2. **Given** I specify "home" as location context filter, **When** I request suggestions, **Then** only tasks with location "home" or "anywhere" appear
3. **Given** I specify both "low effort" and "outside" location filters, **When** I request suggestions, **Then** only tasks matching both criteria appear
4. **Given** multiple context filters are applied, **When** generating suggestions, **Then** tasks matching all filters are ranked by urgency and other scoring factors

---

### User Story 4 - Track Urgency Over Time (Priority: P2)

As a user managing recurring chores, I want overdue tasks to naturally become more urgent over time so that I can see which tasks need attention most without manual prioritization.

**Why this priority**: Improves recurring task management but not strictly necessary for initial MVP. Users can manually assess urgency in US2 suggestions.

**Independent Test**: Create recurring tasks with different intervals (e.g., water plants every 3 days, vacuum every week). Advance system time or wait real days. Verify urgency scores increase for overdue tasks and are reflected in suggestion ranking.

**Acceptance Scenarios**:

1. **Given** I have a recurring task "water plants every 3 days", **When** 3 days pass without completion, **Then** its urgency score begins increasing
2. **Given** a task is 2 days overdue, **When** I request suggestions, **Then** it ranks higher than tasks due today
3. **Given** I complete an overdue recurring task, **When** it's marked done, **Then** urgency resets to zero and next due date is calculated from completion time
4. **Given** multiple recurring tasks have different decay rates, **When** viewing task list or suggestions, **Then** visual urgency indicators (colors, icons) reflect current urgency levels
5. **Given** I have a recurring task "clean gutters every month", that is not due yet and another recurring task "take out trash every week" that is due sooner, **When** I request suggestions, **Then** "take out trash" appears before "clean gutters" despite both being recurring tasks that are not yet overdue.

---

### User Story 5 - Enable Google Drive Sync (Priority: P3)

As a user who values data safety and cross-device access, I want to optionally enable Google Drive sync so that my task data is automatically synchronized across devices with intelligent merge handling.

**Why this priority**: Important for data safety and multi-device use, but not core to the task copilot experience. Users can use the app fully offline without sync.

**Independent Test**: Enable Google Drive sync via OAuth consent flow. Verify two-way sync merges local and remote changes. Test conflict detection when same task modified on multiple devices. Verify offline changes queue and sync when back online.

**Security Model**: OAuth access tokens are stored in IndexedDB, which is origin-isolated and protected by browser security. Tokens expire after 1 hour and have limited scope (drive.appdata only). Users can revoke access at any time through Google Account settings.

**Acceptance Scenarios**:

1. **Given** I'm in app settings, **When** I tap "Enable Google Drive Sync", **Then** I'm redirected to Google OAuth consent screen
2. **Given** I grant OAuth permissions, **When** authentication completes and both local and remote have data, **Then** I see a merge dialog with options: "Merge Both", "Use Google Drive Data", or "Use This Device's Data"
3. **Given** sync is enabled, **When** I make changes to tasks, **Then** changes automatically sync to Google Drive after 2 seconds of inactivity (debounced)
4. **Given** I have sync enabled, **When** remote data changes, **Then** app checks for updates every 5 minutes and automatically merges changes
5. **Given** I'm offline with sync enabled, **When** I make task changes, **Then** changes are queued locally and sync automatically when connectivity returns
6. **Given** I modify the same task on two devices, **When** sync runs, **Then** system detects the conflict and keeps the version with the latest updatedAt timestamp
7. **Given** sync is enabled, **When** I disable it in settings, **Then** OAuth token is revoked, polling stops, and no further syncs occur (local data remains)
8. **Given** I soft-delete a task, **When** sync runs, **Then** the deletion syncs to other devices and task is permanently removed after 30 days

---

### Edge Cases

- **No tasks in system**: When user requests suggestions but has no tasks, show onboarding message: "Add a task to get started"
- **All tasks exceed available time**: If no tasks fit declared time window, suggest breaking projects into smaller sessions or increasing time availability
- **Conflicting context filters**: If context filters (e.g., "low energy" + "requires high focus") exclude all tasks, show "No tasks match your current context. Try adjusting filters or adding more tasks."
- **Google Drive sync conflicts**: If same task modified on multiple devices since last sync, system detects conflict. Conflicts are resolved by keeping the version with the latest updatedAt timestamp. Both versions are temporarily preserved in syncState.conflicts for review
- **Task soft delete**: When a task is deleted, it's marked with deletedAt timestamp and hidden from UI. After 30 days, it's permanently removed. This allows sync to propagate deletions across devices
- **Storage quota exceeded**: If IndexedDB approaches quota limits, warn user and suggest archiving completed tasks or enabling export/cleanup
- **Recurring task completion during interval**: If user completes a recurring task early (before due), next due date calculates from completion time, not original due date
- **Project session interruption**: If user abandons a project mid-session, it remains available for next time-based suggestion without penalty
- **Very long time declarations**: If user declares excessive time (e.g., "8 hours"), system suggests project sessions and multiple tasks in sequence
- **Invalid time estimates**: UI prevents entry of negative, zero, or above 480 minutes (8 hours) time estimates; API validation returns error if invalid values bypass UI
- **Circular dependencies**: System prevents circular task dependencies (A depends on B, B depends on A) during task creation/editing, showing validation error
- **Dependency chain completion**: When Task A (with dependencies B→C→D) is completed, all dependent tasks in the chain become available for suggestions
- **Dependency on deleted task**: If a task's dependency is deleted, the dependent task becomes immediately available (dependency is removed automatically). For multi-level chains (A→B→C), if B is deleted, A's dependency is removed and A becomes available; C's dependency remains on B (which no longer exists) so C also becomes available

## Clarifications

### Session 2025-12-14

- Q: How should scoring model factors (urgency, deadlines, priority, etc.) be weighted when ranking suggestions? → A: Equal weighting with urgency as tiebreaker when scores are close
- Q: What is the decay curve shape for urgency increase in recurring tasks? → A: Linear growth (urgency increases proportionally to days overdue, and decreases proportionally for tasks not yet due)
- Q: What should the system display when fewer than 3 tasks match criteria? → A: Show all available matches (1-2 tasks) without padding or special messaging
- Q: What is the maximum allowed time estimate for a single task or session? → A: 480 minutes (8 hours), with UI validation preventing invalid entry and API returning errors
- Q: How should OAuth tokens be stored? → A: Plain text in IndexedDB, relying on browser's origin isolation, disk encryption, and limited token scope (drive.appdata). Tokens expire after 1 hour.
- Q: What units should recurring intervals support? → A: Days, weeks, months, and years (intervalValue 1-999)
- Q: Should effort and location be optional or mandatory? → A: Mandatory on all tasks; priority defaults to 5 if not specified
- Q: Should invalid inputs have defaults? → A: No - UI prevents invalid entry, API returns validation errors

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create tasks with mandatory fields: name, type (one-off/recurring/project), time estimate (1-480 minutes), effort level (low/medium/high), and location (home/outside/anywhere)
- **FR-002**: System MUST support recurring tasks with flexible interval patterns (e.g., "every N days/weeks/months/years") rather than fixed calendar dates
- **FR-002a**: System MUST allow users to specify last completed date (date only, no time component) when creating recurring tasks, defaulting to today's date
- **FR-003**: System MUST allow personal projects to specify minimum session duration in minutes (the only mandatory project-specific field), enabling repeatable work sessions until the project is marked complete
- **FR-004**: System MUST persist all task data in IndexedDB as the authoritative source of truth
- **FR-005**: System MUST generate task suggestions based on user-declared available time, returning only tasks that fit within the time window
- **FR-006**: System MUST rank task suggestions using a scoring model that considers urgency, deadlines, priority (defaults to 5), postponement history, time estimate fit, and effort level match with equal weighting, using urgency as tiebreaker when scores are close. When context filters (effort/location) are provided, they contribute to scoring; when omitted, those factors are excluded from the average calculation
- **FR-007**: System MUST allow users to mark tasks as complete, removing them from future suggestions
- **FR-008**: System MUST implement a urgency tracking model where recurring tasks become more urgent over time using linear calculation: `urgency = daysOverdue` (positive for overdue tasks, negative for future tasks). For example, a task 2 days overdue has urgency=2, a task due in 3 days has urgency=-3
- **FR-009**: System MUST require effort level and location on all tasks, and support optional context filters (effort, location) when requesting suggestions
- **FR-010**: System MUST work fully offline after initial load, with no dependency on network connectivity for core functionality
- **FR-011**: System MUST support optional Google Drive backup via OAuth, storing task data as JSON in private app data folder
- **FR-012**: System MUST queue local changes and sync to Google Drive automatically when connectivity is restored (if backup enabled)
- **FR-013**: System MUST allow users to export all task data as JSON at any time for portability
- **FR-014**: System MUST allow users to delete all local data with a single action
- **FR-015**: System MUST provide clear sync status indicators showing whether changes are backed up to Google Drive (if backup enabled) and when last sync occurred
- **FR-016**: System MUST handle sync conflicts by using last-modified timestamp to determine newest version
- **FR-017**: System MUST validate time estimates (1-480 minutes) at the application layer (store/service validation) and return validation errors for invalid inputs, with UI preventing invalid entry
- **FR-018**: System MUST provide explainable suggestions, showing why each task was recommended (e.g., "overdue by 2 days", "fits your 30-minute window", "high priority")
- **FR-019**: System MUST allow users to specify that a task depends on another task being completed first
- **FR-020**: System MUST exclude tasks with incomplete dependencies from suggestion results
- **FR-021**: System MUST prevent circular task dependencies and display validation errors when detected
- **FR-022**: System MUST automatically remove dependency references when a dependency target task is deleted

### Key Entities *(include if feature involves data)*

- **Task**: Represents a single actionable item with attributes:
  - ID (unique identifier)
  - Name/description
  - Type (one-off, recurring, project)
  - Time estimate in minutes (1-480, mandatory)
  - Effort level (low/medium/high, mandatory)
  - Location (home/outside/anywhere, mandatory)
  - Priority level (0-10, defaults to 5)
  - Deadline (optional)
  - Created date, last modified date
  - Status (active, completed, archived)
  - Relationships: For recurring tasks (interval pattern with hours/days/weeks/months/years units, last completed date, next due date); For projects (minimum session duration in minutes only - no total duration tracked, project marked complete when fully done)
  - Dependencies: Optional reference to another Task ID that must be completed before this task appears in suggestions

- **Recurring Pattern**: Defines repetition rules for recurring tasks:
  - Interval value (1-999) and unit (days, weeks, months, years)
  - Urgency decay rate (how fast urgency increases when overdue)
  - Last completion timestamp
  - Next due calculation logic

- **Suggestion Session**: Represents a user query for task recommendations:
  - Timestamp
  - Available time declared in minutes
  - Optional context filters (effort level, location)
  - Generated suggestions (list of Task IDs with scores)
  - User action taken (task selected, dismissed, postponed)

- **Sync State** (if Google Drive backup enabled):
  - OAuth token (stored plain text in IndexedDB, protected by browser origin isolation)
  - Last sync timestamp
  - Pending changes queue (for offline edits)
  - Conflict resolution log

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a new task and see it persisted offline within 1 second
- **SC-002**: System generates 3-5 task suggestions within 500ms of user declaring available time
- **SC-003**: Task suggestions fit within declared time window 100% of the time (no suggestions exceed available time)
- **SC-004**: Users can mark tasks complete and see them removed from suggestions immediately
- **SC-005**: Recurring tasks automatically calculate next due date after completion with no user intervention
- **SC-006**: System works fully offline after initial app load, including task CRUD operations and suggestion generation
- **SC-007**: When online with backup enabled, task changes sync to Google Drive within 30 seconds
- **SC-008**: Google Drive backup/restore completes successfully for datasets up to 10,000 tasks
- **SC-009**: App meets PWA Lighthouse scores ≥90 across all categories (Performance, Accessibility, Best Practices, PWA)
- **SC-010**: First Contentful Paint occurs in under 1.5 seconds on 4G throttled connection
- **SC-011**: Initial JS bundle target: ~200KB gzipped; CI warns when >200KB (monitor and optimize critical-path payload)
- **SC-012**: Users successfully complete task addition flow in under 60 seconds (usability benchmark)
- **SC-013**: Suggestion explanations are displayed for 100% of recommended tasks, providing transparency
- **SC-014**: IndexedDB storage quota warnings trigger before reaching 80% capacity
- **SC-015**: 95% of users successfully enable Google Drive backup on first attempt (measured by OAuth completion rate)
