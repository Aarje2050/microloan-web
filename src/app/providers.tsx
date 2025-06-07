// app/providers.tsx - ENTERPRISE FINAL SOLUTION
'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/auth'

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

// Auth initializer that runs once
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const [initStarted, setInitStarted] = React.useState(false)
  const { initialized, loading, initialize } = useAuthStore()

  // Initialize auth exactly once
  React.useEffect(() => {
    if (!initStarted && !initialized) {
      console.log('🔄 PROVIDERS - Starting auth initialization...')
      setInitStarted(true)
      initialize().then(() => {
        console.log('✅ PROVIDERS - Auth initialization completed')
      }).catch((error) => {
        console.error('❌ PROVIDERS - Auth initialization failed:', error)
      })
    }
  }, [initStarted, initialized, initialize])

  // Show loading only while actually initializing
  if (!initialized && (loading || !initStarted)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">MicroLoan Manager</h2>
            <p className="text-sm text-gray-600">Initializing authentication...</p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Main providers
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        {children}
      </AuthInitializer>
    </QueryClientProvider>
  )
}