// /components/ui/unified-loan-card.tsx
'use client'

import React from 'react'
import { 
  CreditCard, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Receipt
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoanSummary, calculateLoanStatus } from '@/lib/loan-utils'

interface UnifiedLoanCardProps {
  loan: LoanSummary
  onRecordPayment: (loanId: string) => void
  onViewDetails: (loan: LoanSummary) => void
  formatCurrency: (amount: number) => string
  formatDate: (date: string) => string
  className?: string
}

export function UnifiedLoanCard({ 
  loan, 
  onRecordPayment, 
  onViewDetails, 
  formatCurrency, 
  formatDate,
  className 
}: UnifiedLoanCardProps) {
  
  // Use smart status calculation
  const smartStatus = calculateLoanStatus(loan)
  
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return { 
          icon: CheckCircle2, 
          color: 'bg-green-100 text-green-800 border-green-200',
          label: 'Active'
        }
      case 'disbursed':
        return { 
          icon: CreditCard, 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          label: 'Disbursed'
        }
      case 'completed':
        return { 
          icon: CheckCircle2, 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          label: 'Completed'
        }
      case 'overdue':
        return { 
          icon: AlertCircle, 
          color: 'bg-red-100 text-red-800 border-red-200',
          label: 'Overdue'
        }
      default:
        return { 
          icon: Clock, 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          label: 'Pending'
        }
    }
  }

  const statusConfig = getStatusConfig(smartStatus)
  const StatusIcon = statusConfig.icon
  const progressPercentage = loan.total_emis > 0 ? (loan.paid_emis / loan.total_emis) * 100 : 0
  const isCompleted = smartStatus === 'completed'

  return (
    <Card className={cn(
      'bg-white border border-gray-200 hover:shadow-md transition-all duration-200 group',
      className
    )}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{loan.loan_number}</h3>
              <Badge className={cn('border', statusConfig.color)}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
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
          
          <button 
            onClick={() => onViewDetails(loan)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <Eye className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Loan Amount */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Loan Amount (Disbursed)
          </p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(loan.principal_amount)}
          </p>
        </div>

        {/* Purpose and Notes - Compact Inline Display */}
        {(loan.purpose || loan.notes) && (
          <div className="mb-4 space-y-2">
            {loan.purpose && (
              <div className="flex items-start space-x-2 text-sm">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 font-medium">Purpose: </span>
                  <span className="text-gray-700">{loan.purpose}</span>
                </div>
              </div>
            )}
            {loan.notes && (
              <div className="flex items-start space-x-2 text-sm">
                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 font-medium">Notes: </span>
                  <span className="text-gray-700">{loan.notes}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EMI Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              EMI Progress
            </span>
            <span className="text-xs font-bold text-gray-900">
              {loan.paid_emis}/{loan.total_emis} ({Math.round(progressPercentage)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                isCompleted ? "bg-green-500" : "bg-blue-600"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Next Due (if applicable) */}
        {loan.next_due_date && !isCompleted && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Next EMI Due</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-orange-900">
                  {formatCurrency(loan.next_due_amount)}
                </p>
                <p className="text-xs text-orange-700">{formatDate(loan.next_due_date)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Completed Status */}
        {isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Loan Fully Paid</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(loan)}
            className="flex-1 h-9 text-sm font-medium"
          >
            View Details
          </Button>
          <Button
            size="sm"
            onClick={() => onRecordPayment(loan.id)}
            disabled={isCompleted}
            className={cn(
              "flex-1 h-9 text-sm font-medium",
              isCompleted && "opacity-50 cursor-not-allowed"
            )}
          >
            <Receipt className="w-4 h-4 mr-2" />
            {isCompleted ? "Fully Paid" : "Record Payment"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}