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
  X,
  IndianRupee,
  Settings2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import DesktopSidebar from './desktop-sidebar'

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
  const { user, signOut, isLender, isBorrower, isBoth, isAuthenticated, isAdmin } = useAuth()
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

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
      label: 'EMIs',
      href: '/dashboard/lender/emis',
      isActive: pathname.startsWith('/dashboard/lender/emis')
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

  // Admin navigation items
  const adminNavItems: NavItem[] = [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/dashboard/admin',
      isActive: pathname === '/dashboard/admin'
    },

    {
      icon: Users,
      label: 'Users',
      href: '/dashboard/admin/users',
      isActive: pathname === '/dashboard/admin/users'
    },

    {
      icon: CreditCard,
      label: 'Loans',
      href: '/dashboard/admin/loans',
      isActive: pathname === '/dashboard/admin/loans'
    },

    {
      icon: IndianRupee,
      label: 'EMIs',
      href: '/dashboard/admin/emis',
      isActive: pathname === '/dashboard/admin/emis'
    },

    {
      icon: Settings2,
      label: 'Settings',
      href: '/dashboard/admin/settings',
      isActive: pathname === '/dashboard/admin/setting'
    },
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
      return adminNavItems
    }
    
    // Default based on user role
    if (isAdmin) return adminNavItems
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
    if (pathname.includes('/admin')) return 'Admin'
    return isLender ? 'Lender' : 'Borrower'
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="flex space-x-1 justify-center mb-4">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
          <p className="text-caption">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden bg-card shadow-xs border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left Section */}
          <div className="flex items-center">
            {showBackButton ? (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors mr-2 interactive-scale"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </button>
            ) : (
              <div className="flex items-center">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                  {isLender && <Briefcase className="h-4 w-4 text-primary-foreground" />}
                  {isBorrower && <User className="h-4 w-4 text-primary-foreground" />}
                  {isAdmin && <Users className="h-4 w-4 text-primary-foreground" />}
                </div>
                <div>
                  <h1 className="text-title text-foreground">
                    {title || getCurrentRole()}
                  </h1>
                  <p className="text-caption -mt-1">
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
                className="p-2 rounded-lg hover:bg-accent transition-colors interactive-scale"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Menu className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-card border-b border-border shadow-lg z-50 animate-enter">
            <div className="px-4 py-3 space-y-1">
              {/* Role Switch Button (if dual role) */}
              {isBoth && (
                <button
                  onClick={handleRoleSwitch}
                  className="w-full flex items-center px-3 py-2 text-sm text-primary hover:bg-accent rounded-lg transition-colors interactive-scale"
                >
                  <User className="h-4 w-4 mr-3" />
                  Switch to {pathname.includes('/lender') ? 'Borrower' : 'Lender'} View
                </button>
              )}
              
              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50 interactive-scale"
              >
                <LogOut className="h-4 w-4 mr-3" />
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-card shadow-xs border-b border-border fixed top-0 left-0 right-0 z-20">
        <div className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "xl:ml-16" : "xl:ml-64"
        )}>
          <div className="layout-container">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center mr-4 hover-lift">
                  {isLender && <Briefcase className="h-6 w-6 text-primary-foreground" />}
                  {isBorrower && <User className="h-6 w-6 text-primary-foreground" />}
                  {isAdmin && <Users className="h-6 w-6 text-primary-foreground" />}
                </div>
                <div>
                  <h1 className="text-headline text-foreground">
                    {title || `${getCurrentRole()} Dashboard`}
                  </h1>
                  <p className="text-body text-muted-foreground">
                    Welcome, {user?.full_name || user?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {customHeader}
                
                {isBoth && (
                  <button
                    onClick={handleRoleSwitch}
                    className="inline-flex items-center bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium hover-lift interactive-scale"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Switch to {pathname.includes('/lender') ? 'Borrower' : 'Lender'}
                  </button>
                )}

                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="inline-flex items-center bg-destructive text-destructive-foreground px-6 py-3 rounded-lg hover:bg-destructive/90 disabled:opacity-50 transition-all duration-200 font-medium hover-lift interactive-scale"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Fixed Desktop Sidebar Overlap */}
      <div className="flex-1">
        <main className={cn(
          "pb-20 lg:pb-0 transition-all duration-300",
          "lg:pt-24", // Account for fixed header
          sidebarCollapsed ? "xl:ml-16" : "xl:ml-64"
        )}>
          <div className="layout-container py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-area-pb">
        <div className="grid grid-cols-5 md:grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center py-3 px-1 min-h-[64px] transition-all duration-200 relative interactive-scale",
                  item.isActive
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {/* Active indicator */}
                {item.isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
                )}
                
                <Icon className={cn(
                  "h-5 w-5 mb-1 transition-all duration-200", 
                  item.isActive && "text-primary scale-110"
                )} />
                <span className={cn(
                  "text-xs font-medium leading-tight",
                  item.isActive && "text-primary"
                )}>
                  {item.label}
                </span>
                
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <div className="absolute top-2 right-1/4 bg-destructive text-destructive-foreground text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 font-medium shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop Sidebar Component */}
      <div className="hidden xl:block">
        <DesktopSidebar 
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          className="fixed left-0 top-0 bottom-0 z-30"
        />
      </div>
    </div>
  )
}