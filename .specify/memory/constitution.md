<!--
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYNC IMPACT REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Version Change: [Initial] → 1.0.0

Constitution Type: Mobile-First PWA

Principles Defined:
  ✓ I. Mobile-First & Offline-First (NEW)
  ✓ II. Client-Side Storage Architecture (NEW)
  ✓ III. PWA Standards Compliance (NEW)
  ✓ IV. Progressive Enhancement (NEW)
  ✓ V. Performance & Lighthouse Standards (NEW)
  ✓ VI. Privacy & Data Control (NEW)

Sections Added:
  ✓ Technology Stack
  ✓ Development Workflow
  ✓ Governance

Template Consistency:
  ⚠ .specify/templates/plan-template.md - REQUIRES REVIEW
    → Technical Context section should reference PWA, IndexedDB, Service Worker
    → Constitution Check gates need alignment with PWA principles

  ⚠ .specify/templates/spec-template.md - REQUIRES REVIEW
    → User scenarios should consider offline/online modes
    → Functional requirements should address PWA capabilities

  ⚠ .specify/templates/tasks-template.md - REQUIRES REVIEW
    → Sample tasks should reflect PWA structure (no backend)
    → Project structure options need PWA client-only option

Follow-up Actions:
  1. Review and update template files to align with PWA architecture
  2. Ensure all commands reference mobile-first principles
  3. Validate that project structure examples match client-only pattern

Ratification: Initial constitution - 2025-12-14

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-->

# Sparetime Constitution

## Core Principles

### I. Mobile-First & Offline-First

**Every feature MUST be designed for mobile and work offline before considering desktop or online enhancements.**

- Mobile viewport and touch interactions are the primary design target
- Offline functionality is non-negotiable; online features are progressive enhancements
- Service Worker must cache all critical application assets and data
- Network requests must gracefully degrade when connectivity is unavailable
- User interface must clearly indicate sync state

**Rationale**: Mobile users expect uninterrupted access regardless of network conditions. Building offline-first ensures resilient, fast, and accessible experiences.

### II. Client-Side Storage Architecture

**All application data MUST be stored in IndexedDB as the single source of truth; cloud backup is optional and user-controlled.**

- IndexedDB serves as the primary and authoritative data store
- All data operations (CRUD) must work fully offline against IndexedDB
- Should have the option to export to JSON file.
- Google Drive backup to private app data folder is opt-in user preference
- OAuth authentication for Google Drive must not block core functionality
- Sync conflicts must be resolved client-side with clear user controls
- Data schemas must be versioned; migrations handled via IndexedDB version changes

**Rationale**: Client-side storage ensures instant performance, privacy by default, and zero backend dependencies. Users retain full control over their data and backup decisions.

### III. PWA Standards Compliance

**Application MUST meet all PWA installability and capability requirements.**

- Valid Web App Manifest with complete metadata (name, icons, theme, display mode)
- Service Worker registered and actively managing cache strategies
- HTTPS required for production (localhost exempt for development)
- Installable on all major platforms (iOS Safari, Android Chrome, Desktop)
- App-like experience: standalone display mode, no browser chrome
- Responsive design: fluid layouts, touch targets ≥ 44x44px
- Fast load times: First Contentful Paint < 1.5s

**Rationale**: PWAs provide native-like experiences without app store friction. Standards compliance ensures cross-platform reach and future compatibility.

### IV. Privacy & Data Control

**User privacy is paramount; no data leaves the device without explicit user consent.**

- No analytics, tracking, or telemetry by default
- Google Drive sync opt-in with clear consent UI
- OAuth tokens stored securely (never in localStorage)
- All external API calls clearly documented in privacy policy
- Users can export all data as JSON at any time
- Users can delete all local data with one action
- No third-party scripts unless absolutely necessary and user-approved

**Rationale**: Privacy-first design builds trust and complies with global regulations (GDPR, CCPA). Users own their data and must have full transparency and control.

## Technology Stack

**Core Technologies** (MUST use):

- **JavaScript/TypeScript**: ES2020+ with TypeScript strict mode
- **IndexedDB**: Via Dexie.js or idb wrapper for ergonomic API
- **Service Worker**: Workbox for cache strategies and lifecycle management
- **Web App Manifest**: Complete PWA manifest with all required fields
- **CSS**: Modern CSS (Grid, Flexbox, Custom Properties) with mobile-first breakpoints
- **Build Tool**: Vite or similar for fast dev server, HMR, and optimized production builds

**Optional Libraries** (use judiciously):

- **UI Framework**: Vanilla JS preferred; framework only if justified (Preact, Svelte for size, or maybe Vue.js)
- **State Management**: LocalStorage for preferences; Context/signals if framework used
- **Google Drive API**: Via `gapi.client` with OAuth 2.0 for backup feature
- **Testing**: Vitest + Playwright for E2E PWA testing

**Prohibited**:

- Backend servers or APIs (application must be fully client-side)
- Large frameworks (React, Angular without extreme justification)
- jQuery or other legacy libraries
- Any dependency that breaks offline-first principle

## Development Workflow

**Feature Development**:

1. Spec defines user scenarios with offline/online considerations
2. Plan includes PWA-specific technical context (manifest changes, SW updates, IndexedDB schema)
3. Tasks organized by user story; foundational phase includes PWA setup
4. Implementation: IndexedDB schema → Service Worker caching → UI → Google Drive sync (if applicable)
5. Testing: Lighthouse audit MUST pass before feature considered complete

**Quality Gates**:

- ✅ All Lighthouse categories ≥ 90
- ✅ Installable on iOS Safari and Android Chrome
- ✅ Works offline after initial load
- ✅ IndexedDB schema versioned and tested
- ✅ No console errors or warnings
- ✅ Responsive across mobile (320px) to desktop (1920px)
- ✅ Touch targets accessible and properly sized
- ✅ Google Drive sync (if implemented) gracefully handles auth failures

**Version Control**:

- Feature branches: `###-feature-name`
- Commit after each task completion
- Service Worker version MUST increment with every deployment
- IndexedDB schema version MUST increment when schema changes

## Governance

**Constitutional Authority**:

This constitution supersedes all other development practices and serves as the definitive decision-making framework for the SpareTime project. All design decisions, technical choices, and implementation approaches must align with these principles.

**Amendment Process**:

1. Amendments require documented justification with user value and technical rationale
2. Version must increment per semantic versioning (MAJOR for principle removal/redefinition, MINOR for additions, PATCH for clarifications)
3. All dependent templates and documentation must be updated within same change
4. Migration plan required for MAJOR version changes affecting existing features

**Compliance Review**:

- Every specification and plan must pass Constitution Check before Phase 0 research
- Pull requests must verify alignment with all relevant principles
- Complexity that violates principles must be explicitly justified in plan.md Complexity Tracking table
- Lighthouse audits are mandatory for every feature merge
- Any principle violation flagged during review blocks merge until resolved or exception granted

**Runtime Development**:

For detailed guidance during active development, agents should reference `.github/agents/` and `.specify/templates/commands/` files, which expand on these constitutional principles with concrete workflows and patterns.

**Version**: 1.0.0 | **Ratified**: 2025-12-14 | **Last Amended**: 2025-12-14
