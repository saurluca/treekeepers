import { ref } from 'vue'

const THRESHOLD_VERY_BAD = 0.02
const THRESHOLD_BAD = 0.1
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

      // Check if zoom level is INDIVIDUAL
      if (zoom === ZOOM_LEVELS.INDIVIDUAL) {
        const { data, error } = await client.rpc('get_individual_trees', {
          min_lat: bounds.south,
          max_lat: bounds.north,
          min_lng: bounds.west,
          max_lng: bounds.east
        })

        if (error) {
          console.error('Supabase error:', error.message)
          throw error
        }

        if (!data || data.length === 0) {
          console.warn('No individual trees found in current view')
          return []
        }

        console.log(`Fetched ${data.length} individual trees in current view`)
        
        // Transform the individual tree data
        return data.map(tree => ({
          isCluster: false,
          lat: tree.lat,
          lng: tree.lng,
          health: tree.avg_ndvi < THRESHOLD_VERY_BAD ? 1 : 
                  tree.avg_ndvi < THRESHOLD_BAD ? 2 : 
                  tree.avg_ndvi < THRESHOLD_GOOD ? 3 : 4
        }))
      }

      // Adjust grid sizes for clustering based on zoom level
      let gridSize
      gridSize = zoom < ZOOM_LEVELS.CITY ? 1 : // Approximately 5km for city-level clustering
                zoom < ZOOM_LEVELS.DISTRICT ? 0.2 : // Approximately 2km for district-level clustering
                zoom < ZOOM_LEVELS.STREET ? 0.05 : // Approximately 500m for street-level clustering
                0.001; // Approximately 100m for individual trees

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