/*
  # Test OpenRouter API Key Format and Configuration
  
  This function tests if the OpenRouter API key is properly configured
  and helps diagnose formatting issues.
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
    // Get all environment variables that might contain the API key
    const allEnvKeys = Object.keys(Deno.env.toObject())
    const routerKeys = allEnvKeys.filter(key => 
      key.toLowerCase().includes('router') || key.toLowerCase().includes('openrouter')
    )

    const results: any = {
      availableKeys: routerKeys,
      keyTests: {}
    }

    // Test each potential key
    for (const keyName of routerKeys) {
      const keyValue = Deno.env.get(keyName)
      if (keyValue) {
        results.keyTests[keyName] = {
          exists: true,
          length: keyValue.length,
          firstChars: keyValue.substring(0, 10),
          lastChars: keyValue.substring(keyValue.length - 4),
          hasWhitespace: /\s/.test(keyValue),
          hasQuotes: keyValue.includes('"') || keyValue.includes("'"),
          startsWithSk: keyValue.startsWith('sk-'),
          startsWithSkOr: keyValue.startsWith('sk-or-'),
          startsWithSkOrV1: keyValue.startsWith('sk-or-v1-'),
          // Check for common formatting issues
          trimmed: keyValue.trim(),
          trimmedLength: keyValue.trim().length,
          isDifferentAfterTrim: keyValue !== keyValue.trim(),
          // Character analysis
          firstCharCode: keyValue.charCodeAt(0),
          expectedFirstCharCode: 's'.charCodeAt(0), // 115
          // Check for invisible characters
          hasInvisibleChars: keyValue !== keyValue.replace(/[\u200B-\u200D\uFEFF]/g, ''),
          // Raw bytes analysis (first 20 characters)
          rawBytes: Array.from(keyValue.substring(0, 20)).map(char => ({
            char,
            code: char.charCodeAt(0),
            hex: char.charCodeAt(0).toString(16)
          }))
        }

        // Try to clean the key and test it
        const cleanedKey = keyValue.trim().replace(/['"]/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '')
        results.keyTests[keyName].cleaned = {
          value: cleanedKey.substring(0, 10) + '...',
          length: cleanedKey.length,
          startsWithSkOr: cleanedKey.startsWith('sk-or-'),
          isDifferent: cleanedKey !== keyValue
        }
      } else {
        results.keyTests[keyName] = {
          exists: false
        }
      }
    }

    // Test the specific key we're looking for
    const targetKey = Deno.env.get('OPEN_ROUTER_API_KEY')
    if (targetKey) {
      // Try to make a simple API call with the cleaned key
      const cleanedKey = targetKey.trim().replace(/['"]/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '')
      
      try {
        const testResponse = await fetch('https://openrouter.ai/api/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${cleanedKey}`,
            'Content-Type': 'application/json',
          }
        })

        results.apiTest = {
          status: testResponse.status,
          statusText: testResponse.statusText,
          ok: testResponse.ok,
          keyUsed: cleanedKey.substring(0, 10) + '...'
        }

        if (!testResponse.ok) {
          const errorText = await testResponse.text()
          results.apiTest.error = errorText
        }
      } catch (apiError) {
        results.apiTest = {
          error: apiError instanceof Error ? apiError.message : 'Unknown API error',
          keyUsed: cleanedKey.substring(0, 10) + '...'
        }
      }
    }

    return new Response(
      JSON.stringify(results, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error testing OpenRouter key:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to test OpenRouter key',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})