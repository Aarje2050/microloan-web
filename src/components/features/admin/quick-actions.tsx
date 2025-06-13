// components/features/admin/quick-actions.tsx - Simplified Quick Actions
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus,
  Settings,
  AlertTriangle,
  CreditCard,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  variant?: 'default' | 'warning' | 'destructive'
  count?: number
}

interface QuickActionsProps {
  pendingApprovals?: number
  overdueEMIs?: number
  activeLoans?: number
  onRefresh?: () => void
  className?: string
}

export default function QuickActions({ 
  pendingApprovals = 0, 
  overdueEMIs = 0,
  activeLoans = 0,
  onRefresh,
  className
}: QuickActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = React.useState<string | null>(null)

  const handleAction = async (actionId: string, href: string) => {
    setLoading(actionId)
    try {
      router.push(href)
    } catch (error) {
      console.error('Navigation failed:', error)
    } finally {
      // Reset loading after a short delay to show feedback
      setTimeout(() => setLoading(null), 500)
    }
  }

  const quickActions: QuickAction[] = [
    {
      id: 'create-user',
      title: 'Create User',
      description: 'Add new account',
      icon: Plus,
      href: '/dashboard/admin/users/create',
      variant: 'default'
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure system',
      icon: Settings,
      href: '/dashboard/admin/profile',
      variant: 'default'
    },
    {
      id: 'overdue-emis',
      title: 'Overdue EMIs',
      description: `${overdueEMIs} pending`,
      icon: AlertTriangle,
      href: '/dashboard/admin/emis?filter=overdue',
      variant: overdueEMIs > 0 ? 'destructive' : 'default',
      count: overdueEMIs
    },
    {
      id: 'active-loans',
      title: 'Active Loans',
      description: `${activeLoans} loans`,
      icon: CreditCard,
      href: '/dashboard/admin/loans',
      variant: 'default',
      count: activeLoans
    }
  ]

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading !== null}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            const isLoading = loading === action.id

            return (
              <Button
                key={action.id}
                variant="outline"
                className={cn(
                  "h-auto p-4 flex flex-col items-center space-y-2 hover-lift transition-all duration-200",
                  "hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  action.variant === 'warning' && "border-warning/30 bg-warning/5 hover:border-warning hover:bg-warning/10",
                  action.variant === 'destructive' && action.count && action.count > 0 && 
                  "border-red-200 bg-red-50 dark:bg-red-900/10 hover:border-red-300 hover:bg-red-100 dark:hover:bg-red-900/20"
                )}
                onClick={() => handleAction(action.id, action.href)}
                disabled={isLoading}
              >
                <div className={cn(
                  "p-3 rounded-lg transition-colors relative",
                  action.variant === 'destructive' && action.count && action.count > 0 
                    ? "bg-red-100 dark:bg-red-900/20" 
                    : action.id === 'create-user' 
                    ? "bg-blue-100 dark:bg-blue-900/20"
                    : action.id === 'settings'
                    ? "bg-gray-100 dark:bg-gray-900/20"
                    : action.id === 'active-loans'
                    ? "bg-green-100 dark:bg-green-900/20"
                    : "bg-primary/20"
                )}>
                  {isLoading ? (
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Icon className={cn(
                      "h-5 w-5",
                      action.variant === 'destructive' && action.count && action.count > 0 
                        ? "text-red-600 dark:text-red-400"
                        : action.id === 'create-user' 
                        ? "text-blue-600 dark:text-blue-400"
                        : action.id === 'settings'
                        ? "text-gray-600 dark:text-gray-400"
                        : action.id === 'active-loans'
                        ? "text-green-600 dark:text-green-400"
                        : "text-primary"
                    )} />
                  )}
                  
                  {/* Badge for counts */}
                  {action.count !== undefined && action.count > 0 && (
                    <Badge 
                      variant={action.variant === 'destructive' ? 'destructive' : 'default'}
                      className="absolute -top-2 -right-2 text-xs min-w-[20px] h-5 flex items-center justify-center p-1"
                    >
                      {action.count > 99 ? '99+' : action.count}
                    </Badge>
                  )}
                </div>
                
                <div className="text-center space-y-1">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            )
          })}
        </div>
        
        {/* Quick Stats */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm font-medium text-foreground">{pendingApprovals}</p>
              <p className="text-xs text-muted-foreground">Pending Approvals</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{overdueEMIs}</p>
              <p className="text-xs text-muted-foreground">Overdue EMIs</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{activeLoans}</p>
              <p className="text-xs text-muted-foreground">Active Loans</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}