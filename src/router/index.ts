/**
 * Vue Router Configuration
 * 
 * Uses lazy loading (dynamic imports) for route components to enable
 * code-splitting. This reduces initial bundle size by loading views
 * only when navigating to them.
 * 
 * Performance optimization: Each view is loaded on-demand, keeping
 * the initial JS bundle under the ~200KB gzipped target.
 */
import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * Lazy-loaded view components for code splitting
 * Each dynamic import creates a separate chunk that's loaded on navigation
 */
const TasksView = () => import('@/views/TasksView.vue')
const SuggestionsView = () => import('@/views/SuggestionsView.vue')
const SettingsView = () => import('@/views/SettingsView.vue')

const router = createRouter({
  // Hash mode for PWA compatibility (works with service worker and offline)
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'tasks',
      component: TasksView,
      meta: { title: 'Tasks - SpareTime' }
    },
    {
      path: '/suggestions',
      name: 'suggestions',
      component: SuggestionsView,
      meta: { title: 'Suggestions - SpareTime' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { title: 'Settings - SpareTime' }
    }
  ]
})

// Update document title on navigation for better accessibility
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  if (title) {
    document.title = title
  }
})

export default router
