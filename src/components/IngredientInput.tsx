import React, { useState, useRef } from 'react'
import { Plus, X, Camera, Upload, CameraIcon, Sparkles, History, AlertCircle } from 'lucide-react'
import { Ingredient } from '../types'
import { AIService } from '../services/aiService'
import { UserService } from '../services/userService'
import { useAuth } from '../hooks/useAuth'
import { SecurityUtils } from '../utils/security'

interface IngredientInputProps {
  ingredients: Ingredient[]
  onIngredientsChange: (ingredients: Ingredient[]) => void
  onAnalyzeImage: (ingredients: string[]) => void
}

export const IngredientInput: React.FC<IngredientInputProps> = ({
  ingredients,
  onIngredientsChange,
  onAnalyzeImage
}) => {
  const [inputValue, setInputValue] = useState('')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [recentIngredients, setRecentIngredients] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [inputError, setInputError] = useState('')
  const [analysisError, setAnalysisError] = useState('')
  const { user } = useAuth()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  React.useEffect(() => {
    if (user) {
      loadIngredientHistory()
    }
  }, [user])

  const loadIngredientHistory = async () => {
    try {
      const history = await UserService.getIngredientHistory()
      setRecentIngredients(history.slice(0, 8))
    } catch (error) {
      console.error('Failed to load ingredient history:', error)
    }
  }

  const addIngredient = (name: string) => {
    const sanitizedName = SecurityUtils.sanitizeInput(name)
    
    if (!sanitizedName.trim()) {
      setInputError('Please enter an ingredient name')
      return
    }

    if (!SecurityUtils.validateIngredientName(sanitizedName)) {
      setInputError('Invalid ingredient name. Please use only letters, numbers, and common punctuation.')
      return
    }

    if (ingredients.find(ing => ing.name.toLowerCase() === sanitizedName.toLowerCase())) {
      setInputError('This ingredient is already added')
      return
    }

    if (ingredients.length >= 20) {
      setInputError('Maximum 20 ingredients allowed')
      return
    }

    const newIngredient: Ingredient = {
      id: `ingredient-${Date.now()}`,
      name: sanitizedName.trim(),
      detected: false
    }
    onIngredientsChange([...ingredients, newIngredient])
    setInputValue('')
    setInputError('')
  }

  const removeIngredient = (id: string) => {
    onIngredientsChange(ingredients.filter(ing => ing.id !== id))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setInputError('')
    
    // Real-time validation feedback
    if (value && !SecurityUtils.validateIngredientName(value)) {
      setInputError('Invalid characters detected')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addIngredient(inputValue)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setAnalysisError('Please upload an image file')
      return
    }

    // File size validation (max 3MB to account for base64 encoding overhead)
    if (file.size > 3 * 1024 * 1024) {
      setAnalysisError('Image file too large. Please use an image smaller than 3MB.')
      return
    }

    if (!user) {
      setAnalysisError('Please sign in to use image analysis')
      return
    }

    // Rate limiting for image analysis
    if (!SecurityUtils.checkRateLimit('image_analysis', 10, 60000)) {
      setAnalysisError('Too many image analysis requests. Please wait a minute before trying again.')
      return
    }

    setIsAnalyzing(true)
    setAnalysisError('')
    
    try {
      const detectedIngredients = await AIService.analyzeImage(file)
      onAnalyzeImage(detectedIngredients)
    } catch (error) {
      console.error('Image analysis failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze image'
      setAnalysisError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const startCamera = async () => {
    if (!user) {
      setAnalysisError('Please sign in to use camera features')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment'
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)
        setAnalysisError('')
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setAnalysisError('Unable to access camera. Please check permissions or use file upload instead.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' })
            stopCamera()
            await handleImageUpload(file)
          }
        }, 'image/jpeg', 0.8)
      }
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const triggerCameraCapture = () => {
    cameraInputRef.current?.click()
  }

  const clearAnalysisError = () => {
    setAnalysisError('')
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Camera className="w-6 h-6 text-emerald-600" />
        Add Your Ingredients
      </h2>
      
      {/* Manual Input */}
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type an ingredient (e.g., chicken breast, broccoli)"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                inputError ? 'border-red-300' : 'border-gray-300'
              }`}
              maxLength={100}
            />
            {inputError && (
              <p className="text-red-600 text-sm mt-1">{inputError}</p>
            )}
          </div>
          <button
            onClick={() => addIngredient(inputValue)}
            disabled={!inputValue.trim() || !!inputError}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Recent Ingredients */}
        {user && recentIngredients.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-2"
            >
              <History className="w-4 h-4" />
              Recent ingredients
            </button>
            {showHistory && (
              <div className="flex flex-wrap gap-2">
                {recentIngredients.map((ingredient, index) => (
                  <button
                    key={index}
                    onClick={() => addIngredient(ingredient)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {ingredient}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camera and Photo Upload */}
      <div className="mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />

          {/* Analysis Error Display */}
          {analysisError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-red-800 mb-1">
                    Image Analysis Error
                  </p>
                  <p className="text-sm text-red-700">{analysisError}</p>
                  {analysisError.includes('service is not properly configured') && (
                    <p className="text-xs text-red-600 mt-2">
                      This feature requires additional setup. Please try again later or add ingredients manually.
                    </p>
                  )}
                </div>
                <button
                  onClick={clearAnalysisError}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {isAnalyzing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600">Analyzing your image with AI...</p>
            </div>
          ) : !isCameraActive ? (
            <>
              <Sparkles className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <p className="text-gray-800 font-medium mb-2">AI-Powered Ingredient Detection</p>
              <p className="text-gray-600 mb-4">Take a photo or upload an image to automatically detect ingredients</p>
              
              {user ? (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={startCamera}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 justify-center"
                  >
                    <CameraIcon className="w-4 h-4" />
                    Use Camera
                  </button>

                  <button
                    onClick={triggerFileSelect}
                    className="px-6 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors flex items-center gap-2 justify-center"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    Sign in to use AI features
                  </p>
                  <p className="text-xs text-blue-600">
                    Create a free account to access image analysis and recipe generation
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-md mx-auto rounded-lg"
              />
              <div className="flex gap-3 justify-center">
                <button
                  onClick={capturePhoto}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Ingredient Tags */}
      {ingredients.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Your Ingredients ({ingredients.length}/20):
          </h3>
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ingredient) => (
              <div
                key={ingredient.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  ingredient.detected
                    ? 'bg-orange-100 text-orange-800 border border-orange-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <span>{ingredient.name}</span>
                <button
                  onClick={() => removeIngredient(ingredient.id)}
                  className="hover:bg-black hover:bg-opacity-10 rounded-full p-1 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}