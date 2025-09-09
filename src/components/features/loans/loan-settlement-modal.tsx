'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, CheckCircle2, Calendar, IndianRupee, AlertTriangle } from 'lucide-react';

interface LoanSettlementModalProps {
  loan: {
    id: string;
    loan_number: string;
    borrower_name: string;
    outstanding_balance: number;
    pending_emis: number;
    total_emis: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (settlementData: SettlementData) => void;
  formatCurrency: (amount: number) => string;
}

interface SettlementData {
  settlementAmount: number;
  settlementDate: string;
  notes: string;
  paymentMethod: string;
}

export default function LoanSettlementModal({ 
  loan, 
  isOpen, 
  onClose, 
  onConfirm,
  formatCurrency 
}: LoanSettlementModalProps) {
  const [settlementAmount, setSettlementAmount] = React.useState(0);
  const [settlementDate, setSettlementDate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('cash');

  React.useEffect(() => {
    if (loan) {
      setSettlementAmount(loan.outstanding_balance);
      setSettlementDate(new Date().toISOString().split('T')[0]);
    }
  }, [loan]);

  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !loan) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAmountValid || !settlementDate) return;
    
    onConfirm({
      settlementAmount,
      settlementDate,
      notes,
      paymentMethod
    });
  };

  const isAmountValid = settlementAmount > 0 && settlementAmount <= loan.outstanding_balance;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] shadow-xl my-2 sm:my-4">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Settle Loan</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-140px)]">
          {/* Loan Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <IndianRupee className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Loan Details</span>
            </div>
            <p className="text-sm text-gray-600">Loan: {loan.loan_number}</p>
            <p className="text-sm text-gray-600">Borrower: {loan.borrower_name}</p>
            <p className="text-lg font-semibold text-gray-900">
              Outstanding: {formatCurrency(loan.outstanding_balance)}
            </p>
            <p className="text-sm text-gray-500">
              Remaining EMIs: {loan.pending_emis} out of {loan.total_emis}
            </p>
          </div>

          {/* Settlement Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Settlement Amount *
            </label>
            <Input
              type="number"
              value={settlementAmount}
              onChange={(e) => setSettlementAmount(Number(e.target.value))}
              max={loan.outstanding_balance}
              className="w-full h-10 text-base"
              placeholder="Enter settlement amount"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum: {formatCurrency(loan.outstanding_balance)}
            </p>
            {settlementAmount > loan.outstanding_balance && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Amount cannot exceed outstanding balance
              </p>
            )}
          </div>

          {/* Settlement Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Settlement Date *
            </label>
            <div className="relative">
              <Input
                type="date"
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="w-full pl-10 h-10 text-base"
                required
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 h-10 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Settlement Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              placeholder="e.g., Borrower paid full amount in cash, early settlement after 3 months..."
            />
          </div>

          {/* Preview */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">After Settlement:</h4>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Loan status will be marked as "Completed"</li>
              <li>• All remaining EMIs will be marked as "Paid" with status "Settled"</li>
              <li>• Settlement date and notes will be recorded</li>
              <li>• Loan will appear in completed loans section</li>
            </ul>
          </div>
        </form>

        {/* Actions - Fixed at bottom */}
        <div className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-white rounded-b-xl">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={!isAmountValid || !settlementDate}
              className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Settled
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
