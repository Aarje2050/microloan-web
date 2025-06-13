// app/dashboard/admin/loans/page.tsx - FIXED LOAN MANAGEMENT (Correct Status Logic)
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  CreditCard, 
  Search, 
  MoreVertical,
  Eye,
  Calendar,
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
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

// Simple interfaces (no complex types)
interface SimpleLoan {
  id: string
  loan_number: string
  borrower_id: string
  borrower_name: string
  borrower_email: string
  lender_id: string
  lender_name: string
  lender_email: string
  principal_amount: number
  total_amount: number
  interest_rate: number
  tenure_value: number
  tenure_unit: string
  database_status: string // Original database status
  calculated_status: string // Calculated based on payments
  disbursement_date: string | null
  maturity_date: string | null
  created_at: string
  // Calculated fields
  outstanding_balance: number
  total_emis: number
  paid_emis: number
  pending_emis: number
  overdue_emis: number
  next_emi_date: string | null
  next_emi_amount: number
  completion_percentage: number
  is_fully_paid: boolean
}

interface SimpleEMI {
  id: string
  loan_id: string
  emi_number: number
  due_date: string
  amount: number
  status: string
  paid_amount: number
}

interface LoanDetailsModalProps {
  loan: SimpleLoan | null
  isOpen: boolean
  onClose: () => void
  onViewSchedule: (loan: SimpleLoan) => void
}

