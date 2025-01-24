import { ref } from 'vue'

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
        health: tree.health || Math.floor(Math.random() * 3) + 1
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

  const fetchTreesSortedByValue = async (bounds) => {
    try {
      console.log('Fetching trees ')
      
      const { data, error } = await client
        .from('trees')
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
      
      return data.map(tree => ({
        id: tree.id,
        lat: tree.lat,
        lng: tree.lng,
        name: tree.name || 'Unknown Tree',
        species: tree.species || 'Unknown Species',
        health: tree.health || Math.floor(Math.random() * 3) + 1
      }))
    } catch (error) {
      console.error('Error in fetchTrees:', error.message)
      return []
    }
  }

  return {
    fetchTreesSortedByValue
  }
}