<script setup lang="ts">
/**
 * WelcomeDialog - First-time user onboarding
 * T119: If first time loading the page (no locally stored data),
 * ask the user if they want to start blank, test with example tasks,
 * or connect with Google Drive to sync
 */

import { ref, onMounted } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { useSyncStore } from '@/stores/syncStore'
import { useRouter } from 'vue-router'
import type { CreateTaskInput, Priority } from '@/types/task'
import {
  initializeGoogleAuth,
  requestAccessToken,
  type TokenClient
} from '@/services/googleDrive'

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const router = useRouter()
const taskStore = useTaskStore()
const syncStore = useSyncStore()

const loading = ref(false)
const loadingAction = ref<'blank' | 'examples' | 'sync' | null>(null)
const tokenClient = ref<TokenClient | null>(null)
const errorMessage = ref<string | null>(null)
const step = ref<'welcome' | 'setup'>('welcome')

// Initialize Google Auth on mount
onMounted(async () => {
  try {
    tokenClient.value = await initializeGoogleAuth()
    syncStore.setTokenClient(tokenClient.value)
  } catch (error) {
    console.error('Failed to initialize Google Auth:', error)
    // Not critical - user can still use other options
  }
})

/**
 * Example tasks for demonstration
 * Covers all three task types with realistic scenarios
 */
const exampleTasks: CreateTaskInput[] = [
  {
    name: 'Water the plants',
    type: 'recurring',
    timeEstimateMinutes: 10,
    effortLevel: 'low',
    location: 'home',
    priority: 'important' as Priority,
    recurringPattern: {
      intervalValue: 3,
      intervalUnit: 'days',
      lastCompletedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago (overdue)
    }
  },
  {
    name: 'Vacuum the living room',
    type: 'recurring',
    timeEstimateMinutes: 20,
    effortLevel: 'medium',
    location: 'home',
    priority: 'important' as Priority,
    recurringPattern: {
      intervalValue: 1,
      intervalUnit: 'weeks',
      lastCompletedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() // 8 days ago (overdue)
    }
  },
  {
    name: 'Take out the trash',
    type: 'recurring',
    timeEstimateMinutes: 5,
    effortLevel: 'low',
    location: 'home',
    priority: 'important' as Priority,
    recurringPattern: {
      intervalValue: 2,
      intervalUnit: 'days',
      lastCompletedDate: new Date().toISOString() // Just done today
    }
  },
  {
    name: 'Buy groceries',
    type: 'one-off',
    timeEstimateMinutes: 45,
    effortLevel: 'medium',
    location: 'outside',
    priority: 'critical' as Priority
  },
  {
    name: 'Fix the leaky faucet',
    type: 'one-off',
    timeEstimateMinutes: 60,
    effortLevel: 'high',
    location: 'home',
    priority: 'important' as Priority
  },
  {
    name: 'Organize the garage',
    type: 'project',
    timeEstimateMinutes: 240,
    effortLevel: 'high',
    location: 'home',
    priority: 'optional' as Priority,
    projectSession: {
      minSessionDurationMinutes: 30
    }
  },
  {
    name: 'Clean out email inbox',
    type: 'one-off',
    timeEstimateMinutes: 30,
    effortLevel: 'low',
    location: 'anywhere',
    priority: 'important' as Priority
  },
  {
    name: 'Schedule dentist appointment',
    type: 'one-off',
    timeEstimateMinutes: 10,
    effortLevel: 'low',
    location: 'anywhere',
    priority: 'important' as Priority
  }
]

async function startBlank() {
  loading.value = true
  loadingAction.value = 'blank'

  try {
    // Just close the dialog - user starts with no tasks
    markOnboardingComplete()
    emit('complete')
  } finally {
    loading.value = false
    loadingAction.value = null
  }
}

async function startWithExamples() {
  loading.value = true
  loadingAction.value = 'examples'

  try {
    // Create all example tasks
    for (const task of exampleTasks) {
      await taskStore.create(task)
    }

    markOnboardingComplete()
    emit('complete')
  } catch (error) {
    console.error('Failed to create example tasks:', error)
  } finally {
    loading.value = false
    loadingAction.value = null
  }
}

