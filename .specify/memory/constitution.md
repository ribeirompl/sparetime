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

- **JavaScript/TypeScript**: TypeScript 5.9+ with ES2022+ features, strict mode enabled
- **IndexedDB**: Via Dexie.js 4.x for ergonomic typed API with version migrations
- **Service Worker**: Vite PWA Plugin 1.x with Workbox for cache strategies (generateSW strategy)
- **Web App Manifest**: Complete PWA manifest with all required fields (name, icons, theme, display: standalone)
- **CSS**: Tailwind CSS 4.x with mobile-first breakpoints, custom utilities for touch targets (≥44x44px)
- **Build Tool**: Vite 7.x for fast dev server, HMR, optimized production builds

**Optional Libraries** (use judiciously):

- **UI Framework**: Vue 3.5+ (Composition API with `<script setup>`) if complex state/routing needed; otherwise vanilla JS
- **State Management**: Pinia 3.x for global state (preferred over Options API patterns); Composables for local state
- **Routing**: Vue Router 4.6+ with hash mode for PWA compatibility
- **Date Utilities**: date-fns 4.x (tree-shakeable, immutable) over moment.js or day.js
- **Accessible Components**: Headless UI 1.7+ for Vue 3 (unstyled, accessible primitives)
- **Google Drive API**: Via `gapi.client` with Google Identity Services for OAuth 2.0
- **Testing**: Vitest 4.x (unit/integration with jsdom), Playwright 1.57+ (E2E PWA testing with offline scenarios)

**Prohibited**:

- Backend servers or APIs (application must be fully client-side)
- Large frameworks (React, Angular without extreme justification)
- jQuery or other legacy libraries
- Vue 2.x or Options API patterns (use Composition API with `<script setup>`)
- Vuex (use Pinia 3.x for state management)
- Class components (use functional composition)
- Moment.js or Day.js (use date-fns 4.x for tree-shaking)
- localStorage for sensitive data (use IndexedDB or Web Crypto API)
- Any dependency that breaks offline-first principle or exceeds bundle budget

## Development Workflow

**Feature Development**:

1. Spec defines user scenarios with offline/online considerations
2. Plan includes PWA-specific technical context (manifest changes, SW updates, IndexedDB schema)
3. Tasks organized by user story; foundational phase includes PWA setup
4. Implementation:
   - IndexedDB schema with Dexie.js typed tables and version migrations
   - Service Worker via Vite PWA Plugin (generateSW strategy with Workbox)
   - Vue 3 components using Composition API with `<script setup lang="ts">`
   - Pinia stores with TypeScript for type-safe state management
   - Google Drive sync (if applicable) with OAuth via Google Identity Services
5. Testing: Unit tests (Vitest), E2E tests (Playwright), Lighthouse audit MUST pass before feature considered complete

**Quality Gates**:

- ✅ All Lighthouse categories ≥ 90 (Performance, Accessibility, Best Practices, SEO, PWA)
- ✅ Installable on iOS Safari 15+ and Android Chrome 90+
- ✅ Works offline after initial load (Service Worker caches all critical assets)
- ✅ IndexedDB schema versioned with Dexie.js migrations tested
- ✅ TypeScript strict mode with no type errors
- ✅ No console errors or warnings in production build
- ✅ Performance budget: target initial JS bundle ~200KB gzipped; CI should **warn** when bundle >200KB. Critical CSS target: ~14KB (use critical CSS extraction).
- ✅ Performance: FCP <1.5s, LCP <2.5s, TTI <3.5s on 4G throttled
- ✅ Responsive across mobile (320px) to desktop (1920px) with mobile-first CSS
- ✅ Touch targets ≥44x44px (WCAG 2.1 Level AAA)
- ✅ Google Drive sync (if implemented) gracefully handles auth failures and works without blocking offline usage

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
