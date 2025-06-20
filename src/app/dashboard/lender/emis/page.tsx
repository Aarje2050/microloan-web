// app/dashboard/lender/emis/page.tsx - LENDER EMI MANAGEMENT (Borrower EMI Tracking)
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
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Download,
  Phone,
  Mail,
  MessageSquare,
  Bell,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Target,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

// Simple interfaces for lender EMI management
interface LenderEMI {
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
  // Borrower details (main focus for lenders)
  borrower_id: string
  borrower_name: string
  borrower_email: string
  borrower_phone: string | null
  // Calculated fields
  calculated_status: string
  is_overdue: boolean
  is_paid: boolean
  is_due_soon: boolean
  remaining_amount: number
  total_payable: number
  priority_level: 'high' | 'medium' | 'low'
}

interface EMIDetailsModalProps {
  emi: LenderEMI | null
  isOpen: boolean
  onClose: () => void
  onContactBorrower: (emi: LenderEMI, method: 'call' | 'email' | 'sms') => void
  onMarkPaid: (emi: LenderEMI) => void
}

function EMIDetailsModal({ emi, isOpen, onClose, onContactBorrower, onMarkPaid }: EMIDetailsModalProps) {
  if (!isOpen || !emi) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200'
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'due_today': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'due_soon': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'partial': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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
              <p className="text-sm text-gray-500 mt-1">
                {emi.borrower_name} • Due: {formatDate(emi.due_date)}
              </p>
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
          {/* Status and Priority */}
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
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</label>
              <div className="mt-2">
                <span className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-full',
                  getPriorityColor(emi.priority_level)
                )}>
                  {emi.priority_level.toUpperCase()} PRIORITY
                </span>
              </div>
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

          {/* Borrower Information - Main Focus */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Borrower Contact Information</h4>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{emi.borrower_name}</h3>
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 font-medium">{emi.borrower_email}</span>
                    </div>
                    {emi.borrower_phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700 font-medium">{emi.borrower_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loan Summary */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Loan Summary</h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Principal</p>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(emi.loan_principal)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Interest Rate</p>
                  <p className="text-sm font-bold text-blue-600">{emi.loan_interest_rate}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tenure</p>
                  <p className="text-sm font-bold text-gray-900">{emi.loan_tenure}</p>
                </div>
              </div>
            </div>
          </div>

          {/* EMI Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">EMI Breakdown</h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Principal Amount:</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(emi.principal_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Interest Amount:</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(emi.interest_amount)}</span>
                </div>
                {emi.late_fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-red-600">Late Fee:</span>
                    <span className="text-sm font-medium text-red-600">{formatCurrency(emi.late_fee)}</span>
                  </div>
                )}
                {emi.penalty_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-red-600">Penalty:</span>
                    <span className="text-sm font-medium text-red-600">{formatCurrency(emi.penalty_amount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Total Amount:</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(emi.total_payable)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Warning */}
          {emi.is_overdue && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <h4 className="text-sm font-semibold text-red-900">Payment Overdue</h4>
                  <p className="text-sm text-red-800 mt-1">
                    This EMI is {emi.days_overdue} days overdue. Contact the borrower immediately.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Due Soon Warning */}
          {emi.is_due_soon && !emi.is_overdue && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <h4 className="text-sm font-semibold text-orange-900">Payment Due Soon</h4>
                  <p className="text-sm text-orange-800 mt-1">
                    This EMI is due within the next 3 days. Consider sending a reminder.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex flex-col space-y-3">
            {/* Contact Actions */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Borrower</h4>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => onContactBorrower(emi, 'call')}
                  size="sm"
                  className="flex-1"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onContactBorrower(emi, 'email')}
                  size="sm"
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onContactBorrower(emi, 'sms')}
                  size="sm"
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  SMS
                </Button>
              </div>
            </div>

            {/* Payment Actions */}
            {!emi.is_paid && (
              <div className="flex space-x-3">
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
                  className="flex-1"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Loan
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface LenderEMICardProps {
  emi: LenderEMI
  onViewDetails: (emi: LenderEMI) => void
  onQuickContact: (emi: LenderEMI, method: 'call' | 'email') => void
  isSelected: boolean
  onSelect: (emiId: string) => void
  isActionLoading: boolean
}

function LenderEMICard({ emi, onViewDetails, onQuickContact, isSelected, onSelect, isActionLoading }: LenderEMICardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'due_today': return 'bg-yellow-100 text-yellow-800'
      case 'due_soon': return 'bg-orange-100 text-orange-800'
      case 'partial': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-3 w-3" />
      case 'overdue': return <AlertTriangle className="h-3 w-3" />
      case 'upcoming': return <Clock className="h-3 w-3" />
      case 'due_today': return <Calendar className="h-3 w-3" />
      case 'due_soon': return <Bell className="h-3 w-3" />
      case 'partial': return <TrendingUp className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-300'
    }
  }

  return (
    <Card className={cn(
      "bg-white border border-gray-200 hover:shadow-md transition-all duration-200 border-l-4",
      getPriorityBorderColor(emi.priority_level)
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(emi.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900 text-sm">
                  EMI #{emi.emi_number}
                </h3>
                <Badge variant="outline" className="text-xs font-medium">
                  {emi.loan_number}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 font-medium">{emi.borrower_name}</p>
            </div>
          </div>
          <button
            onClick={() => onViewDetails(emi)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Status and Due Date */}
        <div className="flex items-center space-x-2 mb-3">
          <span className={cn(
            'px-2 py-1 text-xs font-semibold rounded-md flex items-center space-x-1',
            getStatusColor(emi.calculated_status)
          )}>
            {getStatusIcon(emi.calculated_status)}
            <span>{emi.calculated_status.replace('_', ' ').toUpperCase()}</span>
          </span>
          <Badge variant="outline" className="text-xs">
            Due: {formatDate(emi.due_date)}
          </Badge>
          {emi.is_overdue && (
            <Badge variant="destructive" className="text-xs">
              {emi.days_overdue} Days Overdue
            </Badge>
          )}
        </div>

        {/* Contact Info */}
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{emi.borrower_name}</p>
              <div className="flex flex-col space-y-1 mt-1">
                {emi.borrower_phone && (
                  <span className="text-xs text-gray-600 flex items-center">
                    <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{emi.borrower_phone}</span>
                  </span>
                )}
                <span className="text-xs text-gray-600 flex items-center">
                  <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{emi.borrower_email}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-left">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">EMI Amount</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(emi.amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Paid</p>
            <p className={cn(
              "text-lg font-bold",
              emi.paid_amount > 0 ? "text-green-600" : "text-gray-900"
            )}>
              {formatCurrency(emi.paid_amount)}
            </p>
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Remaining</p>
            <p className={cn(
              "text-lg font-bold",
              emi.remaining_amount > 0 ? "text-red-600" : "text-green-600"
            )}>
              {formatCurrency(emi.remaining_amount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Priority</p>
            <Badge className={cn(
              "text-xs font-medium",
              emi.priority_level === 'high' ? 'bg-red-100 text-red-800' :
              emi.priority_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            )}>
              {emi.priority_level.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewDetails(emi)}
            className="h-9 text-xs font-medium border border-gray-200 hover:bg-gray-50"
          >
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button>
          <Button
            size="sm"
            onClick={() => onQuickContact(emi, 'call')}
            disabled={isActionLoading || !emi.borrower_phone}
            className="h-9 text-xs font-medium bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Phone className="h-3 w-3 mr-1" />
            Call
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onQuickContact(emi, 'email')}
            disabled={isActionLoading}
            className="h-9 text-xs font-medium"
          >
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LenderEMIManagement() {
  const router = useRouter()
  const { user, isLender, initialized, isAuthenticated } = useAuth()
  
  // Simple state
  const [emis, setEMIs] = React.useState<LenderEMI[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedEMIs, setSelectedEMIs] = React.useState<string[]>([])
  const [selectedEMI, setSelectedEMI] = React.useState<LenderEMI | null>(null)
  const [showEMIDetails, setShowEMIDetails] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  
  // Filters and search
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [priorityFilter, setPriorityFilter] = React.useState('all')

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage] = React.useState(12) // Show 12 EMIs per page

  console.log('📅 LENDER EMI MGMT - State:', { 
    user: user?.email, 
    isLender, 
    emisCount: emis.length,
    filters: { searchQuery, statusFilter, priorityFilter }
  })

  // Auth handling - check for lender role
  React.useEffect(() => {
    if (!initialized) return

    if (!isAuthenticated) {
      console.log('🚫 LENDER EMI MGMT - Not authenticated, redirecting to login')
      router.replace('/login')
      return
    }

    if (!isLender) {
      console.log('🚫 LENDER EMI MGMT - Not lender, redirecting to dashboard')
      router.replace('/dashboard')
      return
    }

    console.log('✅ LENDER EMI MGMT - Access granted')
  }, [initialized, isAuthenticated, isLender, router])

  // Load EMIs data for current lender
  React.useEffect(() => {
    if (!user || !isLender) return
    loadLenderEMIs()
  }, [user, isLender])

  const calculateEMIStatus = (emi: any): string => {
    const today = new Date()
    const dueDate = new Date(emi.due_date)
    const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const isPaid = (emi.paid_amount || 0) >= emi.amount
    const isPartiallyPaid = (emi.paid_amount || 0) > 0 && (emi.paid_amount || 0) < emi.amount
    
    if (isPaid) return 'paid'
    if (isPartiallyPaid) return 'partial'
    if (daysDiff < 0) return 'overdue'
    if (daysDiff === 0) return 'due_today'
    if (daysDiff <= 3) return 'due_soon'
    return 'upcoming'
  }

  const calculatePriority = (emi: any, status: string): 'high' | 'medium' | 'low' => {
    if (status === 'overdue') return 'high'
    if (status === 'due_today') return 'high'
    if (status === 'due_soon') return 'medium'
    if (status === 'partial') return 'medium'
    return 'low'
  }

  const loadLenderEMIs = async () => {
    if (!user) return

    try {
      console.log('📅 LENDER EMI MGMT - Loading EMIs for lender:', user.id)
      setLoading(true)
      setError(null)

      // Get loans created by this lender
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('id, loan_number, borrower_id, principal_amount, interest_rate, tenure_value, tenure_unit, status')
        .eq('created_by', user.id)

      if (loansError) throw loansError

      if (!loansData || loansData.length === 0) {
        console.log('📅 LENDER EMI MGMT - No loans found for lender')
        setEMIs([])
        return
      }

      const loanIds = loansData.map(l => l.id)

      // Get EMIs for these loans
      const { data: emisData, error: emisError } = await supabase
        .from('emis')
        .select('*')
        .in('loan_id', loanIds)
        .order('due_date', { ascending: true })

      if (emisError) throw emisError

      // Get borrower details
      const borrowerIds = Array.from(new Set(loansData.map(l => l.borrower_id).filter(Boolean)))
      const { data: borrowersData, error: borrowersError } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .in('id', borrowerIds)

      if (borrowersError) {
        console.warn('⚠️ LENDER EMI MGMT - Borrowers query warning:', borrowersError)
      }

      // Transform EMIs data with lender focus
      const transformedEMIs: LenderEMI[] = (emisData || []).map(emi => {
        const loan = loansData.find(l => l.id === emi.loan_id)
        const borrower = borrowersData?.find(b => b.id === loan?.borrower_id)

        const paidAmount = emi.paid_amount || 0
        const remainingAmount = Math.max(0, emi.amount - paidAmount)
        const totalPayable = emi.amount + (emi.late_fee || 0) + (emi.penalty_amount || 0)
        const calculatedStatus = calculateEMIStatus(emi)
        const priority = calculatePriority(emi, calculatedStatus)
        
        const today = new Date()
        const dueDate = new Date(emi.due_date)
        const daysOverdue = dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
        const daysToDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

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
          // Borrower details (main focus)
          borrower_id: loan?.borrower_id || '',
          borrower_name: borrower?.full_name || 'Unknown Borrower',
          borrower_email: borrower?.email || '',
          borrower_phone: borrower?.phone,
          // Calculated fields
          calculated_status: calculatedStatus,
          is_overdue: calculatedStatus === 'overdue',
          is_paid: calculatedStatus === 'paid',
          is_due_soon: daysToDue <= 3 && daysToDue >= 0,
          remaining_amount: remainingAmount,
          total_payable: totalPayable,
          priority_level: priority
        }
      })

      // Sort by priority and due date
      transformedEMIs.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority_level] - priorityOrder[a.priority_level]
        if (priorityDiff !== 0) return priorityDiff
        
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })

      setEMIs(transformedEMIs)
      console.log('✅ LENDER EMI MGMT - EMIs loaded for lender:', transformedEMIs.length)

    } catch (error: unknown) {
      console.error('❌ LENDER EMI MGMT - Failed to load EMIs:', error)
      setError(error instanceof Error ? error.message : 'Failed to load EMI data')
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
      await loadLenderEMIs()
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  // Contact borrower actions
  const handleContactBorrower = (emi: LenderEMI, method: 'call' | 'email' | 'sms') => {
    console.log(`📞 LENDER EMI MGMT - Contact ${emi.borrower_name} via ${method}`)
    
    switch (method) {
      case 'call':
        if (emi.borrower_phone) {
          window.open(`tel:${emi.borrower_phone}`)
        } else {
          alert('No phone number available for this borrower')
        }
        break
      case 'email':
        const subject = `EMI Payment Reminder - ${emi.loan_number}`
        const body = `Dear ${emi.borrower_name},\n\nThis is a reminder that your EMI #${emi.emi_number} of ${formatCurrency(emi.amount)} is ${emi.is_overdue ? `overdue by ${emi.days_overdue} days` : `due on ${formatDate(emi.due_date)}`}.\n\nPlease make the payment at your earliest convenience.\n\nThank you.`
        window.open(`mailto:${emi.borrower_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
        break
      case 'sms':
        alert(`SMS functionality for ${emi.borrower_name} - To be implemented`)
        break
    }
  }

  const handleMarkPaid = async (emi: LenderEMI) => {
    try {
      setActionLoading(emi.id)
      console.log('🔄 LENDER EMI MGMT - Marking EMI as paid:', emi.id)

      const { error: updateError } = await supabase
        .from('emis')
        .update({
          paid_amount: emi.amount,
          paid_date: new Date().toISOString().split('T')[0],
          status: 'paid',
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', emi.id)

      if (updateError) throw updateError

      console.log('✅ LENDER EMI MGMT - EMI marked as paid successfully')
      setShowEMIDetails(false)
      await loadLenderEMIs()

    } catch (error: any) {
      console.error('❌ LENDER EMI MGMT - Failed to mark EMI as paid:', error)
      setError(error.message || 'Failed to mark EMI as paid')
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
        emi.borrower_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emi.borrower_phone?.includes(searchQuery) ||
        emi.emi_number.toString().includes(searchQuery)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(emi => emi.calculated_status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(emi => emi.priority_level === priorityFilter)
    }

    return filtered
  }, [emis, searchQuery, statusFilter, priorityFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredEMIs.length / itemsPerPage)
  const paginatedEMIs = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredEMIs.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredEMIs, currentPage, itemsPerPage])

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, priorityFilter])

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages.filter(page => typeof page === 'number')
  }

  // Modal handlers
  const handleViewDetails = (emi: LenderEMI) => {
    setSelectedEMI(emi)
    setShowEMIDetails(true)
  }

  const handleQuickContact = (emi: LenderEMI, method: 'call' | 'email') => {
    handleContactBorrower(emi, method)
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
      prev.length === paginatedEMIs.length && paginatedEMIs.every(emi => prev.includes(emi.id))
        ? prev.filter(id => !paginatedEMIs.some(emi => emi.id === id))
        : [...new Set([...prev, ...paginatedEMIs.map(e => e.id)])]
    )
  }

  // Calculate summary stats
  const summaryStats = React.useMemo(() => {
    const totalEMIs = filteredEMIs.length
    const paidEMIs = filteredEMIs.filter(e => e.calculated_status === 'paid').length
    const overdueEMIs = filteredEMIs.filter(e => e.calculated_status === 'overdue').length
    const dueTodayEMIs = filteredEMIs.filter(e => e.calculated_status === 'due_today').length
    const dueSoonEMIs = filteredEMIs.filter(e => e.calculated_status === 'due_soon').length
    const highPriorityEMIs = filteredEMIs.filter(e => e.priority_level === 'high').length
    const totalAmount = filteredEMIs.reduce((sum, e) => sum + e.amount, 0)
    const totalCollected = filteredEMIs.reduce((sum, e) => sum + e.paid_amount, 0)
    const totalOutstanding = filteredEMIs.reduce((sum, e) => sum + e.remaining_amount, 0)

    return {
      totalEMIs,
      paidEMIs,
      overdueEMIs,
      dueTodayEMIs,
      dueSoonEMIs,
      highPriorityEMIs,
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
  if (!isAuthenticated || !isLender) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Lender Access Required</h2>
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
              <h1 className="text-2xl font-bold text-gray-900">My Borrowers' EMIs</h1>
              <p className="mt-2 text-sm text-gray-600">
                Track and manage EMI payments from your borrowers • {filteredEMIs.length} of {emis.length} EMIs
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
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">High Priority</p>
            <p className="text-xl font-bold text-purple-600">{summaryStats.highPriorityEMIs}</p>
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
                    placeholder="Search by borrower name, email, phone, or loan number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-sm"
                  />
                </div>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                  >
                    <option value="all">All Status</option>
                    <option value="overdue">Overdue</option>
                    <option value="due_today">Due Today</option>
                    <option value="due_soon">Due Soon</option>
                    <option value="paid">Paid</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="partial">Partially Paid</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                  >
                    <option value="all">All Priority</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedEMIs.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <span className="text-sm font-semibold text-blue-900">
                {selectedEMIs.length} EMI{selectedEMIs.length !== 1 ? 's' : ''} selected across all pages
              </span>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => console.log('Bulk contact selected borrowers')}
                  disabled={actionLoading === 'bulk'}
                  className="font-medium"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contact All
                </Button>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse shadow-sm">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-24"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEMIs.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No EMIs found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No EMIs have been scheduled for your loans yet.'}
            </p>
            {emis.length === 0 && (
              <Button
                onClick={() => router.push('/dashboard/lender/loans')}
                variant="outline"
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                View My Loans
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="mb-6">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedEMIs.length === paginatedEMIs.length && paginatedEMIs.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-600">Select all on this page</span>
              </label>
            </div>

            {/* EMIs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
              {paginatedEMIs.map((emi) => (
                <LenderEMICard
                  key={emi.id}
                  emi={emi}
                  onViewDetails={handleViewDetails}
                  onQuickContact={handleQuickContact}
                  isSelected={selectedEMIs.includes(emi.id)}
                  onSelect={toggleEMISelection}
                  isActionLoading={actionLoading === emi.id}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEMIs.length)} of {filteredEMIs.length} EMIs
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = getPageNumbers()[i]
                    if (!page) return null
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    )
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="text-gray-400 px-2">...</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}

        {/* EMI Details Modal */}
        <EMIDetailsModal
          emi={selectedEMI}
          isOpen={showEMIDetails}
          onClose={() => setShowEMIDetails(false)}
          onContactBorrower={handleContactBorrower}
          onMarkPaid={handleMarkPaid}
        />
      </div>
    </DashboardLayout>
  )
}