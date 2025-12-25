import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initializeDatabase } from './db/database'
import './style.css'

// Initialize app
async function bootstrap() {
  // Initialize IndexedDB before mounting app
  try {
    await initializeDatabase()
  } catch (error) {
    console.error('Failed to initialize database:', error)
    // App will still mount, but database operations may fail
  }

  const app = createApp(App)

  app.use(createPinia())
  app.use(router)

  app.mount('#app')
}

bootstrap()
