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
  Search,
  BarChart3,
  IndianRupee,
  Trash2
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
      color: 'primary'
    },
    {
      icon: CreditCard,
      label: 'Loans Management',
      href: '/dashboard/lender/loans',
      badge: 0, // TODO: Get from actual data
      color: 'success',
    },

    {
      icon: Zap,
      label: 'EMIs',
      href: '/dashboard/lender/emis',
      color: 'warning'
    },
    {
      icon: Users,
      label: 'Borrowers',
      href: '/dashboard/lender/borrowers',
      color: 'primary',
    },
    
    {
      icon: TrendingUp,
      label: 'Analytics',
      href: '/dashboard/lender/analytics',
      color: 'primary'
    },

    {
      icon: Trash2,
      label: 'Trash',
      href: '/dashboard/lender/trash',
      color: 'primary'
    }
  ]

  // Borrower sidebar items
  const borrowerSidebarItems: SidebarItem[] = [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/dashboard/borrower',
      color: 'primary'
    },
    {
      icon: CreditCard,
      label: 'My Loans',
      href: '/dashboard/borrower/loans',
      badge: 0, // TODO: Get from actual data
      color: 'success'
    },
    {
      icon: TrendingUp,
      label: 'Payment History',
      href: '/dashboard/borrower/payments',
      color: 'primary'
    },
    {
      icon: Users,
      label: 'My Lenders',
      href: '/dashboard/borrower/lenders',
      color: 'primary'
    },
    {
      icon: Bell,
      label: 'Notifications',
      href: '/dashboard/borrower/notifications',
      badge: 0, // TODO: Get from actual data
      color: 'warning'
    }
  ]

  // Admin sidebar items
  const adminSidebarItems: SidebarItem[] = [
    {
      icon: BarChart3,
      label: 'Dashboard',
      href: '/dashboard/admin',
      color: 'primary'
    },
    {
      icon: Users,
      label: 'User Management',
      href: '/dashboard/admin/users',
      color: 'primary',
    },
    {
      icon: CreditCard,
      label: 'Loan Management',
      href: '/dashboard/admin/loans',
      color: 'success'
    },
    {
      icon: IndianRupee,
      label: 'EMI Management',
      href: '/dashboard/admin/emis',
      color: 'success'
    },
    {
      icon: TrendingUp,
      label: 'Analytics',
      href: '/dashboard/admin/analytics',
      color: 'warning'
    },
    {
      icon: Settings,
      label: 'System Settings',
      href: '/dashboard/admin/settings',
      color: 'muted'
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

  // Get color classes for sidebar items using enterprise design system
  const getColorClasses = (color: string, isActive: boolean) => {
    if (isActive) {
      return 'text-primary bg-primary/10 border-primary/20'
    }
    
    return 'text-muted-foreground hover:bg-accent hover:text-foreground border-transparent'
  }

  // Don't render if not on a dashboard page
  if (!pathname.includes('/dashboard')) {
    return null
  }

  return (
    <aside className={cn(
      "hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 z-30 shadow-sm",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-3 hover-lift">
              {currentUserType === 'lender' && <Briefcase className="h-4 w-4 text-primary-foreground" />}
              {currentUserType === 'borrower' && <User className="h-4 w-4 text-primary-foreground" />}
              {currentUserType === 'admin' && <Settings className="h-4 w-4 text-primary-foreground" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {currentUserType.charAt(0).toUpperCase() + currentUserType.slice(1)}
              </h2>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>
        )}
        
        <button
          onClick={handleCollapseToggle}
          className="p-2 rounded-lg hover:bg-accent transition-colors interactive-scale"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-1 pt-24"> {/* Add top padding for fixed header */}
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const colorClasses = getColorClasses(item.color || 'muted', active)
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
                  "w-full flex items-center px-3 py-3 text-left rounded-lg transition-all duration-200 border font-medium hover-lift interactive-scale",
                  colorClasses
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                
                {!collapsed && (
                  <>
                    <span className="ml-3 text-sm truncate flex-1">
                      {item.label}
                    </span>
                    
                    {/* Badge */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-2 bg-destructive text-destructive-foreground text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-2 font-medium shadow-sm">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    
                    {/* Expand Arrow */}
                    {hasSubItems && (
                      <ChevronRight className={cn(
                        "h-4 w-4 ml-2 transition-transform duration-200 text-muted-foreground",
                        isExpanded && "transform rotate-90"
                      )} />
                    )}
                  </>
                )}
              </button>
              
              {/* Sub Items */}
              {hasSubItems && !collapsed && isExpanded && (
                <div className="ml-8 mt-1 space-y-1 animate-enter">
                  {item.subItems?.map((subItem) => {
                    const SubIcon = subItem.icon
                    const subActive = isActive(subItem.href)
                    const subColorClasses = getColorClasses(subItem.color || 'muted', subActive)
                    
                    return (
                      <button
                        key={subItem.href}
                        onClick={() => handleNavigation(subItem.href)}
                        className={cn(
                          "w-full flex items-center px-3 py-2 text-left rounded-lg transition-all duration-200 text-sm border hover-lift interactive-scale",
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
      <div className="p-4 border-t border-border space-y-2">
        {/* User Info */}
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.full_name || user?.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        )}
        
        {/* Role Switch (if dual role) */}
        {isBoth && (
          <button
            onClick={handleRoleSwitch}
            className="w-full flex items-center px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors interactive-scale"
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
          className="w-full flex items-center px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50 interactive-scale"
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