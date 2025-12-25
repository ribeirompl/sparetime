# SpareTime Task Copilot

A mobile-first Progressive Web App (PWA) for managing home chores and personal projects with intelligent time-based suggestions.

## Features

- **Task Management**: Create, edit, and organize one-off tasks, recurring chores, and multi-session projects
- **Smart Suggestions**: Get 3-5 ranked task suggestions based on available time, effort level, and location
- **Offline-First**: Full functionality without internet - data stored locally in IndexedDB
- **Urgency Tracking**: Recurring tasks automatically become more urgent as they become overdue
- **Optional Cloud Backup**: Two-way sync with Google Drive (requires opt-in)
- **PWA Installable**: Install on iOS, Android, and desktop for native-like experience

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/ribeirompl/sparetime.git
cd sparetime

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (includes icon generation and type checking) |
| `npm run preview` | Preview production build locally |
| `npm test` | Run unit and integration tests with Vitest |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:e2e` | Run end-to-end tests with Playwright |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint on source files |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Run TypeScript type checking |
| `npm run icons` | Generate PWA icons from SVG source |

## Project Structure

```
sparetime/
├── src/
│   ├── components/       # Vue components
│   │   ├── tasks/        # Task-related components (TaskForm, TaskCard, TaskList)
│   │   ├── suggestions/  # Suggestion UI (TimeInput, SuggestionCard)
│   │   └── settings/     # Settings components (GoogleDriveSync)
│   ├── views/            # Page components
│   │   ├── TasksView.vue       # Main task list
│   │   ├── SuggestionsView.vue # Time-based suggestions
│   │   └── SettingsView.vue    # App settings and backup
│   ├── stores/           # Pinia state management
│   │   ├── taskStore.ts        # Task CRUD operations
│   │   ├── suggestionStore.ts  # Suggestion generation
│   │   └── syncStore.ts        # Google Drive sync state
│   ├── services/         # Business logic
│   │   ├── scoring.ts          # Task scoring algorithm
│   │   ├── urgency.ts          # Urgency decay calculations
│   │   └── googleDrive.ts      # Google Drive API
│   ├── db/               # IndexedDB via Dexie.js
│   │   ├── database.ts         # Database instance
│   │   ├── schema.ts           # Table schemas
│   │   └── migrations.ts       # Schema migrations
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # Utility functions
│   ├── router/           # Vue Router configuration
│   ├── App.vue           # Root component
│   └── main.ts           # Application entry point
├── public/
│   ├── icons/            # PWA icons (generated)
│   └── robots.txt
├── tests/
│   ├── unit/             # Vitest unit tests
│   ├── integration/      # Vitest integration tests
│   └── e2e/              # Playwright E2E tests
├── specs/                # Feature specifications
│   └── 001-task-copilot-mvp/
│       ├── spec.md       # Feature specification
│       ├── plan.md       # Implementation plan
│       ├── data-model.md # Data model documentation
│       └── quickstart.md # Developer quickstart guide
└── scripts/
    └── generate-icons.ts # PWA icon generation script
```

## Technology Stack

- **Framework**: Vue 3.5+ with Composition API
- **Build Tool**: Vite 7.x with PWA plugin
- **State Management**: Pinia 3.x
- **Routing**: Vue Router 4.6+ (hash mode for PWA)
- **Database**: IndexedDB via Dexie.js 4.x
- **Styling**: Tailwind CSS 4.x with Headless UI
- **Date Handling**: date-fns 4.x
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Language**: TypeScript 5.9+ with strict mode

## Configuration

### Environment Variables

Create a `.env.local` file for optional Google Drive sync:

```bash
# Google Drive API (optional - only needed for backup feature)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

See [specs/001-task-copilot-mvp/quickstart.md](specs/001-task-copilot-mvp/quickstart.md) for detailed setup instructions.

### TypeScript Configuration

The project uses strict TypeScript with ES2022 target. Configuration is in `tsconfig.json`.

### Tailwind CSS

Tailwind is configured for mobile-first responsive design with custom touch target utilities. Configuration is in `tailwind.config.js`.

## Performance

The app is optimized for mobile performance:

- **Bundle Size**: Initial JS ~47KB gzipped (well under 200KB target)
- **Code Splitting**: Routes are lazy-loaded for faster initial load
- **Caching**: Vendor libraries are split into separate chunks for better caching
- **PWA**: Service worker caches assets for instant offline loading
- **Target Metrics**:
  - Lighthouse: 90+ all categories
  - First Contentful Paint: < 1.5s
  - Time to Interactive: < 3.5s
  - Largest Contentful Paint: < 2.5s

## Testing

### Unit and Integration Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test -- --watch
```

### End-to-End Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e -- --ui
```

## PWA Installation

### iOS Safari
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

### Android Chrome
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Install app" or "Add to Home screen"

### Desktop (Chrome/Edge)
1. Open the app in Chrome or Edge
2. Click the install icon in the address bar
3. Click "Install"

## Offline Support

The app works fully offline after initial load:

- All task operations (create, edit, delete) work offline
- Suggestions are generated from local data
- Data is stored in IndexedDB
- Service worker caches all assets
- Optional Google Drive sync when back online

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test && npm run test:e2e`
5. Run linting: `npm run lint:fix`
6. Submit a pull request

## License

MIT

## Documentation

- [Feature Specification](specs/001-task-copilot-mvp/spec.md)
- [Implementation Plan](specs/001-task-copilot-mvp/plan.md)
- [Data Model](specs/001-task-copilot-mvp/data-model.md)
- [Developer Quickstart](specs/001-task-copilot-mvp/quickstart.md)