// components/layout/mobile-navigation.tsx - ENTERPRISE MOBILE BOTTOM NAV
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
  PlusCircle,
  Settings,
  TrendingUp,
  BarChart3,
  Building,
  Receipt,
  Phone
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  badge?: number
  isAction?: boolean
  color?: string
}

interface MobileNavigationProps {
  userType?: 'lender' | 'borrower' | 'admin'
  className?: string
}

export default function MobileNavigation({ 
  userType, 
  className 
}: MobileNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLender, isBorrower, isAdmin } = useAuth()

  // Determine user type from auth if not provided
  const currentUserType = userType || 
    (pathname.includes('/admin') ? 'admin' : 
     pathname.includes('/lender') ? 'lender' : 
     pathname.includes('/borrower') ? 'borrower' :
     isAdmin ? 'admin' :
     isLender ? 'lender' : 
     isBorrower ? 'borrower' : 'lender')

  console.log('📱 MOBILE NAV - Current user type:', currentUserType, 'Path:', pathname)

  // Lender navigation items
  const lenderNavItems: NavItem[] = [
    {
      icon: Home,
      label: 'Home',
      href: '/dashboard/lender',
      color: 'blue'
    },
    {
      icon: CreditCard,
      label: 'Loans',
      href: '/dashboard/lender/loans',
      badge: 0, // TODO: Get from actual data
      color: 'green'
    },
    {
      icon: Users,
      label: 'Borrowers',
      href: '/dashboard/lender/borrowers',
      color: 'purple'
    },
    {
      icon: Zap,
      label: 'Quick',
      href: '/dashboard/lender/actions',
      isAction: true,
      color: 'orange'
    },
    {
      icon: User,
      label: 'Profile',
      href: '/dashboard/lender/profile',
      color: 'gray'
    }
  ]

  // Borrower navigation items
  const borrowerNavItems: NavItem[] = [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/dashboard/borrower',
      color: 'blue'
    },
    {
      icon: CreditCard,
      label: 'My Loans',
      href: '/dashboard/borrower/loans',
      color: 'green'
    },
    {
      icon: Receipt,
      label: 'Payments',
      href: '/dashboard/borrower/payments',
      color: 'purple'
    },
    {
      icon: Phone,
      label: 'Support',
      href: '/dashboard/borrower/support',
      color: 'orange'
    },
    {
      icon: User,
      label: 'Profile',
      href: '/dashboard/borrower/profile',
      color: 'gray'
    }
  ]

  // Admin navigation items
  const adminNavItems: NavItem[] = [
    {
      icon: BarChart3,
      label: 'Dashboard',
      href: '/dashboard/admin',
      color: 'purple'
    },
    {
      icon: Users,
      label: 'Users',
      href: '/dashboard/admin/users',
      badge: 0, // TODO: Get from actual data
      color: 'blue'
    },
    {
      icon: Building,
      label: 'Lenders',
      href: '/dashboard/admin/lenders',
      color: 'green'
    },
    {
      icon: CreditCard,
      label: 'Loans',
      href: '/dashboard/admin/loans',
      color: 'indigo'
    },
    {
      icon: TrendingUp,
      label: 'Analytics',
      href: '/dashboard/admin/analytics',
      color: 'orange'
    }
  ]

  // Get navigation items based on user type
  const getNavItems = (): NavItem[] => {
    switch (currentUserType) {
      case 'borrower':
        return borrowerNavItems
      case 'admin':
        return adminNavItems
      case 'lender':
      default:
        return lenderNavItems
    }
  }

  const navItems = getNavItems()

  // Check if current path is active
  const isActive = (href: string): boolean => {
    if (href === '/dashboard/lender' || href === '/dashboard/borrower' || href === '/dashboard/admin') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  // Handle navigation with haptic feedback simulation
  const handleNavigation = (href: string, isAction = false) => {
    // Simulate haptic feedback (would be real on native)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(isAction ? [10, 50, 10] : 10)
    }
    
    console.log('📱 MOBILE NAV - Navigating to:', href)
    router.push(href)
  }

  // Get color classes for nav items
  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-500',
      green: isActive ? 'text-green-600 bg-green-50' : 'text-gray-500',
      purple: isActive ? 'text-purple-600 bg-purple-50' : 'text-gray-500',
      orange: isActive ? 'text-orange-600 bg-orange-50' : 'text-gray-500',
      indigo: isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500',
      gray: isActive ? 'text-gray-700 bg-gray-100' : 'text-gray-500'
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  // Don't render if not on a dashboard page
  if (!pathname.includes('/dashboard')) {
    return null
  }

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden",
      "safe-area-pb", // For iOS safe area
      className
    )}>
      {/* Navigation Items */}
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const colorClasses = getColorClasses(item.color || 'gray', active)
          
          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href, item.isAction)}
              className={cn(
                "flex flex-col items-center justify-center relative transition-all duration-200 hover:scale-105",
                colorClasses,
                active && "transform scale-105"
              )}
              aria-label={item.label}
            >
              {/* Active indicator */}
              {active && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-current rounded-full opacity-80" />
              )}
              
              {/* Icon with special styling for action button */}
              <div className={cn(
                "relative transition-transform duration-200",
                item.isAction && !active && "animate-pulse"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-all duration-200",
                  active ? "h-6 w-6" : "h-5 w-5",
                  item.isAction && "drop-shadow-sm"
                )} />
                
                {/* Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 font-medium shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </div>
                )}
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-xs font-medium mt-1 transition-all duration-200 leading-tight",
                active ? "text-current opacity-100" : "opacity-75"
              )}>
                {item.label}
              </span>
              
              {/* Ripple effect on tap */}
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div className={cn(
                  "absolute inset-0 transform scale-0 bg-current opacity-10 rounded-lg transition-transform duration-300",
                  "hover:scale-100 active:scale-100"
                )} />
              </div>
            </button>
          )
        })}
      </div>
      
      {/* Safe area spacing for iOS */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  )
}

// Helper hook for navigation state
export function useNavigationState() {
  const pathname = usePathname()
  const { isLender, isBorrower, isAdmin } = useAuth()
  
  const getCurrentSection = () => {
    if (pathname.includes('/loans')) return 'loans'
    if (pathname.includes('/borrowers')) return 'borrowers'
    if (pathname.includes('/lenders')) return 'lenders'
    if (pathname.includes('/actions')) return 'actions'
    if (pathname.includes('/profile')) return 'profile'
    if (pathname.includes('/payments')) return 'payments'
    if (pathname.includes('/analytics')) return 'analytics'
    if (pathname.includes('/settings')) return 'settings'
    if (pathname.includes('/users')) return 'users'
    return 'home'
  }
  
  const getUserType = () => {
    if (pathname.includes('/admin')) return 'admin'
    if (pathname.includes('/borrower')) return 'borrower'
    if (pathname.includes('/lender')) return 'lender'
    if (isAdmin) return 'admin'
    if (isLender) return 'lender'
    if (isBorrower) return 'borrower'
    return 'lender'
  }
  
  return {
    currentSection: getCurrentSection(),
    userType: getUserType(),
    pathname
  }
}