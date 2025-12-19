# QuickStart Guide: SpareTime Task Copilot MVP

**Purpose**: Get the development environment running in <10 minutes
**Target Audience**: Developers setting up the project for the first time
**Prerequisites**: Node.js 18+ and npm 9+ installed

## 1. Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/ribeirompl/sparetime.git
cd sparetime

# Switch to feature branch
git checkout 001-task-copilot-mvp

# Install dependencies
npm install
```

**Expected dependencies** (from package.json):

```json
{
  "dependencies": {
    "vue": "^3.5.25",
    "vue-router": "^4.6.4",
    "pinia": "^3.0.4",
    "dexie": "^4.2.1",
    "date-fns": "^4.1.0",
    "@headlessui/vue": "^1.7.12"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.0",
    "vite": "^7.2.7",
    "vite-plugin-pwa": "^1.2.0",
    "typescript": "^5.9.0",
    "vue-tsc": "^3.1.8",
    "vitest": "^4.0.0",
    "@playwright/test": "^1.57.0",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.14",
    "prettier": "^3.7.4",
    "eslint": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint-plugin-vue": "^10.6.2"
  }
}

```

## 2. Configure Environment (1 minute)

Create `.env.local` in the project root:

```bash
# Google Drive API (optional - only needed for backup feature P3)
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-api-key-here
```

> **Note**: Google Drive backup is optional (P3 priority). Core features work without it.

To get Google API credentials (optional):
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project "SpareTime"
3. Enable Google Drive API
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:5173` to authorized origins
6. Copy Client ID and API Key to `.env.local`

## 3. Start Development Server (1 minute)

```bash
# Start Vite dev server with HMR
npm run dev
```

**Expected output**:
```
VITE v5.0.10  ready in 423 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h to show help
```

Open http://localhost:5173 in your browser. The app should load with an empty task list.

## 4. Verify Installation (2 minutes)

### Check 1: IndexedDB Connection

Open browser DevTools (F12) → Application tab → IndexedDB → Verify "SparetimeDB" database exists with tables:
- `tasks`
- `suggestionSessions`
- `syncState`

### Check 2: Service Worker Registration

In DevTools → Application tab → Service Workers → Verify service worker is registered and activated

### Check 3: PWA Manifest

In DevTools → Application tab → Manifest → Verify "SpareTime Task Copilot" appears with icons

### Check 4: Add a Task

1. Click "Add Task" button
2. Fill in:
   - Name: "Test Task"
   - Type: "one-off"
   - Time Estimate: 30 minutes
   - Effort Level: "medium" (mandatory)
   - Location: "home" (mandatory)
3. Click "Save"
4. Verify task appears in list
5. Refresh page → task should persist (IndexedDB working)

### Check 5: Offline Mode

1. In DevTools → Network tab → Check "Offline"
2. Refresh page → app should still load
3. Add/edit tasks → should work offline
4. Uncheck "Offline" → app should sync (if Google Drive configured)

## 5. Run Tests (2 minutes)

```bash
# Unit + Integration tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Test coverage
npm run test:coverage
```

**Expected test output**:
```
✓ src/services/scoring.test.ts (12)
✓ src/stores/taskStore.test.ts (8)
✓ src/utils/validation.test.ts (6)

Test Files  3 passed (3)
     Tests  26 passed (26)
```

## 6. Build for Production (2 minutes)

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

**Expected build output**:
```
vite v5.0.10 building for production...
✓ 145 modules transformed.
dist/index.html                   0.52 kB │ gzip:  0.34 kB
dist/assets/index-a3b2c4d5.css   12.3 kB │ gzip:  3.21 kB
dist/assets/index-a3b2c4d5.js   187.4 kB │ gzip: 62.19 kB ✅ (under 200KB)

✓ built in 3.42s
```

Verify JS bundle is within the performance budget (initial JS target ~200KB gzipped; CI warn >200KB).

## Project Structure Overview