function LoanDetailsModal({ loan, isOpen, onClose, onViewSchedule }: LoanDetailsModalProps) {
  if (!isOpen || !loan) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'disbursed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'defaulted': return 'bg-red-100 text-red-800 border-red-200'
      case 'approved': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{loan.loan_number}</h3>
              <p className="text-sm text-gray-500 mt-1">Loan Details & Status</p>
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
        <div className="p-6 space-y-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</label>
              <div className="mt-2">
                <span className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-full border',
                  getStatusColor(loan.calculated_status)
                )}>
                  {loan.calculated_status.charAt(0).toUpperCase() + loan.calculated_status.slice(1)}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</label>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {Math.round(loan.completion_percentage)}% Complete
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {loan.is_fully_paid ? 'Fully Paid' : `${formatCurrency(loan.outstanding_balance)} remaining`}
              </p>
            </div>
          </div>

          {/* Financial Details */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Financial Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(loan.principal_amount)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Rate</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{loan.interest_rate}% p.a.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(loan.total_amount)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</span>
                </div>
                <p className={cn(
                  "text-xl font-bold",
                  loan.outstanding_balance > 0 ? "text-red-600" : "text-green-600"
                )}>
                  {formatCurrency(loan.outstanding_balance)}
                </p>
              </div>
            </div>
          </div>

          {/* EMI Progress */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">EMI Progress</h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-900">
                  {loan.paid_emis}/{loan.total_emis} EMIs
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className={cn(
                    "h-3 rounded-full transition-all duration-500",
                    loan.is_fully_paid ? "bg-green-500" : 
                    loan.overdue_emis > 0 ? "bg-red-500" : "bg-blue-500"
                  )}
                  style={{ width: `${loan.completion_percentage}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Paid</p>
                  <p className="text-lg font-bold text-green-600">{loan.paid_emis}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Pending</p>
                  <p className="text-lg font-bold text-yellow-600">{loan.pending_emis}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Overdue</p>
                  <p className="text-lg font-bold text-red-600">{loan.overdue_emis}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Borrower Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Borrower Information</h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{loan.borrower_name}</p>
                  <p className="text-sm text-gray-600 mt-1">{loan.borrower_email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lender Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Lender Information</h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{loan.lender_name}</p>
                  <p className="text-sm text-gray-600 mt-1">{loan.lender_email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Dates */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Important Dates</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatDate(loan.created_at)}</p>
              </div>
              {loan.disbursement_date && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Disbursed</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(loan.disbursement_date)}</p>
                </div>
              )}
              {loan.maturity_date && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Maturity</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(loan.maturity_date)}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tenure</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{loan.tenure_value} {loan.tenure_unit}</p>
              </div>
            </div>
          </div>

          {/* Next EMI Information */}
          {loan.next_emi_date && loan.calculated_status === 'active' && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Next EMI</h4>
              <div className={cn(
                "border-2 rounded-xl p-4",
                loan.overdue_emis > 0 ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={cn(
                      "text-sm font-semibold",
                      loan.overdue_emis > 0 ? "text-red-900" : "text-blue-900"
                    )}>
                      Due Date: {formatDate(loan.next_emi_date)}
                    </p>
                    <p className={cn(
                      "text-xs mt-1",
                      loan.overdue_emis > 0 ? "text-red-700" : "text-blue-700"
                    )}>
                      Amount: {formatCurrency(loan.next_emi_amount)}
                    </p>
                  </div>
                  <Clock className={cn(
                    "h-6 w-6", 
                    loan.overdue_emis > 0 ? "text-red-600" : "text-blue-600"
                  )} />
                </div>
              </div>
            </div>
          )}

          
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={() => onViewSchedule(loan)}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <FileText className="h-4 w-4 mr-2" />
              View EMI Schedule
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface LoanCardProps {
  loan: SimpleLoan
  onViewDetails: (loan: SimpleLoan) => void
  onQuickAction: (loanId: string, action: string) => void
  isSelected: boolean
  onSelect: (loanId: string) => void
  isActionLoading: boolean
}

function LoanCard({ loan, onViewDetails, onQuickAction, isSelected, onSelect, isActionLoading }: LoanCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'disbursed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'defaulted': return 'bg-red-100 text-red-800 border-red-200'
      case 'approved': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const isOverdue = loan.overdue_emis > 0
  const progressPercentage = loan.completion_percentage

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-300 border-0 shadow-sm",
      isOverdue && "border-l-4 border-l-red-500 bg-red-50"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(loan.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate text-lg">{loan.loan_number}</h3>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">{loan.borrower_name}</span> → {loan.lender_name}
              </p>
            </div>
          </div>
          <button
            onClick={() => onViewDetails(loan)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          >
            <MoreVertical className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="flex items-center space-x-3 mb-4">
          <span className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-full border',
            getStatusColor(loan.calculated_status)
          )}>
            {loan.calculated_status.toUpperCase()}
          </span>
          <Badge variant="outline" className="text-xs font-medium">
            {loan.tenure_value} {loan.tenure_unit}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs font-medium">
              {loan.overdue_emis} Overdue
            </Badge>
          )}
          {loan.is_fully_paid && (
            <Badge className="text-xs font-medium bg-green-100 text-green-800">
              Fully Paid
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Principal</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(loan.principal_amount)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Interest</p>
            <p className="text-sm font-bold text-blue-600">{loan.interest_rate}% p.a.</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Total</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(loan.total_amount)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Outstanding</p>
            <p className={cn(
              "text-sm font-bold",
              loan.outstanding_balance > 0 ? "text-red-600" : "text-green-600"
            )}>
              {formatCurrency(loan.outstanding_balance)}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">EMI Progress</span>
            <span className="text-xs font-bold text-gray-900">
              {loan.paid_emis}/{loan.total_emis} ({Math.round(progressPercentage)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className={cn(
                "h-3 rounded-full transition-all duration-500",
                loan.is_fully_paid ? "bg-green-500" :
                isOverdue ? "bg-red-500" : "bg-blue-500"
              )}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{Math.round(progressPercentage)}% Complete</span>
            {loan.pending_emis > 0 && (
              <span className="text-gray-600 font-medium">{loan.pending_emis} EMIs remaining</span>
            )}
          </div>
        </div>

        {loan.next_emi_date && loan.calculated_status === 'active' ? (
          <div className={cn(
            "rounded-xl p-4 mb-4 border-2",
            isOverdue ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-sm font-semibold",
                  isOverdue ? "text-red-900" : "text-blue-900"
                )}>
                  Next EMI: {formatDate(loan.next_emi_date)}
                </p>
                <p className={cn(
                  "text-xs mt-1",
                  isOverdue ? "text-red-700" : "text-blue-700"
                )}>
                  Amount: {formatCurrency(loan.next_emi_amount)}
                </p>
              </div>
              <Clock className={cn("h-5 w-5", isOverdue ? "text-red-600" : "text-blue-600")} />
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
            <p className="text-sm text-gray-600 text-center font-medium">
              {loan.calculated_status === 'completed' ? '✓ Loan Completed' : 
               loan.calculated_status === 'pending' ? 'Pending Disbursement' : 'No Active EMI'}
            </p>
          </div>
        )}

        <div className="flex space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(loan)}
            className="flex-1 h-10 text-sm font-medium"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          {loan.calculated_status === 'active' && (
            <Button
              size="sm"
              onClick={() => onQuickAction(loan.id, 'view_schedule')}
              disabled={isActionLoading}
              className="flex-1 h-10 text-sm font-medium"
            >
              <FileText className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function FixedLoansManagement() {
  const router = useRouter()
  const { user, isAdmin, initialized, isAuthenticated } = useAuth()
  
  // Simple state (same pattern as lender)
  const [loans, setLoans] = React.useState<SimpleLoan[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedLoans, setSelectedLoans] = React.useState<string[]>([])
  const [selectedLoan, setSelectedLoan] = React.useState<SimpleLoan | null>(null)
  const [showLoanDetails, setShowLoanDetails] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  
  // Filters and search
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')

  console.log('💰 LOAN MANAGEMENT - State:', { 
    user: user?.email, 
    isAdmin, 
    loansCount: loans.length,
    filters: { searchQuery, statusFilter }
  })

  // Auth handling (same as other pages)
  React.useEffect(() => {
    if (!initialized) return

    if (!isAuthenticated) {
      console.log('🚫 LOAN MGMT - Not authenticated, redirecting to login')
      router.replace('/login')
      return
    }

    if (!isAdmin) {
      console.log('🚫 LOAN MGMT - Not admin, redirecting to dashboard')
      router.replace('/dashboard')
      return
    }

    console.log('✅ LOAN MGMT - Access granted')
  }, [initialized, isAuthenticated, isAdmin, router])

  // Load loans data
  React.useEffect(() => {
    if (!user || !isAdmin) return
    loadLoans()
  }, [user, isAdmin])

  const loadLoans = async () => {
    if (!user) return

    try {
      console.log('💰 LOAN MGMT - Loading loans with correct status calculation...')
      setLoading(true)
      setError(null)

      // Get all loans
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false })

      if (loansError) throw loansError

      if (!loansData || loansData.length === 0) {
        console.log('💰 LOAN MGMT - No loans found')
        setLoans([])
        return
      }

      // Get borrower details
      const borrowerIds = Array.from(new Set(loansData.map(l => l.borrower_id).filter(Boolean)))
      const { data: borrowersData, error: borrowersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', borrowerIds)

      if (borrowersError) {
        console.warn('⚠️ LOAN MGMT - Borrowers query warning:', borrowersError)
      }

      // Get lender details
      const lenderIds = Array.from(new Set([
        ...loansData.map(l => l.created_by).filter(Boolean),
        ...loansData.map(l => l.lender_id).filter(Boolean)
      ]))
      const { data: lendersData, error: lendersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', lenderIds)

      if (lendersError) {
        console.warn('⚠️ LOAN MGMT - Lenders query warning:', lendersError)
      }

      // Get EMI data for all loans
      const loanIds = loansData.map(l => l.id)
      const { data: emisData, error: emisError } = await supabase
        .from('emis')
        .select('*')
        .in('loan_id', loanIds)
        .order('emi_number', { ascending: true })

      if (emisError) {
        console.warn('⚠️ LOAN MGMT - EMIs query warning:', emisError)
      }

      // Transform loans data with CORRECT STATUS CALCULATION
      const transformedLoans: SimpleLoan[] = loansData.map(loan => {
        const borrower = borrowersData?.find(b => b.id === loan.borrower_id)
        const lender = lendersData?.find(l => l.id === loan.created_by || l.id === loan.lender_id)
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

        const today = new Date()
        const overdueEMIs = pendingEMIs.filter(e => new Date(e.due_date) < today).length

        // Calculate outstanding balance
        const totalPaid = loanEMIs.reduce((sum, emi) => {
          const paidAmount = emi.paid_amount || 0
          return sum + Math.min(paidAmount, emi.amount)
        }, 0)

        const outstandingBalance = Math.max(0, (loan.total_amount || loan.principal_amount) - totalPaid)

        // ✅ CORRECT STATUS CALCULATION
        const isFullyPaid = outstandingBalance <= 0 && totalEMIs > 0 && paidEMIs === totalEMIs
        
        let calculatedStatus = loan.status // Start with database status
        
        // Override status based on actual payment progress
        if (isFullyPaid) {
          calculatedStatus = 'completed'
        } else if (totalEMIs > 0 && paidEMIs > 0 && outstandingBalance > 0) {
          calculatedStatus = 'active' // Loan is running with payments made
        } else if (loan.disbursement_date && totalEMIs > 0) {
          calculatedStatus = 'active' // Loan is disbursed and has EMI schedule
        } else if (loan.status === 'approved' || loan.status === 'pending') {
          calculatedStatus = loan.status // Keep original status for non-disbursed loans
        }

        // Find next EMI
        const nextEMI = pendingEMIs
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]

        // Calculate completion percentage
        const completionPercentage = totalEMIs > 0 ? (paidEMIs / totalEMIs) * 100 : 0

        console.log(`📊 Loan ${loan.loan_number}:`, {
          databaseStatus: loan.status,
          calculatedStatus,
          totalEMIs,
          paidEMIs,
          pendingEMIs: pendingEMIs.length,
          outstandingBalance,
          isFullyPaid
        })

        return {
          id: loan.id,
          loan_number: loan.loan_number || `LOAN-${loan.id.slice(0, 8)}`,
          borrower_id: loan.borrower_id,
          borrower_name: borrower?.full_name || 'Unknown Borrower',
          borrower_email: borrower?.email || '',
          lender_id: loan.created_by || loan.lender_id,
          lender_name: lender?.full_name || 'Unknown Lender',
          lender_email: lender?.email || '',
          principal_amount: loan.principal_amount,
          total_amount: loan.total_amount || loan.principal_amount,
          interest_rate: loan.interest_rate || 0,
          tenure_value: loan.tenure_value,
          tenure_unit: loan.tenure_unit,
          database_status: loan.status,
          calculated_status: calculatedStatus,
          disbursement_date: loan.disbursement_date,
          maturity_date: loan.maturity_date,
          created_at: loan.created_at,
          outstanding_balance: outstandingBalance,
          total_emis: totalEMIs,
          paid_emis: paidEMIs,
          pending_emis: pendingEMIs.length,
          overdue_emis: overdueEMIs,
          next_emi_date: nextEMI?.due_date || null,
          next_emi_amount: nextEMI ? (nextEMI.amount - (nextEMI.paid_amount || 0)) : 0,
          completion_percentage: completionPercentage,
          is_fully_paid: isFullyPaid
        }
      })

      setLoans(transformedLoans)
      console.log('✅ LOAN MGMT - Loans loaded with correct status:', transformedLoans.length)

    } catch (error: unknown) {
      console.error('❌ LOAN MGMT - Failed to load loans:', error)
      setError(error instanceof Error ? error.message : 'Failed to load loans')
      setLoans([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadLoans()
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  // Loan actions
  const handleLoanAction = async (loanId: string, actionType: string) => {
    try {
      setActionLoading(loanId)
      
      if (actionType === 'view_schedule') {
        router.push(`/dashboard/admin/loans/${loanId}/schedule`)
        return
      }
      
      console.log(`🔄 LOAN MGMT - Action ${actionType} on loan:`, loanId)
      
    } catch (error: any) {
      console.error(`❌ LOAN MGMT - Failed to ${actionType} loan:`, error)
      setError(error.message || `Failed to ${actionType} loan`)
    } finally {
      setActionLoading(null)
    }
  }

  // Filter loans based on search and filters
  const filteredLoans = React.useMemo(() => {
    let filtered = loans

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(loan =>
        loan.loan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.borrower_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.lender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.borrower_email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter - use calculated status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => loan.calculated_status === statusFilter)
    }

    return filtered
  }, [loans, searchQuery, statusFilter])

  // Modal handlers
  const handleViewDetails = (loan: SimpleLoan) => {
    setSelectedLoan(loan)
    setShowLoanDetails(true)
  }

  const handleViewSchedule = (loan: SimpleLoan) => {
    setShowLoanDetails(false)
    router.push(`/dashboard/admin/loans/${loan.id}/schedule`)
  }

  // Selection handlers
  const toggleLoanSelection = (loanId: string) => {
    setSelectedLoans(prev =>
      prev.includes(loanId)
        ? prev.filter(id => id !== loanId)
        : [...prev, loanId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedLoans(prev =>
      prev.length === filteredLoans.length ? [] : filteredLoans.map(l => l.id)
    )
  }

  // Calculate summary stats using calculated status
  const summaryStats = React.useMemo(() => {
    const totalLoans = filteredLoans.length
    const activeLoans = filteredLoans.filter(l => l.calculated_status === 'active').length
    const completedLoans = filteredLoans.filter(l => l.calculated_status === 'completed').length
    const overdueLoans = filteredLoans.filter(l => l.overdue_emis > 0).length
    const totalPortfolio = filteredLoans.reduce((sum, l) => sum + l.principal_amount, 0)
    const totalOutstanding = filteredLoans.reduce((sum, l) => sum + l.outstanding_balance, 0)

    return {
      totalLoans,
      activeLoans,
      completedLoans,
      overdueLoans,
      totalPortfolio,
      totalOutstanding
    }
  }, [filteredLoans])

  // Loading state
  if (!initialized) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading loan management...</p>
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
            <CreditCard className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Admin Access Required</h2>
            <p className="text-sm text-gray-600">Redirecting...</p>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Loan Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Monitor and manage all platform loans • {filteredLoans.length} of {loans.length} loans
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
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

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Loans</p>
            <p className="text-xl font-bold text-gray-900">{summaryStats.totalLoans}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Active</p>
            <p className="text-xl font-bold text-green-600">{summaryStats.activeLoans}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Completed</p>
            <p className="text-xl font-bold text-blue-600">{summaryStats.completedLoans}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Overdue</p>
            <p className="text-xl font-bold text-red-600">{summaryStats.overdueLoans}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Portfolio</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(summaryStats.totalPortfolio)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Outstanding</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(summaryStats.totalOutstanding)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl mb-6 shadow-sm">
          <div className="p-6">
            <div className="space-y-4">
              {/* Search */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search loans, borrowers, or lenders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-sm"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="defaulted">Defaulted</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedLoans.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <span className="text-sm font-semibold text-blue-900">
                {selectedLoans.length} loan{selectedLoans.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => console.log('Export selected loans')}
                  disabled={actionLoading === 'bulk'}
                  className="font-medium"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-red-800 text-sm font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Loans Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse shadow-sm">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No loans found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No loans have been created yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="mb-6">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedLoans.length === filteredLoans.length && filteredLoans.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-600">Select all visible loans</span>
              </label>
            </div>

            {/* Loans Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredLoans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  onViewDetails={handleViewDetails}
                  onQuickAction={handleLoanAction}
                  isSelected={selectedLoans.includes(loan.id)}
                  onSelect={toggleLoanSelection}
                  isActionLoading={actionLoading === loan.id}
                />
              ))}
            </div>

            {/* Pagination Info */}
            <div className="mt-8 flex items-center justify-center">
              <p className="text-sm text-gray-600 font-medium">
                Showing {filteredLoans.length} of {loans.length} loans
              </p>
            </div>
          </>
        )}

        {/* Loan Details Modal */}
        <LoanDetailsModal
          loan={selectedLoan}
          isOpen={showLoanDetails}
          onClose={() => setShowLoanDetails(false)}
          onViewSchedule={handleViewSchedule}
        />
      </div>
    </DashboardLayout>
  )
}