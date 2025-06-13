// app/dashboard/admin/emis/page.tsx - EMI MANAGEMENT (Professional Design & Working Functionality)
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  Calendar, 
  Search, 
  MoreVertical,
  Eye,
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
  CreditCard,
  TrendingUp,
  TrendingDown,
  Phone,
  Mail,
  FileText,
  Receipt
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

// Simple interfaces (no complex types)
interface SimpleEMI {
  id: string
  loan_id: string
  loan_number: string
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
  created_at: string
  updated_at: string
  // Loan details
  loan_principal: number
  loan_interest_rate: number
  loan_tenure: string
  loan_status: string
  // Borrower details
  borrower_id: string
  borrower_name: string
  borrower_email: string
  borrower_phone: string | null
  // Lender details
  lender_id: string
  lender_name: string
  lender_email: string
  // Calculated fields
  calculated_status: string
  is_overdue: boolean
  is_paid: boolean
  remaining_amount: number
  total_payable: number
}

interface EMIDetailsModalProps {
  emi: SimpleEMI | null
  isOpen: boolean
  onClose: () => void
  onMarkPaid: (emi: SimpleEMI) => void
  onViewLoan: (emi: SimpleEMI) => void
}

function EMIDetailsModal({ emi, isOpen, onClose, onMarkPaid, onViewLoan }: EMIDetailsModalProps) {
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
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                EMI #{emi.emi_number} - {emi.loan_number}
              </h3>
              <p className="text-sm text-gray-500 mt-1">EMI Details & Payment Status</p>
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
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">EMI Status</label>
              <div className="mt-2">
                <span className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-full border',
                  getStatusColor(emi.calculated_status)
                )}>
                  {emi.calculated_status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</label>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {formatDate(emi.due_date)}
              </p>
              {emi.is_overdue && (
                <p className="text-sm text-red-600 font-medium">
                  {emi.days_overdue} days overdue
                </p>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Payment Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">EMI Amount</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(emi.amount)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Amount</span>
                </div>
                <p className={cn(
                  "text-xl font-bold",
                  emi.paid_amount > 0 ? "text-green-600" : "text-gray-900"
                )}>
                  {formatCurrency(emi.paid_amount)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</span>
                </div>
                <p className={cn(
                  "text-xl font-bold",
                  emi.remaining_amount > 0 ? "text-red-600" : "text-green-600"
                )}>
                  {formatCurrency(emi.remaining_amount)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Payable</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(emi.total_payable)}</p>
              </div>
            </div>
          </div>

          {/* EMI Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">EMI Breakdown</h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Principal</p>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(emi.principal_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Interest</p>
                  <p className="text-sm font-bold text-blue-600">{formatCurrency(emi.interest_amount)}</p>
                </div>
                {emi.late_fee > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Late Fee</p>
                    <p className="text-sm font-bold text-red-600">{formatCurrency(emi.late_fee)}</p>
                  </div>
                )}
                {emi.penalty_amount > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Penalty</p>
                    <p className="text-sm font-bold text-red-600">{formatCurrency(emi.penalty_amount)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Loan Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Loan Information</h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{emi.loan_number}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Principal: {formatCurrency(emi.loan_principal)} • 
                    Rate: {emi.loan_interest_rate}% • 
                    Tenure: {emi.loan_tenure}
                  </p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {emi.loan_status.toUpperCase()}
                    </Badge>
                  </div>
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
                  <p className="font-semibold text-gray-900">{emi.borrower_name}</p>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{emi.borrower_email}</span>
                    </div>
                    {emi.borrower_phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{emi.borrower_phone}</span>
                      </div>
                    )}
                  </div>
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
                  <p className="font-semibold text-gray-900">{emi.lender_name}</p>
                  <p className="text-sm text-gray-600 mt-1">{emi.lender_email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {emi.paid_date && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Payment History</h4>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-900">
                      Paid on {formatDate(emi.paid_date)}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Amount: {formatCurrency(emi.paid_amount)}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          )}

          {/* Outstanding Balance */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Outstanding Balance</h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(emi.outstanding_balance)}</p>
              <p className="text-sm text-gray-600 mt-1">Remaining loan balance after this EMI</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={() => onViewLoan(emi)}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Loan
            </Button>
            {!emi.is_paid && (
              <Button
                onClick={() => onMarkPaid(emi)}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface EMICardProps {
  emi: SimpleEMI
  onViewDetails: (emi: SimpleEMI) => void
  onQuickAction: (emiId: string, action: string) => void
  isSelected: boolean
  onSelect: (emiId: string) => void
  isActionLoading: boolean
}

function EMICard({ emi, onViewDetails, onQuickAction, isSelected, onSelect, isActionLoading }: EMICardProps) {
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

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-300 border-0 shadow-sm",
      emi.is_overdue && "border-l-4 border-l-red-500 bg-red-50",
      emi.calculated_status === 'due_today' && "border-l-4 border-l-yellow-500 bg-yellow-50"
    )}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(emi.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg">
                EMI #{emi.emi_number} - {emi.loan_number}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">{emi.borrower_name}</span> → {emi.lender_name}
              </p>
            </div>
          </div>
          <button
            onClick={() => onViewDetails(emi)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          >
            <MoreVertical className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Status and Due Date */}
        <div className="flex items-center space-x-3 mb-4">
          <span className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-full border flex items-center space-x-1',
            getStatusColor(emi.calculated_status)
          )}>
            {getStatusIcon(emi.calculated_status)}
            <span>{emi.calculated_status.replace('_', ' ').toUpperCase()}</span>
          </span>
          <Badge variant="outline" className="text-xs font-medium">
            Due: {formatDate(emi.due_date)}
          </Badge>
          {emi.is_overdue && (
            <Badge variant="destructive" className="text-xs font-medium">
              {emi.days_overdue} Days Overdue
            </Badge>
          )}
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">EMI Amount</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(emi.amount)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Paid</p>
            <p className={cn(
              "text-sm font-bold",
              emi.paid_amount > 0 ? "text-green-600" : "text-gray-900"
            )}>
              {formatCurrency(emi.paid_amount)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Remaining</p>
            <p className={cn(
              "text-sm font-bold",
              emi.remaining_amount > 0 ? "text-red-600" : "text-green-600"
            )}>
              {formatCurrency(emi.remaining_amount)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Total Due</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(emi.total_payable)}</p>
          </div>
        </div>

        {/* EMI Breakdown */}
        {(emi.late_fee > 0 || emi.penalty_amount > 0) && (
          <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200">
            <h4 className="text-sm font-medium text-red-900 mb-2">Additional Charges</h4>
            <div className="space-y-1">
              {emi.late_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-700">Late Fee:</span>
                  <span className="font-medium text-red-900">{formatCurrency(emi.late_fee)}</span>
                </div>
              )}
              {emi.penalty_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-700">Penalty:</span>
                  <span className="font-medium text-red-900">{formatCurrency(emi.penalty_amount)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loan Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Principal: {formatCurrency(emi.loan_principal)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Rate: {emi.loan_interest_rate}% • Tenure: {emi.loan_tenure}
              </p>
            </div>
            <CreditCard className="h-5 w-5 text-gray-600" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(emi)}
            className="flex-1 h-10 text-sm font-medium"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          {!emi.is_paid && (
            <Button
              size="sm"
              onClick={() => onQuickAction(emi.id, 'mark_paid')}
              disabled={isActionLoading}
              className="flex-1 h-10 text-sm font-medium"
            >
              <Receipt className="h-4 w-4 mr-2" />
              Mark Paid
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function EMIManagement() {
  const router = useRouter()
  const { user, isAdmin, initialized, isAuthenticated } = useAuth()
  
  // Simple state (same pattern as other pages)
  const [emis, setEMIs] = React.useState<SimpleEMI[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedEMIs, setSelectedEMIs] = React.useState<string[]>([])
  const [selectedEMI, setSelectedEMI] = React.useState<SimpleEMI | null>(null)
  const [showEMIDetails, setShowEMIDetails] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  
  // Filters and search
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')

  console.log('📅 EMI MANAGEMENT - State:', { 
    user: user?.email, 
    isAdmin, 
    emisCount: emis.length,
    filters: { searchQuery, statusFilter }
  })

  // Auth handling (same as other pages)
  React.useEffect(() => {
    if (!initialized) return

    if (!isAuthenticated) {
      console.log('🚫 EMI MGMT - Not authenticated, redirecting to login')
      router.replace('/login')
      return
    }

    if (!isAdmin) {
      console.log('🚫 EMI MGMT - Not admin, redirecting to dashboard')
      router.replace('/dashboard')
      return
    }

    console.log('✅ EMI MGMT - Access granted')
  }, [initialized, isAuthenticated, isAdmin, router])

  // Load EMIs data
  React.useEffect(() => {
    if (!user || !isAdmin) return
    loadEMIs()
  }, [user, isAdmin])

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

  const loadEMIs = async () => {
    if (!user) return

    try {
      console.log('📅 EMI MGMT - Loading EMIs with complete details...')
      setLoading(true)
      setError(null)

      // Get all EMIs with loan details
      const { data: emisData, error: emisError } = await supabase
        .from('emis')
        .select('*')
        .order('due_date', { ascending: true })

      if (emisError) throw emisError

      if (!emisData || emisData.length === 0) {
        console.log('📅 EMI MGMT - No EMIs found')
        setEMIs([])
        return
      }

      // Get loan details
      const loanIds = Array.from(new Set(emisData.map(e => e.loan_id).filter(Boolean)))
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .in('id', loanIds)

      if (loansError) {
        console.warn('⚠️ EMI MGMT - Loans query warning:', loansError)
      }

      // Get borrower details
      const borrowerIds = Array.from(new Set(loansData?.map(l => l.borrower_id).filter(Boolean) || []))
      const { data: borrowersData, error: borrowersError } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .in('id', borrowerIds)

      if (borrowersError) {
        console.warn('⚠️ EMI MGMT - Borrowers query warning:', borrowersError)
      }

      // Get lender details
      const lenderIds = Array.from(new Set([
        ...(loansData?.map(l => l.created_by).filter(Boolean) || []),
        ...(loansData?.map(l => l.lender_id).filter(Boolean) || [])
      ]))
      const { data: lendersData, error: lendersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', lenderIds)

      if (lendersError) {
        console.warn('⚠️ EMI MGMT - Lenders query warning:', lendersError)
      }

      // Transform EMIs data
      const transformedEMIs: SimpleEMI[] = emisData.map(emi => {
        const loan = loansData?.find(l => l.id === emi.loan_id)
        const borrower = borrowersData?.find(b => b.id === loan?.borrower_id)
        const lender = lendersData?.find(l => l.id === loan?.created_by || l.id === loan?.lender_id)

        const paidAmount = emi.paid_amount || 0
        const remainingAmount = Math.max(0, emi.amount - paidAmount)
        const totalPayable = emi.amount + (emi.late_fee || 0) + (emi.penalty_amount || 0)
        const calculatedStatus = calculateEMIStatus(emi)
        const today = new Date()
        const dueDate = new Date(emi.due_date)
        const daysOverdue = dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

        return {
          id: emi.id,
          loan_id: emi.loan_id,
          loan_number: loan?.loan_number || `LOAN-${loan?.id?.slice(0, 8) || 'UNKNOWN'}`,
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
          created_at: emi.created_at,
          updated_at: emi.updated_at,
          // Loan details
          loan_principal: loan?.principal_amount || 0,
          loan_interest_rate: loan?.interest_rate || 0,
          loan_tenure: loan ? `${loan.tenure_value} ${loan.tenure_unit}` : 'Unknown',
          loan_status: loan?.status || 'unknown',
          // Borrower details
          borrower_id: loan?.borrower_id || '',
          borrower_name: borrower?.full_name || 'Unknown Borrower',
          borrower_email: borrower?.email || '',
          borrower_phone: borrower?.phone,
          // Lender details
          lender_id: loan?.created_by || loan?.lender_id || '',
          lender_name: lender?.full_name || 'Unknown Lender',
          lender_email: lender?.email || '',
          // Calculated fields
          calculated_status: calculatedStatus,
          is_overdue: calculatedStatus === 'overdue',
          is_paid: calculatedStatus === 'paid',
          remaining_amount: remainingAmount,
          total_payable: totalPayable
        }
      })

      setEMIs(transformedEMIs)
      console.log('✅ EMI MGMT - EMIs loaded:', transformedEMIs.length)

    } catch (error: unknown) {
      console.error('❌ EMI MGMT - Failed to load EMIs:', error)
      setError(error instanceof Error ? error.message : 'Failed to load EMIs')
      setEMIs([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadEMIs()
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  // EMI actions
  const handleEMIAction = async (emiId: string, actionType: string) => {
    try {
      setActionLoading(emiId)
      console.log(`🔄 EMI MGMT - Performing ${actionType} on EMI:`, emiId)

      if (actionType === 'mark_paid') {
        const emi = emis.find(e => e.id === emiId)
        if (!emi) throw new Error('EMI not found')

        // Update EMI as paid
        const { error: updateError } = await supabase
          .from('emis')
          .update({
            paid_amount: emi.amount,
            paid_date: new Date().toISOString().split('T')[0],
            status: 'paid',
            payment_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', emiId)

        if (updateError) throw updateError

        console.log('✅ EMI MGMT - EMI marked as paid successfully')
        await loadEMIs()
        return
      }

      console.log(`✅ EMI MGMT - Action ${actionType} completed`)

    } catch (error: any) {
      console.error(`❌ EMI MGMT - Failed to ${actionType} EMI:`, error)
      setError(error.message || `Failed to ${actionType} EMI`)
    } finally {
      setActionLoading(null)
    }
  }

  // Filter EMIs based on search and filters
  const filteredEMIs = React.useMemo(() => {
    let filtered = emis

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(emi =>
        emi.loan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emi.borrower_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emi.lender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emi.borrower_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emi.emi_number.toString().includes(searchQuery)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(emi => emi.calculated_status === statusFilter)
    }

    return filtered
  }, [emis, searchQuery, statusFilter])

  // Modal handlers
  const handleViewDetails = (emi: SimpleEMI) => {
    setSelectedEMI(emi)
    setShowEMIDetails(true)
  }

  const handleMarkPaid = (emi: SimpleEMI) => {
    setShowEMIDetails(false)
    handleEMIAction(emi.id, 'mark_paid')
  }

  const handleViewLoan = (emi: SimpleEMI) => {
    setShowEMIDetails(false)
    router.push(`/dashboard/admin/loans/${emi.loan_id}/schedule`)
  }

  // Selection handlers
  const toggleEMISelection = (emiId: string) => {
    setSelectedEMIs(prev =>
      prev.includes(emiId)
        ? prev.filter(id => id !== emiId)
        : [...prev, emiId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedEMIs(prev =>
      prev.length === filteredEMIs.length ? [] : filteredEMIs.map(e => e.id)
    )
  }

  // Calculate summary stats
  const summaryStats = React.useMemo(() => {
    const totalEMIs = filteredEMIs.length
    const paidEMIs = filteredEMIs.filter(e => e.calculated_status === 'paid').length
    const overdueEMIs = filteredEMIs.filter(e => e.calculated_status === 'overdue').length
    const dueTodayEMIs = filteredEMIs.filter(e => e.calculated_status === 'due_today').length
    const upcomingEMIs = filteredEMIs.filter(e => e.calculated_status === 'upcoming').length
    const totalAmount = filteredEMIs.reduce((sum, e) => sum + e.amount, 0)
    const totalCollected = filteredEMIs.reduce((sum, e) => sum + e.paid_amount, 0)
    const totalOutstanding = filteredEMIs.reduce((sum, e) => sum + e.remaining_amount, 0)

    return {
      totalEMIs,
      paidEMIs,
      overdueEMIs,
      dueTodayEMIs,
      upcomingEMIs,
      totalAmount,
      totalCollected,
      totalOutstanding
    }
  }, [filteredEMIs])

  // Loading state
  if (!initialized) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading EMI management...</p>
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
            <Calendar className="h-12 w-12 text-red-600 mx-auto mb-4" />
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
              <h1 className="text-2xl font-bold text-gray-900">EMI Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Monitor and manage all EMI payments • {filteredEMIs.length} of {emis.length} EMIs
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total EMIs</p>
            <p className="text-xl font-bold text-gray-900">{summaryStats.totalEMIs}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Paid</p>
            <p className="text-xl font-bold text-green-600">{summaryStats.paidEMIs}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Overdue</p>
            <p className="text-xl font-bold text-red-600">{summaryStats.overdueEMIs}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Due Today</p>
            <p className="text-xl font-bold text-yellow-600">{summaryStats.dueTodayEMIs}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Upcoming</p>
            <p className="text-xl font-bold text-blue-600">{summaryStats.upcomingEMIs}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Amount</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(summaryStats.totalAmount)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Collected</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(summaryStats.totalCollected)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Outstanding</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(summaryStats.totalOutstanding)}</p>
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
                    placeholder="Search EMIs, loans, borrowers, or lenders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-sm"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="due_today">Due Today</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="partial">Partially Paid</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedEMIs.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <span className="text-sm font-semibold text-blue-900">
                {selectedEMIs.length} EMI{selectedEMIs.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => console.log('Export selected EMIs')}
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

        {/* EMIs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse shadow-sm">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-40"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEMIs.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No EMIs found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No EMIs have been scheduled yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="mb-6">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedEMIs.length === filteredEMIs.length && filteredEMIs.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-600">Select all visible EMIs</span>
              </label>
            </div>

            {/* EMIs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredEMIs.map((emi) => (
                <EMICard
                  key={emi.id}
                  emi={emi}
                  onViewDetails={handleViewDetails}
                  onQuickAction={handleEMIAction}
                  isSelected={selectedEMIs.includes(emi.id)}
                  onSelect={toggleEMISelection}
                  isActionLoading={actionLoading === emi.id}
                />
              ))}
            </div>

            {/* Pagination Info */}
            <div className="mt-8 flex items-center justify-center">
              <p className="text-sm text-gray-600 font-medium">
                Showing {filteredEMIs.length} of {emis.length} EMIs
              </p>
            </div>
          </>
        )}

        {/* EMI Details Modal */}
        <EMIDetailsModal
          emi={selectedEMI}
          isOpen={showEMIDetails}
          onClose={() => setShowEMIDetails(false)}
          onMarkPaid={handleMarkPaid}
          onViewLoan={handleViewLoan}
        />
      </div>
    </DashboardLayout>
  )
}