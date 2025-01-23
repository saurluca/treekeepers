import OpenAI from 'openai'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Add debug logging (remove in production)
  console.log('Runtime config:', {
    hasKey: !!config.openaiApiKey,
    keyLength: config.openaiApiKey?.length
  })

  if (!config.openaiApiKey) {
    throw createError({
      statusCode: 500,
      message: 'OpenAI API key is not configured'
    })
  }

  const openai = new OpenAI({
    apiKey: config.openaiApiKey
  })

  try {
    const body = await readBody(event)
    const messages = body.messages || []

    const completion = await openai.chat.completions.create({
      messages: messages,
      model: 'gpt-3.5-turbo',
    })

    return {
      message: completion.choices[0].message.content
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to get chat response'
    })
  }
}) 