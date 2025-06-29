import React, { useState, useEffect } from 'react'
import { ChefHat, Sparkles, Leaf, User, LogOut, Heart } from 'lucide-react'
import { IngredientInput } from './components/IngredientInput'
import { RecipeCard } from './components/RecipeCard'
import { LoadingSpinner } from './components/LoadingSpinner'
import { AuthModal } from './components/AuthModal'
import { TestApiButton } from './components/TestApiButton'
import { AIService } from './services/aiService'
import { UserService } from './services/userService'
import { useAuth } from './hooks/useAuth'
import { Ingredient, Recipe } from './types'

function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showApiTest, setShowApiTest] = useState(false)
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    if (user) {
      loadFavoriteRecipes()
    }
  }, [user])

  const loadFavoriteRecipes = async () => {
    try {
      const favorites = await UserService.getFavoriteRecipes()
      setFavoriteRecipes(favorites)
    } catch (error) {
      console.error('Failed to load favorite recipes:', error)
    }
  }

  const handleIngredientsChange = (newIngredients: Ingredient[]) => {
    setIngredients(newIngredients)
  }

  const handleImageAnalysis = (detectedIngredients: string[]) => {
    const newIngredients = detectedIngredients.map(name => ({
      id: `detected-${Date.now()}-${Math.random()}`,
      name,
      detected: true
    }))

    // Merge with existing ingredients, avoiding duplicates
    const existingNames = ingredients.map(ing => ing.name.toLowerCase())
    const uniqueNewIngredients = newIngredients.filter(
      ing => !existingNames.includes(ing.name.toLowerCase())
    )

    setIngredients([...ingredients, ...uniqueNewIngredients])
  }

  const generateRecipes = async () => {
    if (ingredients.length === 0) {
      alert('Please add some ingredients first!')
      return
    }

    if (!user) {
      setShowAuthModal(true)
      return
    }

    setIsGenerating(true)
    try {
      const ingredientNames = ingredients.map(ing => ing.name)
      
      // Save ingredient history
      await UserService.saveIngredientHistory(ingredientNames)
      
      // Generate recipes
      const generatedRecipes = await AIService.generateRecipes(ingredientNames)
      setRecipes(generatedRecipes)
    } catch (error) {
      console.error('Failed to generate recipes:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate recipes. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleFavorite = async (recipe: Recipe) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    try {
      const isFavorited = favoriteRecipes.some(fav => fav.id === recipe.id)
      
      if (isFavorited) {
        await UserService.removeFavoriteRecipe(recipe.id)
        setFavoriteRecipes(favoriteRecipes.filter(fav => fav.id !== recipe.id))
      } else {
        await UserService.saveFavoriteRecipe(recipe)
        setFavoriteRecipes([...favoriteRecipes, recipe])
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      alert('Failed to update favorites. Please try again.')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setFavoriteRecipes([])
      setRecipes([])
      setIngredients([])
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sage-50 flex items-center justify-center">
        <LoadingSpinner message="Loading FreshCook..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sage-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">FreshCook</h1>
                <p className="text-sm text-gray-600">Minimize waste, maximize flavor</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100 rounded-full">
                <Leaf className="w-4 h-4 text-emerald-700" />
                <span className="text-sm font-medium text-emerald-700">Eco-Friendly</span>
              </div>
              
              {/* API Test Button - only show for development */}
              {import.meta.env.DEV && (
                <button
                  onClick={() => setShowApiTest(!showApiTest)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors text-sm"
                >
                  API Test
                </button>
              )}
              
              {user ? (
                <div className="flex items-center gap-3">
                  {favoriteRecipes.length > 0 && (
                    <button
                      onClick={() => setShowFavorites(!showFavorites)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span className="text-sm font-medium">{favoriteRecipes.length}</span>
                    </button>
                  )}
                  
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {user.email?.split('@')[0]}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Turn Your Ingredients Into 
            <span className="text-emerald-600"> Amazing Recipes</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Upload a photo of your fridge or manually add ingredients. Our AI will create unique, 
            delicious recipes that help reduce food waste.
          </p>
        </div>

        {/* API Test Section - only show in development */}
        {import.meta.env.DEV && showApiTest && (
          <TestApiButton />
        )}

        {/* Show Favorites */}
        {showFavorites && favoriteRecipes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Heart className="w-8 h-8 text-red-500" />
                Your Favorite Recipes
              </h2>
              <button
                onClick={() => setShowFavorites(false)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Hide Favorites
              </button>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {favoriteRecipes.map((recipe) => (
                <RecipeCard
                  key={`fav-${recipe.id}`}
                  recipe={recipe}
                  onFavorite={toggleFavorite}
                  isFavorited={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Ingredient Input */}
        <IngredientInput
          ingredients={ingredients}
          onIngredientsChange={handleIngredientsChange}
          onAnalyzeImage={handleImageAnalysis}
        />

        {/* Generate Recipes Button */}
        {ingredients.length > 0 && (
          <div className="text-center mb-8">
            <button
              onClick={generateRecipes}
              disabled={isGenerating}
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-sage-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl"
            >
              <Sparkles className="w-5 h-5" />
              {isGenerating ? 'Generating Recipes...' : 'Generate Recipes'}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <LoadingSpinner message="Creating amazing recipes with your ingredients..." />
        )}

        {/* Recipes Grid */}
        {recipes.length > 0 && !isGenerating && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Your Personalized Recipes
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onFavorite={toggleFavorite}
                  isFavorited={favoriteRecipes.some(fav => fav.id === recipe.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {ingredients.length === 0 && !showFavorites && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ChefHat className="w-12 h-12 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to Cook?</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Add your ingredients above to get started with personalized recipe recommendations.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="flex items-center justify-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-emerald-600" />
              Made with care for sustainable cooking
            </p>
            <p className="text-sm">
              Helping reduce food waste, one recipe at a time.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  )
}

export default App