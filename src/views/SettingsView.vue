<script setup lang="ts">
// SettingsView - placeholder for User Story 5
</script>

<template>
  <div class="pb-20">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

    <div class="space-y-4">
      <!-- Google Drive Backup -->
      <div class="rounded-lg bg-white p-6 shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-2">Google Drive Backup</h3>
        <p class="text-gray-500 text-sm mb-4">
          Optionally back up your tasks to Google Drive for cross-device sync.
        </p>
        <button
          class="touch-target rounded-md bg-gray-100 px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Enable Backup
        </button>
      </div>

      <!-- Export Data -->
      <div class="rounded-lg bg-white p-6 shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-2">Export Data</h3>
        <p class="text-gray-500 text-sm mb-4">Download all your tasks as a JSON file.</p>
        <button
          class="touch-target rounded-md bg-gray-100 px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Export to JSON
        </button>
      </div>

      <!-- Delete Data -->
      <div class="rounded-lg bg-white p-6 shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-2">Delete All Data</h3>
        <p class="text-gray-500 text-sm mb-4">
          Permanently delete all local data. This cannot be undone.
        </p>
        <button
          class="touch-target rounded-md bg-red-100 px-4 py-2 text-red-700 font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Delete All Data
        </button>
      </div>
    </div>
  </div>
</template>
