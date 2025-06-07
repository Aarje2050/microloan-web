// app/page.tsx - SIMPLE WORKING VERSION
'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth, getRedirectPath } from '@/lib/auth'
import { CreditCard, ArrowRight, Shield, Users, DollarSign } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { user, initialized, isAuthenticated } = useAuth()

  console.log('🏠 HOMEPAGE - State:', { 
    user: user?.email, 
    initialized, 
    isAuthenticated 
  })

  // Simple redirect logic - no delays, no complications
  React.useEffect(() => {
    if (!initialized) {
      return // Wait for auth to initialize
    }

    if (isAuthenticated && user) {
      console.log('🔄 HOMEPAGE - User authenticated, redirecting immediately...')
      const redirectPath = getRedirectPath(user.role)
      console.log('🚀 HOMEPAGE - Redirecting to:', redirectPath)
      router.replace(redirectPath)
    }
  }, [initialized, isAuthenticated, user, router])

  // Show loading while initializing
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated, show redirecting message
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Welcome back, {user.full_name}!</h2>
            <p className="text-sm text-gray-600">Taking you to your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">MicroLoan Manager</span>
            </div>
            <div className="space-x-4">
              <Link 
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Enterprise MicroLoan Management Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline your microloan operations with our comprehensive management system. 
            Perfect for lenders, borrowers, and administrators.
          </p>
          
          <div className="space-x-4">
            <Link 
              href="/login"
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link 
              href="/register"
              className="inline-flex items-center border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Control</h3>
            <p className="text-gray-600">Complete system administration with user management and analytics</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
            <p className="text-gray-600">Manage lenders, borrowers, and loan relationships efficiently</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loan Tracking</h3>
            <p className="text-gray-600">Track payments, EMIs, and loan lifecycles in real-time</p>
          </div>
        </div>

        {/* Test Credentials */}
        <div className="mt-16 bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Test the Platform:</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <p><strong>Super Admin:</strong> aarje2050@gmail.com / Rajesh@321</p>
            <p className="text-xs">Use these credentials to explore the admin dashboard</p>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-green-800 text-sm text-center">
            ✅ Authentication system ready - you can safely login now
          </p>
        </div>
      </div>
    </div>
  )
}