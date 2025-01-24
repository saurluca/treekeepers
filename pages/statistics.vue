<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <AppSidebar class="z-30" />
    
    <!-- Main content -->
    <div class="flex-1 bg-gray-100 p-4">
      <div class="container mx-auto">
        <h1 class="text-3xl font-bold mb-4">Statistics</h1>
        <p> </p>
        <div class="overflow-auto">
          <table class="min-w-full bg-white">
            <thead>
              <tr>
                <th class="py-2 px-4 border-b">Coordinates</th>
                <th class="py-2 px-4 border-b">Health</th>
                <th class="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="tree in trees" :key="tree.id">
                <tr>
                  <td class="py-2 px-4 border-b text-center">{{ formatCoordinates(tree.lat, tree.lng) }}</td>
                  <td class="py-2 px-4 border-b text-center">
                    <span :class="healthClass(tree.health)" class="px-4 py-1 rounded text-black" :style="{ backgroundColor: healthBackgroundColor(tree.health) }">{{ tree.health }}</span>
                  </td>
                  <td class="py-2 px-4 border-b text-center">
                    <button class="bg-gray-200 text-gray-700 py-1 px-3 rounded hover:bg-gray-300" @click="toggleDetails(tree.id)">Toggle Details</button>
                  </td>
                </tr>
                <tr v-if="expandedTreeId !== null && expandedTreeId === tree.id" class="bg-white">
                  <td colspan="3" class="py-2 px-4 border-b">
                    <div class="flex">
                      <div class="w-1/3 mr-4">
                        <div :id="'map-' + tree.id" class="w-full h-64 rounded-lg shadow-lg border border-gray-200"></div>
                      </div>
                      <div class="w-1/3 mr-4">
                        <!-- Placeholder for diagram -->
                        <div class="h-64 bg-gray-300">Diagram Placeholder</div>
                      </div>
                      <div class="w-1/3 flex flex-col items-center justify-center space-y-2">
                        <button class="bg-green-500 text-white py-2 px-4 rounded w-full" @click="markTreeOk(tree.id)">Visited and Tree is OK</button>
                        <button class="bg-yellow-500 text-white py-2 px-4 rounded w-full" @click="markTreeNeedsHelp(tree.id)">Visited and Tree Still Needs Help</button>
                        <button class="bg-blue-500 text-white py-2 px-4 rounded w-full" @click="planRoute(tree.lat, tree.lng)">Plan Route</button>
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
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import AppSidebar from '~/components/AppSidebar.vue'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

const { fetchTreesSortedByValue } = useSupabaseByValue()
const trees = ref([])
const expandedTreeId = ref(null)
let L

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
    'text-black': true
  }
}

function healthBackgroundColor(health) {
  return health === 3 ? '#16a34a' : health === 2 ? '#ca8a04' : '#dc2626'
}
</script>

<style scoped>
/* Styles will be handled by Tailwind classes */
.tree-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
