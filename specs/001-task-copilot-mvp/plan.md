# Implementation Plan: SpareTime Task Copilot MVP

**Branch**: `001-task-copilot-mvp` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-task-copilot-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a mobile-first PWA task copilot that helps users manage home chores and personal projects with time-based suggestions. The system stores tasks (one-off, recurring with days/weeks/months/years intervals, or multi-session projects) with time estimates (1-480 minutes), effort levels (low/medium/high), and locations (home/outside/anywhere) in IndexedDB, then generates 3-5 ranked suggestions when users declare available time. Core MVP includes task CRUD operations with mandatory effort/location fields and suggestion engine working fully offline. Optional enhancements include context filtering by effort/location, urgency tracking for recurring tasks, and Google Drive backup via OAuth.

## Technical Context

**Language/Version**: TypeScript 5.9+ with ES2022+ features, strict mode enabled
**Primary Dependencies**: Vue 3.5+ (Composition API), Dexie.js 4.x (IndexedDB wrapper), Vite 7.x (build tool), Vite PWA Plugin 1.x (service worker generation), Pinia 3.x (state management), Vue Router 4.6+ (routing), date-fns 4.x (date calculations), Tailwind CSS 4.x (styling), Headless UI 1.7+ (accessible components)
**Storage**: IndexedDB via Dexie.js (primary source of truth), Google Drive API with OAuth 2.0 for optional backup
**Testing**: Vitest 4.x (unit/integration), Playwright 1.57+ (E2E PWA testing including offline scenarios)
**Target Platform**: PWA installable on iOS Safari 15+, Android Chrome 90+, Desktop Chrome/Edge/Firefox latest
**Project Type**: pwa-client-only (no backend, fully client-side)
**Performance Goals**: Lighthouse ≥90 all categories, First Contentful Paint <1.5s, Time to Interactive <3.5s, Largest Contentful Paint <2.5s
**Constraints**: Initial JS bundle target ~200KB gzipped; CI should warn if bundle >200KB. App must be offline-capable after initial load, touch targets ≥44x44px, Web Crypto API encryption for OAuth tokens
**Scale/Scope**: Support up to 10,000 tasks, 5 user stories (2 P1 MVP, 2 P2, 1 P3), ~15-20 Vue components, IndexedDB schema v1 with migration support

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Mobile-First & Offline-First ✅ PASS
- ✅ Vue 3 with Composition API supports mobile-first responsive design
- ✅ Tailwind CSS mobile-first breakpoints specified in Technical Context
- ✅ IndexedDB via Dexie.js enables full offline CRUD operations
- ✅ Vite PWA Plugin generates service worker for offline asset caching
- ✅ Spec requires offline functionality as P1 MVP requirement (FR-010)

### II. Client-Side Storage Architecture ✅ PASS
- ✅ IndexedDB (via Dexie.js) designated as single source of truth
- ✅ No backend servers specified - fully client-side architecture
- ✅ Google Drive backup is optional (P3 user story), not required
- ✅ OAuth tokens encrypted with Web Crypto API per spec clarifications
- ✅ Data schema versioning supported by Dexie.js migrations

### III. PWA Standards Compliance ✅ PASS
- ✅ Vite PWA Plugin will generate valid Web App Manifest
- ✅ Service Worker registration handled by Vite PWA Plugin
- ✅ Target platforms include iOS Safari, Android Chrome per Technical Context
- ✅ Performance goals explicitly set: LCP <2.5s, FCP <1.5s, TTI <3.5s
- ✅ Touch target requirement (≥44x44px) specified in constraints
- ✅ Lighthouse ≥90 requirement in performance goals

### IV. Privacy & Data Control ✅ PASS
- ✅ No analytics or tracking mentioned in spec - privacy by default
- ✅ Google Drive backup requires explicit opt-in (US5 P3)
- ✅ OAuth tokens stored with Web Crypto API encryption (spec clarification)
- ✅ Export to JSON required (FR-013)
- ✅ Delete all local data required (FR-014)
- ✅ No third-party scripts beyond specified dependencies

**GATE RESULT**: ✅ ALL CONSTITUTIONAL PRINCIPLES SATISFIED - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/              # Vue 3 UI components
│   ├── tasks/              # Task list, task form, task card components
│   ├── suggestions/        # Suggestion display, time input components
│   ├── common/             # Shared components (buttons, inputs, modals)
│   └── settings/           # Settings page, Google Drive sync UI
├── views/                  # Vue Router page components
│   ├── TasksView.vue      # Main task list page
│   ├── SuggestionsView.vue # Suggestion results page
│   └── SettingsView.vue   # Settings and backup configuration
├── stores/                 # Pinia state management
│   ├── taskStore.ts       # Task CRUD operations, state
│   ├── suggestionStore.ts # Suggestion generation, scoring logic
│   └── syncStore.ts       # Google Drive sync state
├── services/               # Business logic
│   ├── scoring.ts         # Task scoring algorithm
│   ├── urgency.ts         # Urgency decay calculations
│   └── googleDrive.ts     # Google Drive API integration
├── db/                     # IndexedDB configuration
│   ├── database.ts        # Dexie.js database definition
│   ├── schema.ts          # Table schemas, versioning
│   └── migrations.ts      # Schema migration functions
├── types/                  # TypeScript type definitions
│   ├── task.ts            # Task, RecurringPattern interfaces
│   ├── suggestion.ts      # SuggestionSession interface
│   └── sync.ts            # SyncState interface
├── utils/                  # Utility functions
│   ├── dateHelpers.ts     # date-fns wrappers for date calculations
│   ├── validation.ts      # Input validation (time estimates, etc.)
│   └── crypto.ts          # Web Crypto API helpers for token encryption
├── router/                 # Vue Router configuration
│   └── index.ts           # Route definitions
├── App.vue                 # Root component
└── main.ts                 # Application entry point

public/
├── manifest.json           # PWA manifest (generated by Vite PWA Plugin)
├── icons/                  # App icons (192x192, 512x512, maskable)
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable.png
└── robots.txt

tests/
├── unit/                   # Vitest unit tests
│   ├── services/          # Test scoring, urgency, validation
│   ├── stores/            # Test Pinia store logic
│   └── utils/             # Test utility functions
├── integration/            # Vitest integration tests
│   ├── db/                # Test IndexedDB operations via Dexie
│   └── sync/              # Test Google Drive sync logic
└── e2e/                    # Playwright E2E tests
    ├── tasks.spec.ts      # Test task CRUD flows
    ├── suggestions.spec.ts # Test suggestion generation
    ├── offline.spec.ts    # Test offline functionality
    └── sync.spec.ts       # Test Google Drive backup
```

**Structure Decision**: Selected PWA Client-Only structure as this is a fully offline-first PWA with no backend. Using Vue 3 Composition API with TypeScript for type safety, Pinia for state management, and Dexie.js for IndexedDB operations. All business logic resides client-side in services/ and stores/.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
