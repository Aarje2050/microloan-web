// components/layout/desktop-sidebar.tsx - ENTERPRISE DESKTOP SIDEBAR
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
  Settings,
  TrendingUp,
  Briefcase,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  badge?: number
  subItems?: SidebarItem[]
  color?: string
}

interface DesktopSidebarProps {
  userType?: 'lender' | 'borrower' | 'admin'
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  className?: string
}

export default function DesktopSidebar({ 
  userType, 
  collapsed = false,
  onCollapsedChange,
  className 
}: DesktopSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut, isLender, isBorrower, isAdmin, isBoth } = useAuth()
  
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])

  // Determine user type from auth if not provided
  const currentUserType = userType || 
    (pathname.includes('/lender') ? 'lender' : 
     pathname.includes('/borrower') ? 'borrower' :
     pathname.includes('/admin') ? 'admin' :
     isLender ? 'lender' : 
     isBorrower ? 'borrower' : 'lender')

  console.log('🖥️ DESKTOP SIDEBAR - Current user type:', currentUserType)

  // Lender sidebar items
  const lenderSidebarItems: SidebarItem[] = [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/dashboard/lender',
      color: 'blue'
    },
    {
      icon: CreditCard,
      label: 'Loans Management',
      href: '/dashboard/lender/loans',
      badge: 0, // TODO: Get from actual data
      color: 'green',
      subItems: [
        { icon: CreditCard, label: 'Active Loans', href: '/dashboard/lender/loans', color: 'green' },
        { icon: CreditCard, label: 'Create New', href: '/dashboard/lender/loans/create', color: 'green' },
        { icon: CreditCard, label: 'Payment History', href: '/dashboard/lender/loans/payments', color: 'green' }
      ]
    },
    {
      icon: Users,
      label: 'Borrowers',
      href: '/dashboard/lender/borrowers',
      color: 'purple',
      subItems: [
        { icon: Users, label: 'All Borrowers', href: '/dashboard/lender/borrowers', color: 'purple' },
        { icon: Users, label: 'Add New', href: '/dashboard/lender/borrowers/add', color: 'purple' },
        { icon: Users, label: 'KYC Pending', href: '/dashboard/lender/borrowers/kyc', color: 'purple' }
      ]
    },
    {
      icon: Zap,
      label: 'Quick Actions',
      href: '/dashboard/lender/actions',
      color: 'orange'
    },
    {
      icon: TrendingUp,
      label: 'Analytics',
      href: '/dashboard/lender/analytics',
      color: 'indigo'
    }
  ]

  // Borrower sidebar items
  const borrowerSidebarItems: SidebarItem[] = [
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
      badge: 0, // TODO: Get from actual data
      color: 'green'
    },
    {
      icon: TrendingUp,
      label: 'Payment History',
      href: '/dashboard/borrower/payments',
      color: 'purple'
    },
    {
      icon: Users,
      label: 'My Lenders',
      href: '/dashboard/borrower/lenders',
      color: 'indigo'
    },
    {
      icon: Bell,
      label: 'Notifications',
      href: '/dashboard/borrower/notifications',
      badge: 0, // TODO: Get from actual data
      color: 'orange'
    }
  ]

  // Admin sidebar items
  const adminSidebarItems: SidebarItem[] = [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/dashboard/admin',
      color: 'blue'
    },
    {
      icon: Users,
      label: 'User Management',
      href: '/dashboard/admin/users',
      color: 'purple',
      subItems: [
        { icon: Users, label: 'All Users', href: '/dashboard/admin/users', color: 'purple' },
        { icon: Users, label: 'Lenders', href: '/dashboard/admin/users/lenders', color: 'purple' },
        { icon: Users, label: 'Borrowers', href: '/dashboard/admin/users/borrowers', color: 'purple' }
      ]
    },
    {
      icon: CreditCard,
      label: 'Loan Management',
      href: '/dashboard/admin/loans',
      color: 'green'
    },
    {
      icon: TrendingUp,
      label: 'Analytics',
      href: '/dashboard/admin/analytics',
      color: 'orange'
    },
    {
      icon: Settings,
      label: 'System Settings',
      href: '/dashboard/admin/settings',
      color: 'gray'
    }
  ]

  // Get sidebar items based on user type
  const getSidebarItems = (): SidebarItem[] => {
    switch (currentUserType) {
      case 'borrower':
        return borrowerSidebarItems
      case 'admin':
        return adminSidebarItems
      case 'lender':
      default:
        return lenderSidebarItems
    }
  }

  const sidebarItems = getSidebarItems()

  // Check if current path is active
  const isActive = (href: string): boolean => {
    if (href === '/dashboard/lender' || href === '/dashboard/borrower' || href === '/dashboard/admin') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  // Handle navigation
  const handleNavigation = (href: string) => {
    console.log('🖥️ DESKTOP SIDEBAR - Navigating to:', href)
    router.push(href)
  }

  // Handle collapse toggle
  const handleCollapseToggle = () => {
    onCollapsedChange?.(!collapsed)
  }

  // Handle sign out
  const handleSignOut = async () => {
    if (isSigningOut) return
    
    setIsSigningOut(true)
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
    if (pathname.includes('/lender')) {
      router.push('/dashboard/borrower')
    } else {
      router.push('/dashboard/lender')
    }
  }

  // Handle expand/collapse of menu items
  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    )
  }

  // Get color classes for sidebar items
  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600',
      green: isActive ? 'text-green-600 bg-green-50 border-green-200' : 'text-gray-700 hover:bg-green-50 hover:text-green-600',
      purple: isActive ? 'text-purple-600 bg-purple-50 border-purple-200' : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600',
      orange: isActive ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600',
      indigo: isActive ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600',
      gray: isActive ? 'text-gray-700 bg-gray-100 border-gray-200' : 'text-gray-700 hover:bg-gray-50'
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  // Don't render if not on a dashboard page
  if (!pathname.includes('/dashboard')) {
    return null
  }

  return (
    <aside className={cn(
      "hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 z-30",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {currentUserType.charAt(0).toUpperCase() + currentUserType.slice(1)}
              </h2>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
          </div>
        )}
        
        <button
          onClick={handleCollapseToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const colorClasses = getColorClasses(item.color || 'gray', active)
          const hasSubItems = item.subItems && item.subItems.length > 0
          const isExpanded = expandedItems.includes(item.href)
          
          return (
            <div key={item.href}>
              {/* Main Item */}
              <button
                onClick={() => {
                  if (hasSubItems && !collapsed) {
                    toggleExpanded(item.href)
                  } else {
                    handleNavigation(item.href)
                  }
                }}
                className={cn(
                  "w-full flex items-center px-3 py-2 text-left rounded-lg transition-all duration-200 border border-transparent",
                  colorClasses,
                  active && "border"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                
                {!collapsed && (
                  <>
                    <span className="ml-3 font-medium text-sm truncate flex-1">
                      {item.label}
                    </span>
                    
                    {/* Badge */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-2 font-medium">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    
                    {/* Expand Arrow */}
                    {hasSubItems && (
                      <ChevronRight className={cn(
                        "h-4 w-4 ml-2 transition-transform duration-200",
                        isExpanded && "transform rotate-90"
                      )} />
                    )}
                  </>
                )}
              </button>
              
              {/* Sub Items */}
              {hasSubItems && !collapsed && isExpanded && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.subItems?.map((subItem) => {
                    const SubIcon = subItem.icon
                    const subActive = isActive(subItem.href)
                    const subColorClasses = getColorClasses(subItem.color || 'gray', subActive)
                    
                    return (
                      <button
                        key={subItem.href}
                        onClick={() => handleNavigation(subItem.href)}
                        className={cn(
                          "w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors text-sm",
                          subColorClasses
                        )}
                      >
                        <SubIcon className="h-4 w-4 shrink-0" />
                        <span className="ml-3 truncate">{subItem.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {/* User Info */}
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.full_name || user?.email}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        )}
        
        {/* Role Switch (if dual role) */}
        {isBoth && (
          <button
            onClick={handleRoleSwitch}
            className="w-full flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={collapsed ? 'Switch Role' : undefined}
          >
            <User className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="ml-3 truncate">
                Switch to {pathname.includes('/lender') ? 'Borrower' : 'Lender'}
              </span>
            )}
          </button>
        )}
        
        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <span className="ml-3 truncate">
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}