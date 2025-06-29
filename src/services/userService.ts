import { supabase } from '../lib/supabase'
import { Recipe } from '../types'

export class UserService {
  static async saveFavoriteRecipe(recipe: Recipe): Promise<void> {
    const { error } = await supabase
      .from('favorite_recipes')
      .upsert({
        recipe_id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        cooking_time: recipe.cookingTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty
      })

    if (error) {
      console.error('Error saving favorite recipe:', error)
      throw new Error('Failed to save favorite recipe')
    }
  }

  static async removeFavoriteRecipe(recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('favorite_recipes')
      .delete()
      .eq('recipe_id', recipeId)

    if (error) {
      console.error('Error removing favorite recipe:', error)
      throw new Error('Failed to remove favorite recipe')
    }
  }

  static async getFavoriteRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('favorite_recipes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching favorite recipes:', error)
      throw new Error('Failed to fetch favorite recipes')
    }

    return data?.map(item => ({
      id: item.recipe_id,
      title: item.title,
      description: item.description,
      ingredients: item.ingredients,
      instructions: item.instructions,
      cookingTime: item.cooking_time,
      servings: item.servings,
      difficulty: item.difficulty
    })) || []
  }

  static async saveIngredientHistory(ingredients: string[]): Promise<void> {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('No authenticated user found, skipping ingredient history save')
      return
    }

    const { error } = await supabase
      .from('ingredient_history')
      .insert({
        user_id: user.id,
        ingredients
      })

    if (error) {
      console.error('Error saving ingredient history:', error)
      // Don't throw error for history saving - it's not critical
    }
  }

  static async getIngredientHistory(): Promise<string[]> {
    const { data, error } = await supabase
      .from('ingredient_history')
      .select('ingredients')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching ingredient history:', error)
      return []
    }

    // Flatten and deduplicate ingredients
    const allIngredients = data?.flatMap(item => item.ingredients) || []
    return [...new Set(allIngredients)]
  }
}