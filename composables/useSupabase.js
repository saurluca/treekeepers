import { ref } from 'vue'

const THRESHOLD_VERY_BAD = 0.02
const THRESHOLD_BAD = 0.1
const THRESHOLD_GOOD = 0.2

export const useSupabase = () => {
  const client = useSupabaseClient()

  const fetchTrees = async (bounds) => {
    try {
      console.log('Fetching trees within bounds:', bounds)
      
      const { data, error } = await client
        .from('trees')
        .select('*')
        .gte('lat', bounds.south)
        .lte('lat', bounds.north)
        .gte('lng', bounds.west)
        .lte('lng', bounds.east)
        .limit(10000)
      
      if (error) {
        console.error('Supabase error:', error.message)
        throw error
      }
      
      if (!data || data.length === 0) {
        console.warn('No trees found in current view')
        return []
      }

      console.log(`Fetched ${data.length} trees in current view`)
      
      return data.map(tree => ({
        lat: tree.lat,
        lng: tree.lng,
        name: tree.name || 'Unknown Tree',
        species: tree.species || 'Unknown Species',
        ndvi: tree.ndvi,
        health: tree.ndvi < THRESHOLD_VERY_BAD ? 1 : tree.ndvi < THRESHOLD_BAD ? 2 : tree.ndvi < THRESHOLD_GOOD ? 3 : 4
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