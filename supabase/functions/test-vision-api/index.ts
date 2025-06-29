/*
  # Test Google Vision API Connection
  
  This function tests if the Google Cloud Vision API key is properly configured
  and can make a basic API call.
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Check if API key exists
    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION')
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'GOOGLE_CLOUD_VISION environment variable not found',
          availableEnvVars: Object.keys(Deno.env.toObject()).filter(key => 
            key.includes('GOOGLE') || key.includes('VISION')
          )
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Test API key format
    const keyInfo = {
      exists: true,
      length: apiKey.length,
      startsWithExpected: apiKey.startsWith('AIza'),
      hasValidFormat: /^AIza[0-9A-Za-z-_]{35}$/.test(apiKey)
    }

    // Make a simple test request to Google Vision API
    const testResponse = await fetch(
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
                content: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
              },
              features: [
                {
                  type: 'LABEL_DETECTION',
                  maxResults: 1,
                },
              ],
            },
          ],
        }),
      }
    )

    const testResult = {
      apiKeyInfo: keyInfo,
      testRequest: {
        status: testResponse.status,
        statusText: testResponse.statusText,
        ok: testResponse.ok
      }
    }

    if (testResponse.ok) {
      const responseData = await testResponse.json()
      testResult.testRequest.hasValidResponse = !!responseData.responses
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Google Cloud Vision API is working correctly',
          details: testResult
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      const errorText = await testResponse.text()
      testResult.testRequest.error = errorText
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Google Cloud Vision API test failed',
          details: testResult
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error testing Google Vision API:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to test Google Vision API',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})