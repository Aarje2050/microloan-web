// File: src/app/dashboard/borrower/page.tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  User, CreditCard, Calendar, DollarSign, Clock, 
  AlertTriangle, TrendingUp, LogOut, Home, Eye, Receipt,
  CheckCircle, Bell, Phone, Mail, Briefcase // 🆕 ADD Briefcase import
} from 'lucide-react'

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
}

interface EMIDetails {
  id: string
  emi_number: number
  due_date: string
  amount: number
  paid_amount: number | null
  status: string
  days_overdue: number
  late_fee: number | null
}

interface PaymentHistory {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  payment_reference: string | null
  emi_number: number
  loan_number: string
}

type ViewMode = 'dashboard' | 'loan-details' | 'payment-history' | 'emi-schedule'

export default function BorrowerDashboard() {
  const router = useRouter()
  const { user, signOut, isBorrower, initialized, isAuthenticated, 
    canBecomeLender, isBoth, upgradeToLender } = useAuth()  
  // State management
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const [isUpgrading, setIsUpgrading] = React.useState(false)

  const [redirectHandled, setRedirectHandled] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>('dashboard')
  const [selectedLoanId, setSelectedLoanId] = React.useState<string>('')
  
  // Data states
  const [loans, setLoans] = React.useState<BorrowerLoan[]>([])
  const [upcomingEMIs, setUpcomingEMIs] = React.useState<EMIDetails[]>([])
  const [recentPayments, setRecentPayments] = React.useState<PaymentHistory[]>([])
  const [isLoadingLoans, setIsLoadingLoans] = React.useState(true)
  const [isLoadingEMIs, setIsLoadingEMIs] = React.useState(true)
  const [isLoadingPayments, setIsLoadingPayments] = React.useState(true)
  
  // Summary stats
  const [stats, setStats] = React.useState({
    totalLoans: 0,
    totalOutstanding: 0,
    nextEMIAmount: 0,
    nextEMIDays: 0,
    overdueAmount: 0,
    totalPaid: 0
  })

  console.log('👤 BORROWER DASHBOARD - State:', { 
    user: user?.email, 
    isBorrower, 
    initialized,
    isAuthenticated,
    viewMode,
    loansCount: loans.length
  })

  // Auth handling
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
      
      await Promise.all([
        loadBorrowerLoans(),
        loadUpcomingEMIs(),
        loadRecentPayments()
      ])
      
    } catch (error: any) {
      console.error('❌ BORROWER - Failed to load dashboard data:', error)
    }
  }

  // 🆕 ADD this new function after your existing functions (around line 150)
