// app/dashboard/borrower/loans/[id]/page.tsx - LOAN DETAILS PAGE
'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/dashboard-layout'
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  User,
  Phone,
  Mail,
  FileText,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calculator,
  Share,
  BarChart3,
  PieChart,
  IndianRupee,
  Building,
  Hash,
  Percent,
  CalendarDays,
  Target,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoanDetails {
  id: string
  loan_number: string
  borrower_id: string
  lender_id: string
  lender_name: string
  lender_email: string
  lender_phone: string | null
  principal_amount: number
  total_amount: number
  interest_rate: number
  processing_fee: number | null
  tenure_months: number
  repayment_frequency: string
  status: string
  disbursement_date: string
  maturity_date: string
  created_at: string
  purpose: string | null
  collateral_details: string | null
  guarantor_details: string | null
}

interface EMIDetails {
  id: string
  emi_number: number
  due_date: string
  amount: number
  principal_component: number
  interest_component: number
  paid_amount: number | null
  payment_date: string | null
  status: string
  late_fee: number | null
  days_overdue: number
}

interface LoanSummary {
  totalEMIs: number
  paidEMIs: number
  pendingEMIs: number
  overdueEMIs: number
  totalPaid: number
  outstandingBalance: number
  nextEMIDate: string | null
  nextEMIAmount: number
  completionPercentage: number
  totalInterestPaid: number
  totalPrincipalPaid: number
  remainingInterest: number
  remainingPrincipal: number
}

interface PaymentHistory {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  payment_reference: string | null
  emi_number: number
  status: string
}

