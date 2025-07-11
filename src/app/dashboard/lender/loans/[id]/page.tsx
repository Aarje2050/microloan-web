// app/dashboard/lender/loans/[id]/page.tsx - COMPLETE LOAN DETAILS PAGE WITH ALL FEATURES
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  ArrowLeft,
  Edit,
  Receipt,
  Calendar,
  User,
  Phone,
  Mail,
  IndianRupee,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  RefreshCw,
  CreditCard,
  FileText,
  Trash2,
  Eye,
  Edit3,
  Search,
  Info,
  History,
  Settings,
  X,
  Save,
  AlertCircle as AlertCircleIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

// Types based on your database structure
interface LoanDetails {
  id: string;
  loan_number: string;
  borrower_id: string;
  principal_amount: number;
  interest_rate: number;
  tenure_value: number;
  tenure_unit: string;
  loan_type: string;
  repayment_frequency: string;
  total_amount: number;
  status: string;
  disbursement_date: string;
  maturity_date: string;
  created_by: string;
  approved_by: string;
  approved_at: string;
  disbursed_at: string;
  late_fee_rate: number;
  grace_period_days: number;
  notes: string;
  purpose: string;
  current_principal_balance: number;
  is_interest_only: boolean;
  created_at: string;
}

interface BorrowerDetails {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  employment_type?: string;
  monthly_income?: number;
}

interface EMIDetails {
  id: string;
  emi_number: number;
  due_date: string;
  amount: number;
  status: string;
  paid_date: string;
  paid_amount: number;
  principal_amount: number;
  interest_amount: number;
  late_fee: number;
  penalty_amount: number;
  outstanding_balance: number;
  payment_status: string;
  days_overdue: number;
}

interface PaymentDetails {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  notes: string;
  recorded_by: string;
  emi_id: string;
  payment_reference: string;
  late_fee_paid: number;
  penalty_paid: number;
  payment_status: string;
  payment_type: string;
  created_at: string;
}

interface LoanSummaryStats {
  totalEMIs: number;
  paidEMIs: number;
  overdueEMIs: number;
  upcomingEMIs: number;
  totalPaid: number;
  outstandingBalance: number;
  nextDueDate: string;
  nextDueAmount: number;
}

// Edit Loan Modal Component
interface EditLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanDetails;
  onSave: (updatedLoan: Partial<LoanDetails>) => Promise<void>;
}

