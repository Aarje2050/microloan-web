// File: src/app/dashboard/lender/page.tsx 
// Updated lender dashboard with payment recording integration

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  Briefcase, Users, CreditCard, DollarSign, Plus, 
  Clock, AlertTriangle, TrendingUp, LogOut, Home, Eye, Receipt 
} from 'lucide-react'
import AddBorrowerForm from '@/components/forms/add-borrower-form'
import CreateLoanForm from '@/components/forms/loan/create-loan-form'
import RecordPaymentForm from '@/components/forms/loan/record-payment-form'

interface Borrower {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  employment_type: string | null
  monthly_income: number | null
  credit_score: number | null
  kyc_status: string
  created_at: string
}

interface LoanSummary {
  id: string
  loan_number: string
  borrower_name: string
  principal_amount: number
  total_amount: number
  status: string
  disbursement_date: string
  pending_emis: number
  total_emis: number
  paid_emis: number
  outstanding_balance: number
  next_due_date: string | null
  next_due_amount: number
}

type ViewMode = 'dashboard' | 'add-borrower' | 'create-loan' | 'record-payment'

export default function LenderDashboard() {
  const router = useRouter()
  const { user, signOut, isLender, initialized, isAuthenticated } = useAuth()
  
  // ✅ ALL HOOKS AT TOP LEVEL
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const [redirectHandled, setRedirectHandled] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>('dashboard')
  const [selectedBorrowerForLoan, setSelectedBorrowerForLoan] = React.useState<string>('')
  const [selectedLoanForPayment, setSelectedLoanForPayment] = React.useState<string>('')
  const [borrowers, setBorrowers] = React.useState<Borrower[]>([])
  const [loans, setLoans] = React.useState<LoanSummary[]>([])
  const [isLoadingBorrowers, setIsLoadingBorrowers] = React.useState(true)
  const [isLoadingLoans, setIsLoadingLoans] = React.useState(true)
  const [stats, setStats] = React.useState({
    totalBorrowers: 0,
    activeLoans: 0,
    portfolioValue: 0,
    collectionRate: 95,
    overdueAmount: 0,
    paymentsToday: 0
  })

  console.log('💼 LENDER DASHBOARD - State:', { 
    user: user?.email, 
    isLender, 
    initialized,
    isAuthenticated,
    viewMode,
    borrowersCount: borrowers.length,
    loansCount: loans.length
  })

  // ✅ SINGLE useEffect for auth handling
  React.useEffect(() => {
    if (!initialized) return
    if (redirectHandled) return

    if (!isAuthenticated) {
      console.log('🚫 LENDER - Not authenticated, redirecting to login')
      setRedirectHandled(true)
      router.replace('/login')
      return
    }

    if (!isLender) {
      console.log('🚫 LENDER - Not lender, redirecting to dashboard')
      setRedirectHandled(true) 
      router.replace('/dashboard')
      return
    }

    console.log('✅ LENDER - Access granted')
  }, [initialized, isAuthenticated, isLender, redirectHandled, router])

  // Load dashboard data
  React.useEffect(() => {
    if (!user || !isLender) return
    
    loadDashboardData()
  }, [user, isLender])

  // ENHANCED: Load borrowers and loan statistics
  const loadDashboardData = async () => {
    if (!user) return
    
    try {
      console.log('📊 LENDER - Loading dashboard data for lender:', user.id)
      setIsLoadingBorrowers(true)
      setIsLoadingLoans(true)

      // Load borrowers and loans in parallel
      await Promise.all([
        loadBorrowers(),
        loadLoans()
      ])
      
    } catch (error: any) {
      console.error('❌ LENDER - Failed to load dashboard data:', error)
    }
  }

  // Load borrowers
  const loadBorrowers = async () => {
    try {
      // Step 1: Get borrowers for this lender
      const { data: borrowersData, error: borrowersError } = await supabase
        .from('borrowers')
        .select(`
          id,
          user_id,
          credit_score,
          employment_type,
          monthly_income,
          created_at
        `)
        .eq('lender_id', user?.id)
        .order('created_at', { ascending: false })

      if (borrowersError) throw borrowersError

      if (!borrowersData || borrowersData.length === 0) {
        setBorrowers([])
        return
      }

      // Step 2: Get user details separately
      const userIds = borrowersData.map(b => b.user_id)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .in('id', userIds)

      if (usersError) throw usersError

      // Step 3: Get user profiles (optional)
      let profilesData: any[] = []
      try {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, kyc_status')
          .in('user_id', userIds)
        profilesData = profiles || []
      } catch (profileError) {
        console.log('⚠️ LENDER - Profiles table might not exist:', profileError)
      }

      // Step 4: Combine data
      const transformedBorrowers: Borrower[] = borrowersData.map(borrower => {
        const userInfo = usersData?.find(u => u.id === borrower.user_id)
        const profileInfo = profilesData.find(p => p.user_id === borrower.user_id)

        return {
          id: borrower.id,
          user_id: borrower.user_id,
          full_name: userInfo?.full_name || 'N/A',
          email: userInfo?.email || 'N/A',
          phone: userInfo?.phone || 'N/A',
          employment_type: borrower.employment_type,
          monthly_income: borrower.monthly_income,
          credit_score: borrower.credit_score,
          kyc_status: profileInfo?.kyc_status || 'pending',
          created_at: borrower.created_at
        }
      })

      setBorrowers(transformedBorrowers)
      
    } catch (error: any) {
      console.error('❌ LENDER - Failed to load borrowers:', error)
      setBorrowers([])
    } finally {
      setIsLoadingBorrowers(false)
    }
  }

  // Load loans with EMI information
 // COMPLETE FIXED: Load loans with proper EMI calculation
const loadLoans = async () => {
  try {
    console.log('📊 LENDER - Loading loans with EMI data...')
    
    // Get loans directly from loans table
    const { data: loansData, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('created_by', user?.id)
      // Remove status filter to see all loans
      .order('created_at', { ascending: false })

    if (loansError) throw loansError

    if (!loansData || loansData.length === 0) {
      console.log('No loans found')
      setLoans([])
      updateStats([], 0, 0, 0)
      return
    }

    console.log('📋 LOANS RAW DATA:', loansData.length, 'loans found')

    // Get borrower names - FIXED variable declaration
    const borrowerIds = loansData.map(l => l.borrower_id)
    const { data: borrowersData, error: borrowersError } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', borrowerIds)

    if (borrowersError) {
      console.warn('⚠️ Borrowers query warning:', borrowersError)
    }

    // Get EMI data for all loans
    const loanIds = loansData.map(l => l.id)
    const { data: emisData, error: emisError } = await supabase
      .from('emis')
      .select('*')
      .in('loan_id', loanIds)
      .order('emi_number', { ascending: true })

    if (emisError) {
      console.warn('⚠️ LENDER - EMIs query warning:', emisError)
    }

    console.log('📋 EMI DATA:', (emisData || []).length, 'EMIs found')

    // Process loan summaries with real EMI data - COMPLETE FIX
    const transformedLoans: LoanSummary[] = loansData.map(loan => {
      const borrower = borrowersData?.find(b => b.id === loan.borrower_id)
      const loanEMIs = (emisData || []).filter(e => e.loan_id === loan.id)
      
      // Calculate EMI statistics with proper status detection
      const totalEMIs = loanEMIs.length
      
      // CORRECTED: Check actual payment amounts vs EMI amounts
      const paidEMIs = loanEMIs.filter(e => {
        const paidAmount = e.paid_amount || 0
        return paidAmount >= e.amount // Fully paid
      }).length
      
      const partialEMIs = loanEMIs.filter(e => {
        const paidAmount = e.paid_amount || 0
        return paidAmount > 0 && paidAmount < e.amount // Partially paid
      })
      
      const pendingEMIs = loanEMIs.filter(e => {
        const paidAmount = e.paid_amount || 0
        return paidAmount === 0 // Not paid at all
      })
      
      // Calculate outstanding balance - FIXED calculation
      const totalPaid = loanEMIs.reduce((sum, emi) => {
        const paidAmount = emi.paid_amount || 0
        return sum + Math.min(paidAmount, emi.amount) // Don't count overpayments in total
      }, 0)
      
      const outstandingBalance = Math.max(0, (loan.total_amount || loan.principal_amount) - totalPaid)
      
      // Find next due EMI (earliest unpaid/partial)
      const unpaidEMIs = [...partialEMIs, ...pendingEMIs]
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      const nextDueEMI = unpaidEMIs[0]
      
      const result = {
        id: loan.id,
        loan_number: loan.loan_number || `LOAN-${loan.id.slice(0, 8)}`,
        borrower_name: borrower?.full_name || 'Unknown',
        principal_amount: loan.principal_amount,
        total_amount: loan.total_amount || loan.principal_amount,
        status: loan.status,
        disbursement_date: loan.disbursement_date || loan.created_at,
        pending_emis: pendingEMIs.length + partialEMIs.length,
        total_emis: totalEMIs,
        paid_emis: paidEMIs,
        outstanding_balance: outstandingBalance,
        next_due_date: nextDueEMI?.due_date || null,
        next_due_amount: nextDueEMI ? (nextDueEMI.amount - (nextDueEMI.paid_amount || 0)) : 0
      }
      
      console.log('📋 PROCESSED LOAN:', {
        loan_number: result.loan_number,
        total_emis: result.total_emis,
        paid_emis: result.paid_emis,
        pending_emis: result.pending_emis,
        outstanding: result.outstanding_balance
      })
      
      return result
    })

    console.log('✅ LOANS TRANSFORMED:', transformedLoans.length, 'loans processed')
    setLoans(transformedLoans)
    
    // Calculate portfolio statistics
    const totalPortfolio = transformedLoans.reduce((sum, loan) => sum + loan.total_amount, 0)
    const totalOutstanding = transformedLoans.reduce((sum, loan) => sum + loan.outstanding_balance, 0)
    const totalPaid = totalPortfolio - totalOutstanding
    
    updateStats(transformedLoans, totalPortfolio, totalPaid, 0)
    
    console.log('📊 FINAL STATS:', {
      loans: transformedLoans.length,
      portfolio: totalPortfolio,
      outstanding: totalOutstanding
    })
    
  } catch (error: any) {
    console.error('❌ LENDER - Failed to load loans:', error)
    setLoans([])
    updateStats([], 0, 0, 0)
  } finally {
    setIsLoadingLoans(false)
  }
}

  // Update dashboard statistics
  const updateStats = (loans: LoanSummary[], portfolioValue: number, totalPaid: number, overdueAmount: number) => {
    const collectionRate = portfolioValue > 0 ? Math.round((totalPaid / portfolioValue) * 100) : 0
    
    setStats({
      totalBorrowers: borrowers.length,
      activeLoans: loans.length,
      portfolioValue: portfolioValue,
      collectionRate: Math.min(collectionRate, 100),
      overdueAmount: overdueAmount,
      paymentsToday: 0 // TODO: Calculate today's payments
    })
  }

  // ✅ CLEAN SIGN OUT HANDLER
  const handleSignOut = React.useCallback(async () => {
    if (isSigningOut) return
    
    console.log('🚪 LENDER - Sign out clicked')
    setIsSigningOut(true)
    
    try {
      await signOut()
      console.log('✅ LENDER - Sign out completed')
      setRedirectHandled(false)
      router.replace('/login')
    } catch (error) {
      console.error('❌ LENDER - Sign out error:', error)
      setRedirectHandled(false)
      router.replace('/login')
    }
  }, [isSigningOut, signOut, router])

  // Handle success callbacks
  const handleAddBorrowerSuccess = () => {
    console.log('🎉 LENDER - Borrower added successfully')
    setViewMode('dashboard')
    loadDashboardData()
  }

  const handleCreateLoanSuccess = (loanId: string) => {
    console.log('🎉 LENDER - Loan created successfully:', loanId)
    setViewMode('dashboard')
    setSelectedBorrowerForLoan('')
    loadDashboardData()
  }

  const handleRecordPaymentSuccess = (paymentId: string) => {
    console.log('🎉 LENDER - Payment recorded successfully:', paymentId)
    setViewMode('dashboard')
    setSelectedLoanForPayment('')
    loadDashboardData()
  }

  // Handle actions
  const handleCreateLoanForBorrower = (borrowerId: string) => {
    console.log('💰 LENDER - Creating loan for borrower:', borrowerId)
    setSelectedBorrowerForLoan(borrowerId)
    setViewMode('create-loan')
  }

  const handleRecordPaymentForLoan = (loanId: string) => {
    console.log('💳 LENDER - Recording payment for loan:', loanId)
    setSelectedLoanForPayment(loanId)
    setViewMode('record-payment')
  }

  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (!amount) return '₹0'
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

  // ✅ LOADING STATE
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading lender dashboard...</p>
        </div>
      </div>
    )
  }

  // ✅ NOT AUTHENTICATED STATE
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Briefcase className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // ✅ NOT LENDER STATE
  if (!isLender) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Briefcase className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Lender Access Required</h2>
          <p className="text-sm text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  // Show different views based on mode
  if (viewMode === 'add-borrower') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <AddBorrowerForm
            onSuccess={handleAddBorrowerSuccess}
            onCancel={() => setViewMode('dashboard')}
          />
        </div>
      </div>
    )
  }

  if (viewMode === 'create-loan') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <CreateLoanForm
            borrowerId={selectedBorrowerForLoan}
            onSuccess={handleCreateLoanSuccess}
            onCancel={() => {
              setViewMode('dashboard')
              setSelectedBorrowerForLoan('')
            }}
          />
        </div>
      </div>
    )
  }

  if (viewMode === 'record-payment') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <RecordPaymentForm
            loanId={selectedLoanForPayment}
            onSuccess={handleRecordPaymentSuccess}
            onCancel={() => {
              setViewMode('dashboard')
              setSelectedLoanForPayment('')
            }}
          />
        </div>
      </div>
    )
  }

  // ✅ MAIN LENDER DASHBOARD CONTENT
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lender Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.full_name || user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </button>
              
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
        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">My Borrowers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBorrowers}</p>
                <p className="text-xs text-gray-500">Active borrowers</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeLoans}</p>
                <p className="text-xs text-gray-500">Loans disbursed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.portfolioValue)}</p>
                <p className="text-xs text-gray-500">Total outstanding</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.collectionRate}%</p>
                <p className="text-xs text-gray-500">Overall performance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Borrower</h3>
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">Register a new borrower with minimal required information</p>
            <button 
              onClick={() => setViewMode('add-borrower')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Borrower
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New Loan</h3>
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">Issue a new loan to an existing borrower</p>
            <button 
              onClick={() => setViewMode('create-loan')}
              disabled={borrowers.length === 0}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Create Loan
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Record Payment</h3>
              <Receipt className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">Record EMI payments and update loan status</p>
            <button 
              onClick={() => setViewMode('record-payment')}
              disabled={loans.length === 0}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Record Payment
            </button>
          </div>
        </div>

        {/* Active Loans Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Active Loans</h3>
              <span className="text-sm text-gray-500">{loans.length} active</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoadingLoans ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading loans...</p>
              </div>
            ) : loans.length === 0 ? (
              <div className="p-6 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Loans</h4>
                <p className="text-gray-600 mb-4">Create loans for your borrowers to start managing payments.</p>
                <button 
                  onClick={() => setViewMode('create-loan')}
                  disabled={borrowers.length === 0}
                  className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Loan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loans.map((loan) => (
                  <div key={loan.id} className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{loan.loan_number}</h4>
                        <p className="text-sm text-gray-600">{loan.borrower_name}</p>
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
                        <span className="text-sm text-gray-600">EMIs:</span>
                        <span className="font-medium text-gray-900">
                          {loan.paid_emis}/{loan.total_emis} 
                          <span className="text-xs text-gray-500 ml-1">({loan.pending_emis} pending)</span>
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{loan.total_emis > 0 ? Math.round((loan.paid_emis / loan.total_emis) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${loan.total_emis > 0 ? (loan.paid_emis / loan.total_emis) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {loan.next_due_date && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Next Due:</span>
                            <span className="font-medium text-gray-900">{formatDate(loan.next_due_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Next Amount:</span>
                            <span className="font-bold text-green-600">{formatCurrency(loan.next_due_amount)}</span>
                          </div>
                        </>
                      )}
                      {loan.pending_emis === 0 && (
                        <div className="bg-green-50 border border-green-200 p-2 rounded text-center">
                          <span className="text-sm text-green-800 font-medium">✅ Fully Paid</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button 
                        onClick={() => handleRecordPaymentForLoan(loan.id)}
                        disabled={loan.pending_emis === 0}
                        className="flex-1 bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {loan.pending_emis === 0 ? 'Paid' : 'Record Payment'}
                      </button>
                      <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Borrowers List */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">My Borrowers</h3>
              <span className="text-sm text-gray-500">{borrowers.length} total</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoadingBorrowers ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading borrowers...</p>
              </div>
            ) : borrowers.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Borrowers Yet</h4>
                <p className="text-gray-600 mb-4">Start by adding your first borrower to begin managing loans.</p>
                <button 
                  onClick={() => setViewMode('add-borrower')}
                  className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Borrower
                </button>
              </div>
            ) : (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {borrowers.slice(0, 6).map((borrower) => (
                    <div key={borrower.id} className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{borrower.full_name}</h4>
                          <p className="text-sm text-gray-600">{borrower.email}</p>
                          {borrower.monthly_income && (
                            <p className="text-sm text-gray-500 mt-1">
                              Income: {formatCurrency(borrower.monthly_income)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleCreateLoanForBorrower(borrower.user_id)}
                            className="text-green-600 hover:text-green-800"
                            title="Create Loan"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                          <button className="text-blue-600 hover:text-blue-800" title="View Details">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {borrowers.length > 6 && (
                  <div className="mt-4 text-center">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View all {borrowers.length} borrowers →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="text-green-800 font-medium mb-4">✅ System Status:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-green-700">✅ Add Borrower - WORKING!</p>
              <p className="text-green-700">✅ Create Loan - WORKING!</p>
              <p className="text-green-700">✅ Record Payment - NEW FEATURE!</p>
              <p className="text-green-700">✅ Payment Flexibility - ENTERPRISE GRADE!</p>
            </div>
            <div>
              <p className="text-green-700">🔄 Next: Admin dashboard</p>
              <p className="text-green-700">🔄 Then: Mobile optimization</p>
              <p className="text-green-700">🔄 Then: Advanced analytics</p>
              <p className="text-green-700">🔄 Then: Automated notifications</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}