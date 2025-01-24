<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <AppSidebar class="z-30" />
    
    <!-- Main content -->
    <div class="flex-1 relative">
      <!-- Content with semi-transparent background -->
      <div class="relative min-h-screen bg-green-50/95 flex flex-col p-2 pt-12 lg:pt-2">
        <div class="w-full max-w-3xl lg:ml-64 flex flex-col">
          <!-- Main container with dynamic sizing -->
          <div class="bg-white/95 rounded-lg shadow-lg mb-2 p-3 overflow-y-auto relative z-10"
               :style="{
                 width: containerWidth,
                 height: `${containerHeight}vh`,
                 fontSize: `${baseFontSize}px`
               }">
            <h1 class="text-2xl sm:text-3xl font-bold text-green-800 mb-3">Tree Health Statistics</h1>
            
            <!-- Search and Filter Bar -->
            <div class="flex flex-col sm:flex-row gap-2 mb-3"
                 :style="{ height: `${searchBarHeight}vh` }">
              <input
                type="text"
                placeholder="Search by coordinates..."
                class="flex-1 p-1.5 rounded-lg border border-green-200 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                :style="{ fontSize: `${inputFontSize}px` }"
              />
              <select 
                class="p-1.5 rounded-lg border border-green-200 shadow-sm"
                :style="{ fontSize: `${inputFontSize}px` }"
              >
                <option value="all">All Health Levels</option>
                <option value="3">Healthy (3)</option>
                <option value="2">Moderate (2)</option>
                <option value="1">Poor (1)</option>
              </select>
            </div>

            <!-- Table Container -->
            <div class="overflow-auto rounded-lg shadow"
                 :style="{ height: `${tableHeight}vh` }">
              <table class="min-w-full bg-white">
                <thead class="bg-green-50">
                  <tr>
                    <th class="py-2 px-3 text-left text-green-800 font-semibold border-b"
                        :style="{ fontSize: `${tableFontSize}px` }">
                      Coordinates
                    </th>
                    <th class="py-2 px-3 text-left text-green-800 font-semibold border-b"
                        :style="{ fontSize: `${tableFontSize}px` }">
                      Health
                    </th>
                    <th class="py-2 px-3 text-left text-green-800 font-semibold border-b"
                        :style="{ fontSize: `${tableFontSize}px` }">
                      NDVI
                    </th>
                    <th class="py-2 px-3 text-center text-green-800 font-semibold border-b"
                        :style="{ fontSize: `${tableFontSize}px` }">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <template v-for="tree in trees" :key="tree.id">
                    <tr class="hover:bg-green-50/50 transition-colors">
                      <td class="py-2 px-3">{{ formatCoordinates(tree.lat, tree.lng) }}</td>
                      <td class="py-2 px-3">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                              :class="healthClass(tree.health)">
                          {{ '❤️'.repeat(tree.health) }}
                        </span>
                      </td>
                      <td class="py-2 px-3">{{ tree.ndvi?.toFixed(2) || 'N/A' }}</td>
                      <td class="py-2 px-3 text-center">
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
                          
                          <!-- Tree Measurements Chart -->
                          <div class="bg-white rounded-lg shadow-md p-4 col-span-2">
                            <h3 class="font-semibold text-green-800 mb-4">Tree Measurements Over Time</h3>
                            <canvas :id="'chart-' + tree.id"></canvas>
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
import { Chart, registerables } from 'chart.js'
import 'chartjs-adapter-date-fns'

const { fetchTreesSortedByValue } = useSupabaseByValue()
const trees = ref([])
const expandedTreeId = ref(null)
let L

<<<<<<< HEAD
// Register Chart.js components
Chart.register(...registerables)

// Responsive sizing
=======
// Screen size computations
>>>>>>> 842236f8edbdcd10de8a6404147742fe5b496512
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

// Update dimensions on resize
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

// Computed properties for responsive sizing
const containerWidth = computed(() => {
  const width = windowWidth.value
  if (width <= 640) {
    return 'calc(100vw - 80px)'
  } else if (width <= 1024) {
    return 'min(calc(100vw - 80px), 768px)'
  }
  return 'min(calc(100vw - 260px), 768px)'
})

const containerHeight = computed(() => {
  return windowHeight.value < 800 ? 85 : 90
})

const searchBarHeight = computed(() => {
  return windowHeight.value < 800 ? 8 : 10
})

const tableHeight = computed(() => {
  return windowHeight.value < 800 ? 65 : 70
})

const baseFontSize = computed(() => {
  return Math.max(14, Math.min(16, windowWidth.value / 80))
})

const inputFontSize = computed(() => {
  return Math.max(12, Math.min(14, windowWidth.value / 90))
})

const tableFontSize = computed(() => {
  return Math.max(12, Math.min(14, windowWidth.value / 90))
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

      // Create chart
      const ctx = document.getElementById(`chart-${tree.id}`).getContext('2d')
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: tree.measurements.map(m => new Date(m.measurement_date).toLocaleDateString()),
          datasets: [{
            label: 'NDVI',
            data: tree.measurements.map(m => m.ndvi),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'month'
              },
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              title: {
                display: true,
                text: 'NDVI'
              }
            }
          }
        }
      })
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

/* Add smooth margin transitions */
.ml-auto {
  transition: margin 0.3s ease-in-out, padding 0.3s ease-in-out;
}

/* Mobile optimizations */
@media (max-width: 1024px) {
  .lg\:ml-64 {
    margin-left: 0;
  }
  
  .bg-white\/95 {
    width: min(calc(100vw - 80px), 768px) !important;
    max-width: calc(100vw - 80px);
    margin-right: 0.75rem;
    margin-left: 2rem;
  }
}

/* Add responsive width adjustments */
@media (min-width: 1024px) {
  .bg-white\/95 {
    width: min(calc(100vw - 260px), 768px) !important;
    max-width: 768px;
  }
}

/* Ensure smooth transitions for all size changes */
.bg-white\/95 {
  transition: all 0.3s ease-in-out;
}

input, select, table {
  transition: font-size 0.3s ease-in-out;
}

/* Prevent text from becoming too small on mobile */
@media (max-width: 640px) {
  input, select, td, th {
    font-size: max(12px, 3.5vw) !important;
  }
  
  h1 {
    font-size: max(20px, 5vw) !important;
  }
}
</style>

