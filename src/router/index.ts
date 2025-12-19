import { createRouter, createWebHashHistory } from 'vue-router'
import TasksView from '@/views/TasksView.vue'
import SuggestionsView from '@/views/SuggestionsView.vue'
import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'tasks',
      component: TasksView
    },
    {
      path: '/suggestions',
      name: 'suggestions',
      component: SuggestionsView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    }
  ]
})

export default router
