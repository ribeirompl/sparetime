<script setup lang="ts">
// SuggestionsView - placeholder for User Story 2
</script>

<template>
  <div class="pb-20">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Get Suggestions</h2>

    <div class="rounded-lg bg-white p-6 shadow mb-6">
      <label for="available-time" class="block text-sm font-medium text-gray-700 mb-2">
        How much time do you have?
      </label>
      <div class="flex items-center gap-4">
        <input
          id="available-time"
          type="number"
          min="1"
          max="480"
          placeholder="30"
          class="touch-target block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-center text-lg"
        />
        <span class="text-gray-600">minutes</span>
        <button
          class="touch-target ml-auto rounded-md bg-primary-600 px-4 py-2 text-white font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Get Ideas
        </button>
      </div>
    </div>

    <div class="rounded-lg bg-white p-8 text-center shadow">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="mx-auto h-12 w-12 text-gray-400"
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
      <h3 class="mt-4 text-lg font-medium text-gray-900">Enter your available time</h3>
      <p class="mt-2 text-gray-500">
        Tell us how much time you have, and we'll suggest the best tasks to work on.
      </p>
    </div>
  </div>
</template>
