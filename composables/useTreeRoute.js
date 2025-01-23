import { ref } from 'vue'
import { useGeoUtils } from './useGeoUtils'

export const useTreeRoute = (map) => {
  const { calculateDistance } = useGeoUtils()
  let routingControl = null
  
  const findNearestNeighborRoute = (trees) => {
    const unvisited = [...trees]
    const route = [unvisited.shift()]
    
    while (unvisited.length > 0) {
      const currentPoint = route[route.length - 1]
      let nearestIndex = 0
      let minDistance = Infinity
      
      unvisited.forEach((tree, index) => {
        const distance = calculateDistance(currentPoint, tree)
        if (distance < minDistance) {
          minDistance = distance
          nearestIndex = index
        }
      })
      
      route.push(unvisited[nearestIndex])
      unvisited.splice(nearestIndex, 1)
    }
    
    return route
  }

  const planRoute = (trees, L) => {
    if (!map.value) return
    
    if (routingControl) {
      map.value.removeControl(routingControl)
    }

    const treesNeedingAttention = trees.value.filter(tree => tree.health < 3)
    
    if (treesNeedingAttention.length === 0) {
      console.log('No trees need attention!')
      return
    }

    const optimizedRoute = findNearestNeighborRoute(treesNeedingAttention)
    const waypoints = optimizedRoute.map(tree => L.latLng(tree.lat, tree.lng))

    routingControl = L.Routing.control({
      waypoints: waypoints,
      routeWhileDragging: false,
      showAlternatives: false,
      fitSelectedRoutes: true,
      createMarker: () => null,
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

    routingControl.on('routesfound', function(e) {
      const routes = e.routes
      if (routes && routes[0]) {
        const bounds = L.latLngBounds(routes[0].coordinates)
        map.value.fitBounds(bounds, { padding: [50, 50] })
        
        const totalDistance = routes[0].summary.totalDistance
        const totalTime = routes[0].summary.totalTime
        console.log(`Visiting ${treesNeedingAttention.length} trees that need attention`)
        console.log(`Total distance: ${(totalDistance/1000).toFixed(2)} km`)
        console.log(`Estimated time: ${Math.round(totalTime/60)} minutes`)
      }
    })
  }

  return {
    planRoute
  }
} 