export default function LoanDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isBorrower, initialized, isAuthenticated } = useAuth()
  
  const loanId = params?.id as string
  
  // State management
  const [loan, setLoan] = React.useState<LoanDetails | null>(null)
  const [emis, setEMIs] = React.useState<EMIDetails[]>([])
  const [payments, setPayments] = React.useState<PaymentHistory[]>([])
  const [summary, setSummary] = React.useState<LoanSummary>({
    totalEMIs: 0,
    paidEMIs: 0,
    pendingEMIs: 0,
    overdueEMIs: 0,
    totalPaid: 0,
    outstandingBalance: 0,
    nextEMIDate: null,
    nextEMIAmount: 0,
    completionPercentage: 0,
    totalInterestPaid: 0,
    totalPrincipalPaid: 0,
    remainingInterest: 0,
    remainingPrincipal: 0
  })
  
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'overview' | 'schedule' | 'payments' | 'documents'>('overview')
  const [error, setError] = React.useState<string | null>(null)

  console.log('📋 LOAN DETAILS - State:', {
    loanId,
    user: user?.email,
    loan: loan?.loan_number,
    activeTab
  })

  // Auth check and data loading
  React.useEffect(() => {
    if (!initialized) return
    
    if (!isAuthenticated || !isBorrower) {
      router.replace('/dashboard/borrower')
      return
    }
    
    if (!loanId) {
      setError('Loan ID not found')
      return
    }
    
    loadLoanDetails()
  }, [initialized, isAuthenticated, isBorrower, loanId, user])

  // Load complete loan details
  const loadLoanDetails = async () => {
    if (!user || !loanId) return
    
    try {
      setIsLoading(true)
      setError(null)
      console.log('📋 Loading loan details for:', loanId)
      
      // Load loan basic information
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .eq('borrower_id', user.id)
        .single()

      if (loanError) throw loanError
      if (!loanData) throw new Error('Loan not found or access denied')

      // Load lender information
      const { data: lenderData, error: lenderError } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .eq('id', loanData.created_by)
        .single()

      if (lenderError) {
        console.warn('⚠️ Lender data warning:', lenderError)
      }

      // Load EMI schedule
      const { data: emisData, error: emisError } = await supabase
        .from('emis')
        .select('*')
        .eq('loan_id', loanId)
        .order('emi_number', { ascending: true })

      if (emisError) throw emisError

      // Load payment history
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('loan_id', loanId)
        .order('payment_date', { ascending: false })

      if (paymentsError) {
        console.warn('⚠️ Payments data warning:', paymentsError)
      }

      // Process loan data
      const processedLoan: LoanDetails = {
        id: loanData.id,
        loan_number: loanData.loan_number || `LOAN-${loanData.id.slice(0, 8)}`,
        borrower_id: loanData.borrower_id,
        lender_id: loanData.created_by,
        lender_name: lenderData?.full_name || 'Unknown Lender',
        lender_email: lenderData?.email || '',
        lender_phone: lenderData?.phone,
        principal_amount: loanData.principal_amount,
        total_amount: loanData.total_amount || loanData.principal_amount,
        interest_rate: loanData.interest_rate || 0,
        processing_fee: loanData.processing_fee,
        tenure_months: loanData.tenure_months || 12,
        repayment_frequency: loanData.repayment_frequency || 'monthly',
        status: loanData.status,
        disbursement_date: loanData.disbursement_date || loanData.created_at,
        maturity_date: loanData.maturity_date || '',
        created_at: loanData.created_at,
        purpose: loanData.purpose,
        collateral_details: loanData.collateral_details,
        guarantor_details: loanData.guarantor_details
      }

      // Process EMI data
      const today = new Date()
      const processedEMIs: EMIDetails[] = (emisData || []).map(emi => {
        const dueDate = new Date(emi.due_date)
        const daysOverdue = dueDate < today ? 
          Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)) : 0

        return {
          id: emi.id,
          emi_number: emi.emi_number,
          due_date: emi.due_date,
          amount: emi.amount,
          principal_component: emi.principal_component || 0,
          interest_component: emi.interest_component || 0,
          paid_amount: emi.paid_amount,
          payment_date: emi.payment_date,
          status: emi.status,
          late_fee: emi.late_fee,
          days_overdue: daysOverdue
        }
      })

      // Process payment data
      const processedPayments: PaymentHistory[] = (paymentsData || []).map(payment => ({
        id: payment.id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method || 'Bank Transfer',
        payment_reference: payment.payment_reference,
        emi_number: payment.emi_number || 0,
        status: payment.status || 'completed'
      }))

      // Calculate summary
      const calculatedSummary = calculateLoanSummary(processedEMIs, processedPayments, processedLoan)

      setLoan(processedLoan)
      setEMIs(processedEMIs)
      setPayments(processedPayments)
      setSummary(calculatedSummary)

      console.log('✅ Loan details loaded successfully')

    } catch (error: any) {
      console.error('❌ Failed to load loan details:', error)
      setError(error.message || 'Failed to load loan details')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate comprehensive loan summary
  const calculateLoanSummary = (emis: EMIDetails[], payments: PaymentHistory[], loan: LoanDetails): LoanSummary => {
    const today = new Date()
    
    const totalEMIs = emis.length
    const paidEMIs = emis.filter(e => (e.paid_amount || 0) >= e.amount).length
    const pendingEMIs = emis.filter(e => (e.paid_amount || 0) < e.amount)
    const overdueEMIs = pendingEMIs.filter(e => new Date(e.due_date) < today).length
    
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    const outstandingBalance = Math.max(0, loan.total_amount - totalPaid)
    
    const nextPendingEMI = pendingEMIs
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]
    
    const completionPercentage = totalEMIs > 0 ? (paidEMIs / totalEMIs) * 100 : 0
    
    // Calculate interest and principal breakdowns
    const totalInterestPaid = emis
      .filter(e => e.paid_amount && e.paid_amount >= e.amount)
      .reduce((sum, e) => sum + (e.interest_component || 0), 0)
    
    const totalPrincipalPaid = emis
      .filter(e => e.paid_amount && e.paid_amount >= e.amount)
      .reduce((sum, e) => sum + (e.principal_component || 0), 0)
    
    const remainingInterest = emis
      .filter(e => (e.paid_amount || 0) < e.amount)
      .reduce((sum, e) => sum + (e.interest_component || 0), 0)
    
    const remainingPrincipal = emis
      .filter(e => (e.paid_amount || 0) < e.amount)
      .reduce((sum, e) => sum + (e.principal_component || 0), 0)

    return {
      totalEMIs,
      paidEMIs,
      pendingEMIs: pendingEMIs.length,
      overdueEMIs,
      totalPaid,
      outstandingBalance,
      nextEMIDate: nextPendingEMI?.due_date || null,
      nextEMIAmount: nextPendingEMI ? (nextPendingEMI.amount - (nextPendingEMI.paid_amount || 0)) : 0,
      completionPercentage,
      totalInterestPaid,
      totalPrincipalPaid,
      remainingInterest,
      remainingPrincipal
    }
  }

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadLoanDetails()
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  // Navigation handlers
  const handleViewEMISchedule = () => {
    router.push(`/dashboard/borrower/loans/${loanId}/schedule`)
  }

  const handleContactLender = () => {
    if (loan?.lender_email) {
      window.location.href = `mailto:${loan.lender_email}?subject=Regarding Loan ${loan.loan_number}`
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'disbursed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  // Loading state
  if (!initialized || isLoading) {
    return (
      <DashboardLayout title="Loan Details" showBackButton>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading loan details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error || !loan) {
    return (
      <DashboardLayout title="Loan Details" showBackButton>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Loan</h2>
            <p className="text-sm text-gray-600 mb-4">{error || 'Loan not found'}</p>
            <button 
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title={loan.loan_number} 
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
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Share className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      }
    >
      <div className="bg-gray-50 min-h-screen">
        {/* Loan Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{loan.loan_number}</h1>
                <p className="text-sm text-gray-600">
                  Lender: <span className="font-medium">{loan.lender_name}</span> • 
                  Disbursed: {formatDate(loan.disbursement_date)}
                </p>
              </div>
              <span className={cn(
                'px-3 py-1 text-sm font-medium rounded-full border',
                getStatusColor(loan.status)
              )}>
                {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
              </span>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">Total Loan</p>
                <p className="text-lg font-bold text-blue-700">{formatCurrency(loan.total_amount)}</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600 uppercase tracking-wide font-medium">Outstanding</p>
                <p className="text-lg font-bold text-red-700">{formatCurrency(summary.outstandingBalance)}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 uppercase tracking-wide font-medium">Paid</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-600 uppercase tracking-wide font-medium">Progress</p>
                <p className="text-lg font-bold text-purple-700">{Math.round(summary.completionPercentage)}%</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-t border-gray-200">
            <nav className="flex space-x-8 px-4">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'schedule', label: 'EMI Schedule', icon: Calendar },
                { id: 'payments', label: 'Payments', icon: CreditCard },
                { id: 'documents', label: 'Documents', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center py-4 border-b-2 text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Loan Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Overview</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Principal Amount:</span>
                      <span className="font-medium">{formatCurrency(loan.principal_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="font-medium">{loan.interest_rate}% per annum</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tenure:</span>
                      <span className="font-medium">{loan.tenure_months} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Repayment Frequency:</span>
                      <span className="font-medium capitalize">{loan.repayment_frequency}</span>
                    </div>
                    {loan.processing_fee && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing Fee:</span>
                        <span className="font-medium">{formatCurrency(loan.processing_fee)}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Disbursement Date:</span>
                      <span className="font-medium">{formatDate(loan.disbursement_date)}</span>
                    </div>
                    {loan.maturity_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Maturity Date:</span>
                        <span className="font-medium">{formatDate(loan.maturity_date)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total EMIs:</span>
                      <span className="font-medium">{summary.totalEMIs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid EMIs:</span>
                      <span className="font-medium text-green-600">{summary.paidEMIs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining EMIs:</span>
                      <span className="font-medium text-orange-600">{summary.pendingEMIs}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Visualization */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Repayment Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Overall Progress</span>
                      <span className="font-medium">{Math.round(summary.completionPercentage)}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-700"
                        style={{ width: `${summary.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Amount Paid</p>
                      <p className="text-xl font-bold text-green-700">{formatCurrency(summary.totalPaid)}</p>
                      <p className="text-xs text-green-600 mt-1">
                        Principal: {formatCurrency(summary.totalPrincipalPaid)} | 
                        Interest: {formatCurrency(summary.totalInterestPaid)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-600 font-medium">Amount Remaining</p>
                      <p className="text-xl font-bold text-red-700">{formatCurrency(summary.outstandingBalance)}</p>
                      <p className="text-xs text-red-600 mt-1">
                        Principal: {formatCurrency(summary.remainingPrincipal)} | 
                        Interest: {formatCurrency(summary.remainingInterest)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lender Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lender Information</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <Building className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{loan.lender_name}</p>
                      <p className="text-sm text-gray-600">{loan.lender_email}</p>
                      {loan.lender_phone && (
                        <p className="text-sm text-gray-600">{loan.lender_phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleContactLender}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </button>
                    {loan.lender_phone && (
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button 
                    onClick={handleViewEMISchedule}
                    className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                  >
                    <div className="text-center">
                      <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2 group-hover:scale-105 transition-transform" />
                      <span className="text-sm font-medium text-purple-900">EMI Schedule</span>
                    </div>
                  </button>
                  
                  <button className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
                    <div className="text-center">
                      <Calculator className="h-8 w-8 text-green-600 mx-auto mb-2 group-hover:scale-105 transition-transform" />
                      <span className="text-sm font-medium text-green-900">Prepayment Calculator</span>
                    </div>
                  </button>
                  
                  <button className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                    <div className="text-center">
                      <Download className="h-8 w-8 text-blue-600 mx-auto mb-2 group-hover:scale-105 transition-transform" />
                      <span className="text-sm font-medium text-blue-900">Download Statement</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">EMI Schedule</h3>
                <button 
                  onClick={handleViewEMISchedule}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Detailed Schedule →
                </button>
              </div>
              
              <div className="space-y-3">
                {emis.slice(0, 5).map((emi) => (
                  <div key={emi.id} className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    emi.status === 'paid' ? 'bg-green-50 border-green-200' :
                    emi.days_overdue > 0 ? 'bg-red-50 border-red-200' :
                    'bg-white border-gray-200'
                  )}>
                    <div className="flex items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                        emi.status === 'paid' ? 'bg-green-100' :
                        emi.days_overdue > 0 ? 'bg-red-100' :
                        'bg-gray-100'
                      )}>
                        {emi.status === 'paid' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : emi.days_overdue > 0 ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">EMI #{emi.emi_number}</p>
                        <p className="text-sm text-gray-600">{formatDate(emi.due_date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(emi.amount)}</p>
                      <p className="text-xs text-gray-500">
                        P: {formatCurrency(emi.principal_component)} | I: {formatCurrency(emi.interest_component)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment History</h3>
              
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">No payments recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <div>
                          <p className="font-medium">EMI #{payment.emi_number}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(payment.payment_date)} • {payment.payment_method}
                            {payment.payment_reference && (
                              <span className="ml-2 text-xs">Ref: {payment.payment_reference}</span>
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
          )}

          {activeTab === 'documents' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Loan Documents</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium">Loan Agreement</span>
                  </div>
                  <p className="text-sm text-gray-600">Original loan contract and terms</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm">Download</button>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium">EMI Schedule</span>
                  </div>
                  <p className="text-sm text-gray-600">Complete repayment schedule</p>
                  <button className="mt-2 text-green-600 hover:text-green-700 text-sm">Download</button>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="font-medium">Payment Receipts</span>
                  </div>
                  <p className="text-sm text-gray-600">All payment confirmations</p>
                  <button className="mt-2 text-purple-600 hover:text-purple-700 text-sm">Download</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}