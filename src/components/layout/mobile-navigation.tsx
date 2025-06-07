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
  Plus,
  Wallet,
  FileText,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/stores/auth-store'
import { UserRole } from '@/types'

// Navigation items for each role
const navigationConfig = {
  super_admin: [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Lenders', href: '/dashboard/lenders', icon: Users },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { label: 'All Loans', href: '/dashboard/loans', icon: CreditCard },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  lender: [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Borrowers', href: '/dashboard/borrowers', icon: Users },
    { label: 'Loans', href: '/dashboard/loans', icon: CreditCard },
    { label: 'Payments', href: '/dashboard/payments', icon: Wallet },
    { label: 'Profile', href: '/dashboard/profile', icon: User },
  ],
  borrower: [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'My Loans', href: '/dashboard/loans', icon: CreditCard },
    { label: 'EMI Schedule', href: '/dashboard/emis', icon: FileText },
    { label: 'Payments', href: '/dashboard/payments', icon: Wallet },
    { label: 'Profile', href: '/dashboard/profile', icon: User },
  ],
}

interface MobileNavigationProps {
  className?: string
}

export default function MobileNavigation({ className }: MobileNavigationProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  
  if (!user) return null
  
  const items = navigationConfig[user.role] || []

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border",
      "safe-area-pb pb-safe md:hidden", // Only show on mobile
      className
    )}>
      <div className="flex items-center justify-around px-2 py-1">
        {items.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
                          (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200",
                "min-h-[60px] flex-1 max-w-[80px]", // Proper touch targets
                "active:scale-95 touch-manipulation", // Native-like feedback
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 mb-1 transition-all duration-200",
                  isActive && "scale-110"
                )} 
              />
              <span className={cn(
                "text-[10px] font-medium leading-none text-center",
                "max-w-full truncate"
              )}>
                {item.label}
              </span>
              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
      
      {/* Safe area for notched phones */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </nav>
  )
}

// Floating Action Button for quick actions (mobile)
interface FloatingActionButtonProps {
  role: UserRole
}

export function FloatingActionButton({ role }: FloatingActionButtonProps) {
  const getActionConfig = () => {
    switch (role) {
      case 'super_admin':
        return {
          href: '/dashboard/lenders/approve',
          icon: Users,
          label: 'Approve Lenders'
        }
      case 'lender':
        return {
          href: '/dashboard/borrowers/create',
          icon: Plus,
          label: 'Add Borrower'
        }
      case 'borrower':
        return {
          href: '/dashboard/payments/make',
          icon: Wallet,
          label: 'Make Payment'
        }
      default:
        return null
    }
  }

  const config = getActionConfig()
  if (!config) return null

  const Icon = config.icon

  return (
    <Link
      href={config.href}
      className={cn(
        "fixed bottom-20 right-4 z-40", // Above bottom nav
        "h-14 w-14 bg-primary text-primary-foreground",
        "rounded-full shadow-lg hover:shadow-xl",
        "flex items-center justify-center",
        "active:scale-95 transition-all duration-200",
        "md:hidden" // Only show on mobile
      )}
      aria-label={config.label}
    >
      <Icon className="h-6 w-6" />
    </Link>
  )
}