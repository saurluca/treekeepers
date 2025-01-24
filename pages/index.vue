<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <AppSidebar />
    
    <!-- Main content -->
    <div class="flex-1 bg-gray-100 p-4">
      <div class="container mx-auto relative">
        <div class="flex gap-4 mb-4">
          <input
            type="text"
            v-model="searchQuery"
            @keyup.enter="handleSearch"
            placeholder="Search for a location..."
            class="flex-1 p-2 rounded-lg border border-gray-200 shadow-sm"
          />
          <button
            @click="handlePlanRoute"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Plan Tree Route
          </button>
        </div>
        <div 
          id="map" 
          class="w-full h-[600px] rounded-lg shadow-lg border border-gray-200"
        ></div>
        <div class="absolute top-14 right-0 bg-white px-3 py-1 rounded-lg shadow-md z-[1000]">
          Zoom: {{ currentZoom }}
        </div>
      </div>
      <!-- Hidden template for tree icon -->
      <div class="hidden">
        <div id="tree-icon-template">
          <TreeDeciduous class="w-6 h-6 text-green-600" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { TreeDeciduous } from 'lucide-vue-next'
import { useTreeRoute } from '~/composables/useTreeRoute'
import { useGeoUtils } from '~/composables/useGeoUtils'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import AppSidebar from '~/components/AppSidebar.vue'

const map = ref(null)
const searchQuery = ref('')
let L
const trees = ref([])
const currentZoom = ref(11)
const errorMessage = ref('')

// Initialize the route planning composable
const { planRoute } = useTreeRoute(map)

// Add this after other const declarations
const { calculateDistance } = useGeoUtils()

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

// Update the button click handler to pass L to planRoute
const handlePlanRoute = () => planRoute(trees, L)

// Add cleanup ref
const mapInitialized = ref(false)

// Update createTreeIcon to use the L instance
const createTreeIcon = () => {
  if (!L) return null; // Guard against L not being initialized
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
  });
};

// Add these new utility functions and refs
const currentMarkers = ref(new Set())
const debounceTimeout = ref(null)

const getVisibleBounds = (map) => {
  const bounds = map.getBounds()
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest()
  }
}

const updateVisibleTrees = async () => {
  if (!map.value) return
  
  const bounds = getVisibleBounds(map.value)
  const zoom = map.value.getZoom()
  
  // Remove existing markers
  currentMarkers.value.forEach(marker => marker.remove())
  currentMarkers.value.clear()

  // If zoomed out too far, don't show anything
  if (zoom < 8) return

  // Fetch trees in current bounds
  const { fetchTrees } = useSupabase()
  const treesInBounds = await fetchTrees(bounds, zoom)
  
  const treeIconFactory = createTreeIcon()
  const clusterIconFactory = createClusterIcon()
  
  // Add new markers
  treesInBounds.forEach(item => {
    const marker = L.marker(
      [item.lat, item.lng], 
      { icon: item.isCluster ? clusterIconFactory(item) : treeIconFactory(item.health) }
    )

    if (item.isCluster) {
      marker.bindPopup(`
        <div class="font-bold">Tree Cluster</div>
        <div>Trees in cluster: ${item.treeCount}</div>
        <div>Average health: ${'❤️'.repeat(item.health)}</div>
        <div>Average NDVI: ${item.avgNdvi}</div>
        <div class="text-sm text-gray-600">Zoom in to see individual trees</div>
      `)
    } else {
      marker.bindPopup(`
        <div class="font-bold">Tree</div>
        <div>Health: ${'❤️'.repeat(item.health)}</div>
      `)
    }
    
    marker.addTo(map.value)
    currentMarkers.value.add(marker)
  })
}

const debouncedUpdateTrees = () => {
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }
  debounceTimeout.value = setTimeout(updateVisibleTrees, 250)
}

const createClusterIcon = () => {
  if (!L) return null
  return (cluster) => L.divIcon({
    html: `<div class="cluster-icon" style="background-color: ${
      cluster.health === 3 ? '#16a34a' : 
      cluster.health === 2 ? '#ca8a04' : '#dc2626'
    }">
      <div class="cluster-icon-inner">
        ${cluster.treeCount}
      </div>
    </div>`,
    className: 'tree-cluster-icon',
    iconSize: [40, 30],
    iconAnchor: [20, 20]
  })
}

onMounted(async () => {
  if (mapInitialized.value) return  // Prevent multiple initializations
  
  L = await import('leaflet').then(m => m.default || m)
  await import('leaflet-routing-machine')

  try {
    if (!map.value) {
      map.value = L.map('map').setView([52.520008, 13.404954], 11)
      mapInitialized.value = true

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map.value)

      // Add event listeners for map movement
      map.value.on('moveend', debouncedUpdateTrees)
      map.value.on('zoomend', () => {
        currentZoom.value = map.value.getZoom()
        debouncedUpdateTrees()
      })
      
      // Initial tree update
      updateVisibleTrees()
    }
  } catch (error) {
    console.error('Error initializing map:', error)
    errorMessage.value = 'Unable to initialize map. Please try again later.'
  }
})

// Update cleanup
onUnmounted(() => {
  if (map.value) {
    if (debounceTimeout.value) {
      clearTimeout(debounceTimeout.value)
    }
    currentMarkers.value.forEach(marker => marker.remove())
    map.value.remove()
    map.value = null
    mapInitialized.value = false  // Reset initialization flag
  }
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

.tree-cluster-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cluster-icon {
  width: 40px;
  height: 30px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.cluster-icon-inner {
  font-size: 14px;
}
</style>