```
sparetime/
├── src/
│   ├── components/       # Vue components
│   │   ├── tasks/       # Task-related components
│   │   ├── suggestions/ # Suggestion UI
│   │   └── common/      # Shared components
│   ├── views/           # Page components (routes)
│   ├── stores/          # Pinia state management
│   ├── services/        # Business logic
│   ├── db/              # Dexie.js database
│   ├── types/           # TypeScript interfaces
│   ├── utils/           # Helper functions
│   ├── router/          # Vue Router config
│   ├── App.vue          # Root component
│   └── main.ts          # Entry point
├── public/              # Static assets
│   ├── manifest.json   # PWA manifest
│   └── icons/          # App icons
├── tests/               # Test files
│   ├── unit/           # Vitest unit tests
│   ├── integration/    # Vitest integration tests
│   └── e2e/            # Playwright E2E tests
├── specs/               # Feature specifications
│   └── 001-task-copilot-mvp/
│       ├── spec.md
│       ├── plan.md
│       ├── research.md
│       ├── data-model.md
│       └── quickstart.md (this file)
├── vite.config.ts       # Vite + PWA configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
├── .eslintrc.js         # ESLint configuration
├── .prettierrc          # Prettier configuration
└── package.json         # Dependencies + scripts
```

## Available npm Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .ts,.vue",
    "lint:fix": "eslint src --ext .ts,.vue --fix",
    "format": "prettier --write src/**/*.{ts,vue}",
    "type-check": "vue-tsc --noEmit"
  }
}
```

## Configuration Files

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
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
        description: 'Personal task copilot for managing home chores and projects',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
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
              expiration: { maxEntries: 10, maxAgeSeconds: 86400 }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
```

### tailwind.config.js

```javascript
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      minWidth: { 'touch-target': '44px' },
      minHeight: { 'touch-target': '44px' }
    }
  },
  plugins: [require('@headlessui/tailwindcss')]
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.vue"],
  "exclude": ["node_modules", "dist"]
}
```

## Common Issues & Troubleshooting

### Issue: "Cannot find module 'dexie'"

**Solution**: Ensure Dexie.js is installed:
```bash
npm install dexie
```

### Issue: Service Worker not registering

**Solution**:
1. HTTPS required (except localhost)
2. Check browser console for errors
3. Try clearing service workers in DevTools → Application → Service Workers → Unregister

### Issue: IndexedDB errors on iOS Safari

**Solution**:
1. Enable "Experimental Features" in Safari settings
2. Test in private browsing mode (different IndexedDB instance)
3. Check storage quota with `navigator.storage.estimate()`

### Issue: Build exceeds initial JS performance budget (~200KB target)

**Solution**:
1. Check bundle size: `npm run build` → verify gzipped size
2. Analyze bundle: `npx vite-bundle-visualizer`
3. Remove unused imports (especially from date-fns)
4. Tree-shake Headless UI components (import only used ones)

### Issue: Google Drive API not working

**Solution**:
1. Verify `.env.local` has valid credentials
2. Check authorized origins in Google Cloud Console
3. Ensure Google Drive API is enabled in project
4. Test OAuth flow in browser console

## Next Steps

1. Read [spec.md](./spec.md) for full feature requirements
2. Read [plan.md](./plan.md) for implementation strategy
3. Read [data-model.md](./data-model.md) for IndexedDB schema
4. Start with User Story 1 (P1): Task CRUD implementation
5. Then User Story 2 (P1): Suggestion engine

## Development Workflow

1. **Create feature branch**: Already on `001-task-copilot-mvp`
2. **Implement user story**: Start with US1 (Task CRUD)
3. **Write tests**: Unit tests first, then integration, finally E2E
4. **Run linter**: `npm run lint:fix`
5. **Format code**: `npm run format`
6. **Type check**: `npm run type-check`
7. **Test**: `npm run test && npm run test:e2e`
8. **Build**: `npm run build` → verify bundle is within performance budget (target ~200KB gzipped; CI warn >200KB)
9. **Commit**: Git commit with descriptive message
10. **Repeat** for next user story

## Performance Monitoring

Monitor these metrics during development:

- **Lighthouse scores**: Run in Chrome DevTools → Lighthouse tab
- **Bundle size**: Check after each `npm run build`
- **IndexedDB operations**: Profile with DevTools → Performance tab
- **Service Worker caching**: Check Network tab → throttle to Slow 3G

**Target metrics** (from constitution):
- Lighthouse ≥ 90 all categories
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Largest Contentful Paint < 2.5s
- Total JS bundle target: ~200KB gzipped (CI warns >200KB)

---

**Ready to code?** Start with implementing User Story 1 in `src/stores/taskStore.ts`!
