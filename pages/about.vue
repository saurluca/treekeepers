<template>
    <div class="flex min-h-screen">
      <!-- Sidebar -->
      <AppSidebar />
      
      <!-- Main content -->
      <div class="flex-1 bg-gray-100 p-4">
        <div class="container mx-auto">
          <h1 class="text-3xl font-bold mb-4">About</h1>
          <p>Welcome to the about page</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import AppSidebar from '~/components/AppSidebar.vue'
  </script>
  
  <style scoped>
  /* Styles will be handled by Tailwind classes */
  </style>