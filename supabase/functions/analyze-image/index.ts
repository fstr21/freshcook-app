import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AnalyzeImageRequest {
  image: string
  mimeType?: string
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

    // Parse request body with error handling
    let requestBody: AnalyzeImageRequest
    try {
      const bodyText = await req.text()
      console.log('Request body length:', bodyText.length)
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Empty request body')
      }
      
      requestBody = JSON.parse(bodyText)
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { image, mimeType } = requestBody

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate base64 image
    if (typeof image !== 'string' || image.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid image data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Google Vision API key from environment
    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION')
    if (!apiKey) {
      console.error('Google Cloud Vision API key not found')
      return new Response(
        JSON.stringify({ 
          error: 'Google Cloud Vision API key not configured',
          details: 'Please set GOOGLE_CLOUD_VISION environment variable'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Making request to Google Vision API...')

    // Call Google Vision API with better error handling
    let visionResponse: Response
    try {
      visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: image,
                },
                features: [
                  {
                    type: 'LABEL_DETECTION',
                    maxResults: 20,
                  },
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 10,
                  },
                ],
              },
            ],
          }),
        }
      )
    } catch (fetchError) {
      console.error('Network error calling Google Vision API:', fetchError)
      return new Response(
        JSON.stringify({ 
          error: 'Network error calling Google Vision API',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown network error'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!visionResponse.ok) {
      let errorDetails = 'Unknown error'
      try {
        const errorText = await visionResponse.text()
        errorDetails = errorText
      } catch (e) {
        console.error('Could not read error response:', e)
      }
      
      console.error('Google Vision API error:', {
        status: visionResponse.status,
        statusText: visionResponse.statusText,
        error: errorDetails
      })
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to analyze image with Google Vision API',
          details: `API returned ${visionResponse.status}: ${visionResponse.statusText}`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse Vision API response with error handling
    let visionData: any
    try {
      const responseText = await visionResponse.text()
      console.log('Vision API response length:', responseText.length)
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from Vision API')
      }
      
      visionData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse Vision API response:', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response from Google Vision API',
          details: parseError instanceof Error ? parseError.message : 'Failed to parse API response'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    if (!visionData.responses || !visionData.responses[0]) {
      console.error('Invalid Vision API response structure:', visionData)
      return new Response(
        JSON.stringify({ error: 'No response from Google Vision API' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const response = visionData.responses[0]
    
    // Check for API errors in the response
    if (response.error) {
      console.error('Google Vision API response error:', response.error)
      return new Response(
        JSON.stringify({ 
          error: 'Google Vision API error',
          details: response.error.message || 'Unknown API error'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const ingredients: string[] = []

    // Extract ingredients from labels
    if (response.labelAnnotations) {
      console.log(`Found ${response.labelAnnotations.length} labels`)
      const foodLabels = response.labelAnnotations
        .filter((label: any) => 
          label.score > 0.5 && 
          isFoodRelated(label.description)
        )
        .map((label: any) => normalizeIngredient(label.description))
      
      ingredients.push(...foodLabels)
    }

    // Extract ingredients from text (for ingredient lists, recipes, etc.)
    if (response.textAnnotations && response.textAnnotations[0]) {
      console.log('Processing text annotations')
      const text = response.textAnnotations[0].description.toLowerCase()
      const extractedIngredients = extractIngredientsFromText(text)
      ingredients.push(...extractedIngredients.map(normalizeIngredient))
    }

    // Remove duplicates and filter
    const uniqueIngredients = [...new Set(ingredients)]
      .filter(ingredient => ingredient.length > 2)
      .slice(0, 15) // Limit to 15 ingredients

    console.log(`Successfully extracted ${uniqueIngredients.length} unique ingredients:`, uniqueIngredients)

    return new Response(
      JSON.stringify({ 
        ingredients: uniqueIngredients,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in analyze-image function:', error)
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

function isFoodRelated(label: string): boolean {
  const foodKeywords = [
    'food', 'ingredient', 'vegetable', 'fruit', 'meat', 'dairy', 'grain',
    'spice', 'herb', 'sauce', 'oil', 'vinegar', 'cheese', 'milk', 'egg',
    'bread', 'pasta', 'rice', 'bean', 'nut', 'seed', 'fish', 'chicken',
    'beef', 'pork', 'lamb', 'turkey', 'onion', 'garlic', 'tomato', 'potato',
    'carrot', 'pepper', 'mushroom', 'lettuce', 'spinach', 'broccoli',
    'apple', 'banana', 'orange', 'lemon', 'lime', 'strawberry', 'blueberry',
    'cucumber', 'zucchini', 'corn', 'peas', 'cabbage', 'cauliflower',
    'celery', 'avocado', 'mango', 'pineapple', 'grapes', 'berries'
  ]
  
  const labelLower = label.toLowerCase()
  return foodKeywords.some(keyword => 
    labelLower.includes(keyword) || keyword.includes(labelLower)
  )
}

function extractIngredientsFromText(text: string): string[] {
  const commonIngredients = [
    'flour', 'sugar', 'salt', 'pepper', 'oil', 'butter', 'milk', 'eggs',
    'onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'parsley',
    'basil', 'oregano', 'thyme', 'rosemary', 'chicken', 'beef', 'pork',
    'fish', 'cheese', 'cream', 'yogurt', 'lemon', 'lime', 'vinegar',
    'soy sauce', 'olive oil', 'coconut oil', 'honey', 'vanilla', 'cinnamon',
    'ginger', 'paprika', 'cumin', 'turmeric', 'chili', 'mushrooms',
    'spinach', 'broccoli', 'cauliflower', 'zucchini', 'eggplant', 'peppers',
    'cucumber', 'lettuce', 'cabbage', 'kale', 'arugula', 'cilantro',
    'mint', 'dill', 'sage', 'bay leaves', 'nutmeg', 'cardamom', 'cloves'
  ]
  
  const found: string[] = []
  
  for (const ingredient of commonIngredients) {
    const regex = new RegExp(`\\b${ingredient}s?\\b`, 'i') // Match singular and plural
    if (regex.test(text)) {
      found.push(ingredient)
    }
  }
  
  return found
}

function normalizeIngredient(ingredient: string): string {
  return ingredient
    .toLowerCase()
    .replace(/[^a-z\s]/g, '') // Remove non-alphabetic characters except spaces
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}