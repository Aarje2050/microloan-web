// app/dashboard/borrower/page.tsx - INTEGRATED BORROWER DASHBOARD
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/dashboard-layout'
import UpcomingEMIs from '@/components/features/borrower/upcoming-emis'
import {
  User,
  CreditCard,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  Eye,
  Receipt,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  RefreshCw,
  IndianRupee,
  Phone,
  Mail,
  Bell,
  Briefcase,
  Plus,
  FileText,
  Calculator,
  BarChart3,
  PieChart,
  Target
} from 'lucide-react'
import { StatsCard } from '@/components/ui/stats-card'
import { cn } from '@/lib/utils'

interface BorrowerLoan {
  id: string
  loan_number: string
  lender_name: string
  lender_email: string
  principal_amount: number
  total_amount: number
  interest_rate: number
  status: string
  disbursement_date: string
  maturity_date: string
  repayment_frequency: string
  outstanding_balance: number
  total_emis: number
  paid_emis: number
  pending_emis: number
  next_emi_date: string | null
  next_emi_amount: number
  days_until_next_emi: number
  is_overdue: boolean
  overdue_amount: number
  completion_percentage: number
}

interface PaymentHistory {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  payment_reference: string | null
  emi_number: number
  loan_number: string
  status: string
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

interface DashboardStats {
  totalLoans: number
  totalOutstanding: number
  nextEMIAmount: number
  nextEMIDays: number
  overdueAmount: number
  totalPaid: number
  completionRate: number
  paymentPerformance: number
}

// Enhanced Loan Card Component
const EnhancedLoanCard: React.FC<{
  loan: BorrowerLoan
  onViewDetails: (loanId: string) => void
  onViewEMISchedule: (loanId: string) => void
  onContactLender: (lenderEmail: string) => void
  formatCurrency: (amount: number) => string
  formatDate: (date: string) => string
}> = ({ loan, onViewDetails, onViewEMISchedule, onContactLender, formatCurrency, formatDate }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'disbursed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'border-red-500 bg-red-50'
    if (daysUntil <= 3) return 'border-orange-500 bg-orange-50'
    if (daysUntil <= 7) return 'border-yellow-500 bg-yellow-50'
    return 'border-green-500 bg-green-50'
  }

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-blue-500'
    if (percentage >= 40) return 'bg-yellow-500'
    if (percentage >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{loan.loan_number}</h3>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{loan.lender_name}</span> • 
              <span className="ml-1">{loan.interest_rate}% APR</span>
            </p>
          </div>
          <span className={cn(
            'px-3 py-1 text-xs font-medium rounded-full border',
            getStatusColor(loan.status)
          )}>
            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-4">
        {/* Financial Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600 uppercase tracking-wide font-medium">Outstanding</p>
            <p className="text-lg font-bold text-red-700">{formatCurrency(loan.outstanding_balance)}</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">Total Loan</p>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(loan.total_amount)}</p>
          </div>
        </div>

        {/* Progress Visualization */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Completion Progress</span>
            <span className="font-medium text-gray-900">
              {loan.paid_emis}/{loan.total_emis} EMIs ({Math.round(loan.completion_percentage)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
            <div 
              className={cn(
                "h-3 rounded-full transition-all duration-700 relative",
                getCompletionColor(loan.completion_percentage)
              )}
              style={{ width: `${loan.completion_percentage}%` }}
            >
              <div className="absolute inset-0 bg-white bg-opacity-25 animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Started: {formatDate(loan.disbursement_date)}</span>
            <span>{loan.pending_emis} EMIs remaining</span>
          </div>
        </div>

        {/* Next EMI Information */}
        {loan.next_emi_date && (
          <div className={cn(
            'p-3 rounded-lg border-2',
            getUrgencyColor(loan.days_until_next_emi)
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Next EMI Due
                </p>
                <p className="text-sm text-gray-600">{formatDate(loan.next_emi_date)}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{formatCurrency(loan.next_emi_amount)}</p>
                <p className="text-xs text-gray-600">
                  {loan.days_until_next_emi > 0 ? `${loan.days_until_next_emi} days left` : 
                   loan.days_until_next_emi === 0 ? 'Due today' : 
                   `${Math.abs(loan.days_until_next_emi)} days overdue`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overdue Alert */}
        {loan.is_overdue && (
          <div className="bg-red-50 border-2 border-red-200 p-3 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Payment Overdue</p>
                <p className="text-sm text-red-700">
                  Amount: {formatCurrency(loan.overdue_amount)} • Contact lender immediately
                </p>
              </div>
              <button 
                onClick={() => onContactLender(loan.lender_email)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Phone className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button 
            onClick={() => onViewDetails(loan.id)}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Eye className="h-4 w-4 mr-1" />
            Details
          </button>
          <button 
            onClick={() => onViewEMISchedule(loan.id)}
            className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
          >
            <Calendar className="h-4 w-4 mr-1" />
            Schedule
          </button>
          <button 
            onClick={() => onContactLender(loan.lender_email)}
            className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <Phone className="h-4 w-4 mr-1" />
            Contact
          </button>
        </div>
      </div>
    </div>
  )
}

export default function IntegratedBorrowerDashboard() {
  const router = useRouter()
  const { user, signOut, isBorrower, initialized, isAuthenticated, 
    canBecomeLender, isBoth, upgradeToLender } = useAuth()

  // State management
  const [redirectHandled, setRedirectHandled] = React.useState(false)
  const [isUpgrading, setIsUpgrading] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  
  // Data states
  const [loans, setLoans] = React.useState<BorrowerLoan[]>([])
  const [recentPayments, setRecentPayments] = React.useState<PaymentHistory[]>([])
  const [isLoadingLoans, setIsLoadingLoans] = React.useState(true)
  const [isLoadingPayments, setIsLoadingPayments] = React.useState(true)
  
  // EMI summary from UpcomingEMIs component
  const [emiSummary, setEMISummary] = React.useState<EMISummary>({
    nextEMIAmount: 0,
    nextEMIDate: null,
    nextEMIDays: 0,
    totalUpcoming: 0,
    totalOverdue: 0,
    overdueCount: 0,
    upcomingCount: 0,
    totalUpcomingAmount: 0
  })
  
  // Dashboard stats
  const [stats, setStats] = React.useState<DashboardStats>({
    totalLoans: 0,
    totalOutstanding: 0,
    nextEMIAmount: 0,
    nextEMIDays: 0,
    overdueAmount: 0,
    totalPaid: 0,
    completionRate: 0,
    paymentPerformance: 95
  })

  console.log('👤 INTEGRATED BORROWER DASHBOARD - State:', { 
    user: user?.email, 
    isBorrower, 
    initialized,
    isAuthenticated,
    loansCount: loans.length,
    emiSummary
  })

  // ✅ AUTH HANDLING
  React.useEffect(() => {
    if (!initialized) return
    if (redirectHandled) return

    if (!isAuthenticated) {
      console.log('🚫 BORROWER - Not authenticated, redirecting to login')
      setRedirectHandled(true)
      router.replace('/login')
      return
    }

    if (!isBorrower) {
      console.log('🚫 BORROWER - Not borrower, redirecting to dashboard')
      setRedirectHandled(true) 
      router.replace('/dashboard')
      return
    }

    console.log('✅ BORROWER - Access granted')
  }, [initialized, isAuthenticated, isBorrower, redirectHandled, router])

  // Load dashboard data
  React.useEffect(() => {
    if (!user || !isBorrower) return
    loadDashboardData()
  }, [user, isBorrower])

  // Load all borrower data
  const loadDashboardData = async () => {
    if (!user) return
    
    try {
      console.log('📊 BORROWER - Loading dashboard data for:', user.email)
      setIsLoadingLoans(true)
      setIsLoadingPayments(true)
      
      await Promise.all([
        loadBorrowerLoans(),
        loadRecentPayments()
      ])
      
    } catch (error: any) {
      console.error('❌ BORROWER - Failed to load dashboard data:', error)
    }
  }

  // Pull to refresh functionality
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadDashboardData()
      // Simulate haptic feedback
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  // Load borrower's loans with enhanced calculations
  const loadBorrowerLoans = async () => {
    try {
      console.log('📊 BORROWER - Loading loans for user:', user?.id)
      
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('borrower_id', user?.id)
        .order('created_at', { ascending: false })

      if (loansError) throw loansError

      if (!loansData || loansData.length === 0) {
        console.log('📋 BORROWER - No loans found')
        setLoans([])
        updateStats([], [], emiSummary)
        return
      }

      // Get lender details
      const lenderIds = Array.from(new Set(loansData.map(l => l.created_by).filter(Boolean)))
      const { data: lendersData, error: lendersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', lenderIds)

      if (lendersError) {
        console.warn('⚠️ BORROWER - Lenders query warning:', lendersError)
      }

      // Get EMI data for all loans
      const loanIds = loansData.map(l => l.id)
      const { data: emisData, error: emisError } = await supabase
        .from('emis')
        .select('*')
        .in('loan_id', loanIds)
        .order('emi_number', { ascending: true })

      if (emisError) {
        console.warn('⚠️ BORROWER - EMIs query warning:', emisError)
      }

      // Process loan data with enhanced calculations
      const today = new Date()
      const transformedLoans: BorrowerLoan[] = loansData.map(loan => {
        const lender = lendersData?.find(l => l.id === loan.created_by)
        const loanEMIs = (emisData || []).filter(e => e.loan_id === loan.id)
        
        // Calculate EMI statistics
        const totalEMIs = loanEMIs.length
        const paidEMIs = loanEMIs.filter(e => {
          const paidAmount = e.paid_amount || 0
          return paidAmount >= e.amount
        }).length
        
        const pendingEMIs = loanEMIs.filter(e => {
          const paidAmount = e.paid_amount || 0
          return paidAmount < e.amount
        })
        
        // Calculate outstanding balance
        const totalPaid = loanEMIs.reduce((sum, emi) => {
          const paidAmount = emi.paid_amount || 0
          return sum + Math.min(paidAmount, emi.amount)
        }, 0)
        
        const outstandingBalance = Math.max(0, (loan.total_amount || loan.principal_amount) - totalPaid)
        
        // Find next EMI
        const nextEMI = pendingEMIs
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]
        
        const nextEMIDate = nextEMI ? new Date(nextEMI.due_date) : null
        const daysUntilNext = nextEMIDate ? 
          Math.ceil((nextEMIDate.getTime() - today.getTime()) / (1000 * 3600 * 24)) : 0
        
        // Calculate overdue amount
        const overdueEMIs = pendingEMIs.filter(e => new Date(e.due_date) < today)
        const overdueAmount = overdueEMIs.reduce((sum, emi) => {
          const remaining = emi.amount - (emi.paid_amount || 0)
          return sum + remaining
        }, 0)
        
        // Calculate completion percentage
        const completionPercentage = totalEMIs > 0 ? (paidEMIs / totalEMIs) * 100 : 0
        
        return {
          id: loan.id,
          loan_number: loan.loan_number || `LOAN-${loan.id.slice(0, 8)}`,
          lender_name: lender?.full_name || 'Unknown Lender',
          lender_email: lender?.email || '',
          principal_amount: loan.principal_amount,
          total_amount: loan.total_amount || loan.principal_amount,
          interest_rate: loan.interest_rate || 0,
          status: loan.status,
          disbursement_date: loan.disbursement_date || loan.created_at,
          maturity_date: loan.maturity_date || '',
          repayment_frequency: loan.repayment_frequency || 'monthly',
          outstanding_balance: outstandingBalance,
          total_emis: totalEMIs,
          paid_emis: paidEMIs,
          pending_emis: pendingEMIs.length,
          next_emi_date: nextEMI?.due_date || null,
          next_emi_amount: nextEMI ? (nextEMI.amount - (nextEMI.paid_amount || 0)) : 0,
          days_until_next_emi: daysUntilNext,
          is_overdue: overdueAmount > 0,
          overdue_amount: overdueAmount,
          completion_percentage: completionPercentage
        }
      })

      console.log('✅ BORROWER - Loans processed:', transformedLoans.length)
      setLoans(transformedLoans)
      
    } catch (error: any) {
      console.error('❌ BORROWER - Failed to load loans:', error)
      setLoans([])
    } finally {
      setIsLoadingLoans(false)
    }
  }

  // Load recent payments with enhanced data
  const loadRecentPayments = async () => {
    try {
      console.log('📊 BORROWER - Loading recent payments...')
      
      // First get user's loans
      const { data: userLoans, error: loansError } = await supabase
        .from('loans')
        .select('id, loan_number')
        .eq('borrower_id', user?.id)
      
      if (loansError) {
        console.warn('⚠️ BORROWER - Loans query error:', loansError)
        setRecentPayments([])
        return
      }
      
      if (!userLoans || userLoans.length === 0) {
        console.log('📋 BORROWER - No loans found for payments')
        setRecentPayments([])
        return
      }
      
      const loanIds = userLoans.map(loan => loan.id)
      console.log('📋 BORROWER - Loading payments for loans:', loanIds.length)
      
      // Load payments for user's loans
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_date,
          payment_method,
          payment_reference,
          status,
          loan_id,
          emi_id
        `)
        .in('loan_id', loanIds)
        .order('payment_date', { ascending: false })
        .limit(5)

      if (paymentsError) {
        console.warn('⚠️ BORROWER - Payments query error:', paymentsError)
        setRecentPayments([])
        return
      }
      
      console.log('📊 BORROWER - Payments query result:', paymentsData?.length || 0)
      
      // Get EMI numbers for payments
      const emiIds = paymentsData?.map(p => p.emi_id).filter(Boolean) || []
      let emisData: any[] = []
      
      if (emiIds.length > 0) {
        const { data: emis } = await supabase
          .from('emis')
          .select('id, emi_number')
          .in('id', emiIds)
        emisData = emis || []
      }

      const processedPayments: PaymentHistory[] = (paymentsData || []).map(payment => {
        const loan = userLoans.find(l => l.id === payment.loan_id)
        const emi = emisData.find(e => e.id === payment.emi_id)
        
        return {
          id: payment.id,
          amount: payment.amount,
          payment_date: payment.payment_date,
          payment_method: payment.payment_method || 'Bank Transfer',
          payment_reference: payment.payment_reference,
          emi_number: emi?.emi_number || 0,
          loan_number: loan?.loan_number || 'Unknown',
          status: payment.status || 'completed'
        }
      })

      console.log('✅ BORROWER - Recent payments processed:', processedPayments.length)
      setRecentPayments(processedPayments)
      
    } catch (error: any) {
      console.error('❌ BORROWER - Failed to load payments:', error)
      setRecentPayments([])
    } finally {
      setIsLoadingPayments(false)
    }
  }

  // Update dashboard statistics when data changes
  const updateStats = (loans: BorrowerLoan[], payments: PaymentHistory[], emiSummary: EMISummary) => {
    const totalOutstanding = loans.reduce((sum, loan) => sum + loan.outstanding_balance, 0)
    const overdueAmount = loans.reduce((sum, loan) => sum + loan.overdue_amount, 0)
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
    
    // Calculate average completion rate
    const avgCompletionRate = loans.length > 0 ? 
      loans.reduce((sum, loan) => sum + loan.completion_percentage, 0) / loans.length : 0
    
    setStats({
      totalLoans: loans.length,
      totalOutstanding: totalOutstanding,
      nextEMIAmount: emiSummary.nextEMIAmount,
      nextEMIDays: emiSummary.nextEMIDays,
      overdueAmount: overdueAmount,
      totalPaid: totalPaid,
      completionRate: avgCompletionRate,
      paymentPerformance: Math.max(60, 100 - (emiSummary.overdueCount * 10)) // Simple performance metric
    })
  }

  // Update stats when data changes
  React.useEffect(() => {
    updateStats(loans, recentPayments, emiSummary)
  }, [loans, recentPayments, emiSummary])

  // Handle EMI summary updates from UpcomingEMIs component
  const handleEMIUpdate = React.useCallback((newSummary: EMISummary) => {
    console.log('📅 BORROWER - EMI summary updated:', newSummary)
    setEMISummary(newSummary)
  }, [])

  // Handle becoming lender
  const handleBecomeLender = React.useCallback(async () => {
    if (isUpgrading) return
    
    const confirmed = window.confirm(
      'Are you sure you want to become a lender?\n\n' +
      'This will allow you to:\n' +
      '• Add your own borrowers\n' +
      '• Create and manage loans\n' +
      '• Track payments and EMIs\n\n' +
      'You can continue using borrower features as well.'
    )
    
    if (!confirmed) return
    
    console.log('🔄 BORROWER - Starting role upgrade to lender')
    setIsUpgrading(true)
    
    try {
      const result = await upgradeToLender()
      
      if (result.success) {
        console.log('✅ BORROWER - Role upgrade successful')
        alert('🎉 Congratulations! You are now a lender.\n\nYou can switch between borrower and lender views using the menu.')
      } else {
        throw new Error(result.error || 'Role upgrade failed')
      }
    } catch (error: any) {
      console.error('❌ BORROWER - Role upgrade failed:', error)
      alert('❌ Failed to upgrade to lender. Please try again or contact support.')
    } finally {
      setIsUpgrading(false)
    }
  }, [isUpgrading, upgradeToLender])

  // Navigation handlers
  const handleViewLoanDetails = (loanId: string) => {
    router.push(`/dashboard/borrower/loans/${loanId}`)
  }

  const handleViewEMISchedule = (loanId: string) => {
    router.push(`/dashboard/borrower/loans/${loanId}/schedule`)
  }

  const handleContactLender = (lenderEmail: string) => {
    if (lenderEmail) {
      window.location.href = `mailto:${lenderEmail}?subject=Regarding My Loan`
    }
  }

  const handleViewPaymentHistory = () => {
    router.push('/dashboard/borrower/payments')
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

  // ✅ LOADING STATE
  if (!initialized) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading borrower dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // ✅ NOT AUTHENTICATED STATE
  if (!isAuthenticated || !isBorrower) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <User className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Access Required</h2>
            <p className="text-sm text-gray-600">Redirecting...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // ✅ MAIN INTEGRATED BORROWER DASHBOARD
  return (
    <DashboardLayout 
      customHeader={
        <div className="flex items-center space-x-2">
          {canBecomeLender && (
            <button
              onClick={handleBecomeLender}
              disabled={isUpgrading}
              className="hidden sm:inline-flex items-center bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
            >
              <Briefcase className="h-4 w-4 mr-1" />
              {isUpgrading ? 'Upgrading...' : 'Become Lender'}
            </button>
          )}
        </div>
      }
    >
      <div className="bg-gray-50 min-h-screen">
        {/* Critical Alert Banner */}
        {stats.overdueAmount > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 rounded-lg shadow-sm">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold text-lg">⚠️ Urgent: Payment Overdue</h3>
                <p className="text-red-700 mt-1">
                  You have <span className="font-bold">{formatCurrency(stats.overdueAmount)}</span> in overdue payments across {emiSummary.overdueCount} EMI{emiSummary.overdueCount > 1 ? 's' : ''}. 
                  This may affect your credit score. Please contact your lender immediately.
                </p>
                <div className="mt-3 flex space-x-3">
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                    Pay Now
                  </button>
                  <button className="border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                    Contact Lender
                  </button>
                </div>
              </div>
              <button className="text-red-600 hover:text-red-800">
                <Bell className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Header with Refresh */}
        <div className="bg-white px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">My Loan Portfolio</h2>
              <p className="text-sm text-gray-600">
                {loans.length} active loans • {formatCurrency(stats.totalOutstanding)} outstanding • {Math.round(stats.completionRate)}% avg completion
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Active Loans"
              value={stats.totalLoans}
              icon={CreditCard}
              loading={isLoadingLoans}
              className="col-span-1"
              subtitle="Total loans"
              color="blue"
            />
            <StatsCard
              title="Outstanding"
              value={formatCurrency(stats.totalOutstanding)}
              icon={IndianRupee}
              loading={isLoadingLoans}
              className="col-span-1"
              subtitle="Amount due"
              color="red"
            />
            <StatsCard
              title="Next EMI"
              value={formatCurrency(stats.nextEMIAmount)}
              change={stats.nextEMIDays > 0 ? `In ${stats.nextEMIDays} days` : 
                     stats.nextEMIDays === 0 ? 'Due today' : 
                     `${Math.abs(stats.nextEMIDays)} days overdue`}
              changeType={stats.nextEMIDays > 3 ? "positive" : stats.nextEMIDays >= 0 ? "neutral" : "negative"}
              icon={Clock}
              loading={isLoadingLoans}
              className="col-span-2 lg:col-span-1"
              subtitle="Next payment"
              color="orange"
            />
            <StatsCard
              title="Completion Rate"
              value={`${Math.round(stats.completionRate)}%`}
              change={stats.paymentPerformance >= 90 ? "Excellent" : stats.paymentPerformance >= 75 ? "Good" : "Needs improvement"}
              changeType={stats.paymentPerformance >= 90 ? "positive" : stats.paymentPerformance >= 75 ? "neutral" : "negative"}
              icon={Target}
              loading={isLoadingLoans}
              className="col-span-2 lg:col-span-1"
              subtitle="Avg progress"
              color="green"
            />
          </div>

          {/* Enhanced Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-600">Manage your loans and payments</p>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={handleViewPaymentHistory}
                className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-purple-900">Payment History</span>
                  <p className="text-xs text-purple-600 mt-1">{recentPayments.length} recent</p>
                </div>
              </button>

              <button className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-blue-900">Contact Lender</span>
                  <p className="text-xs text-blue-600 mt-1">Get support</p>
                </div>
              </button>

              <button className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <Calculator className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-green-900">EMI Calculator</span>
                  <p className="text-xs text-green-600 mt-1">Plan payments</p>
                </div>
              </button>

              <button className="flex items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors group">
                <div className="text-center">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-indigo-900">Reports</span>
                  <p className="text-xs text-indigo-600 mt-1">View analytics</p>
                </div>
              </button>
            </div>
          </div>

          {/* Become Lender CTA (Mobile) */}
          {canBecomeLender && (
            <div className="sm:hidden bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-sm border border-green-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Become a Lender</h3>
                    <p className="text-green-100 text-sm">Start lending and earning returns</p>
                  </div>
                </div>
                <button
                  onClick={handleBecomeLender}
                  disabled={isUpgrading}
                  className="bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 disabled:opacity-50 transition-colors"
                >
                  {isUpgrading ? 'Upgrading...' : 'Upgrade Now'}
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Active Loans Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">My Active Loans</h3>
                  <p className="text-sm text-gray-600">
                    Current loan portfolio • {formatCurrency(stats.totalOutstanding)} total outstanding
                  </p>
                </div>
                {loans.length > 0 && (
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All →
                  </button>
                )}
              </div>
            </div>

            <div className="p-4">
              {isLoadingLoans ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading loans...</p>
                </div>
              ) : loans.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Active Loans</h4>
                  <p className="text-gray-600 mb-6 text-sm max-w-sm mx-auto">
                    You don't have any active loans at the moment. Contact a lender to apply for a loan.
                  </p>
                  <button className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    <Plus className="h-4 w-4 mr-2" />
                    Find Lenders
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {loans.map((loan) => (
                    <EnhancedLoanCard
                      key={loan.id}
                      loan={loan}
                      onViewDetails={handleViewLoanDetails}
                      onViewEMISchedule={handleViewEMISchedule}
                      onContactLender={handleContactLender}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Upcoming EMIs with Real Data Integration */}
          <UpcomingEMIs
            userId={user?.id || ''}
            onEMIUpdate={handleEMIUpdate}
            maxItems={6}
            timeRange={90}
            showHeader={true}
          />

          {/* Recent Payments Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
                  <p className="text-sm text-gray-600">Latest payment activity</p>
                </div>
                {recentPayments.length > 0 && (
                  <button 
                    onClick={handleViewPaymentHistory}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All →
                  </button>
                )}
              </div>
            </div>

            <div className="p-4">
              {isLoadingPayments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading payments...</p>
                </div>
              ) : recentPayments.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">No payment history available.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payment.loan_number} - EMI #{payment.emi_number}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(payment.payment_date)} • {payment.payment_method}
                            {payment.payment_reference && (
                              <span className="ml-2 text-xs text-gray-500">Ref: {payment.payment_reference}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-gray-500 capitalize">{payment.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}