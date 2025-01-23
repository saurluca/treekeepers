<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="container mx-auto">
      <!-- Add search bar -->
      <div class="mb-4">
        <input
          type="text"
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          placeholder="Search for a location..."
          class="w-full p-2 rounded-lg border border-gray-200 shadow-sm"
        />
      </div>
      <div 
        id="map" 
        class="w-full h-[600px] rounded-lg shadow-lg border border-gray-200"
      ></div>
    </div>
    <!-- Hidden template for tree icon -->
    <div class="hidden">
      <div id="tree-icon-template">
        <TreeDeciduous class="w-6 h-6 text-green-600" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TreeDeciduous } from 'lucide-vue-next'
import 'leaflet/dist/leaflet.css'

const map = ref(null)
const searchQuery = ref('')

// Define 5 locations near the provided coordinates
const trees = [
  { lat: 52.520008, lng: 13.404954, name: 'Oak Tree', health: 3, species: 'Quercus' },      // Central Berlin
  { lat: 52.530008, lng: 13.414954, name: 'Maple Tree', health: 2, species: 'Acer' },       // 2 km NE
  { lat: 52.510008, lng: 13.394954, name: 'Pine Tree', health: 1, species: 'Pinus' },       // 2 km SW
  { lat: 52.530208, lng: 13.394954, name: 'Birch Tree', health: 3, species: 'Betula' },     // 2 km NW
  { lat: 52.510808, lng: 13.414954, name: 'Linden Tree', health: 2, species: 'Tilia' },     // 2 km SE
]

// Add search handler function
const handleSearch = async () => {
  if (!searchQuery.value || !map.value) return
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}`
    )
    const data = await response.json()
    
    if (data && data.length > 0) {
      const { lat, lon } = data[0]
      map.value.setView([lat, lon], 13)
    }
  } catch (error) {
    console.error('Search failed:', error)
  }
}

onMounted(async () => {
  const L = await import('leaflet').then(m => m.default || m)
  
  // Create custom tree icon using Lucide icon
  const treeIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600">
      <path d="M8 19h8a4 4 0 0 0 3.8-2.8 4 4 0 0 0-1.6-4.5c1-1.1 1-2.7.4-4-.7-1.2-2.2-2-3.6-1.7a3 3 0 0 0-3-3 3 3 0 0 0-3 3c-1.4-.2-2.9.5-3.6 1.7-.7 1.3-.5 2.9.4 4a4 4 0 0 0-1.6 4.5A4 4 0 0 0 8 19Z"/>
      <path d="M12 19v3"/>
    </svg>`,
    className: 'tree-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  })

  // Initialize map centered on Berlin coordinates
  map.value = L.map('map').setView([52.520008, 13.404954], 15)

  // Add OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map.value)

  // Add markers for each tree
  trees.forEach(tree => {
    const healthStatus = '❤️'.repeat(tree.health)
    L.marker([tree.lat, tree.lng], { icon: treeIcon })
      .bindPopup(`
        <div class="font-bold">${tree.name}</div>
        <div>Species: ${tree.species}</div>
        <div>Health: ${healthStatus}</div>
      `)
      .bindTooltip(`Health: ${healthStatus}`, {
        permanent: false,
        direction: 'top'
      })
      .addTo(map.value)
  })
})
</script>

<style scoped>
/* Fix Leaflet marker icons */
.leaflet-default-icon-path {
  background-image: url("leaflet/dist/images/marker-icon.png");
}
.leaflet-default-shadow-path {
  background-image: url("leaflet/dist/images/marker-shadow.png");
}

.tree-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.tree-icon svg {
  color: rgb(22 163 74); /* text-green-600 */
}
</style>
