import React, { useState } from 'react'
import { X, Mail, Lock, User, AlertCircle, Shield } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { SecurityUtils } from '../utils/security'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<{ isValid: boolean; message: string }>({ isValid: false, message: '' })
  const { signUp, signIn } = useAuth()

  if (!isOpen) return null

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedEmail = SecurityUtils.sanitizeInput(e.target.value)
    setEmail(sanitizedEmail)
    setError('')
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setError('')
    
    if (isSignUp && newPassword) {
      setPasswordStrength(SecurityUtils.validatePassword(newPassword))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Client-side validation
    if (!SecurityUtils.isValidEmail(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (isSignUp && !passwordStrength.isValid) {
      setError(passwordStrength.message)
      setLoading(false)
      return
    }

    // Rate limiting check
    if (!SecurityUtils.checkRateLimit('auth_attempt', 5, 60000)) {
      setError('Too many attempts. Please wait a minute before trying again.')
      setLoading(false)
      return
    }

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password)

      if (error) {
        setError(error.message)
      } else {
        onClose()
        setEmail('')
        setPassword('')
        setPasswordStrength({ isValid: false, message: '' })
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                maxLength={254}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                minLength={isSignUp ? 8 : 6}
                required
              />
            </div>
            {isSignUp && password && (
              <div className={`mt-2 text-xs ${passwordStrength.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {passwordStrength.message}
              </div>
            )}
          </div>

          {isSignUp && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Security Requirements</span>
              </div>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Contains uppercase and lowercase letters</li>
                <li>• Contains at least one number</li>
                <li>• Your data is encrypted and secure</li>
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (isSignUp && !passwordStrength.isValid)}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-sage-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <User className="w-4 h-4" />
                {isSignUp ? 'Create Secure Account' : 'Sign In'}
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setPasswordStrength({ isValid: false, message: '' })
              }}
              className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>

          <div className="text-center pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Protected by enterprise-grade security
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}