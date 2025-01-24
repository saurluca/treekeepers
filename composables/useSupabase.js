import { ref } from 'vue'

const THRESHOLD_VERY_BAD = 0.33
const THRESHOLD_BAD = 0.66
const THRESHOLD_GOOD = 1

export const useSupabase = () => {
  const client = useSupabaseClient()

  const fetchTrees = async (bounds, zoom) => {
    try {
      console.log('Fetching tree clusters within bounds:', bounds, 'at zoom:', zoom)

      // For zoom level 18 or above, fetch trees directly from the trees table
      if (zoom >= 18) {
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
      0.002;

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

export const useSupabaseByValue = () => {
  const client = useSupabaseClient()

  const fetchTreesSortedByValue = async () => {
    try {
      console.log('Fetching trees')
      
      const { data, error } = await client
        .from('trees2')
        .select('*')
        .limit(100)
      
      if (error) {
        console.error('Supabase error:', error.message)
        throw error
      }
      
      if (!data || data.length === 0) {
        console.warn('No trees found in current view')
        return []
      }

      console.log(`Fetched ${data.length} trees in current view`)
      
      const treesWithMeasurements = await Promise.all(data.map(async tree => {
        const measurements = await fetchTreeMeasurements(tree.id)
        const latestSummerMeasurement = getLatestSummerMeasurement(measurements)
        const health = calculateHealth(latestSummerMeasurement?.ndvi)
        return {
          id: tree.id,
          lat: tree.lat,
          lng: tree.lng,
          ndvi: latestSummerMeasurement?.ndvi || 0,
          name: tree.name || 'Unknown Tree',
          species: tree.species || 'Unknown Species',
          health,
          measurements
        }
      }))
      
      return treesWithMeasurements
    } catch (error) {
      console.error('Error in fetchTrees:', error.message)
      return []
    }
  }

  const fetchTreeMeasurements = async (treeId) => {
    try {
      console.log(`Fetching measurements for tree ${treeId}`)
      
      const { data, error } = await client
        .from('ndvi_measurements')
        .select('ndvi, measurement_date')
        .eq('tree_id', treeId) // Ensure tree_id is treated as a bigint
        .order('measurement_date', { ascending: false })
      
      if (error) {
        console.error('Supabase error:', error.message)
        throw error
      }
      
      if (!data || data.length === 0) {
        console.warn(`No measurements found for tree ${treeId}`)
        return []
      }

      console.log(`Fetched ${data.length} measurements for tree ${treeId}`)
      
      return data
    } catch (error) {
      console.error('Error in fetchTreeMeasurements:', error.message)
      return []
    }
  }

  const getLatestSummerMeasurement = (measurements) => {
    const summerMonths = [6, 7, 8] // June, July, August
    return measurements.find(measurement => {
      const month = new Date(measurement.measurement_date).getMonth() + 1
      return summerMonths.includes(month)
    })
  }

  const calculateHealth = (ndvi) => {
    if (ndvi < THRESHOLD_VERY_BAD) return 1
    if (ndvi < THRESHOLD_BAD) return 2
    if (ndvi < THRESHOLD_GOOD) return 3
    return 4
  }

  return {
    fetchTreesSortedByValue,
    fetchTreeMeasurements
  }
}