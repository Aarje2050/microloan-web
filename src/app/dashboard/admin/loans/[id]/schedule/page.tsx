// app/dashboard/admin/loans/[id]/schedule/page.tsx - LOAN SCHEDULE (Professional Design & Working Functionality)
'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  ArrowLeft,
  Calendar,
  CreditCard,
  User,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Download,
  Receipt,
  FileText,
  TrendingUp,
  TrendingDown,
  Phone,
  Mail,
  Edit,
  Eye,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

// Simple interfaces
interface LoanDetails {
  id: string
  loan_number: string
  borrower_id: string
  borrower_name: string
  borrower_email: string
  borrower_phone: string | null
  lender_id: string
  lender_name: string
  lender_email: string
  principal_amount: number
  total_amount: number
  interest_rate: number
  tenure_value: number
  tenure_unit: string
  loan_type: string
  repayment_frequency: string
  status: string
  disbursement_date: string | null
  maturity_date: string | null
  created_at: string
  approved_at: string | null
  notes: string | null
}

interface EMIScheduleItem {
  id: string
  emi_number: number
  due_date: string
  amount: number
  status: string
  paid_date: string | null
  paid_amount: number
  principal_amount: number
  interest_amount: number
  late_fee: number
  penalty_amount: number
  outstanding_balance: number
  payment_status: string | null
  days_overdue: number
  calculated_status: string
  is_overdue: boolean
  is_paid: boolean
  remaining_amount: number
  total_payable: number
}

interface EMIActionModalProps {
  emi: EMIScheduleItem | null
  isOpen: boolean
  onClose: () => void
  onMarkPaid: (emi: EMIScheduleItem) => void
  onAddPayment: (emi: EMIScheduleItem) => void
}

