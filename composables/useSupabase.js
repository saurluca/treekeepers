import { ref } from 'vue'

export const useSupabase = () => {
  const client = useSupabaseClient()

  const fetchTrees = async () => {
    try {
      console.log('Initiating fetch trees request...')
      
      const { data, error } = await client
        .from('trees')
        .select('*')
        .limit(1000)
      
      // Log the raw response
      console.log('Raw Supabase response:', { data, error })
      
      if (error) {
        console.error('Supabase error:', error.message)
        throw error
      }
      
      if (!data || data.length === 0) {
        console.warn('No trees found in database')
        return []
      }

      console.log(`Successfully fetched ${data.length} trees`)
      console.log('First tree sample:', data[0])
      
      return data.map(tree => ({
        lat: tree.latitude,
        lng: tree.longitude,
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