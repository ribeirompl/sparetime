# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., TypeScript 5.x, JavaScript ES2020+ or NEEDS CLARIFICATION]
**Primary Dependencies**: [e.g., Dexie.js, Workbox, Vite or NEEDS CLARIFICATION]
**Storage**: [for PWA: IndexedDB (required), Google Drive backup (optional) or NEEDS CLARIFICATION]
**Testing**: [e.g., Vitest, Playwright for PWA E2E or NEEDS CLARIFICATION]
**Target Platform**: [e.g., PWA installable on mobile/desktop, iOS Safari, Android Chrome or NEEDS CLARIFICATION]
**Project Type**: [pwa-client-only/single/web/mobile - determines source structure]
**Performance Goals**: [PWA-specific: Lighthouse ≥90, LCP <2.5s, TTI <3.5s, or NEEDS CLARIFICATION]
**Constraints**: [PWA-specific: offline-capable required, <200KB JS, <14KB critical CSS or NEEDS CLARIFICATION]
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: PWA Client-Only (for offline-first, no backend)
src/
├── components/          # UI components
├── services/            # Business logic & data access
├── db/                  # IndexedDB schemas & migrations
├── sw/                  # Service Worker & cache strategies
├── sync/                # Google Drive sync (optional)
└── utils/               # Helpers & utilities

public/
├── manifest.json        # PWA manifest
├── icons/               # App icons (multiple sizes)
└── sw.js                # Service Worker (built from src/sw)

tests/
├── e2e/                 # Playwright PWA tests
├── integration/         # IndexedDB & sync tests
└── unit/                # Component & service tests

# [REMOVE IF UNUSED] Option 2: Single project (general purpose)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 3: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 4: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