function EMIActionModal({ emi, isOpen, onClose, onMarkPaid, onAddPayment }: EMIActionModalProps) {
  if (!isOpen || !emi) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200'
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'due_today': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'partial': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">EMI #{emi.emi_number}</h3>
              <p className="text-sm text-gray-500 mt-1">{formatDate(emi.due_date)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status */}
          <div className="text-center">
            <span className={cn(
              'px-4 py-2 text-sm font-medium rounded-full border',
              getStatusColor(emi.calculated_status)
            )}>
              {emi.calculated_status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">EMI Amount</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(emi.amount)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Paid Amount</p>
              <p className={cn(
                "text-lg font-bold",
                emi.paid_amount > 0 ? "text-green-600" : "text-gray-900"
              )}>
                {formatCurrency(emi.paid_amount)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Remaining</p>
              <p className={cn(
                "text-lg font-bold",
                emi.remaining_amount > 0 ? "text-red-600" : "text-green-600"
              )}>
                {formatCurrency(emi.remaining_amount)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Due</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(emi.total_payable)}</p>
            </div>
          </div>

          {/* EMI Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Principal:</span>
                <span className="font-medium">{formatCurrency(emi.principal_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interest:</span>
                <span className="font-medium">{formatCurrency(emi.interest_amount)}</span>
              </div>
              {emi.late_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-red-600">Late Fee:</span>
                  <span className="font-medium text-red-600">{formatCurrency(emi.late_fee)}</span>
                </div>
              )}
              {emi.penalty_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-red-600">Penalty:</span>
                  <span className="font-medium text-red-600">{formatCurrency(emi.penalty_amount)}</span>
                </div>
              )}
            </div>
          </div>

          {emi.is_overdue && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">
                  {emi.days_overdue} days overdue
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex space-x-3">
            {!emi.is_paid && (
              <>
                <Button
                  onClick={() => onMarkPaid(emi)}
                  className="flex-1"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onAddPayment(emi)}
                  className="flex-1"
                  size="sm"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </>
            )}
            {emi.is_paid && (
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                size="sm"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoanSchedulePage() {
  const router = useRouter()
  const params = useParams()
  const { user, isAdmin, initialized, isAuthenticated } = useAuth()
  
  // Simple state
  const [loan, setLoan] = React.useState<LoanDetails | null>(null)
  const [schedule, setSchedule] = React.useState<EMIScheduleItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedEMI, setSelectedEMI] = React.useState<EMIScheduleItem | null>(null)
  const [showEMIModal, setShowEMIModal] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  const loanId = params?.id as string

  console.log('📋 LOAN SCHEDULE - State:', { 
    loanId,
    user: user?.email, 
    isAdmin, 
    loan: loan?.loan_number,
    scheduleCount: schedule.length
  })

  // Auth handling
  React.useEffect(() => {
    if (!initialized) return

    if (!isAuthenticated) {
      console.log('🚫 LOAN SCHEDULE - Not authenticated, redirecting to login')
      router.replace('/login')
      return
    }

    if (!isAdmin) {
      console.log('🚫 LOAN SCHEDULE - Not admin, redirecting to dashboard')
      router.replace('/dashboard')
      return
    }

    console.log('✅ LOAN SCHEDULE - Access granted')
  }, [initialized, isAuthenticated, isAdmin, router])

  // Load loan and schedule data
  React.useEffect(() => {
    if (!user || !isAdmin || !loanId) return
    loadLoanSchedule()
  }, [user, isAdmin, loanId])

  const calculateEMIStatus = (emi: any): string => {
    const today = new Date()
    const dueDate = new Date(emi.due_date)
    const isPaid = (emi.paid_amount || 0) >= emi.amount
    const isPartiallyPaid = (emi.paid_amount || 0) > 0 && (emi.paid_amount || 0) < emi.amount
    
    if (isPaid) return 'paid'
    if (isPartiallyPaid) return 'partial'
    if (dueDate < today) return 'overdue'
    if (dueDate.toDateString() === today.toDateString()) return 'due_today'
    return 'upcoming'
  }

  const loadLoanSchedule = async () => {
    if (!user || !loanId) return

    try {
      console.log('📋 LOAN SCHEDULE - Loading loan and schedule for:', loanId)
      setLoading(true)
      setError(null)

      // Get loan details
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single()

      if (loanError) throw loanError
      if (!loanData) throw new Error('Loan not found')

      // Get borrower details
      const { data: borrowerData, error: borrowerError } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .eq('id', loanData.borrower_id)
        .single()

      if (borrowerError) {
        console.warn('⚠️ LOAN SCHEDULE - Borrower query warning:', borrowerError)
      }

      // Get lender details
      const { data: lenderData, error: lenderError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', loanData.created_by || loanData.lender_id)
        .single()

      if (lenderError) {
        console.warn('⚠️ LOAN SCHEDULE - Lender query warning:', lenderError)
      }

      // Get EMI schedule
      const { data: emisData, error: emisError } = await supabase
        .from('emis')
        .select('*')
        .eq('loan_id', loanId)
        .order('emi_number', { ascending: true })

      if (emisError) throw emisError

      // Transform loan data
      const transformedLoan: LoanDetails = {
        id: loanData.id,
        loan_number: loanData.loan_number || `LOAN-${loanData.id.slice(0, 8)}`,
        borrower_id: loanData.borrower_id,
        borrower_name: borrowerData?.full_name || 'Unknown Borrower',
        borrower_email: borrowerData?.email || '',
        borrower_phone: borrowerData?.phone,
        lender_id: loanData.created_by || loanData.lender_id,
        lender_name: lenderData?.full_name || 'Unknown Lender',
        lender_email: lenderData?.email || '',
        principal_amount: loanData.principal_amount,
        total_amount: loanData.total_amount || loanData.principal_amount,
        interest_rate: loanData.interest_rate || 0,
        tenure_value: loanData.tenure_value,
        tenure_unit: loanData.tenure_unit,
        loan_type: loanData.loan_type || 'personal',
        repayment_frequency: loanData.repayment_frequency || 'monthly',
        status: loanData.status,
        disbursement_date: loanData.disbursement_date,
        maturity_date: loanData.maturity_date,
        created_at: loanData.created_at,
        approved_at: loanData.approved_at,
        notes: loanData.notes
      }

      // Transform EMI schedule
      const transformedSchedule: EMIScheduleItem[] = (emisData || []).map(emi => {
        const paidAmount = emi.paid_amount || 0
        const remainingAmount = Math.max(0, emi.amount - paidAmount)
        const totalPayable = emi.amount + (emi.late_fee || 0) + (emi.penalty_amount || 0)
        const calculatedStatus = calculateEMIStatus(emi)
        const today = new Date()
        const dueDate = new Date(emi.due_date)
        const daysOverdue = dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

        return {
          id: emi.id,
          emi_number: emi.emi_number,
          due_date: emi.due_date,
          amount: emi.amount,
          status: emi.status,
          paid_date: emi.paid_date,
          paid_amount: paidAmount,
          principal_amount: emi.principal_amount || 0,
          interest_amount: emi.interest_amount || 0,
          late_fee: emi.late_fee || 0,
          penalty_amount: emi.penalty_amount || 0,
          outstanding_balance: emi.outstanding_balance || 0,
          payment_status: emi.payment_status,
          days_overdue: daysOverdue,
          calculated_status: calculatedStatus,
          is_overdue: calculatedStatus === 'overdue',
          is_paid: calculatedStatus === 'paid',
          remaining_amount: remainingAmount,
          total_payable: totalPayable
        }
      })

      setLoan(transformedLoan)
      setSchedule(transformedSchedule)
      console.log('✅ LOAN SCHEDULE - Data loaded:', {
        loan: transformedLoan.loan_number,
        emisCount: transformedSchedule.length
      })

    } catch (error: unknown) {
      console.error('❌ LOAN SCHEDULE - Failed to load:', error)
      setError(error instanceof Error ? error.message : 'Failed to load loan schedule')
      setLoan(null)
      setSchedule([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadLoanSchedule()
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  // EMI actions
  const handleMarkPaid = async (emi: EMIScheduleItem) => {
    try {
      setActionLoading(emi.id)
      console.log('🔄 LOAN SCHEDULE - Marking EMI as paid:', emi.id)

      const { error: updateError } = await supabase
        .from('emis')
        .update({
          paid_amount: emi.amount,
          paid_date: new Date().toISOString().split('T')[0],
          status: 'paid',
          payment_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', emi.id)

      if (updateError) throw updateError

      console.log('✅ LOAN SCHEDULE - EMI marked as paid successfully')
      setShowEMIModal(false)
      await loadLoanSchedule()

    } catch (error: any) {
      console.error('❌ LOAN SCHEDULE - Failed to mark EMI as paid:', error)
      setError(error.message || 'Failed to mark EMI as paid')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddPayment = (emi: EMIScheduleItem) => {
    setShowEMIModal(false)
    // For now, just show alert. Can implement payment modal later
    alert(`Add payment functionality for EMI #${emi.emi_number} - To be implemented`)
  }

  const handleEMIClick = (emi: EMIScheduleItem) => {
    setSelectedEMI(emi)
    setShowEMIModal(true)
  }

  const handleGoBack = () => {
    router.back()
  }

  // Calculate summary stats
  const summaryStats = React.useMemo(() => {
    const totalEMIs = schedule.length
    const paidEMIs = schedule.filter(e => e.calculated_status === 'paid').length
    const overdueEMIs = schedule.filter(e => e.calculated_status === 'overdue').length
    const totalAmount = schedule.reduce((sum, e) => sum + e.amount, 0)
    const totalPaid = schedule.reduce((sum, e) => sum + e.paid_amount, 0)
    const totalOutstanding = schedule.reduce((sum, e) => sum + e.remaining_amount, 0)
    const completionPercentage = totalEMIs > 0 ? (paidEMIs / totalEMIs) * 100 : 0

    return {
      totalEMIs,
      paidEMIs,
      overdueEMIs,
      totalAmount,
      totalPaid,
      totalOutstanding,
      completionPercentage
    }
  }, [schedule])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'due_today': return 'bg-yellow-100 text-yellow-800'
      case 'partial': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />
      case 'overdue': return <AlertTriangle className="h-4 w-4" />
      case 'upcoming': return <Clock className="h-4 w-4" />
      case 'due_today': return <Calendar className="h-4 w-4" />
      case 'partial': return <TrendingUp className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  // Loading state
  if (!initialized) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading loan schedule...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Not authenticated state
  if (!isAuthenticated || !isAdmin) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Admin Access Required</h2>
            <p className="text-sm text-gray-600">Redirecting...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error && !loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Schedule</h2>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <div className="space-x-3">
              <Button onClick={handleGoBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              onClick={handleGoBack}
              size="sm"
              className="font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {loading ? 'Loading...' : loan?.loan_number || 'Loan Schedule'}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {loading ? 'Loading loan schedule...' : `EMI Schedule & Payment Tracking • ${schedule.length} EMIs`}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                size="sm"
                className="font-medium"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", (loading || refreshing) && "animate-spin")} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="font-medium"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {/* Skeleton for loan details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="h-12 bg-gray-200 rounded"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            {/* Skeleton for schedule table */}
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : loan ? (
          <>
            {/* Loan Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Loan Details */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Loan Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Principal</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.principal_amount)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Interest Rate</p>
                        <p className="text-lg font-bold text-blue-600">{loan.interest_rate}% p.a.</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Tenure</p>
                        <p className="text-lg font-bold text-gray-900">{loan.tenure_value} {loan.tenure_unit}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Amount</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.total_amount)}</p>
                      </div>
                    </div>

                    {/* Borrower & Lender */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Borrower</h4>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{loan.borrower_name}</p>
                              <div className="space-y-1 mt-1">
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-600">{loan.borrower_email}</span>
                                </div>
                                {loan.borrower_phone && (
                                  <div className="flex items-center space-x-2">
                                    <Phone className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-600">{loan.borrower_phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Lender</h4>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{loan.lender_name}</p>
                              <div className="space-y-1 mt-1">
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-600">{loan.lender_email}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Payment Progress</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">{Math.round(summaryStats.completionPercentage)}%</p>
                        <p className="text-sm text-gray-600">Complete</p>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${summaryStats.completionPercentage}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-green-600">{summaryStats.paidEMIs}</p>
                          <p className="text-gray-600">Paid</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-red-600">{summaryStats.overdueEMIs}</p>
                          <p className="text-gray-600">Overdue</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5" />
                      <span>Financial Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total EMI Amount</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(summaryStats.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Amount Collected</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(summaryStats.totalPaid)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Outstanding</p>
                        <p className="text-xl font-bold text-red-600">{formatCurrency(summaryStats.totalOutstanding)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* EMI Schedule Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>EMI Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {schedule.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No EMI Schedule</h3>
                    <p className="text-gray-500">No EMIs have been scheduled for this loan yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">EMI #</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Due Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Paid</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Remaining</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.map((emi) => (
                          <tr 
                            key={emi.id} 
                            className={cn(
                              "border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
                              emi.is_overdue && "bg-red-50"
                            )}
                            onClick={() => handleEMIClick(emi)}
                          >
                            <td className="py-4 px-4">
                              <span className="font-semibold text-gray-900">#{emi.emi_number}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-gray-900">{formatDate(emi.due_date)}</span>
                              {emi.is_overdue && (
                                <p className="text-xs text-red-600 font-medium mt-1">
                                  {emi.days_overdue} days overdue
                                </p>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-semibold text-gray-900">{formatCurrency(emi.amount)}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={cn(
                                "font-semibold",
                                emi.paid_amount > 0 ? "text-green-600" : "text-gray-400"
                              )}>
                                {formatCurrency(emi.paid_amount)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={cn(
                                "font-semibold",
                                emi.remaining_amount > 0 ? "text-red-600" : "text-green-600"
                              )}>
                                {formatCurrency(emi.remaining_amount)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={cn(
                                'px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 w-fit',
                                getStatusColor(emi.calculated_status)
                              )}>
                                {getStatusIcon(emi.calculated_status)}
                                <span>{emi.calculated_status.replace('_', ' ').toUpperCase()}</span>
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEMIClick(emi)
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                <MoreVertical className="h-4 w-4 text-gray-400" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}

        {/* EMI Action Modal */}
        <EMIActionModal
          emi={selectedEMI}
          isOpen={showEMIModal}
          onClose={() => setShowEMIModal(false)}
          onMarkPaid={handleMarkPaid}
          onAddPayment={handleAddPayment}
        />
      </div>
    </DashboardLayout>
  )
}