'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings,
  Wallet,
  FileText,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui'
// import { Separator } from '@/components/ui'

// Same navigation config as mobile
const navigationConfig = {
  super_admin: [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Manage Lenders', href: '/dashboard/lenders', icon: Users },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { label: 'All Loans', href: '/dashboard/loans', icon: CreditCard },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  lender: [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'My Borrowers', href: '/dashboard/borrowers', icon: Users },
    { label: 'Loans', href: '/dashboard/loans', icon: CreditCard },
    { label: 'Payments', href: '/dashboard/payments', icon: Wallet },
    { label: 'Profile', href: '/dashboard/profile', icon: User },
  ],
  borrower: [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'My Loans', href: '/dashboard/loans', icon: CreditCard },
    { label: 'EMI Schedule', href: '/dashboard/emis', icon: FileText },
    { label: 'Payment History', href: '/dashboard/payments', icon: Wallet },
    { label: 'Profile', href: '/dashboard/profile', icon: User },
  ],
}

interface DesktopSidebarProps {
  className?: string
}

export default function DesktopSidebar({ className }: DesktopSidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  
  if (!user) return null
  
  const items = navigationConfig[user.role] || []

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <aside className={cn(
      "hidden md:flex flex-col bg-background border-r border-border",
      "transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">MicroLoan</h2>
              <p className="text-xs text-muted-foreground">Manager</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
            {user.role === 'super_admin' ? (
              <Shield className="h-5 w-5 text-primary" />
            ) : (
              <User className="h-5 w-5 text-primary" />
            )}
          </div>
          
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user.full_name}</p>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={user.role === 'super_admin' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {user.role.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
                          (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive && "text-current"
              )} />
              
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              
              {/* Active indicator for collapsed state */}
              {isActive && collapsed && (
                <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-3">Sign Out</span>}
        </Button>
        
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center">
            v1.0.0 • Enterprise Edition
          </div>
        )}
      </div>
    </aside>
  )
}