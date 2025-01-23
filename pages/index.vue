<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="container mx-auto">
      <div class="flex gap-4 mb-4">
        <input
          type="text"
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          placeholder="Search for a location..."
          class="flex-1 p-2 rounded-lg border border-gray-200 shadow-sm"
        />
        <button
          @click="planRoute"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Plan Tree Route
        </button>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { TreeDeciduous } from 'lucide-vue-next'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

const map = ref(null)
const searchQuery = ref('')
let routingControl = null
let L; // Declare L at module scope

// Define 5 locations near the provided coordinates
const trees_samples = [
  { lat: 52.520008, lng: 13.404954, name: 'Oak Tree', health: 3, species: 'Quercus' },      // Central Berlin
  { lat: 52.530008, lng: 13.414954, name: 'Maple Tree', health: 2, species: 'Acer' },       // 2 km NE
  { lat: 52.510008, lng: 13.394954, name: 'Pine Tree', health: 1, species: 'Pinus' },       // 2 km SW
  { lat: 52.530208, lng: 13.394954, name: 'Birch Tree', health: 3, species: 'Betula' },     // 2 km NW
  { lat: 52.510808, lng: 13.414954, name: 'Linden Tree', health: 2, species: 'Tilia' },     // 2 km SE
  { lat: 52.520008, lng: 13.414954, name: 'Chestnut Tree', health: 1, species: 'Castanea' }, // 2 km N
  { lat: 52.520008, lng: 13.394954, name: 'Willow Tree', health: 3, species: 'Salix' },     // 2 km S
  { lat: 52.530008, lng: 13.404954, name: 'Beech Tree', health: 2, species: 'Fagus' },      // 2 km E
  { lat: 52.510008, lng: 13.404954, name: 'Cedar Tree', health: 1, species: 'Cedrus' },     // 2 km W
  { lat: 52.530208, lng: 13.414954, name: 'Poplar Tree', health: 3, species: 'Populus' },   // 2 km NE
  { lat: 52.510808, lng: 13.394954, name: 'Spruce Tree', health: 2, species: 'Picea' },     // 2 km SW
]

const trees = ref([])

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

// Add these utility functions
const calculateDistance = (point1, point2) => {
  // Using Haversine formula for more accurate distance calculation
  const R = 6371 // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180
  const dLon = (point2.lng - point1.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

const findNearestNeighborRoute = (trees) => {
  const unvisited = [...trees]
  const route = [unvisited.shift()] // Start with the first tree
  
  while (unvisited.length > 0) {
    const currentPoint = route[route.length - 1]
    let nearestIndex = 0
    let minDistance = Infinity
    
    // Find the nearest unvisited tree
    unvisited.forEach((tree, index) => {
      const distance = calculateDistance(currentPoint, tree)
      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = index
      }
    })
    
    // Add the nearest tree to our route and remove it from unvisited
    route.push(unvisited[nearestIndex])
    unvisited.splice(nearestIndex, 1)
  }
  
  return route
}

// Add this utility function for coordinate conversion
const convertWebMercatorToLatLng = (x, y) => {
  const lng = (x * 180) / 20037508.34;
  const lat = (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
  return { lat, lng };
}

// Updated planRoute function
const planRoute = () => {
  if (!map.value) return
  
  // Remove existing route if any
  if (routingControl) {
    map.value.removeControl(routingControl)
  }

  // Filter trees that need attention (health < 3)
  const treesNeedingAttention = trees.value.filter(tree => tree.health < 3)
  
  // Only proceed if there are trees needing attention
  if (treesNeedingAttention.length === 0) {
    console.log('No trees need attention!')
    return
  }

  // Calculate the optimal route for trees needing attention
  const optimizedRoute = findNearestNeighborRoute(treesNeedingAttention)
  
  // Create waypoints from the optimized route
  const waypoints = optimizedRoute.map(tree => L.latLng(tree.lat, tree.lng))

  // Create new routing control
  routingControl = L.Routing.control({
    waypoints: waypoints,
    routeWhileDragging: false,
    showAlternatives: false,
    fitSelectedRoutes: true,
    createMarker: () => null, // Don't create additional markers
    lineOptions: {
      styles: [
        { color: 'green', opacity: 0.7, weight: 3 }
      ]
    },
    router: L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1',
      profile: 'walking'
    })
  }).addTo(map.value)

  // Fit bounds after route is calculated
  routingControl.on('routesfound', function(e) {
    const routes = e.routes
    if (routes && routes[0]) {
      const bounds = L.latLngBounds(routes[0].coordinates)
      map.value.fitBounds(bounds, { padding: [50, 50] })
      
      // Display the total distance and number of trees in route
      const totalDistance = routes[0].summary.totalDistance
      const totalTime = routes[0].summary.totalTime
      console.log(`Visiting ${treesNeedingAttention.length} trees that need attention`)
      console.log(`Total distance: ${(totalDistance/1000).toFixed(2)} km`)
      console.log(`Estimated time: ${Math.round(totalTime/60)} minutes`)
    }
  })
}

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

onMounted(async () => {
  if (mapInitialized.value) return
  
  // Assign L to module scope
  L = await import('leaflet').then(m => m.default || m)
  await import('leaflet-routing-machine')

  try {
    // Load and process GeoJSON data
    const response = await fetch('/data/tree.geojson')
    const geojsonData = await response.json()
    
    // Create the icon factory after L is loaded
    const treeIconFactory = createTreeIcon()

    console.log(geojsonData.features.slice(0, 500))
    
    // Transform features into tree format
    trees.value = geojsonData.features
      .slice(0, 500)
      .map(feature => {
        return {
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
          name: feature.properties.art_deutsch || 'Unknown Tree',
          species: feature.properties.art_bot || 'Unknown Species',
          health: Math.floor(Math.random() * 3) + 1
        };
      })
    // console.log(trees.value)
    // Initialize map only if it hasn't been initialized yet
    if (!map.value) {
      map.value = L.map('map').setView([52.520008, 13.404954], 15)
      mapInitialized.value = true

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map.value)

      // Add markers for each tree
      trees.value.forEach(tree => {
        const healthStatus = '❤️'.repeat(tree.health)
        L.marker([tree.lat, tree.lng], { icon: treeIconFactory(tree.health) })
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
    }
  } catch (error) {
    console.error('Error loading tree data:', error)
    trees.value = []
  }
})

// Add cleanup on component unmount
onUnmounted(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
    mapInitialized.value = false
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
</style>
