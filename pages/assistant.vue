<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <AppSidebar class="z-30" />
    
    <!-- Main content -->
    <div class="flex-1 relative">
      <!-- Chat Interface with semi-transparent background -->
      <div class="relative min-h-screen bg-green-50/95 flex items-center justify-center p-4">
        <div class="w-full max-w-3xl">
          <!-- Chat messages container -->
          <div class="bg-white/95 rounded-lg shadow-lg mb-4 p-4 h-[70vh] overflow-y-auto relative z-10">
            <div 
              v-for="message in displayMessages" 
              :key="message.id" 
              class="mb-4"
            >
              <div 
                :class="[
                  'p-3 rounded-lg max-w-[80%] prose prose-green',
                  message.role === 'user' 
                    ? 'bg-green-100 ml-auto text-green-900' 
                    : 'bg-green-600 text-white prose-invert'
                ]"
              >
                <p class="whitespace-pre-wrap" v-html="formatMarkdown(message.content)"></p>
              </div>
            </div>
            <div v-if="isLoading" class="flex items-center gap-2 text-green-500">
              <span class="animate-pulse">●</span>
              <span class="animate-pulse delay-100">●</span>
              <span class="animate-pulse delay-200">●</span>
            </div>
          </div>

          <!-- Input form -->
          <form @submit.prevent="sendMessage" class="flex gap-2 relative z-10">
            <input
              v-model="userInput"
              type="text"
              placeholder="Get advice on your tree route..."
              class="flex-1 p-2 rounded-lg border border-green-200 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white/95"
              :disabled="isLoading"
            />
            <button
              type="submit"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300"
              :disabled="isLoading || !userInput.trim()"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      <!-- Foreground Image -->
      <div class="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="/image.png" 
          alt="Foreground" 
          class="w-full h-full object-cover opacity-40"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppSidebar from '~/components/AppSidebar.vue'

const userInput = ref('')
const messages = ref([
  {
    role: 'system',
    content: `You are a knowledgeable tree route assistant for the Berlin Tree Map application. 
Your role is to help users plan and understand their tree routes in Berlin.

You can:
- Suggest optimal routes between trees
- Provide information about tree species and health
- Give advice about tree maintenance and care
- Share interesting facts about Berlin's urban forest
- Help users understand the tree health indicators

When discussing routes, consider:
- Tree health (indicated by 1-3 hearts)
- Distance between trees
- Accessibility of locations
- Seasonal factors

be concise and to the point.

Ask if the person wants to plan a route.
if they do, ask them for how much time they have, if they want to focus on a specific area, and if they want to focus on the trees with worst health.
redirect them to the statistics page, where they can see the tree health indicators and inspect individual trees.

Keep responses focused on trees, routes, and Berlin's urban environment.
Use markdown formatting for emphasis: **bold** for important points, *italic* for species names.`
  }
])

// Add initial welcome message when component mounts
onMounted(() => {
  messages.value.push({
    role: 'assistant',
    content: `Hi! I'm your tree route assistant. I can help you:

**1.** Plan tree routes in Berlin
**2.** Learn about tree health and species
**3.** Get maintenance advice

Would you like to plan a route today?`
  })
})

// Computed property to filter out system messages for display
const displayMessages = computed(() => 
  messages.value.filter(message => message.role !== 'system')
)

const isLoading = ref(false)

// Function to format markdown
const formatMarkdown = (text) => {
  return text
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Bullet points
    .replace(/^- (.*)$/gm, '• $1')
    // Line breaks
    .replace(/\n/g, '<br>')
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  // Add user message to chat
  messages.value.push({
    role: 'user',
    content: userInput.value.trim()
  })

  // Clear input
  const messageToSend = userInput.value.trim()
  userInput.value = ''
  isLoading.value = true

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.value // Send all messages including system prompt
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get response')
    }

    const data = await response.json()
    
    // Add assistant response to chat
    messages.value.push({
      role: 'assistant',
      content: data.message
    })
  } catch (error) {
    console.error('Chat error:', error)
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Add some basic styling for markdown elements */
.prose strong {
  font-weight: 600;
}

.prose em {
  font-style: italic;
}

/* Remove default margins from prose */
.prose p {
  margin: 0;
}

/* Ensure proper text color in dark messages */
.prose-invert strong,
.prose-invert em {
  color: inherit;
}

/* Z-index layering */
.z-0 {
  z-index: 0;
}

.z-10 {
  z-index: 10;
}

.z-30 {
  z-index: 30;
}
</style> 