<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <AppSidebar class="z-30" />
    
    <!-- Main content -->
    <div class="flex-1 relative">
      <div class="relative min-h-screen bg-green-50/95 flex items-center justify-center p-4">
        <div class="w-full max-w-3xl bg-white/95 rounded-lg shadow-lg p-8 relative z-10">
          <h1 class="text-3xl font-bold text-green-800 mb-6">About Treekeeper</h1>
          
          <div class="prose prose-green max-w-none">
            <!-- About content -->
            <p class="mb-4">
              Treekeeper is a comprehensive tool for exploring and monitoring Berlin's urban forest.
            </p>
            
            <!-- Features section -->
            <h2 class="text-xl font-semibold text-green-700 mb-3">Features</h2>
            <ul class="list-disc pl-5 mb-6">
              <li>Interactive map of Berlin's trees</li>
              <li>Tree health monitoring system</li>
              <li>Route planning for tree maintenance</li>
              <li>AI-powered tree care assistant</li>
              <li>Detailed statistics and analytics</li>
            </ul>
            
            <!-- More sections as needed -->
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

/* Prose customization */
.prose {
  max-width: none;
}

.prose ul > li {
  margin-top: 0.25em;
  margin-bottom: 0.25em;
}
</style>

