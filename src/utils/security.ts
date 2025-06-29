/**
 * Security utilities for input validation and sanitization
 */

export class SecurityUtils {
  /**
   * Sanitize user input to prevent XSS attacks
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim()
      .slice(0, 1000) // Limit input length
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; message: string } {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' }
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' }
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' }
    }
    
    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' }
    }
    
    return { isValid: true, message: 'Password is strong' }
  }

  /**
   * Validate ingredient names to prevent injection
   */
  static validateIngredientName(name: string): boolean {
    // Allow letters, numbers, spaces, hyphens, and common punctuation
    const validPattern = /^[a-zA-Z0-9\s\-'.,()&]+$/
    return validPattern.test(name) && name.length <= 100
  }

  /**
   * Rate limiting helper (client-side tracking)
   */
  static checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now()
    const windowKey = `rate_limit_${key}_${Math.floor(now / windowMs)}`
    
    const stored = localStorage.getItem(windowKey)
    const count = stored ? parseInt(stored) : 0
    
    if (count >= maxRequests) {
      return false // Rate limit exceeded
    }
    
    localStorage.setItem(windowKey, (count + 1).toString())
    
    // Clean up old entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('rate_limit_') && key !== windowKey) {
        localStorage.removeItem(key)
      }
    }
    
    return true
  }
}