function EditLoanModal({ isOpen, onClose, loan, onSave }: EditLoanModalProps) {
  const [formData, setFormData] = useState({
    principal_amount: loan.principal_amount,
    interest_rate: loan.interest_rate,
    tenure_value: loan.tenure_value,
    tenure_unit: loan.tenure_unit,
    loan_type: loan.loan_type,
    repayment_frequency: loan.repayment_frequency,
    late_fee_rate: loan.late_fee_rate || 2.0,
    grace_period_days: loan.grace_period_days || 0,
    purpose: loan.purpose || '',
    notes: loan.notes || ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.principal_amount || formData.principal_amount <= 0) {
      newErrors.principal_amount = 'Principal amount must be greater than 0';
    }

    if (!formData.interest_rate || formData.interest_rate < 0) {
      newErrors.interest_rate = 'Interest rate must be 0 or greater';
    }

    if (!formData.tenure_value || formData.tenure_value <= 0) {
      newErrors.tenure_value = 'Tenure must be greater than 0';
    }

    if (formData.late_fee_rate < 0) {
      newErrors.late_fee_rate = 'Late fee rate cannot be negative';
    }

    if (formData.grace_period_days < 0) {
      newErrors.grace_period_days = 'Grace period cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Calculate new total amount based on updated values
      const totalAmount = formData.principal_amount * (1 + (formData.interest_rate / 100));
      
      await onSave({
        ...formData,
        total_amount: totalAmount
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to update loan:', error);
      alert('Failed to update loan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Edit Loan</h3>
              <p className="text-sm text-gray-500 mt-1">{loan.loan_number}</p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Principal Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Principal Amount *
              </label>
              <input
                type="number"
                value={formData.principal_amount}
                onChange={(e) => handleInputChange('principal_amount', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.principal_amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter principal amount"
              />
              {errors.principal_amount && (
                <p className="text-red-500 text-xs mt-1">{errors.principal_amount}</p>
              )}
            </div>

            {/* Interest Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (%) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.interest_rate}
                onChange={(e) => handleInputChange('interest_rate', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.interest_rate ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter interest rate"
              />
              {errors.interest_rate && (
                <p className="text-red-500 text-xs mt-1">{errors.interest_rate}</p>
              )}
            </div>

            {/* Tenure Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenure Value *
              </label>
              <input
                type="number"
                value={formData.tenure_value}
                onChange={(e) => handleInputChange('tenure_value', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.tenure_value ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter tenure value"
              />
              {errors.tenure_value && (
                <p className="text-red-500 text-xs mt-1">{errors.tenure_value}</p>
              )}
            </div>

            {/* Tenure Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenure Unit *
              </label>
              <select
                value={formData.tenure_unit}
                onChange={(e) => handleInputChange('tenure_unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="months">Months</option>
                <option value="years">Years</option>
                <option value="weeks">Weeks</option>
                <option value="days">Days</option>
              </select>
            </div>

            {/* Loan Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Type *
              </label>
              <select
                value={formData.loan_type}
                onChange={(e) => handleInputChange('loan_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="personal">Personal Loan</option>
                <option value="business">Business Loan</option>
                <option value="home">Home Loan</option>
                <option value="vehicle">Vehicle Loan</option>
                <option value="education">Education Loan</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Repayment Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repayment Frequency *
              </label>
              <select
                value={formData.repayment_frequency}
                onChange={(e) => handleInputChange('repayment_frequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="bi_weekly">Bi-Weekly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {/* Late Fee Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Fee Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.late_fee_rate}
                onChange={(e) => handleInputChange('late_fee_rate', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.late_fee_rate ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter late fee rate"
              />
              {errors.late_fee_rate && (
                <p className="text-red-500 text-xs mt-1">{errors.late_fee_rate}</p>
              )}
            </div>

            {/* Grace Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grace Period (Days)
              </label>
              <input
                type="number"
                value={formData.grace_period_days}
                onChange={(e) => handleInputChange('grace_period_days', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.grace_period_days ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter grace period in days"
              />
              {errors.grace_period_days && (
                <p className="text-red-500 text-xs mt-1">{errors.grace_period_days}</p>
              )}
            </div>

            {/* Purpose */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose
              </label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter loan purpose"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter any additional notes"
              />
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <div className="flex items-start space-x-3">
              <AlertCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Important Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Editing loan details will update the loan information but won't automatically recalculate EMIs. 
                  Consider the impact on existing EMI schedule before making changes.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// EMI Status Change Modal
interface EMIStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  emi: EMIDetails;
  onSave: (emiId: string, updates: Partial<EMIDetails>) => Promise<void>;
}

function EMIStatusModal({ isOpen, onClose, emi, onSave }: EMIStatusModalProps) {
  const [formData, setFormData] = useState({
    payment_status: emi.payment_status || 'pending',
    paid_amount: emi.paid_amount || 0,
    paid_date: emi.paid_date || '',
    status: emi.status || 'pending',
    late_fee: emi.late_fee || 0,
    penalty_amount: emi.penalty_amount || 0,
    days_overdue: emi.days_overdue || 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave(emi.id, formData);
      onClose();
    } catch (error) {
      console.error('Failed to update EMI:', error);
      alert('Failed to update EMI status');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Edit EMI Status</h3>
              <p className="text-sm text-gray-500">EMI #{emi.emi_number} - Due: {formatDate(emi.due_date)}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status *
              </label>
              <select
                value={formData.payment_status}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Paid Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.paid_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, paid_amount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter paid amount"
              />
              <p className="text-xs text-gray-500 mt-1">EMI Amount: {formatCurrency(emi.amount)}</p>
            </div>

            {/* Paid Date */}
            {(formData.payment_status === 'paid' || formData.payment_status === 'partial') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paid Date
                </label>
                <input
                  type="date"
                  value={formData.paid_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, paid_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Advanced Options Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Settings className="h-4 w-4" />
                <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
              </button>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Late Fee
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.late_fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, late_fee: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Penalty Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.penalty_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, penalty_amount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Days Overdue
                    </label>
                    <input
                      type="number"
                      value={formData.days_overdue}
                      onChange={(e) => setFormData(prev => ({ ...prev, days_overdue: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Manual Status Change</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This will manually update the EMI status. Make sure this change is intentional and documented.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// EMI Investigation Modal
interface EMIInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  emi: EMIDetails;
  loanId: string;
}

function EMIInvestigationModal({ isOpen, onClose, emi, loanId }: EMIInvestigationModalProps) {
  const [investigationData, setInvestigationData] = useState<{
    relatedPayments: PaymentDetails[];
    emiHistory: any[];
    inconsistencies: string[];
  }>({
    relatedPayments: [],
    emiHistory: [],
    inconsistencies: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      investigateEMI();
    }
  }, [isOpen, emi.id]);

  const investigateEMI = async () => {
    setIsLoading(true);
    try {
      // Find payments related to this EMI
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('emi_id', emi.id);

      // Find all payments for this loan on the same date
      const { data: sameDatePayments } = await supabase
        .from('payments')
        .select('*')
        .eq('loan_id', loanId)
        .eq('payment_date', emi.due_date);

      // Check for inconsistencies
      const inconsistencies: string[] = [];
      
      // Check if EMI is marked as paid but no payment records
      if ((emi.payment_status === 'paid' || emi.paid_amount >= emi.amount) && (!payments || payments.length === 0)) {
        inconsistencies.push('EMI marked as paid but no payment records found');
      }

      // Check if paid amount doesn't match payment records
      const totalPayments = (payments || []).reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPayments - (emi.paid_amount || 0)) > 0.01) {
        inconsistencies.push(`Payment records total (${formatCurrency(totalPayments)}) doesn't match EMI paid amount (${formatCurrency(emi.paid_amount || 0)})`);
      }

      setInvestigationData({
        relatedPayments: payments || [],
        emiHistory: [], // We don't have audit logs, but this could be added
        inconsistencies
      });

    } catch (error) {
      console.error('Investigation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">EMI Investigation</h3>
              <p className="text-sm text-gray-500">EMI #{emi.emi_number} - {formatCurrency(emi.amount)}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p>Investigating EMI...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* EMI Current Status */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Current EMI Status</h4>
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Payment Status</p>
                    <p className="font-semibold">{emi.payment_status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Paid Amount</p>
                    <p className="font-semibold">{formatCurrency(emi.paid_amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Due Amount</p>
                    <p className="font-semibold">{formatCurrency(emi.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Paid Date</p>
                    <p className="font-semibold">{emi.paid_date ? formatDate(emi.paid_date) : 'Not set'}</p>
                  </div>
                </div>
              </div>

              {/* Inconsistencies */}
              {investigationData.inconsistencies.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    Issues Found
                  </h4>
                  <div className="space-y-2">
                    {investigationData.inconsistencies.map((issue, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">{issue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Payments */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Related Payment Records</h4>
                {investigationData.relatedPayments.length > 0 ? (
                  <div className="space-y-3">
                    {investigationData.relatedPayments.map((payment) => (
                      <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Amount</p>
                            <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="font-semibold">{formatDate(payment.payment_date)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Method</p>
                            <p className="font-semibold capitalize">{payment.payment_method}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Reference</p>
                            <p className="font-semibold">{payment.reference_number || 'N/A'}</p>
                          </div>
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-gray-600 mt-2">Notes: {payment.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">No payment records found for this EMI.</p>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <ul className="text-sm text-blue-800 space-y-1">
                    {investigationData.inconsistencies.length > 0 ? (
                      <>
                        <li>• Review and correct the inconsistencies found above</li>
                        <li>• Check if payments were recorded manually in the database</li>
                        <li>• Verify with borrower about actual payment status</li>
                        <li>• Consider creating a payment record if payment was actually made</li>
                      </>
                    ) : (
                      <li>• No issues detected. EMI status appears consistent with payment records.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          <Button onClick={onClose} className="w-full">
            Close Investigation
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function LoanDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLender, initialized, isAuthenticated } = useAuth();
  const loanId = params.id as string;

  // State
  const [loan, setLoan] = React.useState<LoanDetails | null>(null);
  const [borrower, setBorrower] = React.useState<BorrowerDetails | null>(null);
  const [emis, setEMIs] = React.useState<EMIDetails[]>([]);
  const [payments, setPayments] = React.useState<PaymentDetails[]>([]);
  const [stats, setStats] = React.useState<LoanSummaryStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'emis' | 'payments'>('overview');
  const [error, setError] = React.useState<string | null>(null);

  // Modal states
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [selectedEMIForEdit, setSelectedEMIForEdit] = useState<EMIDetails | null>(null);
  const [selectedEMIForInvestigation, setSelectedEMIForInvestigation] = useState<EMIDetails | null>(null);
  const [showEMIStatusModal, setShowEMIStatusModal] = useState(false);
  const [showEMIInvestigationModal, setShowEMIInvestigationModal] = useState(false);

  console.log("💳 LOAN DETAILS - Loan ID:", loanId, "User:", user?.email);

  // Auth check
  React.useEffect(() => {
    if (!initialized) return;
    
    if (!isAuthenticated || !isLender) {
      router.replace("/dashboard");
      return;
    }
  }, [initialized, isAuthenticated, isLender, router]);

  // Load loan data
  React.useEffect(() => {
    if (!user || !isLender || !loanId) return;
    loadLoanDetails();
  }, [user, isLender, loanId]);

  const loadLoanDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load loan details
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .eq('created_by', user?.id) // Security: only show loans created by this lender
        .eq('is_deleted', false)
        .single();

      if (loanError) {
        if (loanError.code === 'PGRST116') {
          setError('Loan not found or access denied');
          return;
        }
        throw loanError;
      }

      if (!loanData) {
        setError('Loan not found');
        return;
      }

      setLoan(loanData);

      // Load borrower details
      const { data: borrowerData, error: borrowerError } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .eq('id', loanData.borrower_id)
        .single();

      if (borrowerError) {
        console.warn('Could not load borrower details:', borrowerError);
      } else {
        setBorrower(borrowerData);
      }

      // Load borrower profile for additional details
      const { data: profileData } = await supabase
        .from('borrowers')
        .select('employment_type, monthly_income')
        .eq('user_id', loanData.borrower_id)
        .single();

      if (profileData && borrowerData) {
        setBorrower({
          ...borrowerData,
          employment_type: profileData.employment_type,
          monthly_income: profileData.monthly_income
        });
      }

      // Load EMIs
      const { data: emisData, error: emisError } = await supabase
        .from('emis')
        .select('*')
        .eq('loan_id', loanId)
        .eq('is_deleted', false)
        .order('emi_number', { ascending: true });

      if (emisError) {
        console.warn('Could not load EMIs:', emisError);
      } else {
        setEMIs(emisData || []);
      }

      // Load payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('loan_id', loanId)
        .order('payment_date', { ascending: false });

      if (paymentsError) {
        console.warn('Could not load payments:', paymentsError);
      } else {
        setPayments(paymentsData || []);
      }

      // Calculate stats
      if (emisData) {
        calculateStats(emisData, loanData);
      }

    } catch (error) {
      console.error('❌ Failed to load loan details:', error);
      setError('Failed to load loan details');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (emisData: EMIDetails[], loanData: LoanDetails) => {
    const today = new Date();
    
    const totalEMIs = emisData.length;
    const paidEMIs = emisData.filter(emi => emi.payment_status === 'paid' || emi.paid_amount >= emi.amount).length;
    const overdueEMIs = emisData.filter(emi => {
      const dueDate = new Date(emi.due_date);
      return dueDate < today && emi.payment_status !== 'paid' && emi.paid_amount < emi.amount;
    }).length;
    const upcomingEMIs = totalEMIs - paidEMIs - overdueEMIs;

    const totalPaid = emisData.reduce((sum, emi) => sum + (emi.paid_amount || 0), 0);
    const outstandingBalance = loanData.total_amount - totalPaid;

    // Find next due EMI
    const unpaidEMIs = emisData
      .filter(emi => emi.payment_status !== 'paid' && emi.paid_amount < emi.amount)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    
    const nextDueEMI = unpaidEMIs[0];

    setStats({
      totalEMIs,
      paidEMIs,
      overdueEMIs,
      upcomingEMIs,
      totalPaid,
      outstandingBalance,
      nextDueDate: nextDueEMI?.due_date || '',
      nextDueAmount: nextDueEMI ? nextDueEMI.amount - (nextDueEMI.paid_amount || 0) : 0
    });
  };

  const handleSaveLoan = async (updatedLoanData: Partial<LoanDetails>) => {
    try {
      console.log("💾 Updating loan:", loanId, updatedLoanData);

      const { error } = await supabase
        .from('loans')
        .update({
          principal_amount: updatedLoanData.principal_amount,
          interest_rate: updatedLoanData.interest_rate,
          tenure_value: updatedLoanData.tenure_value,
          tenure_unit: updatedLoanData.tenure_unit,
          loan_type: updatedLoanData.loan_type,
          repayment_frequency: updatedLoanData.repayment_frequency,
          total_amount: updatedLoanData.total_amount,
          late_fee_rate: updatedLoanData.late_fee_rate,
          grace_period_days: updatedLoanData.grace_period_days,
          purpose: updatedLoanData.purpose,
          notes: updatedLoanData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', loanId)
        .eq('created_by', user?.id); // Security check

      if (error) {
        throw error;
      }

      console.log("✅ Loan updated successfully");
      
      // Show success message
      alert("Loan updated successfully!");
      
      // Reload loan details to show updated data
      await loadLoanDetails();
      
    } catch (error) {
      console.error("❌ Failed to update loan:", error);
      throw error;
    }
  };

  const handleUpdateEMIStatus = async (emiId: string, updates: Partial<EMIDetails>) => {
    try {
      console.log("💾 Updating EMI status:", emiId, updates);

      const { error } = await supabase
        .from('emis')
        .update({
          payment_status: updates.payment_status,
          paid_amount: updates.paid_amount,
          paid_date: updates.paid_date || null,
          status: updates.status,
          late_fee: updates.late_fee,
          penalty_amount: updates.penalty_amount,
          days_overdue: updates.days_overdue,
          updated_at: new Date().toISOString()
        })
        .eq('id', emiId);

      if (error) {
        throw error;
      }

      console.log("✅ EMI status updated successfully");
      alert("EMI status updated successfully!");
      
      // Reload loan details
      await loadLoanDetails();
      
    } catch (error) {
      console.error("❌ Failed to update EMI status:", error);
      throw error;
    }
  };

  const getEMIStatusBadge = (emi: EMIDetails) => {
    const today = new Date();
    const dueDate = new Date(emi.due_date);
    const isPaid = emi.payment_status === 'paid' || emi.paid_amount >= emi.amount;
    const isPartial = emi.paid_amount > 0 && emi.paid_amount < emi.amount;
    const isOverdue = dueDate < today && !isPaid;

    if (isPaid) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
    } else if (isPartial) {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Partial</Badge>;
    } else if (isOverdue) {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800"><Calendar className="w-3 h-3 mr-1" />Upcoming</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      'cash': 'bg-green-100 text-green-800',
      'bank_transfer': 'bg-blue-100 text-blue-800',
      'cheque': 'bg-purple-100 text-purple-800',
      'online': 'bg-indigo-100 text-indigo-800',
      'upi': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {method.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (!initialized || !isAuthenticated || !isLender) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading loan details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !loan) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {error || 'Loan not found'}
            </h2>
            <Button onClick={() => router.push('/dashboard/lender/loans')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Loans
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const progressPercentage = stats ? (stats.paidEMIs / stats.totalEMIs) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/lender/loans')}
                  size="sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Loans
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{loan.loan_number}</h1>
                  <p className="text-gray-600">Loan Details & Management</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Loan
                </Button>
                <Button size="sm">
                  <Receipt className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Summary Cards */}
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Principal Amount</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(loan.principal_amount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Paid Amount</p>
                    <p className="text-xl font-bold text-green-900">
                      {stats ? formatCurrency(stats.totalPaid) : formatCurrency(0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Outstanding</p>
                    <p className="text-xl font-bold text-orange-900">
                      {stats ? formatCurrency(stats.outstandingBalance) : formatCurrency(loan.total_amount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Progress</p>
                    <p className="text-xl font-bold text-purple-900">
                      {Math.round(progressPercentage)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Loan Progress</span>
                <span className="font-medium text-gray-900">
                  {stats ? `${stats.paidEMIs}/${stats.totalEMIs} EMIs` : '0/0 EMIs'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4 text-center">
                <div>
                  <p className="text-xs text-gray-500">Paid</p>
                  <p className="text-lg font-bold text-green-600">{stats?.paidEMIs || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Overdue</p>
                  <p className="text-lg font-bold text-red-600">{stats?.overdueEMIs || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Upcoming</p>
                  <p className="text-lg font-bold text-blue-600">{stats?.upcomingEMIs || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-600">{stats?.totalEMIs || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: FileText },
                { id: 'emis', name: 'EMI Schedule', icon: Calendar },
                { id: 'payments', name: 'Payment History', icon: Receipt }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm",
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Loan Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Loan Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Interest Rate</p>
                      <p className="font-semibold">{loan.interest_rate}% per {loan.tenure_unit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Loan Type</p>
                      <p className="font-semibold capitalize">{loan.loan_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tenure</p>
                      <p className="font-semibold">{loan.tenure_value} {loan.tenure_unit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Repayment</p>
                      <p className="font-semibold capitalize">{loan.repayment_frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Disbursed Date</p>
                      <p className="font-semibold">{formatDate(loan.disbursement_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Maturity Date</p>
                      <p className="font-semibold">{formatDate(loan.maturity_date)}</p>
                    </div>
                  </div>
                  
                  {loan.purpose && (
                    <div>
                      <p className="text-sm text-gray-600">Purpose</p>
                      <p className="font-semibold">{loan.purpose}</p>
                    </div>
                  )}
                  
                  {loan.notes && (
                    <div>
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="text-sm text-gray-800">{loan.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Borrower Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Borrower Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {borrower ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {borrower.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{borrower.full_name}</p>
                          <p className="text-sm text-gray-600">Borrower</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{borrower.email}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{borrower.phone}</span>
                        </div>
                        {borrower.employment_type && (
                          <div>
                            <p className="text-sm text-gray-600">Employment</p>
                            <p className="font-semibold capitalize">{borrower.employment_type}</p>
                          </div>
                        )}
                        {borrower.monthly_income && (
                          <div>
                            <p className="text-sm text-gray-600">Monthly Income</p>
                            <p className="font-semibold">{formatCurrency(borrower.monthly_income)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Borrower information not available</p>
                  )}
                </CardContent>
              </Card>

              {/* Next Due EMI */}
              {stats && stats.nextDueDate && (
                <Card className="lg:col-span-2">
                  <CardContent className="p-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-orange-900">Next EMI Due</h4>
                          <p className="text-sm text-orange-700">
                            Due Date: {formatDate(stats.nextDueDate)}
                          </p>
                          <p className="text-lg font-bold text-orange-900">
                            {formatCurrency(stats.nextDueAmount)}
                          </p>
                        </div>
                        <Button size="sm">
                          <Receipt className="h-4 w-4 mr-2" />
                          Record Payment
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'emis' && (
            <Card>
              <CardHeader>
                <CardTitle>EMI Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2">EMI #</th>
                        <th className="text-left py-3 px-2">Due Date</th>
                        <th className="text-right py-3 px-2">Amount</th>
                        <th className="text-right py-3 px-2">Principal</th>
                        <th className="text-right py-3 px-2">Interest</th>
                        <th className="text-right py-3 px-2">Paid</th>
                        <th className="text-left py-3 px-2">Paid Date</th>
                        <th className="text-center py-3 px-2">Status</th>
                        <th className="text-center py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emis.map((emi) => (
                        <tr key={emi.id} className="border-b border-gray-100">
                          <td className="py-3 px-2 font-medium">{emi.emi_number}</td>
                          <td className="py-3 px-2">{formatDate(emi.due_date)}</td>
                          <td className="py-3 px-2 text-right font-medium">
                            {formatCurrency(emi.amount)}
                          </td>
                          <td className="py-3 px-2 text-right">
                            {formatCurrency(emi.principal_amount || 0)}
                          </td>
                          <td className="py-3 px-2 text-right">
                            {formatCurrency(emi.interest_amount || 0)}
                          </td>
                          <td className="py-3 px-2 text-right">
                            {formatCurrency(emi.paid_amount || 0)}
                          </td>
                          <td className="py-3 px-2">
                            {emi.paid_date ? formatDate(emi.paid_date) : '-'}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {getEMIStatusBadge(emi)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              {emi.payment_status !== 'paid' && (
                                <Button size="sm" variant="outline">
                                  Pay
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedEMIForEdit(emi);
                                  setShowEMIStatusModal(true);
                                }}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedEMIForInvestigation(emi);
                                  setShowEMIInvestigationModal(true);
                                }}
                              >
                                <Search className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'payments' && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                              <p className="text-sm text-gray-600">{formatDate(payment.payment_date)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {getPaymentMethodBadge(payment.payment_method)}
                            <p className="text-xs text-gray-600 mt-1">
                              Ref: {payment.reference_number || payment.payment_reference || 'N/A'}
                            </p>
                          </div>
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-gray-600 mt-2">{payment.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No payments recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Loan Modal */}
        {loan && (
          <EditLoanModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            loan={loan}
            onSave={handleSaveLoan}
          />
        )}

        {/* EMI Status Modal */}
        {selectedEMIForEdit && (
          <EMIStatusModal
            isOpen={showEMIStatusModal}
            onClose={() => {
              setShowEMIStatusModal(false);
              setSelectedEMIForEdit(null);
            }}
            emi={selectedEMIForEdit}
            onSave={handleUpdateEMIStatus}
          />
        )}

        {/* EMI Investigation Modal */}
        {selectedEMIForInvestigation && (
          <EMIInvestigationModal
            isOpen={showEMIInvestigationModal}
            onClose={() => {
              setShowEMIInvestigationModal(false);
              setSelectedEMIForInvestigation(null);
            }}
            emi={selectedEMIForInvestigation}
            loanId={loanId}
          />
        )}
      </div>
    </DashboardLayout>
  );
}