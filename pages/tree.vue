<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="container mx-auto">
      <div class="text-center text-3xl font-bold text-gray-800">
        Hello World
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

onMounted(() => {
  console.log('Hello World')
})
</script>

<style scoped>
/* No additional styles needed for this simple page */
</style>
