import { supabase } from '../lib/supabase'

export class AIService {
  static async analyzeImage(imageFile: File): Promise<string[]> {
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(imageFile)
      
      // Validate base64 data
      if (!base64 || base64.length === 0) {
        throw new Error('Failed to convert image to base64')
      }

      console.log('Sending image analysis request...', {
        imageSize: imageFile.size,
        imageType: imageFile.type,
        base64Length: base64.length
      })
      
      // Get the current session to include the access token
      const { data: { session } } = await supabase.auth.getSession()
      
      // Construct the full URL for the edge function
      const functionUrl = `${supabase.supabaseUrl}/functions/v1/analyze-image`
      
      // Use fetch API directly to ensure proper request body transmission
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || supabase.supabaseKey}`,
        },
        body: JSON.stringify({ 
          image: base64,
          mimeType: imageFile.type 
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Edge function error:', errorText)
        
        // Handle specific error cases
        if (errorText.includes('Google Cloud Vision API key not configured')) {
          throw new Error('Image analysis is temporarily unavailable. The service is not properly configured.')
        }
        
        if (errorText.includes('Network error')) {
          throw new Error('Network error occurred. Please check your internet connection and try again.')
        }
        
        if (errorText.includes('Invalid image data')) {
          throw new Error('Invalid image format. Please try a different image.')
        }
        
        if (errorText.includes('Empty request body')) {
          throw new Error('Failed to send image data. Please try again.')
        }
        
        throw new Error(`Image analysis service error: ${errorText || 'Unknown error'}`)
      }

      const data = await response.json()

      if (!data || !data.ingredients) {
        console.error('Invalid response from edge function:', data)
        throw new Error('Invalid response from image analysis service')
      }

      console.log('Image analysis successful:', data.ingredients)
      return data.ingredients
    } catch (error) {
      console.error('Image analysis error:', error)
      if (error instanceof Error) {
        throw error // Re-throw the error with the original message
      }
      throw new Error('Failed to analyze image. Please try again.')
    }
  }

  static async generateRecipes(ingredients: string[]): Promise<any[]> {
    try {
      if (!ingredients || ingredients.length === 0) {
        throw new Error('No ingredients provided')
      }

      // Get the current session to include the access token
      const { data: { session } } = await supabase.auth.getSession()
      
      // Construct the full URL for the edge function
      const functionUrl = `${supabase.supabaseUrl}/functions/v1/generate-recipes`
      
      // Use fetch API directly to ensure proper request body transmission
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || supabase.supabaseKey}`,
        },
        body: JSON.stringify({ 
          ingredients: ingredients.filter(ingredient => ingredient.trim().length > 0)
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Recipe generation error:', errorText)
        throw new Error(`Failed to generate recipes: ${errorText || 'Unknown error'}`)
      }

      const data = await response.json()

      if (!data || !Array.isArray(data.recipes)) {
        console.error('Invalid response from recipe generation:', data)
        throw new Error('Invalid response from recipe generation service')
      }

      return data.recipes
    } catch (error) {
      console.error('Recipe generation error:', error)
      if (error instanceof Error) {
        throw new Error(`Recipe generation failed: ${error.message}`)
      }
      throw new Error('Failed to generate recipes. Please try again.')
    }
  }

  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        if (!result) {
          reject(new Error('Failed to read file'))
          return
        }
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1]
        if (!base64) {
          reject(new Error('Invalid file format'))
          return
        }
        resolve(base64)
      }
      reader.onerror = (error) => {
        console.error('FileReader error:', error)
        reject(new Error('Failed to read file'))
      }
    })
  }
}