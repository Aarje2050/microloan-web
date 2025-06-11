// components/features/borrower/upcoming-emis.tsx - ENHANCED UPCOMING EMIs
'use client'

import React from 'react'
import { supabase } from '@/lib/supabase'
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  IndianRupee,
  Bell,
  Eye,
  CreditCard,
  TrendingUp,
  ArrowRight,
  Phone,
  Mail,
  RefreshCw,
  AlertCircle,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EMIDetail {
  id: string
  emi_number: number
  due_date: string
  amount: number
  paid_amount: number | null
  status: 'pending' | 'partial' | 'paid' | 'overdue'
  late_fee: number | null
  loan_id: string
  loan_number: string
  lender_name: string
  lender_email: string
  days_until_due: number
  is_overdue: boolean
  principal_amount: number
  interest_amount: number
  outstanding_balance: number
}

interface EMISummary {
  nextEMIAmount: number
  nextEMIDate: string | null
  nextEMIDays: number
  totalUpcoming: number
  totalOverdue: number
  overdueCount: number
  upcomingCount: number
  totalUpcomingAmount: number
}

interface UpcomingEMIsProps {
  userId: string
  onEMIUpdate?: (summary: EMISummary) => void
  className?: string
  showHeader?: boolean
  maxItems?: number
  timeRange?: number // days
}

