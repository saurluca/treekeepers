<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <AppSidebar class="z-30" />
    
    <!-- Main content -->
    <div class="flex-1 relative">
      <div class="relative min-h-screen bg-green-50/95 flex items-start justify-center p-4">
        <!-- Main container with responsive width -->
        <div class="w-full" :style="{ maxWidth: `${contentWidth}px` }">
          <div class="bg-white/95 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 relative z-10">
            <h1 class="text-2xl sm:text-3xl font-bold text-green-800 mb-4 sm:mb-6">Tree Health Statistics</h1>
            
            <!-- Search and Filter Bar - responsive spacing -->
            <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
              <input
                type="text"
                placeholder="Search by coordinates..."
                class="flex-1 p-2 text-sm sm:text-base rounded-lg border border-green-200 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
              <select class="p-2 text-sm sm:text-base rounded-lg border border-green-200 shadow-sm">
                <option value="all">All Health Levels</option>
                <option value="3">Healthy (3)</option>
                <option value="2">Moderate (2)</option>
                <option value="1">Poor (1)</option>
              </select>
            </div>

            <!-- Table Container with responsive height -->
            <div class="overflow-auto rounded-lg shadow" :style="{ maxHeight: `${tableHeight}vh` }">
              <table class="min-w-full bg-white">
                <thead class="bg-green-50">
                  <tr>
                    <th class="py-3 px-4 text-left text-green-800 font-semibold border-b">Coordinates</th>
                    <th class="py-3 px-4 text-left text-green-800 font-semibold border-b">Health</th>
                    <th class="py-3 px-4 text-left text-green-800 font-semibold border-b">NDVI</th>
                    <th class="py-3 px-4 text-center text-green-800 font-semibold border-b">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <template v-for="tree in trees" :key="tree.id">
                    <tr class="hover:bg-green-50/50 transition-colors">
                      <td class="py-3 px-4">{{ formatCoordinates(tree.lat, tree.lng) }}</td>
                      <td class="py-3 px-4">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                              :class="healthClass(tree.health)">
                          {{ '❤️'.repeat(tree.health) }}
                        </span>
                      </td>
                      <td class="py-3 px-4">{{ tree.ndvi?.toFixed(2) || 'N/A' }}</td>
                      <td class="py-3 px-4 text-center">
                        <button 
                          @click="toggleDetails(tree.id)"
                          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          {{ expandedTreeId === tree.id ? 'Hide Details' : 'View Details' }}
                        </button>
                      </td>
                    </tr>
                    <!-- Expanded Details -->
                    <tr v-if="expandedTreeId === tree.id">
                      <td colspan="4" class="p-4 bg-green-50/30">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <!-- Map -->
                          <div class="bg-white rounded-lg shadow-md overflow-hidden">
                            <div :id="'map-' + tree.id" class="w-full h-64"></div>
                          </div>
                          
                          <!-- Tree Details -->
                          <div class="bg-white rounded-lg shadow-md p-4">
                            <h3 class="font-semibold text-green-800 mb-4">Tree Details</h3>
                            <div class="space-y-2">
                              <p><span class="font-medium">Health Score:</span> {{ tree.health }}/3</p>
                              <p><span class="font-medium">NDVI:</span> {{ tree.ndvi?.toFixed(3) || 'N/A' }}</p>
                              <p><span class="font-medium">Last Updated:</span> {{ new Date().toLocaleDateString() }}</p>
                            </div>
                          </div>
                          
                          <!-- Actions -->
                          <div class="bg-white rounded-lg shadow-md p-4">
                            <h3 class="font-semibold text-green-800 mb-4">Actions</h3>
                            <div class="space-y-3">
                              <button 
                                @click="markTreeOk(tree.id)"
                                class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Mark as Visited
                              </button>
                              <button 
                                @click="planRoute(tree.lat, tree.lng)"
                                class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Plan Route
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
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
import { ref, onMounted, watch, nextTick, computed, onUnmounted } from 'vue'
import AppSidebar from '~/components/AppSidebar.vue'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

const { fetchTreesSortedByValue } = useSupabaseByValue()
const trees = ref([])
const expandedTreeId = ref(null)
let L

// Responsive sizing
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

// Update window dimensions on resize
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

