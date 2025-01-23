// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  ssr: false,
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],
  supabase: {
    redirect: false,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  },
  runtimeConfig: {
    // Private keys that are exposed to the server
    openaiApiKey: process.env.OPENAI_API_KEY,
    // Public keys that are exposed to the client
    public: {}
  },
  nitro: {
    preset: 'cloudflare-pages',
    output: {
      dir: 'dist'
    }
  },
  experimental: {
    payloadExtraction: false
  },
  vite: {
    build: {
      sourcemap: false
    }
  }
})