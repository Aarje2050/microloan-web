// components/ui/enterprise-cards.tsx - PROFESSIONAL CARD COMPONENTS
'use client'

import React from 'react'
import { 
  CreditCard, 
  Users, 
  Eye, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ===== LOAN CARD COMPONENT =====
interface LoanCardProps {
  loan: {
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
  onRecordPayment: (loanId: string) => void
  onViewDetails: (loanId: string) => void
  formatCurrency: (amount: number) => string
  formatDate: (date: string) => string
  className?: string
}

export function LoanCard({ 
  loan, 
  onRecordPayment, 
  onViewDetails, 
  formatCurrency, 
  formatDate,
  className 
}: LoanCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { 
          icon: CheckCircle2, 
          color: 'text-green-600', 
          bg: 'bg-green-50', 
          border: 'border-green-200',
          label: 'Active'
        }
      case 'disbursed':
        return { 
          icon: CreditCard, 
          color: 'text-blue-600', 
          bg: 'bg-blue-50', 
          border: 'border-blue-200',
          label: 'Disbursed'
        }
      case 'completed':
        return { 
          icon: CheckCircle2, 
          color: 'text-gray-600', 
          bg: 'bg-gray-50', 
          border: 'border-gray-200',
          label: 'Completed'
        }
      case 'overdue':
        return { 
          icon: AlertCircle, 
          color: 'text-red-600', 
          bg: 'bg-red-50', 
          border: 'border-red-200',
          label: 'Overdue'
        }
      default:
        return { 
          icon: Clock, 
          color: 'text-yellow-600', 
          bg: 'bg-yellow-50', 
          border: 'border-yellow-200',
          label: 'Pending'
        }
    }
  }

  const statusConfig = getStatusConfig(loan.status)
  const StatusIcon = statusConfig.icon
  const progress = loan.total_emis > 0 ? (loan.paid_emis / loan.total_emis) * 100 : 0
  const isCompleted = loan.pending_emis === 0

  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group',
      className
    )}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{loan.loan_number}</h3>
              <span className={cn(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                statusConfig.bg,
                statusConfig.color,
                statusConfig.border
              )}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-600 space-x-4">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                <span className="font-medium">{loan.borrower_name}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{formatDate(loan.disbursement_date)}</span>
              </div>
            </div>
          </div>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Outstanding</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(loan.outstanding_balance)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Amount</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(loan.total_amount)}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">
              EMI Progress: {loan.paid_emis}/{loan.total_emis}
            </span>
            <span className="text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                isCompleted ? "bg-green-500" : "bg-blue-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Next Due (if applicable) */}
        {loan.next_due_date && !isCompleted && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Next Due</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(loan.next_due_amount)}
                </p>
                <p className="text-xs text-gray-500">{formatDate(loan.next_due_date)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Completed Badge */}
        {isCompleted && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Loan Fully Paid</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex space-x-3">
          <button
            onClick={() => onRecordPayment(loan.id)}
            disabled={isCompleted}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isCompleted
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            {isCompleted ? "Fully Paid" : "Record Payment"}
          </button>
          <button
            onClick={() => onViewDetails(loan.id)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== BORROWER CARD COMPONENT =====
interface BorrowerCardProps {
  borrower: {
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
  onCreateLoan: (borrowerId: string) => void
  onViewDetails: (borrowerId: string) => void
  formatCurrency: (amount: number) => string
  className?: string
}

export function BorrowerCard({ 
  borrower, 
  onCreateLoan, 
  onViewDetails, 
  formatCurrency,
  className 
}: BorrowerCardProps) {
  const getKycStatusConfig = (status: string) => {
    switch (status) {
      case 'verified':
        return { 
          color: 'text-green-600', 
          bg: 'bg-green-50', 
          border: 'border-green-200',
          label: 'Verified'
        }
      case 'pending':
        return { 
          color: 'text-yellow-600', 
          bg: 'bg-yellow-50', 
          border: 'border-yellow-200',
          label: 'Pending'
        }
      case 'rejected':
        return { 
          color: 'text-red-600', 
          bg: 'bg-red-50', 
          border: 'border-red-200',
          label: 'Rejected'
        }
      default:
        return { 
          color: 'text-gray-600', 
          bg: 'bg-gray-50', 
          border: 'border-gray-200',
          label: 'Unknown'
        }
    }
  }

  const kycConfig = getKycStatusConfig(borrower.kyc_status)

  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group',
      className
    )}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {borrower.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{borrower.full_name}</h3>
                <span className={cn(
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                  kycConfig.bg,
                  kycConfig.color,
                  kycConfig.border
                )}>
                  {kycConfig.label}
                </span>
              </div>
            </div>
          </div>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="w-4 h-4 mr-2 text-gray-400" />
            <span className="truncate">{borrower.email}</span>
          </div>
          {borrower.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 text-gray-400" />
              <span>{borrower.phone}</span>
            </div>
          )}
        </div>

        {/* Financial Info */}
        <div className="grid grid-cols-2 gap-4">
          {borrower.monthly_income && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly Income</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(borrower.monthly_income)}
              </p>
            </div>
          )}
          {borrower.credit_score && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Credit Score</p>
              <p className={cn(
                "text-lg font-bold",
                borrower.credit_score >= 700 ? "text-green-600" : 
                borrower.credit_score >= 600 ? "text-yellow-600" : "text-red-600"
              )}>
                {borrower.credit_score}
              </p>
            </div>
          )}
        </div>

        {/* Employment */}
        {borrower.employment_type && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {borrower.employment_type.charAt(0).toUpperCase() + borrower.employment_type.slice(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex space-x-3">
          <button
            onClick={() => onCreateLoan(borrower.user_id)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Create Loan
          </button>
          <button
            onClick={() => onViewDetails(borrower.id)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== SECTION CONTAINER =====
interface SectionContainerProps {
  title: string
  subtitle?: string
  count?: number
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function SectionContainer({ 
  title, 
  subtitle, 
  count, 
  action, 
  children, 
  className 
}: SectionContainerProps) {
  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {count !== undefined && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {count}
              </span>
            )}
            {action}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}