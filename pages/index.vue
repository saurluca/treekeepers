<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="container mx-auto">
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

// Define 5 locations near the provided coordinates
const trees = [
  { lat: 50.907672, lng: 6.900960, name: 'Oak Tree', health: 3, species: 'Quercus' },
  { lat: 50.908672, lng: 6.902960, name: 'Maple Tree', health: 2, species: 'Acer' },
  { lat: 50.906672, lng: 6.898960, name: 'Pine Tree', health: 1, species: 'Pinus' },
  { lat: 50.907872, lng: 6.898960, name: 'Birch Tree', health: 3, species: 'Betula' },
  { lat: 50.906472, lng: 6.902960, name: 'Linden Tree', health: 2, species: 'Tilia' },
]

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

  // Initialize map centered on Cologne coordinates
  map.value = L.map('map').setView([50.907672, 6.900960], 15)

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
