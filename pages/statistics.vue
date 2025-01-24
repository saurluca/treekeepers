<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <AppSidebar class="z-30" />
    
    <!-- Main content -->
    <div class="flex-1 relative">
      <div class="relative min-h-screen bg-green-50/95 flex items-center justify-center p-4">
        <div class="w-full max-w-4xl bg-white/95 rounded-lg shadow-lg p-8 relative z-10">
          <h1 class="text-3xl font-bold text-green-800 mb-6">Tree Statistics</h1>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Statistics cards -->
            <div class="bg-green-50 rounded-lg p-6 shadow-md">
              <h2 class="text-xl font-semibold text-green-700 mb-4">Tree Health Overview</h2>
              <!-- Add your statistics charts/data here -->
            </div>

            <div class="bg-green-50 rounded-lg p-6 shadow-md">
              <h2 class="text-xl font-semibold text-green-700 mb-4">Species Distribution</h2>
              <!-- Add your statistics charts/data here -->
            </div>

            <div class="bg-green-50 rounded-lg p-6 shadow-md">
              <h2 class="text-xl font-semibold text-green-700 mb-4">Maintenance History</h2>
              <!-- Add your statistics charts/data here -->
            </div>

            <div class="bg-green-50 rounded-lg p-6 shadow-md">
              <h2 class="text-xl font-semibold text-green-700 mb-4">Growth Trends</h2>
              <!-- Add your statistics charts/data here -->
            </div>
          </div>
        </div>
      </div>

      <!-- Background Image -->
      <div class="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="/image.png" 
          alt="Background" 
          class="w-full h-full object-cover opacity-40"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import AppSidebar from '~/components/AppSidebar.vue'
</script>

<style scoped>
/* Z-index layering */
.z-0 {
  z-index: 0;
}

.z-10 {
  z-index: 10;
}

.z-30 {
  z-index: 30;
}
</style>
