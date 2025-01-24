<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <AppSidebar class="z-30" />
    
    <!-- Main content -->
    <div class="flex-1 bg-gray-100 p-4 relative">
      <div class="container mx-auto relative">
        <!-- Search container - responsive width -->
        <div class="flex gap-2 sm:gap-4 mb-4 w-full max-w-screen-lg transition-all duration-300 relative z-10"
             :style="{ width: `${searchBarWidth}%` }">
          <input
            type="text"
            v-model="searchQuery"
            @keyup.enter="handleSearch"
            placeholder="Search for a location..."
            class="flex-1 p-2 text-sm sm:text-base rounded-lg border border-gray-200 shadow-sm min-w-0"
          />
          <button
            @click="handlePlanRoute"
            class="px-2 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap text-sm sm:text-base"
          >
            Plan Tree Route
          </button>
        </div>

        <!-- Map container - responsive height -->
        <div 
          id="map" 
          class="w-full rounded-lg shadow-lg border border-gray-200 transition-all duration-300 relative z-0"
          :style="{ height: `${mapHeight}vh` }"
        ></div>

        <!-- Zoom indicator - responsive positioning and size -->
        <div 
          class="absolute top-14 right-4 bg-white px-2 sm:px-3 py-1 rounded-lg shadow-md z-20 text-sm sm:text-base"
          :style="{ opacity: zoomIndicatorOpacity }"
        >
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
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
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

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
        <div>NDVI: ${item.ndvi}</div>
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
    html: `<div class="cluster-icon px-2 py-2.5 rounded-full flex items-center justify-center" style="background-color: #3B82F6; opacity: 0.9; color: white;">
            <span class="text-sm font-bold">${cluster.treeCount}</span>
          </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
    className: 'no-background'  // Added class to remove white background
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

// Compute search bar width based on zoom and screen size
const searchBarWidth = computed(() => {
  const baseWidth = windowWidth.value > 640 ? 50 : 90 // Wider on mobile
  const zoomFactor = currentZoom.value
  
  if (zoomFactor >= 15) {
    return Math.min(baseWidth * 1.3, 95)
  } else if (zoomFactor <= 8) {
    return Math.max(baseWidth * 0.7, 40)
  } else {
    const factor = (zoomFactor - 8) / (15 - 8)
    return baseWidth + (factor * baseWidth * 0.3)
  }
})

// Compute map height based on screen size
const mapHeight = computed(() => {
  const baseHeight = 80 // Base height in vh
  if (windowHeight.value < 600) {
    return 70 // Smaller height for very small screens
  } else if (windowHeight.value > 1200) {
    return 85 // Larger height for big screens
  }
  return baseHeight
})

// Compute zoom indicator opacity based on map interaction
const zoomIndicatorOpacity = computed(() => {
  return currentZoom.value > 8 ? 1 : 0.7
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
  background: none;  /* Remove any background */
}

.cluster-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.cluster-icon-inner {
  font-size: 14px;
  border-radius: 50%;
}

/* Responsive container adjustments */
@media (max-width: 1024px) {
  .container {
    padding-left: 4rem;
  }
}

/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Ensure proper text sizing */
@media (max-width: 640px) {
  input::placeholder {
    font-size: 0.875rem;
  }
}

/* Prevent map overflow */
#map {
  max-height: calc(100vh - 8rem);
  min-height: 300px;
}

/* Ensure proper z-index stacking */
.z-0 {
  z-index: 0;
}

.z-10 {
  z-index: 10;
}

.z-20 {
  z-index: 20;
}

.z-30 {
  z-index: 30;
}
</style>
