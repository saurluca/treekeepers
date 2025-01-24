import { ref } from 'vue'

const THRESHOLD_VERY_BAD = 0.002
const THRESHOLD_BAD = 0.01
const THRESHOLD_GOOD = 0.2

export const useSupabase = () => {
  const client = useSupabaseClient()

  const getTrees = async () => {
    const { data, error } = await client
      .from('trees2')
      .select(`
        id,
        lat,
        lng,
        ndvi_measurements (
          ndvi,
          measurement_date
        )
      `)
      .order('id')
      .is('lat', 'not.null')
      .is('lng', 'not.null');

    if (error) {
      console.error('Error fetching trees:', error);
      return [];
    }

    // Transform the data to include only the latest NDVI measurement
    return data.map(tree => ({
      id: tree.id,
      lat: tree.lat,
      lng: tree.lng,
      ndvi: tree.ndvi_measurements?.[0]?.ndvi || null,
      measurement_date: tree.ndvi_measurements?.[0]?.measurement_date || null
    }));
  };

  const getTreeClusters = async (distance, minPoints) => {
    const { data, error } = await client
      .rpc('update_tree_clustering', {
        distance_threshold: distance,
        min_samples: minPoints
      });

    if (error) {
      console.error('Error fetching tree clusters:', error);
      return [];
    }

    return data.map(cluster => ({
      id: cluster.cluster_id,
      treeIds: cluster.tree_ids,
      center: {
        lat: cluster.center_lat,
        lng: cluster.center_lng
      },
      avgNdvi: cluster.avg_ndvi
    }));
  };

  const getTreeById = async (id) => {
    const { data, error } = await client
      .from('trees2')
      .select(`
        id,
        lat,
        lng,
        ndvi_measurements (
          ndvi,
          measurement_date
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching tree:', error);
      return null;
    }

    return {
      id: data.id,
      lat: data.lat,
      lng: data.lng,
      ndvi: data.ndvi_measurements?.[0]?.ndvi || null,
      measurement_date: data.ndvi_measurements?.[0]?.measurement_date || null
    };
  };

  const fetchTrees = async (bounds, zoom) => {
    try {
      console.log('Fetching tree clusters within bounds:', bounds, 'at zoom:', zoom)

      // For zoom level 18 or above, fetch trees directly with their latest NDVI
      if (zoom >= 18) {
        const { data, error } = await client
          .from('trees2')
          .select(`
            id,
            lat,
            lng,
            ndvi_measurements!inner (
              ndvi,
              measurement_date
            )
          `)
          .gte('lat', bounds.south)
          .lte('lat', bounds.north)
          .gte('lng', bounds.west)
          .lte('lng', bounds.east)
          .order('id')
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
        
        // Transform the data to use the latest NDVI measurement
        return data.map(tree => ({
          isCluster: false,
          lat: tree.lat,
          lng: tree.lng,
          ndvi: tree.ndvi_measurements?.[0]?.ndvi || 0,
          health: (tree.ndvi_measurements?.[0]?.ndvi || 0) < THRESHOLD_VERY_BAD ? 1 : 
                 (tree.ndvi_measurements?.[0]?.ndvi || 0) < THRESHOLD_BAD ? 2 : 
                 (tree.ndvi_measurements?.[0]?.ndvi || 0) < THRESHOLD_GOOD ? 3 : 4
        }))
      }

      // Adjusted gridSize based on zoom level - made more granular
      let gridSize = zoom <= 10 ? 0.02 :    // ~2km
                    zoom <= 12 ? 0.01 :     // ~1km
                    zoom <= 14 ? 0.005 :    // ~500m
                    zoom <= 16 ? 0.002 :    // ~200m
                    0.001;                  // ~100m

      const { data, error } = await client.rpc('update_tree_clustering', {
        distance_threshold: gridSize,
        min_samples: 2,
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
        console.warn('No tree clusters found in current view')
        return []
      }

      console.log(`Fetched ${data.length} tree clusters in current view`)
      
      return data.map(cluster => ({
        isCluster: true,
        lat: cluster.center_lat,
        lng: cluster.center_lng,
        treeCount: cluster.tree_count,
        avgNdvi: cluster.avg_ndvi,
        treeIds: cluster.tree_ids,
        clusterId: cluster.cluster_id,
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
    fetchTrees,
    getTrees,
    getTreeClusters,
    getTreeById
  }
}