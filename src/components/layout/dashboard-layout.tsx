// components/layout/dashboard-layout.tsx - ENTERPRISE MOBILE-FIRST LAYOUT
'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { 
  Home, 
  CreditCard, 
  Users, 
  Zap, 
  User,
  Briefcase,
  LogOut,
  ArrowLeft,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  showBackButton?: boolean
  showMobileMenu?: boolean
  customHeader?: React.ReactNode
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  badge?: number
  isActive?: boolean
}

export default function DashboardLayout({
  children,
  title,
  showBackButton = false,
  showMobileMenu = true,
  customHeader
}: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut, isLender, isBorrower, isBoth, isAuthenticated } = useAuth()
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  console.log('📱 DASHBOARD LAYOUT - Current path:', pathname)

  // Mobile navigation items for lender
  const lenderNavItems: NavItem[] = [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/dashboard/lender',
      isActive: pathname === '/dashboard/lender'
    },
    {
      icon: CreditCard,
      label: 'Loans',
      href: '/dashboard/lender/loans',
      isActive: pathname.startsWith('/dashboard/lender/loans')
    },
    {
      icon: Users,
      label: 'Borrowers',
      href: '/dashboard/lender/borrowers',
      isActive: pathname.startsWith('/dashboard/lender/borrowers')
    },
    {
      icon: Zap,
      label: 'Actions',
      href: '/dashboard/lender/actions',
      isActive: pathname.startsWith('/dashboard/lender/actions')
    },
    {
      icon: User,
      label: 'Profile',
      href: '/dashboard/lender/profile',
      isActive: pathname.startsWith('/dashboard/lender/profile')
    }
  ]

  // Borrower navigation items
  const borrowerNavItems: NavItem[] = [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/dashboard/borrower',
      isActive: pathname === '/dashboard/borrower'
    },
    {
      icon: CreditCard,
      label: 'My Loans',
      href: '/dashboard/borrower/loans',
      isActive: pathname.startsWith('/dashboard/borrower/loans')
    },
    {
      icon: Users,
      label: 'Lenders',
      href: '/dashboard/borrower/lenders',
      isActive: pathname.startsWith('/dashboard/borrower/lenders')
    },
    {
      icon: User,
      label: 'Profile',
      href: '/dashboard/borrower/profile',
      isActive: pathname.startsWith('/dashboard/borrower/profile')
    }
  ]

  // Get current navigation items based on user role and current path
  const getCurrentNavItems = (): NavItem[] => {
    // More specific path matching to avoid confusion
    if (pathname.startsWith('/dashboard/borrower')) {
      return borrowerNavItems
    }
    if (pathname.startsWith('/dashboard/lender')) {
      return lenderNavItems
    }
    if (pathname.startsWith('/dashboard/admin')) {
      return [] // Admin nav items (when implemented)
    }
    
    // Default based on user role
    if (isLender) return lenderNavItems
    if (isBorrower) return borrowerNavItems
    return lenderNavItems
  }

  const navItems = getCurrentNavItems()

  // Handle navigation
  const handleNavigation = (href: string) => {
    setIsMobileMenuOpen(false)
    router.push(href)
  }

  // Handle back button
  const handleBack = () => {
    router.back()
  }

  // Handle sign out
  const handleSignOut = async () => {
    if (isSigningOut) return
    
    setIsSigningOut(true)
    setIsMobileMenuOpen(false)
    
    try {
      await signOut()
      router.replace('/login')
    } catch (error) {
      console.error('❌ Sign out error:', error)
      router.replace('/login')
    }
  }

  // Handle role switch
  const handleRoleSwitch = () => {
    setIsMobileMenuOpen(false)
    if (pathname.includes('/lender')) {
      router.push('/dashboard/borrower')
    } else {
      router.push('/dashboard/lender')
    }
  }

  // Get current role display
  const getCurrentRole = () => {
    if (pathname.includes('/lender')) return 'Lender'
    if (pathname.includes('/borrower')) return 'Borrower'
    return isLender ? 'Lender' : 'Borrower'
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left Section */}
          <div className="flex items-center">
            {showBackButton ? (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors mr-2"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            ) : (
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  {isLender && <Briefcase className="h-4 w-4 text-white" />}
                  {isBorrower && <User className="h-4 w-4 text-white" />}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    {title || getCurrentRole()}
                  </h1>
                  <p className="text-xs text-gray-500 -mt-1">
                    {user?.full_name || user?.email}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {customHeader}
            {showMobileMenu && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 text-gray-600" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-600" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
            <div className="px-4 py-3 space-y-1">
              {/* Role Switch Button (if dual role) */}
              {isBoth && (
                <button
                  onClick={handleRoleSwitch}
                  className="w-full flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <User className="h-4 w-4 mr-3" />
                  Switch to {pathname.includes('/lender') ? 'Borrower' : 'Lender'} View
                </button>
              )}
              
              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <LogOut className="h-4 w-4 mr-3" />
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                {isLender && <Briefcase className="h-5 w-5 text-white" />}
                {isBorrower && <User className="h-5 w-5 text-white" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {title || `${getCurrentRole()} Dashboard`}
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome, {user?.full_name || user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {customHeader}
              
              {isBoth && (
                <button
                  onClick={handleRoleSwitch}
                  className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <User className="h-4 w-4 mr-2" />
                  Switch to {pathname.includes('/lender') ? 'Borrower' : 'Lender'}
                </button>
              )}

              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Fixed Desktop Sidebar Overlap */}
      <div className="flex-1">
        <main className="pb-20 lg:pb-0 xl:ml-64 transition-all duration-300">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-5 md:grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 min-h-[60px] transition-colors relative",
                  item.isActive
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {/* Active indicator */}
                {item.isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full" />
                )}
                
                <Icon className={cn("h-5 w-5 mb-1", item.isActive && "text-blue-600")} />
                <span className={cn(
                  "text-xs font-medium leading-tight",
                  item.isActive && "text-blue-600"
                )}>
                  {item.label}
                </span>
                
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <div className="absolute top-1 right-1/4 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop Sidebar (for larger screens) - Fixed Positioning */}
      <div className="hidden xl:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-30">
        <div className="pt-20"> {/* Space for fixed header */}
          <nav className="px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors",
                    item.isActive
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Icon className={cn("h-5 w-5 mr-3", item.isActive && "text-blue-600")} />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-2">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

    </div>
  )
}