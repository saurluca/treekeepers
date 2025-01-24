<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="container mx-auto">
      <div class="text-center text-3xl font-bold text-gray-800">
        Hello World
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

onMounted(() => {
  console.log('Hello World')
})
</script>

<style scoped>
/* No additional styles needed for this simple page */
</style>
CREATE OR REPLACE FUNCTION public.get_tree_clusters(
    min_lat double precision,
    max_lat double precision,
    min_lng double precision,
    max_lng double precision,
    grid_size double precision
) RETURNS TABLE (
    center_lat double precision,
    center_lng double precision,
    tree_count bigint,
    avg_ndvi double precision
) AS $$
BEGIN
    RETURN QUERY
    WITH bounds AS (
        SELECT 
            width_bucket(lat, min_lat, max_lat, ceil((max_lat - min_lat) / grid_size)::integer) as lat_bucket,
            width_bucket(lng, min_lng, max_lng, ceil((max_lng - min_lng) / grid_size)::integer) as lng_bucket,
            lat,
            lng,
            ndvi
        FROM trees
        WHERE lat BETWEEN min_lat AND max_lat
        AND lng BETWEEN min_lng AND max_lng
    )
    SELECT 
        AVG(lat)::double precision as center_lat,
        AVG(lng)::double precision as center_lng,
        COUNT(*)::bigint as tree_count,
        AVG(ndvi)::double precision as avg_ndvi
    FROM bounds
    GROUP BY lat_bucket, lng_bucket
    HAVING COUNT(*) >= 3
    ORDER BY COUNT(*) DESC
    LIMIT 1000;
END;
$$ LANGUAGE plpgsql;


CREATE INDEX IF NOT EXISTS idx_trees_lat_lng ON trees (lat, lng);