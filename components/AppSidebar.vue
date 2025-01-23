<template>
  <div class="relative" :class="isCollapsed ? 'w-[64px]' : 'w-[152px]'">
    <div class="h-full bg-white shadow-lg fixed pr-2">
      <!-- Logo container -->
      <div v-if="!isCollapsed" class="p-4 flex flex-col items-center justify-center">
        <h2 class="text-xl font-bold mb-2">Treekeeper</h2>
      </div>

      <!-- Navigation links -->
      <nav class="p-1 mt-2">
        <ul class="space-y-3">
          <li>
            <NuxtLink 
              to="/" 
              class="flex items-center px-5 py-3 text-gray-700 hover:bg-gray-100 rounded-lg" 
              :class="{ 'bg-gray-100': $route.path === '/', 'justify-center': isCollapsed }"
              :title="isCollapsed ? 'Map View' : ''"
            >
              <Map :class="isCollapsed ? 'w-4 h-4' : 'w-6 h-6 mr-2'" />
              <span v-if="!isCollapsed" class="text-base">Map View</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink 
              to="/statistics" 
              class="flex items-center px-5 py-3 text-gray-600 hover:bg-gray-100 rounded-lg" 
              :class="{ 'bg-gray-100': $route.path === '/statistics', 'justify-center': isCollapsed }"
              :title="isCollapsed ? 'Statistics' : ''"
            >
              <BarChart :class="isCollapsed ? 'w-4 h-4' : 'w-6 h-6 mr-2'" />
              <span v-if="!isCollapsed" class="text-base">Statistics</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink 
              to="/assistant" 
              class="flex items-center px-5 py-3 text-gray-600 hover:bg-gray-100 rounded-lg" 
              :class="{ 'justify-center': isCollapsed }"
              :title="isCollapsed ? 'Assistant' : ''"
            >
              <MessageSquareCode :class="isCollapsed ? 'w-4 h-4' : 'w-6 h-6 mr-2'" />
              <span v-if="!isCollapsed" class="text-base">Assistant</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink 
              to="/about" 
              class="flex items-center px-5 py-3 text-gray-600 hover:bg-gray-100 rounded-lg" 
              :class="{ 'bg-gray-100': $route.path === '/about', 'justify-center': isCollapsed }"
              :title="isCollapsed ? 'About' : ''"
            >
              <Info :class="isCollapsed ? 'w-4 h-4' : 'w-6 h-6 mr-2'" />
              <span v-if="!isCollapsed" class="text-base">About</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <!-- Chevron button at the bottom of the sidebar -->
      <button 
        @click="isCollapsed = !isCollapsed"
        class="bg-white rounded-full p-1 hover:bg-gray-50 absolute bottom-4 w-full"
      >
        <ChevronLeft v-if="!isCollapsed" class="w-5 h-5 mx-auto" />
        <ChevronRight v-else class="w-5 h-5 mx-auto" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Map, BarChart, Info, ChevronLeft, ChevronRight, MessageSquareCode } from 'lucide-vue-next'

const isCollapsed = ref(false)
</script> 