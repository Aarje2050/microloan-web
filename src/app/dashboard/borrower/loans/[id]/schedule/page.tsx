// app/dashboard/borrower/loans/[id]/schedule/page.tsx - EMI SCHEDULE PAGE
'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/dashboard-layout'
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Filter,
  Search,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  IndianRupee,
  Calculator,
  RefreshCw,
  ArrowUpDown,
  Info,
  Target,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EMIRecord {
  id: string
  emi_number: number
  due_date: string
  amount: number
  principal_component: number
  interest_component: number
  paid_amount: number | null
  payment_date: string | null
  status: 'paid' | 'partial' | 'pending' | 'overdue'
  late_fee: number | null
  days_overdue: number
  remaining_amount: number
  cumulative_principal: number
  cumulative_interest: number
  outstanding_balance: number
}

interface LoanInfo {
  id: string
  loan_number: string
  principal_amount: number
  total_amount: number
  interest_rate: number
  tenure_months: number
  status: string
}

interface ScheduleSummary {
  totalEMIs: number
  paidEMIs: number
  pendingEMIs: number
  overdueEMIs: number
  totalPaid: number
  totalInterestPaid: number
  totalPrincipalPaid: number
  remainingPrincipal: number
  remainingInterest: number
  nextEMIDate: string | null
  nextEMIAmount: number
  averageEMIAmount: number
}

type ViewMode = 'table' | 'calendar' | 'chart'
type FilterType = 'all' | 'paid' | 'pending' | 'overdue'

