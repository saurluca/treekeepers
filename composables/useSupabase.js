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
      // Set longer timeout for this specific query

      console.log('Fetching tree clusters within bounds:', bounds, 'at zoom:', zoom)

      // Individual trees only at very high zoom
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
          .limit(200)

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

      // Increased grid sizes for larger clusters
      let gridSize = zoom <= 10 ? 1 :    // 4x larger
                    zoom <= 12 ? 0.5 :    // 4x larger
                    zoom <= 14 ? 0.02 :    // 4x larger
                    zoom <= 15 ? 0.005 :    // 4x larger
                    zoom <= 16 ? 0.0025 :    // 5x larger
                    0.001;                 // 5x larger

      // Increased target sizes
      let targetSize = zoom <= 10 ? 2000 :  // 4x larger
                      zoom <= 12 ? 1000 :   // 4x larger
                      zoom <= 14 ? 500 :    // 5x larger
                      zoom <= 15 ? 250 :    // 5x larger
                      zoom <= 16 ? 100 :    // 4x larger
                      50;                   // 5x larger

      let minSamples = 2;

      const { data, error } = await client.rpc('update_tree_clustering', {
        distance_threshold: gridSize,
        min_samples: minSamples,
        target_size: targetSize,
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