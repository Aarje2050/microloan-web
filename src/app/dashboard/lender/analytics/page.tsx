// app/dashboard/lender/analytics/page.tsx - COMPREHENSIVE LENDER ANALYTICS
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  CreditCard, 
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  RefreshCw,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Percent
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

// Analytics Interfaces
interface OverallAnalytics {
  totalLoanDisbursed: number
  totalBorrowers: number
  totalActiveLoans: number
  totalCompletedLoans: number
  totalOverdueLoans: number
  averageLoanAmount: number
  totalInterestEarned: number
  totalPrincipalRecovered: number
  portfolioHealth: number // percentage
}

interface MonthlyAnalytics {
  month: string
  monthKey: string
  totalEMIAmount: number
  totalInterestAmount: number
  totalPrincipalAmount: number
  emisDue: number
  emisPaid: number
  collectionRate: number // percentage
}

interface BorrowerAnalytics {
  borrower_id: string
  borrower_name: string
  borrower_email: string
  total_loans: number
  total_amount_borrowed: number
  total_emis_due: number
  total_emis_paid: number
  total_interest_due: number
  total_interest_paid: number
  total_principal_due: number
  total_principal_paid: number
  first_loan_date: string
  last_payment_date: string | null
  payment_consistency: number // percentage
  risk_level: 'low' | 'medium' | 'high'
}

interface AnalyticsState {
  overall: OverallAnalytics
  monthly: MonthlyAnalytics[]
  borrowers: BorrowerAnalytics[]
  loading: boolean
  error: string | null
  refreshing: boolean
}

interface AnalyticsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
}

function AnalyticsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  loading, 
  color = 'blue' 
}: AnalyticsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600'
  }

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
              <div className={cn('w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center', colorClasses[color])}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
                {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
              </div>
            </div>
            {loading ? (
              <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-16 sm:w-24"></div>
            ) : (
              <div className="space-y-1">
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate" title={value.toString()}>
                  {value}
                </p>
                {trend && (
                  <div className={cn(
                    'flex items-center text-xs font-medium',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}>
                    {trend.isPositive ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(trend.value)}%
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface MonthlyAnalyticsTableProps {
  monthlyData: MonthlyAnalytics[]
  loading: boolean
}

function MonthlyAnalyticsTable({ monthlyData, loading }: MonthlyAnalyticsTableProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const displayData = isExpanded ? monthlyData : monthlyData.slice(0, 6)

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {displayData.map((month) => (
          <Card key={month.monthKey} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{month.month}</h3>
                  <p className="text-xs text-gray-500">{month.emisDue + month.emisPaid} EMIs</p>
                </div>
                <Badge className={cn(
                  month.collectionRate >= 80 ? 'bg-green-100 text-green-800' :
                  month.collectionRate >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                )}>
                  {month.collectionRate >= 80 ? 'Excellent' :
                   month.collectionRate >= 60 ? 'Good' : 'Needs Attention'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <p className="text-gray-500 font-medium text-xs">Total EMI</p>
                  <p className="font-bold text-gray-900">{formatCurrency(month.totalEMIAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium text-xs">Interest</p>
                  <p className="font-bold text-green-600">{formatCurrency(month.totalInterestAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium text-xs">Principal</p>
                  <p className="font-bold text-gray-900">{formatCurrency(month.totalPrincipalAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium text-xs">Collection</p>
                  <p className="font-bold text-gray-900">{month.collectionRate.toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="w-full h-3 bg-gray-200 rounded-full">
                <div 
                  className={cn(
                    'h-3 rounded-full transition-all',
                    month.collectionRate >= 80 ? 'bg-green-500' :
                    month.collectionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min(month.collectionRate, 100)}%` }}
                ></div>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                {month.emisPaid}/{month.emisDue + month.emisPaid} EMIs paid
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">Month</th>
              <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">Total EMI</th>
              <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">Interest</th>
              <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">Principal</th>
              <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">Collection Rate</th>
              <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.map((month) => (
              <tr key={month.monthKey} className="hover:bg-gray-50">
                <td className="py-4">
                  <div>
                    <p className="font-semibold text-gray-900">{month.month}</p>
                    <p className="text-xs text-gray-500">{month.emisDue + month.emisPaid} EMIs</p>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(month.totalEMIAmount)}</p>
                  <p className="text-xs text-gray-500">{month.emisPaid}/{month.emisDue + month.emisPaid}</p>
                </td>
                <td className="py-4 text-right">
                  <p className="font-bold text-green-600">{formatCurrency(month.totalInterestAmount)}</p>
                  <p className="text-xs text-gray-500">Pure Interest</p>
                </td>
                <td className="py-4 text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(month.totalPrincipalAmount)}</p>
                  <p className="text-xs text-gray-500">Principal Recovery</p>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div 
                        className={cn(
                          'h-2 rounded-full transition-all',
                          month.collectionRate >= 80 ? 'bg-green-500' :
                          month.collectionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        )}
                        style={{ width: `${Math.min(month.collectionRate, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {month.collectionRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="py-4 text-center">
                  <Badge className={cn(
                    month.collectionRate >= 80 ? 'bg-green-100 text-green-800' :
                    month.collectionRate >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  )}>
                    {month.collectionRate >= 80 ? 'Excellent' :
                     month.collectionRate >= 60 ? 'Good' : 'Needs Attention'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {monthlyData.length > 6 && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show All {monthlyData.length} Months
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

interface BorrowerAnalyticsTableProps {
  borrowersData: BorrowerAnalytics[]
  loading: boolean
  onViewDetails: (borrower: BorrowerAnalytics) => void
}

function BorrowerAnalyticsTable({ borrowersData, loading, onViewDetails }: BorrowerAnalyticsTableProps) {
  const [sortField, setSortField] = React.useState<keyof BorrowerAnalytics>('total_amount_borrowed')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')
  const [isExpanded, setIsExpanded] = React.useState(false)

  const sortedData = React.useMemo(() => {
    return [...borrowersData].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'desc' ? bValue - aValue : aValue - bValue
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'desc' 
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue)
      }
      
      return 0
    })
  }, [borrowersData, sortField, sortDirection])

  const displayData = isExpanded ? sortedData : sortedData.slice(0, 10)

  const handleSort = (field: keyof BorrowerAnalytics) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {displayData.map((borrower) => (
          <Card key={borrower.borrower_id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{borrower.borrower_name}</h3>
                  <p className="text-xs text-gray-500 break-all">{borrower.borrower_email}</p>
                  <p className="text-xs text-gray-500">{borrower.total_loans} loan{borrower.total_loans !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getRiskColor(borrower.risk_level)}>
                    {borrower.risk_level.toUpperCase()}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails(borrower)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500 font-medium">Total Borrowed</p>
                  <p className="font-bold text-gray-900">{formatCurrency(borrower.total_amount_borrowed)}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Interest Paid</p>
                  <p className="font-bold text-green-600">{formatCurrency(borrower.total_interest_paid)}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">EMI Status</p>
                  <p className="font-medium text-gray-900">
                    {borrower.total_emis_paid}/{borrower.total_emis_due + borrower.total_emis_paid}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Payment Rate</p>
                  <p className="font-medium text-gray-900">{borrower.payment_consistency.toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="mt-3 w-full h-2 bg-gray-200 rounded-full">
                <div 
                  className={cn(
                    'h-2 rounded-full',
                    borrower.payment_consistency >= 80 ? 'bg-green-500' :
                    borrower.payment_consistency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min(borrower.payment_consistency, 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">
                <button
                  onClick={() => handleSort('borrower_name')}
                  className="flex items-center space-x-1 hover:text-gray-800"
                >
                  <span>Borrower</span>
                  {sortField === 'borrower_name' && (
                    sortDirection === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                  )}
                </button>
              </th>
              <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">
                <button
                  onClick={() => handleSort('total_amount_borrowed')}
                  className="flex items-center justify-end space-x-1 hover:text-gray-800 w-full"
                >
                  <span>Total Borrowed</span>
                  {sortField === 'total_amount_borrowed' && (
                    sortDirection === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                  )}
                </button>
              </th>
              <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">
                <button
                  onClick={() => handleSort('total_interest_paid')}
                  className="flex items-center justify-end space-x-1 hover:text-gray-800 w-full"
                >
                  <span>Interest Paid</span>
                  {sortField === 'total_interest_paid' && (
                    sortDirection === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                  )}
                </button>
              </th>
              <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">EMI Status</th>
              <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">Risk</th>
              <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.map((borrower) => (
              <tr key={borrower.borrower_id} className="hover:bg-gray-50">
                <td className="py-4">
                  <div>
                    <p className="font-semibold text-gray-900">{borrower.borrower_name}</p>
                    <p className="text-xs text-gray-500">{borrower.borrower_email}</p>
                    <p className="text-xs text-gray-500">{borrower.total_loans} loan{borrower.total_loans !== 1 ? 's' : ''}</p>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(borrower.total_amount_borrowed)}</p>
                  <p className="text-xs text-gray-500">Since {formatDate(borrower.first_loan_date)}</p>
                </td>
                <td className="py-4 text-right">
                  <p className="font-bold text-green-600">{formatCurrency(borrower.total_interest_paid)}</p>
                  <p className="text-xs text-gray-500">
                    Due: {formatCurrency(borrower.total_interest_due - borrower.total_interest_paid)}
                  </p>
                </td>
                <td className="py-4 text-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {borrower.total_emis_paid}/{borrower.total_emis_due + borrower.total_emis_paid}
                    </p>
                    <div className="w-16 h-2 bg-gray-200 rounded-full mx-auto">
                      <div 
                        className={cn(
                          'h-2 rounded-full',
                          borrower.payment_consistency >= 80 ? 'bg-green-500' :
                          borrower.payment_consistency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        )}
                        style={{ 
                          width: `${Math.min(borrower.payment_consistency, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">{borrower.payment_consistency.toFixed(1)}%</p>
                  </div>
                </td>
                <td className="py-4 text-center">
                  <Badge className={getRiskColor(borrower.risk_level)}>
                    {borrower.risk_level.toUpperCase()}
                  </Badge>
                </td>
                <td className="py-4 text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails(borrower)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {borrowersData.length > 10 && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Show Top 10
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show All {borrowersData.length} Borrowers
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

export default function LenderAnalytics() {
  const router = useRouter()
  const { user, isLender, initialized, isAuthenticated } = useAuth()
  
  const [analytics, setAnalytics] = React.useState<AnalyticsState>({
    overall: {
      totalLoanDisbursed: 0,
      totalBorrowers: 0,
      totalActiveLoans: 0,
      totalCompletedLoans: 0,
      totalOverdueLoans: 0,
      averageLoanAmount: 0,
      totalInterestEarned: 0,
      totalPrincipalRecovered: 0,
      portfolioHealth: 0
    },
    monthly: [],
    borrowers: [],
    loading: true,
    error: null,
    refreshing: false
  })

  console.log('📊 LENDER ANALYTICS - State:', { 
    user: user?.email, 
    isLender, 
    analyticsLoaded: !analytics.loading
  })

  // Auth handling
  React.useEffect(() => {
    if (!initialized) return

    if (!isAuthenticated) {
      console.log('🚫 LENDER ANALYTICS - Not authenticated, redirecting to login')
      router.replace('/login')
      return
    }

    if (!isLender) {
      console.log('🚫 LENDER ANALYTICS - Not lender, redirecting to dashboard')
      router.replace('/dashboard')
      return
    }

    console.log('✅ LENDER ANALYTICS - Access granted')
  }, [initialized, isAuthenticated, isLender, router])

  // Load analytics data
  React.useEffect(() => {
    if (!user || !isLender) return
    loadAnalyticsData()
  }, [user, isLender])

  const loadAnalyticsData = async () => {
    if (!user) return

    try {
      console.log('📊 LENDER ANALYTICS - Loading analytics data for lender:', user.id)
      setAnalytics(prev => ({ ...prev, loading: true, error: null }))

      await Promise.all([
        loadOverallAnalytics(),
        loadMonthlyAnalytics(),
        loadBorrowerAnalytics()
      ])

    } catch (error: unknown) {
      console.error('❌ LENDER ANALYTICS - Failed to load analytics:', error)
      setAnalytics(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load analytics data' 
      }))
    } finally {
      setAnalytics(prev => ({ ...prev, loading: false, refreshing: false }))
    }
  }

  const loadOverallAnalytics = async () => {
    if (!user) return

    // Load loans data
    const { data: loansData, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('created_by', user.id)

    if (loansError) throw loansError

    if (!loansData || loansData.length === 0) {
      setAnalytics(prev => ({
        ...prev,
        overall: {
          totalLoanDisbursed: 0,
          totalBorrowers: 0,
          totalActiveLoans: 0,
          totalCompletedLoans: 0,
          totalOverdueLoans: 0,
          averageLoanAmount: 0,
          totalInterestEarned: 0,
          totalPrincipalRecovered: 0,
          portfolioHealth: 100
        }
      }))
      return
    }

    // Load EMIs data
    const loanIds = loansData.map(l => l.id)
    const { data: emisData, error: emisError } = await supabase
      .from('emis')
      .select('*')
      .in('loan_id', loanIds)

    if (emisError) {
      console.warn('⚠️ EMIs query warning:', emisError)
    }

    // Load borrowers count
    const { data: borrowersData, error: borrowersError } = await supabase
      .from('borrowers')
      .select('id')
      .eq('lender_id', user.id)

    if (borrowersError) {
      console.warn('⚠️ Borrowers query warning:', borrowersError)
    }

    // Calculate overall analytics
    const totalLoanDisbursed = loansData.reduce((sum, loan) => sum + loan.principal_amount, 0)
    const totalBorrowers = borrowersData?.length || 0
    
    let activeLoans = 0
    let completedLoans = 0
    let overdueLoans = 0
    let totalInterestEarned = 0
    let totalPrincipalRecovered = 0

    const today = new Date()

    loansData.forEach(loan => {
      const loanEMIs = (emisData || []).filter(e => e.loan_id === loan.id)
      
      // Simplified loan status calculation
      if (loan.status === 'completed') {
        completedLoans++
      } else if (loan.status === 'active' || loan.status === 'disbursed') {
        // Check if has overdue EMIs
        const hasOverdueEMIs = loanEMIs.some(e => {
          const dueDate = new Date(e.due_date)
          const paidAmount = e.paid_amount || 0
          return dueDate < today && paidAmount < e.amount
        })
        
        if (hasOverdueEMIs) {
          overdueLoans++
        } else {
          activeLoans++
        }
      } else {
        // Any other status (pending, rejected, etc.)
        // Don't count in active loans
      }

      // Calculate earnings from paid EMIs only
      loanEMIs.forEach(emi => {
        const paidAmount = emi.paid_amount || 0
        if (paidAmount > 0) {
          const interestAmount = emi.interest_amount || 0
          const interestPaid = Math.min(paidAmount, interestAmount)
          const principalPaid = Math.max(0, paidAmount - interestAmount)
          
          totalInterestEarned += interestPaid
          totalPrincipalRecovered += principalPaid
        }
      })
    })

    const averageLoanAmount = loansData.length > 0 ? totalLoanDisbursed / loansData.length : 0
    const portfolioHealth = loansData.length > 0 
      ? ((activeLoans + completedLoans) / loansData.length) * 100 
      : 100

    setAnalytics(prev => ({
      ...prev,
      overall: {
        totalLoanDisbursed,
        totalBorrowers,
        totalActiveLoans: activeLoans,
        totalCompletedLoans: completedLoans,
        totalOverdueLoans: overdueLoans,
        averageLoanAmount,
        totalInterestEarned,
        totalPrincipalRecovered,
        portfolioHealth
      }
    }))
  }

  const loadMonthlyAnalytics = async () => {
    if (!user) return

    // Get loans
    const { data: loansData, error: loansError } = await supabase
      .from('loans')
      .select('id')
      .eq('created_by', user.id)

    if (loansError) throw loansError

    if (!loansData || loansData.length === 0) {
      setAnalytics(prev => ({ ...prev, monthly: [] }))
      return
    }

    const loanIds = loansData.map(l => l.id)

    // Get EMIs
    const { data: emisData, error: emisError } = await supabase
      .from('emis')
      .select('*')
      .in('loan_id', loanIds)
      .order('due_date', { ascending: false })

    if (emisError) throw emisError

    if (!emisData || emisData.length === 0) {
      setAnalytics(prev => ({ ...prev, monthly: [] }))
      return
    }

    // Group EMIs by month
    const monthlyMap = new Map<string, {
      month: string
      monthKey: string
      emis: any[]
    }>()

    emisData.forEach(emi => {
      const dueDate = new Date(emi.due_date)
      const monthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = dueDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      })

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthLabel,
          monthKey,
          emis: []
        })
      }

      monthlyMap.get(monthKey)!.emis.push(emi)
    })

    // Calculate monthly analytics
    const monthlyAnalytics: MonthlyAnalytics[] = Array.from(monthlyMap.values()).map(monthData => {
      const emis = monthData.emis
      let totalEMIAmount = 0
      let totalInterestAmount = 0
      let totalPrincipalAmount = 0
      let emisDue = 0
      let emisPaid = 0

      emis.forEach(emi => {
        const paidAmount = emi.paid_amount || 0
        const isPaid = paidAmount >= emi.amount

        totalEMIAmount += emi.amount
        totalInterestAmount += emi.interest_amount || 0
        totalPrincipalAmount += emi.principal_amount || 0

        if (isPaid) {
          emisPaid++
        } else {
          emisDue++
        }
      })

      const collectionRate = emis.length > 0 ? (emisPaid / emis.length) * 100 : 0

      return {
        month: monthData.month,
        monthKey: monthData.monthKey,
        totalEMIAmount,
        totalInterestAmount,
        totalPrincipalAmount,
        emisDue,
        emisPaid,
        collectionRate
      }
    })

    // Sort by month - Current month first, then future months chronologically
    const today = new Date()
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    
    monthlyAnalytics.sort((a, b) => {
      // Current month always comes first
      if (a.monthKey === currentMonthKey) return -1
      if (b.monthKey === currentMonthKey) return 1
      
      // After current month, sort chronologically (ascending)
      return a.monthKey.localeCompare(b.monthKey)
    })

    setAnalytics(prev => ({ ...prev, monthly: monthlyAnalytics }))
  }

  const loadBorrowerAnalytics = async () => {
    if (!user) return

    // Get borrowers
    const { data: borrowersData, error: borrowersError } = await supabase
      .from('borrowers')
      .select('id, user_id')
      .eq('lender_id', user.id)

    if (borrowersError) throw borrowersError

    if (!borrowersData || borrowersData.length === 0) {
      setAnalytics(prev => ({ ...prev, borrowers: [] }))
      return
    }

    // Get borrower details
    const borrowerUserIds = borrowersData.map(b => b.user_id)
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', borrowerUserIds)

    if (usersError) throw usersError

    // Get loans for each borrower
    const { data: loansData, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('created_by', user.id)
      .in('borrower_id', borrowerUserIds)

    if (loansError) throw loansError

    // Get all EMIs
    const loanIds = (loansData || []).map(l => l.id)
    const { data: emisData, error: emisError } = await supabase
      .from('emis')
      .select('*')
      .in('loan_id', loanIds)

    if (emisError) {
      console.warn('⚠️ EMIs query warning:', emisError)
    }

    // Calculate borrower analytics
    const borrowerAnalytics: BorrowerAnalytics[] = borrowersData.map(borrower => {
      const user = usersData?.find(u => u.id === borrower.user_id)
      const borrowerLoans = (loansData || []).filter(l => l.borrower_id === borrower.user_id)
      const borrowerEMIs = (emisData || []).filter(e => 
        borrowerLoans.some(l => l.id === e.loan_id)
      )

      // Calculate totals
      const totalAmountBorrowed = borrowerLoans.reduce((sum, loan) => sum + loan.principal_amount, 0)
      const totalEMIsDue = borrowerEMIs.filter(e => (e.paid_amount || 0) < e.amount).length
      const totalEMIsPaid = borrowerEMIs.filter(e => (e.paid_amount || 0) >= e.amount).length

      let totalInterestDue = 0
      let totalInterestPaid = 0
      let totalPrincipalDue = 0
      let totalPrincipalPaid = 0

      borrowerEMIs.forEach(emi => {
        const paidAmount = emi.paid_amount || 0
        const interestAmount = emi.interest_amount || 0
        const principalAmount = emi.principal_amount || 0

        totalInterestDue += interestAmount
        totalPrincipalDue += principalAmount

        if (paidAmount > 0) {
          const interestPaid = Math.min(paidAmount, interestAmount)
          const principalPaid = Math.max(0, paidAmount - interestAmount)
          
          totalInterestPaid += interestPaid
          totalPrincipalPaid += principalPaid
        }
      })

      const totalOutstanding = totalPrincipalDue - totalPrincipalPaid
      const paymentConsistency = borrowerEMIs.length > 0 
        ? (totalEMIsPaid / borrowerEMIs.length) * 100 
        : 100

      // Calculate risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low'
      if (paymentConsistency < 60 || totalEMIsDue > 3) {
        riskLevel = 'high'
      } else if (paymentConsistency < 80 || totalEMIsDue > 1) {
        riskLevel = 'medium'
      }

      const firstLoanDate = borrowerLoans.length > 0 
        ? borrowerLoans.reduce((earliest, loan) => 
            loan.created_at < earliest ? loan.created_at : earliest, 
            borrowerLoans[0].created_at
          )
        : new Date().toISOString()

      const lastPaymentDate = borrowerEMIs
        .filter(e => e.paid_date)
        .reduce((latest: string | null, emi) => {
          if (!latest || (emi.paid_date && emi.paid_date > latest)) {
            return emi.paid_date
          }
          return latest
        }, null)

      return {
        borrower_id: borrower.user_id,
        borrower_name: user?.full_name || 'Unknown',
        borrower_email: user?.email || '',
        total_loans: borrowerLoans.length,
        total_amount_borrowed: totalAmountBorrowed,
        total_emis_due: totalEMIsDue,
        total_emis_paid: totalEMIsPaid,
        total_interest_due: totalInterestDue,
        total_interest_paid: totalInterestPaid,
        total_principal_due: totalPrincipalDue,
        total_principal_paid: totalPrincipalPaid,
        first_loan_date: firstLoanDate,
        last_payment_date: lastPaymentDate,
        payment_consistency: paymentConsistency,
        risk_level: riskLevel
      }
    })

    // Sort by total amount borrowed (highest first)
    borrowerAnalytics.sort((a, b) => b.total_amount_borrowed - a.total_amount_borrowed)

    setAnalytics(prev => ({ ...prev, borrowers: borrowerAnalytics }))
  }

  const handleRefresh = async () => {
    setAnalytics(prev => ({ ...prev, refreshing: true }))
    try {
      await loadAnalyticsData()
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } finally {
      setTimeout(() => {
        setAnalytics(prev => ({ ...prev, refreshing: false }))
      }, 500)
    }
  }

  const handleViewBorrowerDetails = (borrower: BorrowerAnalytics) => {
    console.log('📊 View borrower details:', borrower.borrower_name)
    // Navigate to borrower details or show modal
    router.push(`/dashboard/lender/borrowers?borrower=${borrower.borrower_id}`)
  }

  const handleExportData = () => {
    console.log('📊 Export analytics data')
    // Implement export functionality
  }

  // Loading state
  if (!initialized) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Not authenticated state
  if (!isAuthenticated || !isLender) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Lender Access Required</h2>
            <p className="text-sm text-gray-600">Redirecting...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Lender Analytics</h1>
              <p className="text-sm text-gray-600 mt-1 sm:mt-2">
                Comprehensive insights into your lending portfolio and performance
              </p>
            </div>
            <div className="flex flex-row space-x-2 sm:space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={analytics.loading || analytics.refreshing}
                size="sm"
                className="font-medium flex-1 sm:flex-none"
              >
                <RefreshCw className={cn(
                  "h-4 w-4 mr-2", 
                  (analytics.loading || analytics.refreshing) && "animate-spin"
                )} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleExportData}
                size="sm"
                className="font-medium flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {analytics.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-red-900">Error Loading Analytics</h4>
                <p className="text-sm text-red-800 mt-1 break-words">{analytics.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Overall Analytics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <AnalyticsCard
            title="Total Loan Disbursed"
            value={formatCurrency(analytics.overall.totalLoanDisbursed)}
            subtitle="Principal amount lent"
            icon={DollarSign}
            loading={analytics.loading}
            color="blue"
          />
          <AnalyticsCard
            title="Total Borrowers"
            value={analytics.overall.totalBorrowers}
            subtitle="Active relationships"
            icon={Users}
            loading={analytics.loading}
            color="green"
          />
          <AnalyticsCard
            title="Active Loans"
            value={analytics.overall.totalActiveLoans}
            subtitle={`${analytics.overall.totalCompletedLoans} completed`}
            icon={CreditCard}
            loading={analytics.loading}
            color="purple"
          />
          <AnalyticsCard
            title="Portfolio Health"
            value={`${analytics.overall.portfolioHealth.toFixed(1)}%`}
            subtitle={`${analytics.overall.totalOverdueLoans} overdue`}
            icon={Target}
            loading={analytics.loading}
            color={analytics.overall.portfolioHealth >= 80 ? 'green' : 
                   analytics.overall.portfolioHealth >= 60 ? 'yellow' : 'red'}
          />
          <AnalyticsCard
            title="Interest Earned"
            value={formatCurrency(analytics.overall.totalInterestEarned)}
            subtitle="Pure interest collected"
            icon={TrendingUp}
            loading={analytics.loading}
            color="green"
          />
          <AnalyticsCard
            title="Principal Recovered"
            value={formatCurrency(analytics.overall.totalPrincipalRecovered)}
            subtitle="Capital returned"
            icon={Percent}
            loading={analytics.loading}
            color="blue"
          />
          <AnalyticsCard
            title="Average Loan Size"
            value={formatCurrency(analytics.overall.averageLoanAmount)}
            subtitle="Per loan disbursed"
            icon={BarChart3}
            loading={analytics.loading}
            color="purple"
          />
          <AnalyticsCard
            title="Active Collection"
            value={`${analytics.overall.totalActiveLoans}/${analytics.overall.totalActiveLoans + analytics.overall.totalOverdueLoans}`}
            subtitle="Performing loans"
            icon={CheckCircle}
            loading={analytics.loading}
            color="green"
          />
        </div>

        {/* Monthly Analytics */}
        <Card className="bg-white border border-gray-200 mb-6 sm:mb-8 shadow-sm">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <span>Monthly Performance</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              EMI collections and interest earnings by month
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <MonthlyAnalyticsTable 
              monthlyData={analytics.monthly} 
              loading={analytics.loading} 
            />
          </CardContent>
        </Card>

        {/* Borrower Analytics */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <span>Borrower Performance</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Individual borrower analytics and payment history
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <BorrowerAnalyticsTable 
              borrowersData={analytics.borrowers}
              loading={analytics.loading}
              onViewDetails={handleViewBorrowerDetails}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}