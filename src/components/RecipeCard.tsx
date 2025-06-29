import React from 'react'
import { Clock, Users, ChefHat, Heart } from 'lucide-react'
import { Recipe } from '../types'

interface RecipeCardProps {
  recipe: Recipe
  onFavorite?: (recipe: Recipe) => void
  isFavorited?: boolean
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ 
  recipe, 
  onFavorite, 
  isFavorited = false 
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-gray-100">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-800 leading-tight">{recipe.title}</h3>
          {onFavorite && (
            <button
              onClick={() => onFavorite(recipe)}
              className={`p-2 rounded-full transition-colors ${
                isFavorited 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{recipe.description}</p>
        
        {/* Meta Info */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{recipe.cookingTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{recipe.servings} servings</span>
          </div>
          <div className="flex items-center gap-1">
            <ChefHat className="w-4 h-4" />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
              {recipe.difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="p-6 pb-4">
        <h4 className="font-semibold text-gray-800 mb-3">Ingredients:</h4>
        <ul className="space-y-1">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>{ingredient}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions */}
      <div className="p-6 pt-0">
        <h4 className="font-semibold text-gray-800 mb-3">Instructions:</h4>
        <ol className="space-y-2">
          {recipe.instructions.map((instruction, index) => (
            <li key={index} className="text-sm text-gray-600 flex gap-3">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                {index + 1}
              </span>
              <span className="leading-relaxed">{instruction}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}