async function startWithSync() {
  if (!tokenClient.value) {
    errorMessage.value = 'Google Sign-In not available. Please try again.'
    return
  }

  loading.value = true
  loadingAction.value = 'sync'
  errorMessage.value = null

  try {
    // Request OAuth access token
    const accessToken = await requestAccessToken(tokenClient.value)
    await syncStore.storeAccessToken(accessToken)

    // Check if we need a first-time merge decision
    const firstTimeStatus = await syncStore.checkFirstTimeConnect()

    if (firstTimeStatus.needsMergeDecision) {
      // Redirect to settings where the merge dialog is properly handled
      markOnboardingComplete()
      emit('complete')
      // Navigate to settings to complete the merge process
      router.push('/settings')
    } else {
      // Perform initial sync
      await syncStore.performSync()
      // Start automatic polling
      syncStore.startRemoteCheckPolling()

      markOnboardingComplete()
      emit('complete')
    }
  } catch (error) {
    console.error('Failed to connect to Google Drive:', error)
    errorMessage.value = error instanceof Error ? error.message : 'Failed to connect'
  } finally {
    loading.value = false
    loadingAction.value = null
  }
}

function markOnboardingComplete() {
  // Store flag in localStorage to prevent showing dialog again
  localStorage.setItem('sparetime-onboarding-complete', 'true')
}

function goToSetup() {
  step.value = 'setup'
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="welcome-title"
  >
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
      <!-- Step 1: Welcome / Introduction -->
      <div v-if="step === 'welcome'" class="p-6 sm:p-8">
        <!-- Icon -->
        <div class="text-center mb-6">
          <div class="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          
          <h2 id="welcome-title" class="text-3xl font-bold text-gray-900 mb-3">
            Welcome to SpareTime
          </h2>
          <p class="text-lg text-gray-600 leading-relaxed">
            Get more done in short pockets of time
          </p>
        </div>

        <!-- Feature highlights -->
        <div class="space-y-4 mb-8">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Smart Suggestions</h3>
              <p class="text-sm text-gray-600">Get quick, prioritized tasks you can finish with the time you have</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Always Available</h3>
              <p class="text-sm text-gray-600">Works offline—your data stays on your device</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Optional Cloud Sync</h3>
              <p class="text-sm text-gray-600">Back up to Google Drive if you choose</p>
            </div>
          </div>
        </div>

        <!-- Get Started button -->
        <button
          type="button"
          class="w-full touch-target px-6 py-3.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors shadow-lg"
          @click="goToSetup"
        >
          Get Started
        </button>
      </div>

      <!-- Step 2: Setup Options -->
      <div v-else-if="step === 'setup'" class="p-6 sm:p-8">
        <!-- Header -->
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">
            How would you like to start?
          </h2>
          <p class="text-gray-600">
            Choose an option to set up your workspace
          </p>
        </div>

        <!-- Options -->
        <div class="space-y-3">
          <!-- Start blank -->
          <button
            type="button"
            data-testid="start-fresh-button"
            class="touch-target w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading"
            @click="startBlank"
          >
            <div class="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg
                v-if="loadingAction === 'blank'"
                class="animate-spin h-5 w-5 text-primary-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div class="text-left">
              <div class="font-semibold text-gray-900">Start Fresh</div>
              <div class="text-sm text-gray-500">Begin with a blank slate</div>
            </div>
          </button>

          <!-- Try with examples -->
          <button
            type="button"
            class="touch-target w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading"
            @click="startWithExamples"
          >
            <div class="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg
                v-if="loadingAction === 'examples'"
                class="animate-spin h-5 w-5 text-primary-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div class="text-left">
              <div class="font-semibold text-gray-900">Try with Examples</div>
              <div class="text-sm text-gray-500">Load sample tasks to explore features</div>
            </div>
          </button>

          <!-- Connect to Google Drive -->
          <button
            type="button"
            class="touch-target w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading"
            @click="startWithSync"
          >
            <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                v-if="loadingAction === 'sync'"
                class="animate-spin h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div class="text-left">
              <div class="font-semibold text-gray-900">Sync with Google Drive</div>
              <div class="text-sm text-gray-500">Restore from backup or start syncing</div>
            </div>
          </button>
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-700">{{ errorMessage }}</p>
        </div>

        <!-- Footer note -->
        <p class="mt-6 text-center text-xs text-gray-500">
          All your data is stored locally. Google Drive sync is optional.
        </p>
      </div>
    </div>
  </div>
</template>