// Compute content width based on screen size
const contentWidth = computed(() => {
  const baseWidth = 1200 // Maximum width
  const minWidth = 320 // Minimum width
  const screenWidth = windowWidth.value
  
  if (screenWidth <= 640) { // Mobile
    return Math.max(screenWidth - 32, minWidth) // 16px padding on each side
  } else if (screenWidth <= 1024) { // Tablet
    return Math.min(screenWidth * 0.85, baseWidth)
  } else { // Desktop
    return baseWidth
  }
})

// Compute table height based on screen size
const tableHeight = computed(() => {
  const screenHeight = windowHeight.value
  
  if (screenHeight < 600) {
    return 50 // Smaller height for very small screens
  } else if (screenHeight > 1200) {
    return 70 // Larger height for big screens
  } else {
    return 60 // Default height
  }
})

// Compute expanded details height
const detailsHeight = computed(() => {
  return windowHeight.value < 800 ? 200 : 300 // Adjust map/details height based on screen height
})

const createTreeIcon = () => {
  if (!L) return null
  return (health) => L.divIcon({
    html: `<div class="tree-icon">
            <svg xmlns="http://www.w3.org/2000/svg" 
                 width="24" 
                 height="24" 
                 viewBox="0 0 24 24" 
                 fill="none" 
                 stroke="${health === 3 ? '#16a34a' : health === 2 ? '#ca8a04' : '#dc2626'}" 
                 stroke-width="2" 
                 stroke-linecap="round" 
                 stroke-linejoin="round">
              <path d="M8 19h8a4 4 0 0 0 3.8-2.8 4 4 0 0 0-1.6-4.5c1-1.1 1-2.7 0-3.8-.7-.8-1.8-1.2-2.9-1.1a3.6 3.6 0 0 0-3.2-2A3.7 3.7 0 0 0 9 6.7c-1.1-.1-2.2.3-2.9 1.1-1 1.1-1 2.7 0 3.8a4 4 0 0 0-1.6 4.5A4 4 0 0 0 8 19Z"/>
              <path d="M12 19v3"/>
            </svg>
          </div>`,
    className: 'tree-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  })
}

onMounted(async () => {
  L = await import('leaflet').then(m => m.default || m)
  await import('leaflet-routing-machine')

  const data = await fetchTreesSortedByValue()
  trees.value = data
})

watch(expandedTreeId, async (newId) => {
  if (newId !== null && trees.value.length > 0) {
    await nextTick() // Ensure the DOM is updated
    const tree = trees.value.find(t => t.id === newId)
    if (tree) {
      const map = L.map(`map-${tree.id}`).setView([tree.lat, tree.lng], 35) // Zoom in more
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)
      const treeIcon = createTreeIcon()
      L.marker([tree.lat, tree.lng], { icon: treeIcon(tree.health) }).addTo(map)
    }
  }
})

function toggleDetails(treeId) {
  expandedTreeId.value = expandedTreeId.value === treeId ? null : treeId
}

function markTreeOk(treeId) {
  console.log(`Tree ${treeId} marked as OK`)
  // Add your logic here
}

function markTreeNeedsHelp(treeId) {
  console.log(`Tree ${treeId} marked as needing help`)
  // Add your logic here
}

function planRoute(lat, lng) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  window.open(url, '_blank')
}

function formatCoordinates(lat, lng) {
  return `${lat.toFixed(4)} : ${lng.toFixed(4)}`
}

function healthClass(health) {
  return {
    'bg-red-100 text-red-800': health === 1,
    'bg-yellow-100 text-yellow-800': health === 2,
    'bg-green-100 text-green-800': health === 3,
  }
}
</script>

<style scoped>
/* Styles will be handled by Tailwind classes */
.tree-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

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

/* Table styles */
.divide-y > tr {
  border-bottom: 1px solid #e5e7eb;
}

/* Smooth transitions */
.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Responsive text sizing */
@media (max-width: 640px) {
  .text-sm {
    font-size: 0.875rem;
  }
  
  th, td {
    padding: 0.75rem 0.5rem;
  }
}

/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Ensure proper scrolling on mobile */
.overflow-auto {
  -webkit-overflow-scrolling: touch;
}
</style>