export default function UpcomingEMIs({ 
  userId, 
  onEMIUpdate, 
  className,
  showHeader = true,
  maxItems = 10,
  timeRange = 90
}: UpcomingEMIsProps) {
  const [emis, setEMIs] = React.useState<EMIDetail[]>([])
  const [summary, setSummary] = React.useState<EMISummary>({
    nextEMIAmount: 0,
    nextEMIDate: null,
    nextEMIDays: 0,
    totalUpcoming: 0,
    totalOverdue: 0,
    overdueCount: 0,
    upcomingCount: 0,
    totalUpcomingAmount: 0
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [selectedEMI, setSelectedEMI] = React.useState<EMIDetail | null>(null)
  const [showOverdueOnly, setShowOverdueOnly] = React.useState(false)

  console.log('📅 UPCOMING EMIs - State:', {
    userId,
    emisCount: emis.length,
    overdueCount: summary.overdueCount,
    upcomingCount: summary.upcomingCount
  })

  // Load upcoming EMIs
  const loadUpcomingEMIs = React.useCallback(async () => {
    if (!userId) return
    
    try {
      console.log('📅 Loading upcoming EMIs for user:', userId)
      
      const today = new Date()
      const futureDate = new Date()
      futureDate.setDate(today.getDate() + timeRange)
      
      // First, get user's loans
      const { data: userLoans, error: loansError } = await supabase
        .from('loans')
        .select('id, loan_number, created_by')
        .eq('borrower_id', userId)
      
      if (loansError) {
        console.error('❌ Error loading user loans:', loansError)
        throw loansError
      }
      
      if (!userLoans || userLoans.length === 0) {
        console.log('📋 No loans found for user')
        setEMIs([])
        const emptySummary = {
          nextEMIAmount: 0,
          nextEMIDate: null,
          nextEMIDays: 0,
          totalUpcoming: 0,
          totalOverdue: 0,
          overdueCount: 0,
          upcomingCount: 0,
          totalUpcomingAmount: 0
        }
        setSummary(emptySummary)
        onEMIUpdate?.(emptySummary)
        return
      }
      
      const loanIds = userLoans.map(loan => loan.id)
      console.log('📋 Found loans:', loanIds.length)
      
      // Load EMIs for user's loans
      const overdueDate = new Date()
      overdueDate.setDate(today.getDate() - 365) // Look back 1 year for overdue
      
      const { data: emisData, error: emisError } = await supabase
        .from('emis')
        .select('*')
        .in('loan_id', loanIds)
        .gte('due_date', overdueDate.toISOString().split('T')[0])
        .lte('due_date', futureDate.toISOString().split('T')[0])
        .in('status', ['pending', 'partial'])
        .order('due_date', { ascending: true })
        .limit(maxItems * 2)
      
      if (emisError) {
        console.error('❌ Error loading EMIs:', emisError)
        throw emisError
      }
      
      console.log('📅 EMIs query result:', emisData?.length || 0, 'EMIs found')
      
      if (!emisData || emisData.length === 0) {
        setEMIs([])
        const emptySummary = {
          nextEMIAmount: 0,
          nextEMIDate: null,
          nextEMIDays: 0,
          totalUpcoming: 0,
          totalOverdue: 0,
          overdueCount: 0,
          upcomingCount: 0,
          totalUpcomingAmount: 0
        }
        setSummary(emptySummary)
        onEMIUpdate?.(emptySummary)
        return
      }
      
      // Get lender information
      const lenderIds = Array.from(new Set(
        userLoans.map(loan => loan.created_by).filter(Boolean)
      ))
      
      const { data: lendersData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', lenderIds)
      
      // Transform EMI data
      const transformedEMIs: EMIDetail[] = emisData.map(emi => {
        // Find the corresponding loan
        const loan = userLoans.find(l => l.id === emi.loan_id)
        const lender = lendersData?.find(l => l.id === loan?.created_by)
        
        const dueDate = new Date(emi.due_date)
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
        const isOverdue = daysUntilDue < 0
        
        // Calculate principal and interest breakdown if not available
        let principalAmount = 0
        let interestAmount = 0
        
        if (emi.principal_component && emi.interest_component) {
          principalAmount = emi.principal_component
          interestAmount = emi.interest_component
        } else {
          // Simple estimation - in real app, use proper amortization
          interestAmount = Math.round(emi.amount * 0.3) // Rough estimate
          principalAmount = emi.amount - interestAmount
        }
        
        return {
          id: emi.id,
          emi_number: emi.emi_number,
          due_date: emi.due_date,
          amount: emi.amount,
          paid_amount: emi.paid_amount,
          status: isOverdue ? 'overdue' : emi.status,
          late_fee: emi.late_fee,
          loan_id: loan?.id || '',
          loan_number: loan?.loan_number || 'Unknown',
          lender_name: lender?.full_name || 'Unknown Lender',
          lender_email: lender?.email || '',
          days_until_due: daysUntilDue,
          is_overdue: isOverdue,
          principal_amount: principalAmount,
          interest_amount: interestAmount,
          outstanding_balance: emi.amount - (emi.paid_amount || 0)
        }
      }).filter(emi => emi.outstanding_balance > 0)
      
      // Sort: overdue first, then by due date
      transformedEMIs.sort((a, b) => {
        if (a.is_overdue && !b.is_overdue) return -1
        if (!a.is_overdue && b.is_overdue) return 1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })
      
      // Limit results
      const limitedEMIs = transformedEMIs.slice(0, maxItems)
      setEMIs(limitedEMIs)
      
      // Calculate summary
      const overdueEMIs = transformedEMIs.filter(e => e.is_overdue)
      const upcomingEMIs = transformedEMIs.filter(e => !e.is_overdue)
      const nextEMI = upcomingEMIs[0] || overdueEMIs[0]
      
      const newSummary: EMISummary = {
        nextEMIAmount: nextEMI?.outstanding_balance || 0,
        nextEMIDate: nextEMI?.due_date || null,
        nextEMIDays: nextEMI?.days_until_due || 0,
        totalUpcoming: upcomingEMIs.reduce((sum, e) => sum + e.outstanding_balance, 0),
        totalOverdue: overdueEMIs.reduce((sum, e) => sum + e.outstanding_balance, 0),
        overdueCount: overdueEMIs.length,
        upcomingCount: upcomingEMIs.length,
        totalUpcomingAmount: transformedEMIs.reduce((sum, e) => sum + e.outstanding_balance, 0)
      }
      
      setSummary(newSummary)
      onEMIUpdate?.(newSummary)
      
      console.log('✅ EMIs loaded:', {
        total: transformedEMIs.length,
        overdue: overdueEMIs.length,
        upcoming: upcomingEMIs.length
      })
      
    } catch (error) {
      console.error('❌ Failed to load upcoming EMIs:', error)
      setEMIs([])
    } finally {
      setIsLoading(false)
    }
  }, [userId, timeRange, maxItems, onEMIUpdate])

  // Load data on mount and user change
  React.useEffect(() => {
    loadUpcomingEMIs()
  }, [loadUpcomingEMIs])

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadUpcomingEMIs()
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Get urgency styling
  const getUrgencyStyle = (emi: EMIDetail) => {
    if (emi.is_overdue) {
      return {
        container: 'bg-red-50 border-red-200 border-2',
        badge: 'bg-red-100 text-red-800 border-red-200',
        indicator: 'bg-red-500',
        text: 'text-red-700'
      }
    }
    if (emi.days_until_due <= 3) {
      return {
        container: 'bg-orange-50 border-orange-200 border-2',
        badge: 'bg-orange-100 text-orange-800 border-orange-200',
        indicator: 'bg-orange-500',
        text: 'text-orange-700'
      }
    }
    if (emi.days_until_due <= 7) {
      return {
        container: 'bg-yellow-50 border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        indicator: 'bg-yellow-500',
        text: 'text-yellow-700'
      }
    }
    return {
      container: 'bg-white border-gray-200',
      badge: 'bg-green-100 text-green-800 border-green-200',
      indicator: 'bg-green-500',
      text: 'text-green-700'
    }
  }

  // Get urgency text
  const getUrgencyText = (emi: EMIDetail) => {
    if (emi.is_overdue) {
      return `${Math.abs(emi.days_until_due)} days overdue`
    }
    if (emi.days_until_due === 0) {
      return 'Due today'
    }
    if (emi.days_until_due <= 3) {
      return `Due in ${emi.days_until_due} days`
    }
    if (emi.days_until_due <= 7) {
      return `Due in ${emi.days_until_due} days`
    }
    return `Due in ${emi.days_until_due} days`
  }

  // Filter EMIs based on selection
  const filteredEMIs = showOverdueOnly ? emis.filter(e => e.is_overdue) : emis

  if (isLoading) {
    return (
      <div className={cn("bg-white rounded-xl shadow-sm border border-gray-200", className)}>
        {showHeader && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming EMIs</h3>
          </div>
        )}
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading EMIs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("bg-white rounded-xl shadow-sm border border-gray-200", className)}>
      {/* Header */}
      {showHeader && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Upcoming EMIs</h3>
              <p className="text-sm text-gray-600">
                Next {timeRange} days • {summary.overdueCount} overdue • {summary.upcomingCount} upcoming
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Alert */}
      {(summary.overdueCount > 0 || summary.upcomingCount > 0) && (
        <div className="p-4 border-b border-gray-200">
          {summary.overdueCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">
                    {summary.overdueCount} Overdue EMI{summary.overdueCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-red-700">
                    Total overdue: {formatCurrency(summary.totalOverdue)}
                  </p>
                </div>
                <button className="text-red-600 hover:text-red-800">
                  <Phone className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Next EMI</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.nextEMIAmount)}</p>
              {summary.nextEMIDate && (
                <p className="text-xs text-gray-600">
                  {summary.nextEMIDays >= 0 ? `In ${summary.nextEMIDays} days` : `${Math.abs(summary.nextEMIDays)} days ago`}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Upcoming</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(summary.totalUpcoming)}</p>
              <p className="text-xs text-gray-600">{summary.upcomingCount} EMIs</p>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">This Period</p>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(summary.totalUpcomingAmount)}</p>
              <p className="text-xs text-gray-600">Total amount</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      {emis.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowOverdueOnly(false)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-colors",
                !showOverdueOnly
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              All EMIs ({emis.length})
            </button>
            {summary.overdueCount > 0 && (
              <button
                onClick={() => setShowOverdueOnly(true)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-colors",
                  showOverdueOnly
                    ? "bg-red-600 text-white"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                )}
              >
                Overdue ({summary.overdueCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* EMI List */}
      <div className="p-4">
        {filteredEMIs.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {showOverdueOnly ? 'No Overdue EMIs' : 'No Upcoming EMIs'}
            </h4>
            <p className="text-gray-600">
              {showOverdueOnly 
                ? 'Great! You have no overdue payments.'
                : `No EMIs due in the next ${timeRange} days.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEMIs.map((emi) => {
              const urgencyStyle = getUrgencyStyle(emi)
              
              return (
                <div key={emi.id} className={cn(
                  "p-4 rounded-lg border transition-all duration-200",
                  urgencyStyle.container
                )}>
                  {/* Mobile Layout */}
                  <div className="lg:hidden">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className={cn("w-3 h-3 rounded-full mr-3", urgencyStyle.indicator)}></div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {emi.loan_number} - EMI #{emi.emi_number}
                          </p>
                          <p className="text-sm text-gray-600">{emi.lender_name}</p>
                        </div>
                      </div>
                      <span className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full border',
                        urgencyStyle.badge
                      )}>
                        {emi.is_overdue ? 'OVERDUE' : 'PENDING'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(emi.outstanding_balance)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Due Date</p>
                        <p className="font-medium text-gray-900">{formatDate(emi.due_date)}</p>
                      </div>
                    </div>
                    
                    <div className={cn("text-sm font-medium mb-3", urgencyStyle.text)}>
                      {getUrgencyText(emi)}
                    </div>
                    
                    {/* Principal/Interest Breakdown */}
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
                      <div>
                        <span>Principal: {formatCurrency(emi.principal_amount)}</span>
                      </div>
                      <div>
                        <span>Interest: {formatCurrency(emi.interest_amount)}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setSelectedEMI(emi)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                      <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                        <Phone className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={cn("w-4 h-4 rounded-full", urgencyStyle.indicator)}></div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {emi.loan_number} - EMI #{emi.emi_number}
                        </p>
                        <p className="text-sm text-gray-600">{emi.lender_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(emi.outstanding_balance)}</p>
                        <p className="text-xs text-gray-600">
                          P: {formatCurrency(emi.principal_amount)} | I: {formatCurrency(emi.interest_amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatDate(emi.due_date)}</p>
                        <p className={cn("text-sm", urgencyStyle.text)}>
                          {getUrgencyText(emi)}
                        </p>
                      </div>
                      <span className={cn(
                        'px-3 py-1 text-xs font-medium rounded-full border',
                        urgencyStyle.badge
                      )}>
                        {emi.is_overdue ? 'OVERDUE' : 'PENDING'}
                      </span>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setSelectedEMI(emi)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                          <Phone className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* View More Button */}
      {emis.length >= maxItems && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            View All EMIs ({emis.length}+) →
          </button>
        </div>
      )}
    </div>
  )
}