const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GenerateRecipesRequest {
  ingredients: string[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the API key - try both possible environment variable names
    let openRouterApiKey = Deno.env.get('OPEN_ROUTER_API_KEY') || Deno.env.get('OPENROUTER_API_KEY')

    if (!openRouterApiKey) {
      console.error('OpenRouter API key not found in environment variables')
      
      // Debug: List available environment variables
      const allEnvKeys = Object.keys(Deno.env.toObject())
      const routerKeys = allEnvKeys.filter(key => 
        key.toLowerCase().includes('router') || key.toLowerCase().includes('openrouter')
      )
      
      return new Response(
        JSON.stringify({ 
          error: 'OpenRouter API key not configured',
          debug: {
            availableRouterKeys: routerKeys,
            totalEnvVars: allEnvKeys.length
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Clean the API key (remove whitespace, quotes, invisible characters)
    const originalKey = openRouterApiKey
    openRouterApiKey = openRouterApiKey.trim().replace(/['"]/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '')
    
    // Validate the key format - accept both sk-or-v1- and ssk-or-v1- since both work
    const isValidKey = (
      openRouterApiKey.length > 50 && 
      (openRouterApiKey.startsWith('sk-or-v1-') || openRouterApiKey.startsWith('ssk-or-v1-'))
    )
    
    if (!isValidKey) {
      console.error('Invalid OpenRouter API key format')
      return new Response(
        JSON.stringify({ 
          error: 'Invalid OpenRouter API key format',
          debug: {
            keyLength: openRouterApiKey.length,
            keyPrefix: openRouterApiKey.substring(0, 15) + '...',
            expectedFormat: 'Should start with sk-or-v1- or ssk-or-v1- and be longer than 50 characters'
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('OpenRouter API key validated successfully')

    // Parse request body
    const { ingredients }: GenerateRecipesRequest = await req.json()

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No ingredients provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const prompt = `Generate 3 creative and delicious recipes using some or all of these ingredients: ${ingredients.join(', ')}.

For each recipe, provide:
1. A creative title
2. A brief description (1-2 sentences)
3. List of ingredients with quantities
4. Step-by-step instructions
5. Cooking time in minutes
6. Number of servings
7. Difficulty level (Easy, Medium, or Hard)

Format the response as a JSON array of recipe objects with these exact fields:
- title (string)
- description (string)
- ingredients (array of strings with quantities)
- instructions (array of strings, each step)
- cooking_time (number in minutes)
- servings (number)
- difficulty (string: "Easy", "Medium", or "Hard")

Make sure the recipes are practical and use common cooking techniques.`

    console.log('Making request to OpenRouter API...')

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://freshcook-app.netlify.app',
        'X-Title': 'FreshCook Recipe Generator'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    console.log('OpenRouter API response status:', response.status)

    if (!response.ok) {
      let responseData: any = {}
      try {
        responseData = await response.json()
      } catch (e) {
        console.error('Could not parse error response:', e)
      }
      
      console.error('OpenRouter API error:', responseData)
      
      // Enhanced error handling
      let errorMessage = 'Failed to generate recipes'
      let errorDetails = `OpenRouter API returned ${response.status}: ${response.statusText}`
      
      if (response.status === 401) {
        errorMessage = 'OpenRouter API authentication failed'
        errorDetails = 'The API key is invalid or expired. Please check your OpenRouter account.'
      } else if (response.status === 429) {
        errorMessage = 'OpenRouter API rate limit exceeded'
        errorDetails = 'Too many requests. Please try again later.'
      } else if (response.status === 402) {
        errorMessage = 'OpenRouter API payment required'
        errorDetails = 'Insufficient credits in your OpenRouter account.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorDetails,
          status: response.status
        }), 
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const responseData = await response.json()

    if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
      console.error('Invalid response from OpenRouter:', responseData)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response from AI service'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let recipes
    try {
      const content = responseData.choices[0].message.content
      console.log('OpenRouter response content length:', content.length)
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        recipes = JSON.parse(jsonMatch[0])
      } else {
        recipes = JSON.parse(content)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse recipe data'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate recipe structure
    if (!Array.isArray(recipes)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid recipe format - expected array'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Ensure each recipe has required fields and add unique IDs
    const validatedRecipes = recipes.map((recipe: any, index: number) => ({
      id: `recipe-${Date.now()}-${index}`,
      title: recipe.title || 'Untitled Recipe',
      description: recipe.description || 'A delicious recipe',
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
      cookingTime: typeof recipe.cooking_time === 'number' ? recipe.cooking_time : 30,
      servings: typeof recipe.servings === 'number' ? recipe.servings : 4,
      difficulty: ['Easy', 'Medium', 'Hard'].includes(recipe.difficulty) ? recipe.difficulty : 'Medium'
    }))

    console.log(`Successfully generated ${validatedRecipes.length} recipes`)

    return new Response(
      JSON.stringify({ 
        recipes: validatedRecipes,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in generate-recipes function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})