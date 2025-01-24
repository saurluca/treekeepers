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
CREATE TABLE tree_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID REFERENCES trees(id),
  ndvi DOUBLE PRECISION,
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tree_id, measured_at)
);