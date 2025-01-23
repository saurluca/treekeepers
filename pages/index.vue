<template>
  <div class="min-h-screen bg-gray-100 p-4">
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

const trees = ref([])

const currentZoom = ref(11) // Initialize with default zoom level

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


const MINIMUM_ZOOM_FOR_TREES = 18// Only show individual trees at zoom >= 14
const CLUSTER_RADIUS_BASE = 20 // Increased base radius for larger clusters
const MAX_VISIBLE_TREES = 200

const pixelsToLatLng = (map, pixels, latitude) => {
  const metersPerPixel = 156543.03392 * Math.cos(latitude * Math.PI / 180) / Math.pow(2, map.getZoom())
  return (pixels * metersPerPixel) / 111320 // Convert to approximate degrees
}

const clusterTrees = (trees, map) => {
  if (!trees.length) return []
  
  const zoom = map.getZoom()
  const clusters = []
  const processed = new Set()
  
  // Adjust cluster radius based on zoom (much larger radius when zoomed out)
  const clusterRadius = pixelsToLatLng(
    map, 
    CLUSTER_RADIUS_BASE * (140 - zoom), // Exponentially larger clusters at lower zoom
    map.getCenter().lat
  )

  trees.forEach((tree, index) => {
    if (processed.has(index)) return

    const cluster = {
      lat: tree.lat,
      lng: tree.lng,
      trees: [tree],
      health: tree.health
    }

    // Find nearby trees
    trees.forEach((otherTree, otherIndex) => {
      if (index === otherIndex || processed.has(otherIndex)) return

      const distance = calculateDistance(
        { lat: tree.lat, lng: tree.lng },
        { lat: otherTree.lat, lng: otherTree.lng }
      )

      if (distance <= clusterRadius) {
        cluster.trees.push(otherTree)
        // Update cluster center
        cluster.lat = cluster.trees.reduce((sum, t) => sum + t.lat, 0) / cluster.trees.length
        cluster.lng = cluster.trees.reduce((sum, t) => sum + t.lng, 0) / cluster.trees.length
        // Update cluster health (average)
        cluster.health = Math.round(cluster.trees.reduce((sum, t) => sum + t.health, 0) / cluster.trees.length)
        processed.add(otherIndex)
      }
    })

    clusters.push(cluster)
    processed.add(index)
  })

  return clusters
}

const createClusterIcon = () => {
  if (!L) return null
  return (cluster) => L.divIcon({
    html: `<div class="cluster-icon" style="background-color: ${
      cluster.health === 3 ? '#16a34a' : 
      cluster.health === 2 ? '#ca8a04' : '#dc2626'
    }">
      <div class="cluster-icon-inner">
        ${cluster.trees.length}
      </div>
    </div>`,
    className: 'tree-cluster-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  })
}

const updateVisibleTrees = () => {
  if (!map.value) return
  
  const bounds = getVisibleBounds(map.value)
  const zoom = map.value.getZoom()
  
  // Remove existing markers
  currentMarkers.value.forEach(marker => marker.remove())
  currentMarkers.value.clear()

  // If zoomed out too far, don't show anything
  if (zoom < 8) return

  // Get trees in bounds
  const treesInBounds = trees.value.filter(tree => 
    tree.lat >= bounds.south &&
    tree.lat <= bounds.north &&
    tree.lng >= bounds.west &&
    tree.lng <= bounds.east
  )

  // Apply clustering if not zoomed in enough, otherwise show individual trees
  const visibleItems = zoom >= MINIMUM_ZOOM_FOR_TREES 
    ? treesInBounds.slice(0, MAX_VISIBLE_TREES).map(tree => ({ ...tree, trees: [tree] }))
    : clusterTrees(treesInBounds, map.value)

  const treeIconFactory = createTreeIcon()
  const clusterIconFactory = createClusterIcon()
  
  // Add new markers
  visibleItems.forEach(item => {
    const isCluster = item.trees.length > 1
    const marker = L.marker(
      [item.lat, item.lng], 
      { icon: isCluster ? clusterIconFactory(item) : treeIconFactory(item.health) }
    )

    if (isCluster) {
      marker.bindPopup(`
        <div class="font-bold">Tree Cluster</div>
        <div>Trees in cluster: ${item.trees.length}</div>
        <div>Average health: ${'❤️'.repeat(item.health)}</div>
        <div class="text-sm text-gray-600">Zoom in to see individual trees</div>
      `)
    } else {
      const tree = item.trees[0]
      marker.bindPopup(`
        <div class="font-bold">${tree.name}</div>
        <div>Species: ${tree.species}</div>
        <div>Health: ${'❤️'.repeat(tree.health)}</div>
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

onMounted(async () => {
  if (mapInitialized.value) return  // Prevent multiple initializations
  
  L = await import('leaflet').then(m => m.default || m)
  await import('leaflet-routing-machine')

  try {
    // Load and process GeoJSON data
    const response = await fetch('/data/tree.geojson')
    const geojsonData = await response.json()
    
    // Transform features into tree format, limited to 4000 trees
    trees.value = geojsonData.features.slice(0, 1000).map(feature => ({
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
      name: feature.properties.art_deutsch || 'Unknown Tree',
      species: feature.properties.art_bot || 'Unknown Species',
      health: Math.floor(Math.random() * 3) + 1
    }))

    if (!map.value) {
      // Start much more zoomed out
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
      })
      
      // Initial tree update
      updateVisibleTrees()
    }
  } catch (error) {
    console.error('Error loading tree data:', error)
    trees.value = []
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
</style>