export default function EMISchedulePage() {
  const router = useRouter()
  const params = useParams()
  const { user, isBorrower, initialized, isAuthenticated } = useAuth()
  
  const loanId = params?.id as string
  
  // State management
  const [emis, setEMIs] = React.useState<EMIRecord[]>([])
  const [loan, setLoan] = React.useState<LoanInfo | null>(null)
  const [summary, setSummary] = React.useState<ScheduleSummary>({
    totalEMIs: 0,
    paidEMIs: 0,
    pendingEMIs: 0,
    overdueEMIs: 0,
    totalPaid: 0,
    totalInterestPaid: 0,
    totalPrincipalPaid: 0,
    remainingPrincipal: 0,
    remainingInterest: 0,
    nextEMIDate: null,
    nextEMIAmount: 0,
    averageEMIAmount: 0
  })
  
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>('table')
  const [filterType, setFilterType] = React.useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedEMI, setSelectedEMI] = React.useState<EMIRecord | null>(null)
  const [showAnalytics, setShowAnalytics] = React.useState(false)

  console.log('📅 EMI SCHEDULE - State:', {
    loanId,
    emisCount: emis.length,
    viewMode,
    filterType
  })

  // Auth check and data loading
  React.useEffect(() => {
    if (!initialized) return
    
    if (!isAuthenticated || !isBorrower) {
      router.replace('/dashboard/borrower')
      return
    }
    
    if (!loanId) {
      router.replace('/dashboard/borrower')
      return
    }
    
    loadEMISchedule()
  }, [initialized, isAuthenticated, isBorrower, loanId, user])

  // Load EMI schedule data
  const loadEMISchedule = async () => {
    if (!user || !loanId) return
    
    try {
      setIsLoading(true)
      console.log('📅 Loading EMI schedule for loan:', loanId)
      
      // Load loan information
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('id, loan_number, principal_amount, total_amount, interest_rate, tenure_months, status')
        .eq('id', loanId)
        .eq('borrower_id', user.id)
        .single()

      if (loanError) {
        console.error('❌ Loan query error:', loanError)
        throw loanError
      }
      if (!loanData) throw new Error('Loan not found')

      console.log('✅ Loan data loaded:', loanData)

      // Load EMI schedule
      const { data: emisData, error: emisError } = await supabase
        .from('emis')
        .select('*')
        .eq('loan_id', loanId)
        .order('emi_number', { ascending: true })

      if (emisError) {
        console.error('❌ EMIs query error:', emisError)
        throw emisError
      }

      console.log('✅ EMIs data loaded:', emisData?.length || 0, 'EMIs')

      // Process EMI data
      const today = new Date()
      let cumulativePrincipal = 0
      let cumulativeInterest = 0
      let remainingBalance = loanData.total_amount || loanData.principal_amount

      const processedEMIs: EMIRecord[] = (emisData || []).map((emi, index) => {
        const dueDate = new Date(emi.due_date)
        const daysOverdue = dueDate < today ? 
          Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)) : 0
        
        const paidAmount = emi.paid_amount || 0
        const remainingAmount = Math.max(0, emi.amount - paidAmount)
        
        // Calculate principal and interest components if not available
        let principalComponent = emi.principal_component || 0
        let interestComponent = emi.interest_component || 0
        
        // If components are not available, calculate them
        if (principalComponent === 0 && interestComponent === 0 && emi.amount > 0) {
          // Simple calculation - in real app, use proper amortization
          const totalInterest = (loanData.total_amount - loanData.principal_amount) || 0
          const totalEMIs = emisData.length
          interestComponent = totalInterest / totalEMIs
          principalComponent = emi.amount - interestComponent
        }
        
        // Determine status
        let status: EMIRecord['status'] = 'pending'
        if (paidAmount >= emi.amount) {
          status = 'paid'
          cumulativePrincipal += principalComponent
          cumulativeInterest += interestComponent
          remainingBalance -= emi.amount
        } else if (paidAmount > 0) {
          status = 'partial'
        } else if (daysOverdue > 0) {
          status = 'overdue'
        }

        return {
          id: emi.id,
          emi_number: emi.emi_number,
          due_date: emi.due_date,
          amount: emi.amount,
          principal_component: principalComponent,
          interest_component: interestComponent,
          paid_amount: paidAmount,
          payment_date: emi.payment_date,
          status,
          late_fee: emi.late_fee,
          days_overdue: daysOverdue,
          remaining_amount: remainingAmount,
          cumulative_principal: cumulativePrincipal,
          cumulative_interest: cumulativeInterest,
          outstanding_balance: Math.max(0, remainingBalance)
        }
      })

      console.log('✅ Processed EMIs:', processedEMIs.length)

      // Calculate summary
      const calculatedSummary = calculateScheduleSummary(processedEMIs, loanData)

      setLoan(loanData)
      setEMIs(processedEMIs)
      setSummary(calculatedSummary)

      console.log('✅ EMI schedule loaded successfully')

    } catch (error: any) {
      console.error('❌ Failed to load EMI schedule:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate schedule summary
  const calculateScheduleSummary = (emis: EMIRecord[], loan: LoanInfo): ScheduleSummary => {
    const totalEMIs = emis.length
    const paidEMIs = emis.filter(e => e.status === 'paid').length
    const pendingEMIs = emis.filter(e => e.status === 'pending').length
    const overdueEMIs = emis.filter(e => e.status === 'overdue').length
    
    const totalPaid = emis.reduce((sum, e) => sum + (e.paid_amount || 0), 0)
    const totalInterestPaid = emis
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + e.interest_component, 0)
    const totalPrincipalPaid = emis
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + e.principal_component, 0)
    
    const remainingEMIs = emis.filter(e => e.status !== 'paid')
    const remainingPrincipal = remainingEMIs.reduce((sum, e) => sum + e.principal_component, 0)
    const remainingInterest = remainingEMIs.reduce((sum, e) => sum + e.interest_component, 0)
    
    const nextPendingEMI = emis.find(e => e.status === 'pending' || e.status === 'overdue')
    const averageEMIAmount = totalEMIs > 0 ? loan.total_amount / totalEMIs : 0

    return {
      totalEMIs,
      paidEMIs,
      pendingEMIs,
      overdueEMIs,
      totalPaid,
      totalInterestPaid,
      totalPrincipalPaid,
      remainingPrincipal,
      remainingInterest,
      nextEMIDate: nextPendingEMI?.due_date || null,
      nextEMIAmount: nextPendingEMI?.remaining_amount || 0,
      averageEMIAmount
    }
  }

  // Filter EMIs based on selected filter
  const filteredEMIs = React.useMemo(() => {
    let filtered = emis

    // Apply status filter
    if (filterType !== 'all') {
      filtered = filtered.filter(emi => emi.status === filterType)
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(emi =>
        emi.emi_number.toString().includes(searchQuery) ||
        emi.due_date.includes(searchQuery) ||
        emi.amount.toString().includes(searchQuery)
      )
    }

    return filtered
  }, [emis, filterType, searchQuery])

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadEMISchedule()
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

  // Get status styling
  const getStatusStyle = (status: EMIRecord['status']) => {
    switch (status) {
      case 'paid':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: CheckCircle,
          iconColor: 'text-green-600'
        }
      case 'partial':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: Clock,
          iconColor: 'text-yellow-600'
        }
      case 'overdue':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: AlertTriangle,
          iconColor: 'text-red-600'
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: Clock,
          iconColor: 'text-blue-600'
        }
    }
  }

  // Loading state
  if (!initialized || isLoading) {
    return (
      <DashboardLayout title="EMI Schedule" showBackButton>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading EMI schedule...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title={`EMI Schedule - ${loan?.loan_number}`} 
      showBackButton
      customHeader={
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showAnalytics ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-600"
            )}
          >
            <BarChart3 className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Download className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      }
    >
      <div className="bg-gray-50 min-h-screen">
        {/* Schedule Summary */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">Total EMIs</p>
              <p className="text-lg font-bold text-blue-700">{summary.totalEMIs}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 uppercase tracking-wide font-medium">Paid</p>
              <p className="text-lg font-bold text-green-700">{summary.paidEMIs}</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-600 uppercase tracking-wide font-medium">Pending</p>
              <p className="text-lg font-bold text-yellow-700">{summary.pendingEMIs}</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-red-600 uppercase tracking-wide font-medium">Overdue</p>
              <p className="text-lg font-bold text-red-700">{summary.overdueEMIs}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-600 uppercase tracking-wide font-medium">Progress</p>
              <p className="text-lg font-bold text-purple-700">
                {Math.round((summary.paidEMIs / summary.totalEMIs) * 100)}%
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Repayment Progress</span>
              <span>{summary.paidEMIs} of {summary.totalEMIs} EMIs completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 h-3 rounded-full transition-all duration-700"
                style={{ width: `${(summary.paidEMIs / summary.totalEMIs) * 100}%` }}
              />
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Paid</p>
              <p className="font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
            </div>
            <div>
              <p className="text-gray-600">Principal Paid</p>
              <p className="font-bold text-blue-600">{formatCurrency(summary.totalPrincipalPaid)}</p>
            </div>
            <div>
              <p className="text-gray-600">Interest Paid</p>
              <p className="font-bold text-orange-600">{formatCurrency(summary.totalInterestPaid)}</p>
            </div>
            <div>
              <p className="text-gray-600">Remaining</p>
              <p className="font-bold text-red-600">{formatCurrency(summary.remainingPrincipal + summary.remainingInterest)}</p>
            </div>
          </div>
        </div>

        {/* Analytics Panel */}
        {showAnalytics && (
          <div className="bg-white border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Analytics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Principal vs Interest Chart */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Payment Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Principal Paid:</span>
                    <span className="font-medium">{formatCurrency(summary.totalPrincipalPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Interest Paid:</span>
                    <span className="font-medium">{formatCurrency(summary.totalInterestPaid)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${(summary.totalPrincipalPaid / (summary.totalPrincipalPaid + summary.totalInterestPaid)) * 100}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Principal: {Math.round((summary.totalPrincipalPaid / (summary.totalPrincipalPaid + summary.totalInterestPaid)) * 100)}%
                  </p>
                </div>
              </div>

              {/* Payment Performance */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Payment Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">On-time Payments:</span>
                    <span className="font-medium text-green-600">{summary.paidEMIs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overdue Payments:</span>
                    <span className="font-medium text-red-600">{summary.overdueEMIs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Success Rate:</span>
                    <span className="font-medium">
                      {summary.totalEMIs > 0 ? Math.round(((summary.paidEMIs) / (summary.paidEMIs + summary.overdueEMIs)) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Remaining Projection */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Remaining Payments</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">EMIs Left:</span>
                    <span className="font-medium">{summary.pendingEMIs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount Left:</span>
                    <span className="font-medium">{formatCurrency(summary.remainingPrincipal + summary.remainingInterest)}</span>
                  </div>
                  {summary.nextEMIDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Next EMI:</span>
                      <span className="font-medium">{formatDate(summary.nextEMIDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white border-b border-gray-200 p-4 space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search EMI number, date, or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-2">
              {(['all', 'paid', 'pending', 'overdue'] as FilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm transition-colors",
                    filterType === filter
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter !== 'all' && (
                    <span className="ml-1 text-xs">
                      ({filter === 'paid' ? summary.paidEMIs :
                        filter === 'pending' ? summary.pendingEMIs :
                        summary.overdueEMIs})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {[
                { mode: 'table' as ViewMode, icon: BarChart3, label: 'Table' },
                { mode: 'calendar' as ViewMode, icon: Calendar, label: 'Calendar' },
                { mode: 'chart' as ViewMode, icon: PieChart, label: 'Chart' }
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm transition-colors",
                    viewMode === mode
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </button>
              ))}
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {filteredEMIs.length} of {emis.length} EMIs
            </div>
          </div>
        </div>

        {/* EMI List/View */}
        <div className="p-4">
          {filteredEMIs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No EMIs Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No EMI schedule available for this loan.'
                  }
                </p>
                {(searchQuery || filterType !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setFilterType('all')
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Mobile View */}
              <div className="lg:hidden divide-y divide-gray-200">
                {filteredEMIs.map((emi) => {
                  const statusStyle = getStatusStyle(emi.status)
                  const StatusIcon = statusStyle.icon
                  
                  return (
                    <div key={emi.id} className={cn("p-4", statusStyle.bg)}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <StatusIcon className={cn("h-5 w-5 mr-3", statusStyle.iconColor)} />
                          <div>
                            <p className="font-semibold text-gray-900">EMI #{emi.emi_number}</p>
                            <p className="text-sm text-gray-600">{formatDate(emi.due_date)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(emi.amount)}</p>
                          {emi.remaining_amount > 0 && (
                            <p className="text-sm text-red-600">
                              Remaining: {formatCurrency(emi.remaining_amount)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-500">Principal</p>
                          <p className="font-medium">{formatCurrency(emi.principal_component)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Interest</p>
                          <p className="font-medium">{formatCurrency(emi.interest_component)}</p>
                        </div>
                      </div>
                      
                      {emi.status === 'paid' && emi.payment_date && (
                        <div className="text-sm text-green-600">
                          ✓ Paid on {formatDate(emi.payment_date)}
                        </div>
                      )}
                      
                      {emi.status === 'overdue' && (
                        <div className="text-sm text-red-600">
                          ⚠ {emi.days_overdue} days overdue
                          {emi.late_fee && <span> • Late fee: {formatCurrency(emi.late_fee)}</span>}
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setSelectedEMI(emi)}
                        className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        EMI #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Principal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interest
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEMIs.map((emi) => {
                      const statusStyle = getStatusStyle(emi.status)
                      const StatusIcon = statusStyle.icon
                      
                      return (
                        <tr key={emi.id} className={cn("hover:bg-gray-50", statusStyle.bg)}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <StatusIcon className={cn("h-4 w-4 mr-2", statusStyle.iconColor)} />
                              <span className="text-sm font-medium text-gray-900">#{emi.emi_number}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(emi.due_date)}
                            {emi.status === 'overdue' && (
                              <div className="text-xs text-red-600">
                                {emi.days_overdue} days overdue
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(emi.amount)}
                            {emi.remaining_amount > 0 && (
                              <div className="text-xs text-red-600">
                                Remaining: {formatCurrency(emi.remaining_amount)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(emi.principal_component)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(emi.interest_component)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn(
                              "inline-flex px-2 py-1 text-xs font-semibold rounded-full border",
                              statusStyle.bg,
                              statusStyle.border,
                              statusStyle.text
                            )}>
                              {emi.status.charAt(0).toUpperCase() + emi.status.slice(1)}
                            </span>
                            {emi.status === 'paid' && emi.payment_date && (
                              <div className="text-xs text-gray-500 mt-1">
                                Paid: {formatDate(emi.payment_date)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(emi.outstanding_balance)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button 
                              onClick={() => setSelectedEMI(emi)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {viewMode === 'calendar' ? 'Calendar View' : 'Chart View'}
                </h3>
                <p className="text-gray-600">
                  {viewMode === 'calendar' ? 'Calendar view' : 'Chart view'} coming soon!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}