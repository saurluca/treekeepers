import { ref } from 'vue'

const THRESHOLD_VERY_BAD = 0.002
const THRESHOLD_BAD = 0.01
const THRESHOLD_GOOD = 0.2

// Define zoom level thresholds for different clustering granularity
const ZOOM_LEVELS = {
  CITY: 11,
  DISTRICT: 14,
  STREET: 16,
  INDIVIDUAL: 18
}

export const useSupabase = () => {
  const client = useSupabaseClient()

  const fetchTrees = async (bounds, zoom) => {
    try {
      console.log('Fetching tree clusters within bounds:', bounds, 'at zoom:', zoom)

      // For zoom level 18 or above, fetch trees directly from the trees table
      if (zoom >= 16) {
        const { data, error } = await client
          .from('trees')
          .select('lat, lng, ndvi')
          .gte('lat', bounds.south)
          .lte('lat', bounds.north)
          .gte('lng', bounds.west)
          .lte('lng', bounds.east)
          .limit(1000)

        if (error) {
          console.error('Supabase error:', error.message)
          throw error
        }

        if (!data || data.length === 0) {
          console.warn('No trees found in current view')
          return []
        }

        console.log(`Fetched ${data.length} individual trees in current view`)
        
        // Transform the individual tree data
        return data.map(tree => ({
          isCluster: false,
          lat: tree.lat,
          lng: tree.lng,
          health: tree.ndvi < THRESHOLD_VERY_BAD ? 1 : 
                  tree.ndvi < THRESHOLD_BAD ? 2 : 
                  tree.ndvi < THRESHOLD_GOOD ? 3 : 4
        }))
      }

      let gridSize = zoom <= 10 ? 0.2 : 
      zoom <= 12 ? 0.05 : 
      zoom <= 14 ? 0.02 : 
      zoom <= 16 ? 0.005 : 
      0.001;

      const { data, error } = await client.rpc('get_tree_clusters', {
        min_lat: bounds.south,
        max_lat: bounds.north,
        min_lng: bounds.west,
        max_lng: bounds.east,
        grid_size: gridSize
      })

      if (error) {
        console.error('Supabase error:', error.message)
        throw error
      }

      if (!data || data.length === 0) {
        console.warn('No tree clusters found in current view')
        return []
      }

      console.log(`Fetched ${data.length} tree clusters in current view`)
      
      // Transform the cluster data
      return data.map(cluster => ({
        isCluster: true,
        lat: cluster.center_lat,
        lng: cluster.center_lng,
        treeCount: cluster.tree_count,
        avgNdvi: cluster.avg_ndvi,
        health: cluster.avg_ndvi < THRESHOLD_VERY_BAD ? 1 : 
                cluster.avg_ndvi < THRESHOLD_BAD ? 2 : 
                cluster.avg_ndvi < THRESHOLD_GOOD ? 3 : 4
      }))
    } catch (error) {
      console.error('Error in fetchTrees:', error.message)
      return []
    }
  }

  return {
    fetchTrees
  }
}