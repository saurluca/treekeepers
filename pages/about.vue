<template>
    <div class="flex min-h-screen">
      <!-- Sidebar -->
      <AppSidebar />
      
      <!-- Main content -->
      <div class="flex-1 bg-gray-100 p-4">
        <div class="container mx-auto">
          <h1 class="text-3xl font-bold mb-4">About</h1>
          <p>Welcome to the about page</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import AppSidebar from '~/components/AppSidebar.vue'
  </script>
  
  <style scoped>
  /* Styles will be handled by Tailwind classes */
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
    SELECT 
        round((floor(lat / grid_size) * grid_size + (grid_size / 2))::numeric, 6)::double precision as center_lat,
        round((floor(lng / grid_size) * grid_size + (grid_size / 2))::numeric, 6)::double precision as center_lng,
        COUNT(*)::bigint as tree_count,
        AVG(ndvi)::double precision as avg_ndvi
    FROM trees
    WHERE 
        lat BETWEEN min_lat AND max_lat AND
        lng BETWEEN min_lng AND max_lng
    GROUP BY 
        floor(lat / grid_size),
        floor(lng / grid_size)
    HAVING COUNT(*) > 0
    LIMIT 1000;
END;
$$ LANGUAGE plpgsql;
d