// components/ui/loading.tsx - Loading Components
'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  }

  return (
    <div className={cn('spinner border-2 border-gray-300 border-t-primary rounded-full animate-spin', sizes[size], className)} />
  )
}

interface LoadingPageProps {
  title?: string
  subtitle?: string
}

export function LoadingPage({ title = 'Loading...', subtitle }: LoadingPageProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center mx-auto">
          <LoadingSpinner size="md" className="border-primary-foreground border-t-transparent" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}