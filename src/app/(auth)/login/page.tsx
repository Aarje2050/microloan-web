// app/(auth)/login/page.tsx - ENTERPRISE FINAL
'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth, getRedirectPath } from '@/lib/auth'

export default function LoginPage() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [formData, setFormData] = React.useState({'email': '', 'password': ''}
    )
  
  const router = useRouter()
  const { signIn, user, initialized, isAuthenticated } = useAuth()

  console.log('🔍 LOGIN - State:', { 
    user: user?.email, 
    initialized,
    isAuthenticated,
    isLoading 
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isLoading) return

    console.log('🚀 LOGIN - Form submitted')
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signIn(formData.email, formData.password)
      
      if (result?.error) {
        console.error('❌ LOGIN - Error:', result.error)
        setError(result.error.message || 'Login failed')
        setIsLoading(false)
      } else {
        console.log('🎉 LOGIN - Success! Getting user...')
        // Don't set loading to false yet, let the redirect handle it
      }
    } catch (err: any) {
      console.error('💥 LOGIN - Exception:', err)
      setError(err.message || 'An unexpected error occurred')
      setIsLoading(false)
    }
  }

  // Handle redirect after successful login
  React.useEffect(() => {
    if (initialized && isAuthenticated && user && !error) {
      console.log('🔄 LOGIN - User authenticated, redirecting...')
      const redirectPath = getRedirectPath(user.role)
      router.replace(redirectPath)
    }
  }, [initialized, isAuthenticated, user, error, router])

  // Show loading while auth is initializing
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading login...</p>
        </div>
      </div>
    )
  }

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-12 w-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Already logged in</h2>
          <p className="text-sm text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">
              Sign in to your MicroLoan Manager account
            </p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500 disabled:opacity-50"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            
            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500 disabled:opacity-50"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          
          {/* Footer Links */}
          <div className="mt-8 text-center space-y-4">
            <div className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
              <Link 
                href="/register"
                className="text-blue-600 hover:text-blue-500 underline font-medium"
              >
                Sign up here
              </Link>
            </div>
            
            <div className="text-sm text-gray-600">
              <Link 
                href="/"
                className="text-blue-600 hover:text-blue-500 underline"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
        
        {/* Test Credentials */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Test Credentials:</h3>
          <div className="text-xs text-yellow-700">
            <p><strong>Super Admin:</strong> aarje2050@gmail.com / rajesh@321</p>
            <p><strong>Lender:</strong> rajesh@immortalseo.com / Rajesh@321</p>

            <p><strong>Borrower:</strong> rrishika3010@gmail.com / Rajesh@321</p>

          </div>
        </div>
      </div>
    </div>
  )
}