const handleBecomeLender = React.useCallback(async () => {
  if (isUpgrading) return
  
  // Simple confirmation
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
      
      // Show success message
      alert('🎉 Congratulations! You are now a lender.\n\nYou can switch between borrower and lender views using the buttons in the header.')
      
      // Optional: Redirect to lender dashboard
      // router.push('/dashboard/lender')
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

  // Load borrower's loans
  const loadBorrowerLoans = async () => {
    try {
      console.log('📊 BORROWER - Loading loans for user:', user?.id)
      setIsLoadingLoans(true)
      
      // Get loans for this borrower
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('borrower_id', user?.id)
        .order('created_at', { ascending: false })

      if (loansError) throw loansError

      if (!loansData || loansData.length === 0) {
        console.log('📋 BORROWER - No loans found')
        setLoans([])
        updateStats([], [], [])
        return
      }

      console.log('📋 BORROWER - Loans found:', loansData.length)

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

      // Process loan data
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
        
        return {
          id: loan.id,
          loan_number: loan.loan_number || `LOAN-${loan.id.slice(0, 8)}`,
          lender_name: lender?.full_name || 'Unknown Lender',
          lender_email: lender?.email || '',
          principal_amount: loan.principal_amount,
          total_amount: loan.total_amount || loan.principal_amount,
          interest_rate: loan.interest_rate,
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
          overdue_amount: overdueAmount
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

  // Load upcoming EMIs
  const loadUpcomingEMIs = async () => {
    try {
      console.log('📊 BORROWER - Loading upcoming EMIs...')
      setIsLoadingEMIs(true)
      
      // Get EMIs for next 30 days
      const today = new Date()
      const futureDate = new Date()
      futureDate.setDate(today.getDate() + 30)
      
      const { data: emisData, error: emisError } = await supabase
        .from('emis')
        .select(`
          *,
          loans!inner (
            borrower_id,
            loan_number
          )
        `)
        .eq('loans.borrower_id', user?.id)
        .gte('due_date', today.toISOString().split('T')[0])
        .lte('due_date', futureDate.toISOString().split('T')[0])
        .in('status', ['pending', 'partial'])
        .order('due_date', { ascending: true })
        .limit(10)

      if (emisError) {
        console.warn('⚠️ BORROWER - Upcoming EMIs warning:', emisError)
        setUpcomingEMIs([])
        return
      }

      // Process EMI data
      const processedEMIs: EMIDetails[] = (emisData || []).map(emi => {
        const dueDate = new Date(emi.due_date)
        const daysOverdue = dueDate < today ? 
          Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)) : 0

        return {
          id: emi.id,
          emi_number: emi.emi_number,
          due_date: emi.due_date,
          amount: emi.amount,
          paid_amount: emi.paid_amount,
          status: emi.status,
          days_overdue: daysOverdue,
          late_fee: emi.late_fee
        }
      })

      console.log('✅ BORROWER - Upcoming EMIs loaded:', processedEMIs.length)
      setUpcomingEMIs(processedEMIs)
      
    } catch (error: any) {
      console.error('❌ BORROWER - Failed to load EMIs:', error)
      setUpcomingEMIs([])
    } finally {
      setIsLoadingEMIs(false)
    }
  }

  // Load recent payments
  const loadRecentPayments = async () => {
    try {
      console.log('📊 BORROWER - Loading recent payments...')
      setIsLoadingPayments(true)
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          loans!inner (
            borrower_id,
            loan_number
          ),
          emis (
            emi_number
          )
        `)
        .eq('loans.borrower_id', user?.id)
        .order('payment_date', { ascending: false })
        .limit(10)

      if (paymentsError) {
        console.warn('⚠️ BORROWER - Recent payments warning:', paymentsError)
        setRecentPayments([])
        return
      }

      // Process payment data
      const processedPayments: PaymentHistory[] = (paymentsData || []).map(payment => ({
        id: payment.id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        payment_reference: payment.payment_reference,
        emi_number: payment.emis?.emi_number || 0,
        loan_number: (payment.loans as any)?.loan_number || 'Unknown'
      }))

      console.log('✅ BORROWER - Recent payments loaded:', processedPayments.length)
      setRecentPayments(processedPayments)
      
    } catch (error: any) {
      console.error('❌ BORROWER - Failed to load payments:', error)
      setRecentPayments([])
    } finally {
      setIsLoadingPayments(false)
    }
  }

  // Update dashboard statistics
  const updateStats = (loans: BorrowerLoan[], emis: EMIDetails[], payments: PaymentHistory[]) => {
    const totalOutstanding = loans.reduce((sum, loan) => sum + loan.outstanding_balance, 0)
    const overdueAmount = loans.reduce((sum, loan) => sum + loan.overdue_amount, 0)
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
    
    // Find next EMI
    const nextEMI = loans
      .filter(l => l.next_emi_date)
      .sort((a, b) => new Date(a.next_emi_date!).getTime() - new Date(b.next_emi_date!).getTime())[0]
    
    setStats({
      totalLoans: loans.length,
      totalOutstanding: totalOutstanding,
      nextEMIAmount: nextEMI?.next_emi_amount || 0,
      nextEMIDays: nextEMI?.days_until_next_emi || 0,
      overdueAmount: overdueAmount,
      totalPaid: totalPaid
    })
  }

  // Update stats when data changes
  React.useEffect(() => {
    updateStats(loans, upcomingEMIs, recentPayments)
  }, [loans, upcomingEMIs, recentPayments])

  // Sign out handler
  const handleSignOut = React.useCallback(async () => {
    if (isSigningOut) return
    
    console.log('🚪 BORROWER - Sign out clicked')
    setIsSigningOut(true)
    
    try {
      await signOut()
      console.log('✅ BORROWER - Sign out completed')
      setRedirectHandled(false)
      router.replace('/login')
    } catch (error) {
      console.error('❌ BORROWER - Sign out error:', error)
      setRedirectHandled(false)
      router.replace('/login')
    }
  }, [isSigningOut, signOut, router])

  // View handlers
  const handleViewLoanDetails = (loanId: string) => {
    setSelectedLoanId(loanId)
    setViewMode('loan-details')
  }

  const handleViewPaymentHistory = () => {
    setViewMode('payment-history')
  }

  const handleViewEMISchedule = (loanId: string) => {
    setSelectedLoanId(loanId)
    setViewMode('emi-schedule')
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

  // Get loan status color
  const getLoanStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'disbursed': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  // Get EMI urgency color
  const getEMIUrgencyColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'text-red-600 bg-red-50 border-red-200'
    if (daysUntil <= 3) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (daysUntil <= 7) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  // Loading state
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading borrower dashboard...</p>
        </div>
      </div>
    )
  }

  // Auth error states
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (!isBorrower) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Borrower Access Required</h2>
          <p className="text-sm text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
     {/* Enhanced Header with Role Switch */}
<div className="bg-white shadow">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center py-4">
      <div className="flex items-center">
        <User className="h-8 w-8 text-blue-600 mr-3" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Loans</h1>
          <p className="text-sm text-gray-600">Welcome, {user?.full_name || user?.email}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* NEW: Role Switch Buttons */}
        {canBecomeLender && (
          <button
            onClick={handleBecomeLender}
            disabled={isUpgrading}
            className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            {isUpgrading ? 'Upgrading...' : 'Become Lender'}
          </button>
        )}
        
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </button>

        {isBoth && (
          <button
            onClick={() => router.push('/dashboard/lender')}
            className="inline-flex items-center bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Switch to Lender View
          </button>
        )}
        
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isSigningOut ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  </div>
</div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert for overdue payments */}
        {stats.overdueAmount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-red-800 font-medium">Overdue Payment Alert</h3>
                <p className="text-red-700 text-sm mt-1">
                  You have {formatCurrency(stats.overdueAmount)} in overdue payments. 
                  Please contact your lender or make payment immediately to avoid additional charges.
                </p>
              </div>
              <button className="text-red-600 hover:text-red-800">
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLoans}</p>
                <p className="text-xs text-gray-500">Total loans</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalOutstanding)}</p>
                <p className="text-xs text-gray-500">Amount due</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Next EMI</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.nextEMIAmount)}</p>
                <p className="text-xs text-gray-500">
                  {stats.nextEMIDays > 0 ? `In ${stats.nextEMIDays} days` : 
                   stats.nextEMIDays === 0 ? 'Due today' : 
                   `${Math.abs(stats.nextEMIDays)} days overdue`}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid Till Date</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
                <p className="text-xs text-gray-500">Total payments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
              <Receipt className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">View all your payment records and transaction history</p>
            <button 
              onClick={handleViewPaymentHistory}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
            >
              View History
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Contact Lender</h3>
              <Phone className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">Get in touch with your lender for support or queries</p>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              Contact Now
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Payment Instructions</h3>
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">Learn how to make payments and set up reminders</p>
            <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
              Learn More
            </button>
          </div>
        </div>

        {/* Active Loans */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">My Active Loans</h3>
              <span className="text-sm text-gray-500">{loans.length} active</span>
            </div>
          </div>

          <div className="p-6">
            {isLoadingLoans ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading loans...</p>
              </div>
            ) : loans.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Loans</h4>
                <p className="text-gray-600">You don't have any active loans at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loans.map((loan) => (
                  <div key={loan.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{loan.loan_number}</h4>
                        <p className="text-sm text-gray-600">Lender: {loan.lender_name}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getLoanStatusColor(loan.status)}`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="space-y-3 text-gray-900">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Outstanding:</span>
                        <span className="font-bold text-red-600">{formatCurrency(loan.outstanding_balance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Amount:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(loan.total_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">EMI Progress:</span>
                        <span className="font-medium text-gray-900">
                          {loan.paid_emis}/{loan.total_emis} 
                          <span className="text-xs text-gray-500 ml-1">({loan.pending_emis} pending)</span>
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Completion</span>
                          <span>{loan.total_emis > 0 ? Math.round((loan.paid_emis / loan.total_emis) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${loan.total_emis > 0 ? (loan.paid_emis / loan.total_emis) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {loan.next_emi_date && (
                        <div className={`p-3 rounded-lg border ${getEMIUrgencyColor(loan.days_until_next_emi)}`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Next EMI Due</p>
                              <p className="text-sm">{formatDate(loan.next_emi_date)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(loan.next_emi_amount)}</p>
                              <p className="text-xs">
                                {loan.days_until_next_emi > 0 ? `${loan.days_until_next_emi} days left` : 
                                 loan.days_until_next_emi === 0 ? 'Due today' : 
                                 `${Math.abs(loan.days_until_next_emi)} days overdue`}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {loan.is_overdue && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-red-900">Overdue Amount</p>
                              <p className="text-sm text-red-700">{formatCurrency(loan.overdue_amount)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button 
                        onClick={() => handleViewLoanDetails(loan.id)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => handleViewEMISchedule(loan.id)}
                        className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                      >
                        EMI Schedule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming EMIs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Upcoming EMIs (Next 30 Days)</h3>
          </div>

          <div className="p-6">
            {isLoadingEMIs ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading EMIs...</p>
              </div>
            ) : upcomingEMIs.length === 0 ? (
              <div className="text-center py-4">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-600">No upcoming EMIs in the next 30 days.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEMIs.slice(0, 5).map((emi) => (
                  <div key={emi.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        emi.days_overdue > 0 ? 'bg-red-500' :
                        new Date(emi.due_date).getTime() - new Date().getTime() <= 3 * 24 * 60 * 60 * 1000 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">EMI #{emi.emi_number}</p>
                        <p className="text-sm text-gray-600">{formatDate(emi.due_date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(emi.amount - (emi.paid_amount || 0))}</p>
                      <p className={`text-xs ${
                        emi.days_overdue > 0 ? 'text-red-600' :
                        new Date(emi.due_date).getTime() - new Date().getTime() <= 3 * 24 * 60 * 60 * 1000 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {emi.days_overdue > 0 ? `${emi.days_overdue} days overdue` :
                         Math.ceil((new Date(emi.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) <= 3 ? 'Due soon' :
                         'On track'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recent Payments</h3>
              <button 
                onClick={handleViewPaymentHistory}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View All →
              </button>
            </div>
          </div>

          <div className="p-6">
            {isLoadingPayments ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading payments...</p>
              </div>
            ) : recentPayments.length === 0 ? (
              <div className="text-center py-4">
                <Receipt className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-600">No payment history available.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPayments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
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
                      <p className="font-medium text-green-600">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-gray-500">Paid</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}