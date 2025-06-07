'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Search, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui'
import { Badge } from '@/components/ui'
import DesktopSidebar from './desktop-sidebar'
import MobileNavigation, { FloatingActionButton } from './mobile-navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  actions,
  className
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const { user } = useAuth()
  const pathname = usePathname()

  // Auto-close mobile menu on navigation
  React.useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Get page title from pathname if not provided
  const getPageTitle = () => {
    if (title) return title
    
    const segments = pathname.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    
    if (lastSegment === 'dashboard') return 'Dashboard'
    return lastSegment
      ?.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Dashboard'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <DesktopSidebar />
      
      {/* Mobile Overlay Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">ML</span>
                </div>
                <div>
                  <h2 className="font-semibold text-sm">MicroLoan Manager</h2>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Mobile menu content can be added here */}
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                Use bottom navigation for quick access
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col",
        "md:ml-64", // Account for desktop sidebar
        className
      )}>
        {/* Top Header */}
        <header className="bg-background border-b border-border sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Page title */}
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {getPageTitle()}
                </h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2">
              {/* Search (desktop only) */}
              <div className="hidden md:block">
                <Input
                  placeholder="Search..."
                  className="w-64"
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
              
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
                >
                  3
                </Badge>
              </Button>
              
              {/* Actions */}
              {actions}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={cn(
          "flex-1 p-4 md:p-6",
          "pb-20 md:pb-6", // Account for mobile bottom nav
          "min-h-0" // Allow scrolling
        )}>
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* Floating Action Button */}
      {user && <FloatingActionButton role={user.role} />}
    </div>
  )
}

// Page wrapper for consistent spacing and max width
interface PageWrapperProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  className?: string
}

export function PageWrapper({ 
  children, 
  maxWidth = '2xl', 
  className 
}: PageWrapperProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }

  return (
    <div className={cn(
      "w-full mx-auto space-y-6",
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  )
}

// Stats cards wrapper for dashboard
interface StatsGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={cn(
      "grid gap-4",
      gridClasses[columns],
      className
    )}>
      {children}
    </div>
  )
}