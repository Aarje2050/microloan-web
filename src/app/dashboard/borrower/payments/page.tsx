// app/dashboard/borrower/payments/page.tsx - ENTERPRISE PAYMENT HISTORY
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/dashboard-layout'
import {
  Receipt,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpDown,
  FileText,
  RefreshCw,
  IndianRupee,
  TrendingUp,
  PieChart
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaymentRecord {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  payment_reference: string | null
  status: string
  emi_number: number
  loan_id: string
  loan_number: string
  lender_name: string
  late_fee: number | null
  processing_fee: number | null
  created_at: string
}

interface PaymentSummary {
  totalPaid: number
  totalPayments: number
  avgPaymentAmount: number
  onTimePayments: number
  latePayments: number
  thisMonthPaid: number
  lastMonthPaid: number
}

type FilterType = 'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'
type SortType = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'

export default function PaymentHistoryPage() {
  const router = useRouter()
  const { user, isBorrower, initialized, isAuthenticated } = useAuth()
  
  // State management
  const [payments, setPayments] = React.useState<PaymentRecord[]>([])
  const [filteredPayments, setFilteredPayments] = React.useState<PaymentRecord[]>([])
  const [summary, setSummary] = React.useState<PaymentSummary>({
    totalPaid: 0,
    totalPayments: 0,
    avgPaymentAmount: 0,
    onTimePayments: 0,
    latePayments: 0,
    thisMonthPaid: 0,
    lastMonthPaid: 0
  })
  
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterType, setFilterType] = React.useState<FilterType>('all')
  const [sortType, setSortType] = React.useState<SortType>('date_desc')
  const [showFilters, setShowFilters] = React.useState(false)
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentRecord | null>(null)

  console.log('💳 PAYMENT HISTORY - State:', {
    user: user?.email,
    paymentsCount: payments.length,
    filterType,
    sortType
  })

  // Auth check
  React.useEffect(() => {
    if (!initialized) return
    
    if (!isAuthenticated || !isBorrower) {
      router.replace('/dashboard')
      return
    }
    
    loadPaymentHistory()
  }, [initialized, isAuthenticated, isBorrower, user])

  // Load payment history
  const loadPaymentHistory = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      console.log('💳 Loading payment history for user:', user.id)
      
      // First get user's loans
      const { data: userLoans, error: loansError } = await supabase
        .from('loans')
        .select('id, loan_number, created_by')
        .eq('borrower_id', user.id)
      
      if (loansError) {
        console.error('❌ Error loading user loans:', loansError)
        throw loansError
      }
      
      if (!userLoans || userLoans.length === 0) {
        console.log('📋 No loans found for payment history')
        setPayments([])
        setFilteredPayments([])
        return
      }
      
      const loanIds = userLoans.map(loan => loan.id)
      console.log('📋 Found loans for payments:', loanIds.length)
      
      // Get payments for user's loans
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('loan_id', loanIds)
        .order('payment_date', { ascending: false })
      
      if (paymentsError) {
        console.error('❌ Error loading payments:', paymentsError)
        throw paymentsError
      }
      
      console.log('💳 Payments query result:', paymentsData?.length || 0)
      
      if (!paymentsData || paymentsData.length === 0) {
        setPayments([])
        setFilteredPayments([])
        updateSummary([])
        updateSummary([])
        return
      }
      
      // Get lender information
      const lenderIds = Array.from(new Set(userLoans.map(l => l.created_by).filter(Boolean)))
      const { data: lendersData } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', lenderIds)
      
      // Get EMI information for payments that have EMI IDs
      const emiIds = paymentsData.map(p => p.emi_id).filter(Boolean)
      let emisData: any[] = []
      
      if (emiIds.length > 0) {
        const { data: emis } = await supabase
          .from('emis')
          .select('id, emi_number')
          .in('id', emiIds)
        emisData = emis || []
      }
      
      // Transform payment data
      const transformedPayments: PaymentRecord[] = paymentsData.map(payment => {
        const loan = userLoans.find(l => l.id === payment.loan_id)
        const lender = lendersData?.find(l => l.id === loan?.created_by)
        const emi = emisData.find(e => e.id === payment.emi_id)
        
        return {
          id: payment.id,
          amount: payment.amount,
          payment_date: payment.payment_date,
          payment_method: payment.payment_method || 'Bank Transfer',
          payment_reference: payment.payment_reference,
          status: payment.status || 'completed',
          emi_number: emi?.emi_number || 0,
          loan_id: loan?.id || '',
          loan_number: loan?.loan_number || 'Unknown',
          lender_name: lender?.full_name || 'Unknown Lender',
          late_fee: payment.late_fee,
          processing_fee: payment.processing_fee,
          created_at: payment.created_at
        }
      })
      
      setPayments(transformedPayments)
      calculateSummary(transformedPayments)
      
    } catch (error) {
      console.error('❌ Failed to load payment history:', error)
      setPayments([])
    } finally {
      setIsLoading(false)
    }
  }

  // Update summary helper function
  const updateSummary = (payments: PaymentRecord[]) => {
    calculateSummary(payments)
  }

  // Calculate payment summary
  const calculateSummary = (payments: PaymentRecord[]) => {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    const totalPayments = payments.length
    const avgPaymentAmount = totalPayments > 0 ? totalPaid / totalPayments : 0
    
    const thisMonthPayments = payments.filter(p => 
      new Date(p.payment_date) >= thisMonth
    )
    const lastMonthPayments = payments.filter(p => {
      const date = new Date(p.payment_date)
      return date >= lastMonth && date <= lastMonthEnd
    })
    
    const thisMonthPaid = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0)
    const lastMonthPaid = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0)
    
    // Note: We'd need EMI due dates to calculate on-time vs late payments accurately
    const onTimePayments = payments.filter(p => p.status === 'completed').length
    const latePayments = payments.filter(p => p.late_fee && p.late_fee > 0).length
    
    setSummary({
      totalPaid,
      totalPayments,
      avgPaymentAmount,
      onTimePayments,
      latePayments,
      thisMonthPaid,
      lastMonthPaid
    })
  }

  // Apply filters and sorting
  React.useEffect(() => {
    let filtered = [...payments]
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(payment =>
        payment.loan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.lender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.payment_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.payment_method.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply date filter
    const now = new Date()
    switch (filterType) {
      case 'thisMonth':
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        filtered = filtered.filter(p => new Date(p.payment_date) >= thisMonth)
        break
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        filtered = filtered.filter(p => {
          const date = new Date(p.payment_date)
          return date >= lastMonth && date <= lastMonthEnd
        })
        break
      case 'thisYear':
        const thisYear = new Date(now.getFullYear(), 0, 1)
        filtered = filtered.filter(p => new Date(p.payment_date) >= thisYear)
        break
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'date_asc':
          return new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
        case 'date_desc':
          return new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
        case 'amount_asc':
          return a.amount - b.amount
        case 'amount_desc':
          return b.amount - a.amount
        default:
          return 0
      }
    })
    
    setFilteredPayments(filtered)
  }, [payments, searchQuery, filterType, sortType])

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadPaymentHistory()
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

  // Get payment status color
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'bank transfer':
      case 'neft':
      case 'rtgs':
        return <CreditCard className="h-4 w-4" />
      case 'upi':
        return <CreditCard className="h-4 w-4" />
      case 'cash':
        return <IndianRupee className="h-4 w-4" />
      default:
        return <Receipt className="h-4 w-4" />
    }
  }

  // Loading state
  if (!initialized || isLoading) {
    return (
      <DashboardLayout title="Payment History" showBackButton>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading payment history...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="Payment History" 
      showBackButton
      customHeader={
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      }
    >
      <div className="bg-gray-50 min-h-screen">
        {/* Summary Stats */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
              <p className="text-xs text-gray-600">Total Paid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{summary.totalPayments}</p>
              <p className="text-xs text-gray-600">Total Payments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.avgPaymentAmount)}</p>
              <p className="text-xs text-gray-600">Avg Payment</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {summary.totalPayments > 0 ? Math.round((summary.onTimePayments / summary.totalPayments) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-600">On Time</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border-b border-gray-200 p-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by loan, lender, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg border transition-colors",
                showFilters ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-300 text-gray-700"
              )}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'thisMonth', 'lastMonth', 'thisYear'] as FilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm transition-colors",
                    filterType === filter
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {filter === 'all' ? 'All Time' :
                   filter === 'thisMonth' ? 'This Month' :
                   filter === 'lastMonth' ? 'Last Month' :
                   'This Year'}
                </button>
              ))}
            </div>

            {/* Sort Control */}
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="date_desc">Latest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Payment List */}
        <div className="p-4">
          {filteredPayments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery || filterType !== 'all' ? 'No Payments Found' : 'No Payment History'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Your payment history will appear here once you make payments.'
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
          ) : (
            <div className="space-y-4">
              {/* Results Summary */}
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                  Showing {filteredPayments.length} of {payments.length} payments
                </span>
                <span>
                  Total: {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.amount, 0))}
                </span>
              </div>

              {/* Payment Cards */}
              <div className="space-y-3">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    {/* Mobile Layout */}
                    <div className="lg:hidden">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            {getPaymentMethodIcon(payment.payment_method)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-gray-600">{payment.loan_number}</p>
                          </div>
                        </div>
                        <span className={cn(
                          'px-2 py-1 text-xs font-medium rounded-full border',
                          getPaymentStatusColor(payment.status)
                        )}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Date</p>
                          <p className="font-medium">{formatDate(payment.payment_date)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">EMI #</p>
                          <p className="font-medium">{payment.emi_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Method</p>
                          <p className="font-medium">{payment.payment_method}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Lender</p>
                          <p className="font-medium">{payment.lender_name}</p>
                        </div>
                      </div>
                      
                      {payment.payment_reference && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">Reference: {payment.payment_reference}</p>
                        </div>
                      )}
                      
                      <div className="mt-3 flex space-x-2">
                        <button 
                          onClick={() => setSelectedPayment(payment)}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                        <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          {getPaymentMethodIcon(payment.payment_method)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-gray-600">{payment.loan_number} - EMI #{payment.emi_number}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Date</p>
                          <p className="font-medium">{formatDate(payment.payment_date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Method</p>
                          <p className="font-medium">{payment.payment_method}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Lender</p>
                          <p className="font-medium">{payment.lender_name}</p>
                        </div>
                        <span className={cn(
                          'px-3 py-1 text-xs font-medium rounded-full border',
                          getPaymentStatusColor(payment.status)
                        )}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setSelectedPayment(payment)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}