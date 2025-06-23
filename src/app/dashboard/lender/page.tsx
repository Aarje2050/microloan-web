// app/dashboard/lender/page.tsx - PROFESSIONAL LENDER DASHBOARD WITH MONTHLY INTEREST
"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  Users,
  CreditCard,
  Calendar,
  DollarSign,
  Plus,
  Eye,
  Receipt,
  RefreshCw,
  ArrowRight,
  Phone,
  Mail,
  User,
  TrendingUp,
  TrendingDown,
  X,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AddBorrowerForm from "@/components/forms/add-borrower-form";
import CreateLoanForm from "@/components/forms/loan/create-loan-form";
import RecordPaymentForm from "@/components/forms/loan/record-payment-form";
import { UnifiedLoanCard } from "@/components/ui/unified-loan-card";
import { LoanSummary, calculateLoanStatus } from "@/lib/loan-utils";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface Borrower {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  employment_type: string | null;
  monthly_income: number | null;
  credit_score: number | null;
  kyc_status: string;
  created_at: string;
}

interface DashboardStats {
  totalBorrowers: number;
  activeLoans: number;
  dueEmis: number;
  currentMonthEarnings: number; // EMIs due in current month
  totalLoanDisbursed: number; // Total loan disbursed
}

type ViewMode = "dashboard" | "add-borrower" | "create-loan" | "record-payment";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading?: boolean;
  onClick?: () => void;
  subtitle?: string;
}

function StatsCard({ title, value, icon: Icon, loading, onClick, subtitle }: StatsCardProps) {
  const isClickable = !!onClick;
  
  return (
    <Card 
      className={`bg-white border border-gray-200 hover:shadow-md transition-all duration-200 ${
        isClickable ? 'cursor-pointer hover:border-blue-300' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                {subtitle && (
                  <p className="text-xs text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>
            {loading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            )}
          </div>
          {isClickable && (
            <ArrowRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface LoanDetailsModalProps {
  loan: LoanSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordPayment: (loanId: string) => void;
}

function LoanDetailsModal({ loan, isOpen, onClose, onRecordPayment }: LoanDetailsModalProps) {
  if (!isOpen || !loan) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const progressPercentage = loan.total_emis > 0 ? (loan.paid_emis / loan.total_emis) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{loan.loan_number}</h3>
              <p className="text-sm text-gray-500 mt-1">Loan Details & Progress</p>
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
        <div className="p-4 sm:p-6 space-y-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
              <div className="mt-2">
                <span className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-full border',
                  getStatusColor(loan.status)
                )}>
                  {loan.status.toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</label>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {Math.round(progressPercentage)}% Complete
              </p>
            </div>
          </div>

          {/* Financial Details */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Financial Overview</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Disbursed</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatDate(loan.disbursement_date)}</p>
              </div>
            </div>
          </div>

          {/* Purpose & Notes */}
          {(loan.purpose || loan.notes) && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Loan Information</h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {loan.purpose && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Purpose</p>
                    <p className="text-sm text-gray-700">{loan.purpose}</p>
                  </div>
                )}
                {loan.notes && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{loan.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EMI Progress */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">EMI Progress</h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-900">
                  {loan.paid_emis}/{loan.total_emis} EMIs ({Math.round(progressPercentage)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Paid EMIs</p>
                  <p className="text-lg font-bold text-green-600">{loan.paid_emis}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Pending EMIs</p>
                  <p className="text-lg font-bold text-orange-600">{loan.pending_emis}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Borrower Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Borrower Information</h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{loan.borrower_name}</p>
                  <p className="text-sm text-gray-600">Loan Borrower</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next EMI Information */}
          {loan.next_due_date && loan.status === 'active' && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Next EMI</h4>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-orange-900">
                      Due Date: {formatDate(loan.next_due_date)}
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      Amount: {formatCurrency(loan.next_due_amount)}
                    </p>
                  </div>
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-10"
            >
              Close
            </Button>
            {loan.status === 'active' && (
              <Button
                onClick={() => {
                  onClose();
                  onRecordPayment(loan.id);
                }}
                className="flex-1 h-10"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface BorrowerDetailsModalProps {
  borrower: Borrower | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateLoan: (borrowerId: string) => void;
}

function BorrowerDetailsModal({ borrower, isOpen, onClose, onCreateLoan }: BorrowerDetailsModalProps) {
  if (!isOpen || !borrower) return null;

  const getKycStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {borrower.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{borrower.full_name}</h3>
                <p className="text-sm text-gray-500">Borrower Details</p>
              </div>
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
        <div className="p-4 sm:p-6 space-y-6">
          {/* Contact Information */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-4">Contact Information</h4>
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-900 break-all font-medium">{borrower.email}</span>
              </div>
              {borrower.phone && borrower.phone !== 'N/A' && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-900 font-medium">{borrower.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-4">Financial Profile</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Income</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {borrower.monthly_income ? formatCurrency(borrower.monthly_income) : 'Not provided'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Score</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {borrower.credit_score || 'Not available'}
                </p>
              </div>
              {borrower.employment_type && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Employment Type</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 capitalize">{borrower.employment_type}</p>
                </div>
              )}
            </div>
          </div>

          {/* KYC Status */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-4">Verification Status</h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">KYC Status</p>
                  <span className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-full border',
                    getKycStatusColor(borrower.kyc_status)
                  )}>
                    {borrower.kyc_status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-4">Account Information</h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Added On</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{formatDate(borrower.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-10"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                onClose();
                onCreateLoan(borrower.user_id);
              }}
              className="flex-1 h-10"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Create Loan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoanCardProps {
  loan: LoanSummary;
  onRecordPayment: (loanId: string) => void;
  onViewDetails: (loan: LoanSummary) => void;
}

function LoanCard({ loan, onRecordPayment, onViewDetails }: LoanCardProps) {
  return (
    <UnifiedLoanCard
      loan={loan}
      onRecordPayment={onRecordPayment}
      onViewDetails={onViewDetails}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
    />
  );
}

interface BorrowerCardProps {
  borrower: Borrower;
  onCreateLoan: (borrowerId: string) => void;
  onViewDetails: (borrower: Borrower) => void;
}

function BorrowerCard({ borrower, onCreateLoan, onViewDetails }: BorrowerCardProps) {
  const getKycStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{borrower.full_name}</h3>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-xs text-gray-600 flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {borrower.email}
                </span>
                {borrower.phone && (
                  <span className="text-xs text-gray-600 flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {borrower.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => onViewDetails(borrower)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Eye className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Monthly Income</p>
            <p className="text-sm font-bold text-gray-900">
              {borrower.monthly_income ? formatCurrency(borrower.monthly_income) : 'Not provided'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Credit Score</p>
            <p className="text-sm font-bold text-gray-900">
              {borrower.credit_score || 'Not available'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">KYC Status</p>
            <Badge className={getKycStatusColor(borrower.kyc_status)}>
              {borrower.kyc_status.toUpperCase()}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-gray-500">Added: {formatDate(borrower.created_at)}</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(borrower)}
            className="flex-1 h-9 text-sm"
          >
            View Details
          </Button>
          <Button
            size="sm"
            onClick={() => onCreateLoan(borrower.user_id)}
            className="flex-1 h-9 text-sm"
          >
            Create Loan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LenderDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLender, initialized, isAuthenticated } = useAuth();

  // State management
  const [viewMode, setViewMode] = React.useState<ViewMode>("dashboard");
  const [selectedBorrowerForLoan, setSelectedBorrowerForLoan] = React.useState<string>("");
  const [selectedLoanForPayment, setSelectedLoanForPayment] = React.useState<string>("");
  const [borrowers, setBorrowers] = React.useState<Borrower[]>([]);
  const [loans, setLoans] = React.useState<LoanSummary[]>([]);
  
  // Modal state
  const [selectedLoanForDetails, setSelectedLoanForDetails] = React.useState<LoanSummary | null>(null);
  const [selectedBorrowerForDetails, setSelectedBorrowerForDetails] = React.useState<Borrower | null>(null);
  const [showLoanDetailsModal, setShowLoanDetailsModal] = React.useState(false);
  const [showBorrowerDetailsModal, setShowBorrowerDetailsModal] = React.useState(false);
  
  const [stats, setStats] = React.useState<DashboardStats>({
    totalBorrowers: 0,
    activeLoans: 0,
    dueEmis: 0,
    currentMonthEarnings: 0, // EMIs due in current month
    totalLoanDisbursed: 0// Total loan disbursed

  });
  const [loading, setLoading] = React.useState({
    borrowers: true,
    loans: true,
    stats: true,
  });
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  console.log("💼 LENDER DASHBOARD - State:", {
    user: user?.email,
    isLender,
    viewMode,
    borrowersCount: borrowers.length,
    loansCount: loans.length,
  });

  // Auth handling
  React.useEffect(() => {
    if (!initialized) return;

    if (!isAuthenticated) {
      console.log("🚫 LENDER - Not authenticated, redirecting to login");
      router.replace("/login");
      return;
    }

    if (!isLender) {
      console.log("🚫 LENDER - Not lender, redirecting to dashboard");
      router.replace("/dashboard");
      return;
    }

    console.log("✅ LENDER - Access granted");
  }, [initialized, isAuthenticated, isLender, router]);

  // Handle URL parameters for deep linking to forms
  React.useEffect(() => {
    if (!initialized || !isAuthenticated || !isLender) return;

    const mode = searchParams.get('mode');
    const loanId = searchParams.get('loan');
    const borrowerId = searchParams.get('borrower');

    console.log("📋 DASHBOARD - URL params:", { mode, loanId, borrowerId });

    if (mode && mode !== viewMode) {
      switch (mode) {
        case 'record-payment':
          if (loanId) {
            setSelectedLoanForPayment(loanId);
            setViewMode("record-payment");
          }
          break;
        case 'create-loan':
          if (borrowerId) {
            setSelectedBorrowerForLoan(borrowerId);
          }
          setViewMode("create-loan");
          break;
        case 'add-borrower':
          setViewMode("add-borrower");
          break;
        default:
          console.log("⚠️ Unknown mode:", mode);
      }
    }
  }, [initialized, isAuthenticated, isLender, searchParams, viewMode]);

  // Load dashboard data
  React.useEffect(() => {
    if (!user || !isLender) return;
    loadDashboardData();
  }, [user, isLender]);

  // Monthly EMI Calculation Function - Current Month Earnings Only
  const calculateCurrentMonthEarnings = async (loans: LoanSummary[]) => {
    try {
      // Get current month date range
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-based (0 = Jan, 11 = Dec)
      
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];
      
      console.log(`📅 Calculating earnings for ${startDate} to ${endDate}`);

      // Get all loan IDs
      const loanIds = loans.map(loan => loan.id);
      
      if (loanIds.length === 0) {
        return 0;
      }

      // Get EMIs for current month - either due in this month OR paid in this month
      const { data: currentMonthEMIs, error } = await supabase
        .from('emis')
        .select('id, loan_id, amount, due_date, paid_date, paid_amount')
        .in('loan_id', loanIds)
        .or(`due_date.gte.${startDate},due_date.lte.${endDate},paid_date.gte.${startDate},paid_date.lte.${endDate}`);

      if (error) {
        console.error('Failed to fetch current month EMIs:', error);
        return 0;
      }

      if (!currentMonthEMIs || currentMonthEMIs.length === 0) {
        console.log('📊 No EMIs found for current month');
        return 0;
      }

      let totalEarnings = 0;
      let dueThisMonth = 0;
      let paidThisMonth = 0;

      currentMonthEMIs.forEach(emi => {
        const dueDate = new Date(emi.due_date);
        const paidDate = emi.paid_date ? new Date(emi.paid_date) : null;
        const paidAmount = emi.paid_amount || 0;
        
        // Check if EMI is due in current month
        const isDueThisMonth = dueDate >= startOfMonth && dueDate <= endOfMonth;
        
        // Check if EMI was paid in current month
        const isPaidThisMonth = paidDate && paidDate >= startOfMonth && paidDate <= endOfMonth;

        if (isDueThisMonth) {
          dueThisMonth += emi.amount;
          console.log(`📊 Due this month: Loan ${emi.loan_id} - ₹${emi.amount} (Due: ${emi.due_date})`);
        }

        if (isPaidThisMonth) {
          paidThisMonth += paidAmount;
          console.log(`📊 Paid this month: Loan ${emi.loan_id} - ₹${paidAmount} (Paid: ${emi.paid_date})`);
        }

        // For earnings calculation, count EMIs that are due this month
        // regardless of payment status (this shows expected earnings)
        if (isDueThisMonth) {
          totalEarnings += emi.amount;
        }
      });

      console.log(`📅 Current Month Summary:`);
      console.log(`📊 EMIs Due This Month: ₹${dueThisMonth.toLocaleString()}`);
      console.log(`💰 EMIs Paid This Month: ₹${paidThisMonth.toLocaleString()}`);
      console.log(`🎯 Total Expected Earnings: ₹${totalEarnings.toLocaleString()}`);

      return totalEarnings;

    } catch (error) {
      console.error('Error calculating current month earnings:', error);
      return 0;
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      console.log("📊 LENDER - Loading dashboard data for lender:", user.id);
      await Promise.all([loadBorrowers(), loadLoans()]);
    } catch (error: unknown) {
      console.error("❌ LENDER - Failed to load dashboard data:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadDashboardData();
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const loadBorrowers = async () => {
    try {
      setLoading(prev => ({ ...prev, borrowers: true }));

      const { data: borrowersData, error: borrowersError } = await supabase
        .from("borrowers")
        .select("id, user_id, credit_score, employment_type, monthly_income, created_at")
        .eq("lender_id", user?.id)
        .order("created_at", { ascending: false });

      if (borrowersError) throw borrowersError;

      if (!borrowersData || borrowersData.length === 0) {
        setBorrowers([]);
        updateStats({ borrowers: 0 });
        return;
      }

      const userIds = borrowersData.map((b) => b.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, email, phone")
        .in("id", userIds);

      if (usersError) throw usersError;

      let profilesData: Array<Record<string, any>> = [];
      try {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("user_id, kyc_status")
          .in("user_id", userIds);
        profilesData = profiles || [];
      } catch (profileError) {
        console.log("⚠️ LENDER - Profiles table might not exist:", profileError);
      }

      const transformedBorrowers: Borrower[] = borrowersData.map((borrower) => {
        const userInfo = usersData?.find((u) => u.id === borrower.user_id);
        const profileInfo = profilesData.find((p) => p.user_id === borrower.user_id);

        return {
          id: borrower.id,
          user_id: borrower.user_id,
          full_name: userInfo?.full_name || "N/A",
          email: userInfo?.email || "N/A",
          phone: userInfo?.phone || "N/A",
          employment_type: borrower.employment_type,
          monthly_income: borrower.monthly_income,
          credit_score: borrower.credit_score,
          kyc_status: profileInfo?.kyc_status || "pending",
          created_at: borrower.created_at,
        };
      });

      setBorrowers(transformedBorrowers);
      updateStats({ borrowers: transformedBorrowers.length });

    } catch (error: unknown) {
      console.error("❌ LENDER - Failed to load borrowers:", error);
      setBorrowers([]);
      updateStats({ borrowers: 0 });
    } finally {
      setLoading(prev => ({ ...prev, borrowers: false }));
    }
  };

  const loadLoans = async () => {
    try {
      setLoading(prev => ({ ...prev, loans: true, stats: true }));

      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false });

      if (loansError) throw loansError;

      if (!loansData || loansData.length === 0) {
        setLoans([]);
        updateStats({ loans: 0, dueEmis: 0, currentMonthEarnings: 0 });
        return;
      }

      const borrowerIds = loansData.map((l) => l.borrower_id);
      const { data: borrowersData, error: borrowersError } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", borrowerIds);

      if (borrowersError) {
        console.warn("⚠️ Borrowers query warning:", borrowersError);
      }

      const loanIds = loansData.map((l) => l.id);
      const { data: emisData, error: emisError } = await supabase
        .from("emis")
        .select("*")
        .in("loan_id", loanIds)
        .order("emi_number", { ascending: true });

      if (emisError) {
        console.warn("⚠️ LENDER - EMIs query warning:", emisError);
      }

      let totalDueEmis = 0;
      let totalLoanDisbursed = 0; // Initialize total loan disbursed

      const transformedLoans: LoanSummary[] = loansData.map((loan) => {
        const borrower = borrowersData?.find((b) => b.id === loan.borrower_id);
        const loanEMIs = (emisData || []).filter((e) => e.loan_id === loan.id);

        const totalEMIs = loanEMIs.length;
        const paidEMIs = loanEMIs.filter((e) => {
          const paidAmount = e.paid_amount || 0;
          return paidAmount >= e.amount;
        }).length;

        const partialEMIs = loanEMIs.filter((e) => {
          const paidAmount = e.paid_amount || 0;
          return paidAmount > 0 && paidAmount < e.amount;
        });

        const pendingEMIs = loanEMIs.filter((e) => {
          const paidAmount = e.paid_amount || 0;
          return paidAmount === 0;
        });

        // Calculate due EMIs (unpaid EMIs that are due or overdue)
        const today = new Date();
        const dueEMIs = [...partialEMIs, ...pendingEMIs].filter((e) => {
          const dueDate = new Date(e.due_date);
          return dueDate <= today;
        });

        totalDueEmis += dueEMIs.length;

        const totalPaid = loanEMIs.reduce((sum, emi) => {
          const paidAmount = emi.paid_amount || 0;
          return sum + Math.min(paidAmount, emi.amount);
        }, 0);

        const outstandingBalance = Math.max(
          0,
          (loan.total_amount || loan.principal_amount) - totalPaid
        );

        const unpaidEMIs = [...partialEMIs, ...pendingEMIs].sort(
          (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        );
        const nextDueEMI = unpaidEMIs[0];

        const loanData = {
          id: loan.id,
          loan_number: loan.loan_number || `LOAN-${loan.id.slice(0, 8)}`,
          borrower_name: borrower?.full_name || "Unknown",
          principal_amount: loan.principal_amount,
          total_amount: loan.total_amount || loan.principal_amount,
          status: loan.status,
          disbursement_date: loan.disbursement_date || loan.created_at,
          pending_emis: pendingEMIs.length + partialEMIs.length,
          total_emis: totalEMIs,
          paid_emis: paidEMIs,
          outstanding_balance: outstandingBalance,
          next_due_date: nextDueEMI?.due_date || null,
          next_due_amount: nextDueEMI
            ? nextDueEMI.amount - (nextDueEMI.paid_amount || 0)
            : 0,
          purpose: loan.purpose || null,
          notes: loan.notes || null,
          emis: loanEMIs // Include EMI data for status calculation
        };

        // Add principal amount to total loan disbursed
      totalLoanDisbursed += loan.principal_amount;

        // Calculate smart status
        const smartStatus = calculateLoanStatus(loanData);

        return {
          ...loanData,
          status: smartStatus // Use calculated status
        };
      });

      setLoans(transformedLoans);

      // Calculate current month earnings (EMIs due in current month)
      const currentMonthEarnings = await calculateCurrentMonthEarnings(transformedLoans);

      updateStats({ 
        loans: transformedLoans.length, 
        dueEmis: totalDueEmis, 
        currentMonthEarnings: currentMonthEarnings,
        totalLoanDisbursed: totalLoanDisbursed // Update stats with total loan disbursed

      });

    } catch (error: unknown) {
      console.error("❌ LENDER - Failed to load loans:", error);
      setLoans([]);
      updateStats({ loans: 0, dueEmis: 0, currentMonthEarnings: 0 });
    } finally {
      setLoading(prev => ({ ...prev, loans: false, stats: false }));
    }
  };

  const updateStats = (updates: Partial<{
    borrowers: number;
    loans: number;
    dueEmis: number;
    currentMonthEarnings: number;
    totalLoanDisbursed: number; // Include totalLoanDisbursed
  }>) => {
    setStats(prev => ({
      totalBorrowers: updates.borrowers ?? prev.totalBorrowers,
      activeLoans: updates.loans ?? prev.activeLoans,
      dueEmis: updates.dueEmis ?? prev.dueEmis,
      currentMonthEarnings: updates.currentMonthEarnings ?? prev.currentMonthEarnings,
      totalLoanDisbursed: updates.totalLoanDisbursed ?? prev.totalLoanDisbursed, // Include totalLoanDisbursed
    }));
  };

  // Navigation handlers
  const handleNavigateToBorrowers = () => {
    router.push('/dashboard/lender/borrowers');
  };

  const handleNavigateToLoans = () => {
    router.push('/dashboard/lender/loans');
  };

  const handleNavigateToEMIs = () => {
    router.push('/dashboard/lender/emis');
  };

  // Success handlers
  const handleAddBorrowerSuccess = () => {
    setViewMode("dashboard");
    router.replace('/dashboard/lender');
    loadDashboardData();
  };

  const handleCreateLoanSuccess = (loanId: string) => {
    setViewMode("dashboard");
    setSelectedBorrowerForLoan("");
    router.replace('/dashboard/lender');
    loadDashboardData();
  };

  const handleRecordPaymentSuccess = (paymentId: string) => {
    setViewMode("dashboard");
    setSelectedLoanForPayment("");
    router.replace('/dashboard/lender');
    loadDashboardData();
  };

  // Modal handlers
  const handleViewLoanDetails = (loan: LoanSummary) => {
    setSelectedLoanForDetails(loan);
    setShowLoanDetailsModal(true);
  };

  const handleViewBorrowerDetails = (borrower: Borrower) => {
    setSelectedBorrowerForDetails(borrower);
    setShowBorrowerDetailsModal(true);
  };

  // Action handlers
  const handleCreateLoanForBorrower = (borrowerId: string) => {
    setSelectedBorrowerForLoan(borrowerId);
    setViewMode("create-loan");
  };

  const handleRecordPaymentForLoan = (loanId: string) => {
    setSelectedLoanForPayment(loanId);
    setViewMode("record-payment");
  };

  // Loading state
  if (!initialized) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading lender dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Not authenticated state
  if (!isAuthenticated || !isLender) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Users className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Lender Access Required</h2>
            <p className="text-sm text-gray-600">Redirecting...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show different views based on mode
  if (viewMode === "add-borrower") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-6">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode("dashboard");
                router.replace('/dashboard/lender');
              }}
              size="sm"
            >
              ← Back to Dashboard
            </Button>
          </div>
          <AddBorrowerForm
            onSuccess={handleAddBorrowerSuccess}
            onCancel={() => {
              setViewMode("dashboard");
              router.replace('/dashboard/lender');
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (viewMode === "create-loan") {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode("dashboard");
                setSelectedBorrowerForLoan("");
                router.replace('/dashboard/lender');
              }}
              size="sm"
            >
              ← Back to Dashboard
            </Button>
          </div>
          <CreateLoanForm
            borrowerId={selectedBorrowerForLoan}
            onSuccess={handleCreateLoanSuccess}
            onCancel={() => {
              setViewMode("dashboard");
              setSelectedBorrowerForLoan("");
              router.replace('/dashboard/lender');
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (viewMode === "record-payment") {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto p-6">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode("dashboard");
                setSelectedLoanForPayment("");
                router.replace('/dashboard/lender');
              }}
              size="sm"
            >
              ← Back to Dashboard
            </Button>
          </div>
          <RecordPaymentForm
            loanId={selectedLoanForPayment}
            onSuccess={handleRecordPaymentSuccess}
            onCancel={() => {
              setViewMode("dashboard");
              setSelectedLoanForPayment("");
              router.replace('/dashboard/lender');
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Main dashboard
  return (
    <DashboardLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white px-6 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lender Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your lending portfolio and borrower relationships
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
  <StatsCard
    title="Total Borrowers"
    value={stats.totalBorrowers}
    icon={Users}
    loading={loading.borrowers}
    onClick={handleNavigateToBorrowers}
    subtitle="Manage contacts"
  />
  <StatsCard
    title="Active Loans"
    value={stats.activeLoans}
    icon={CreditCard}
    loading={loading.loans}
    onClick={handleNavigateToLoans}
    subtitle="Portfolio overview"
  />
  <StatsCard
    title="Due EMIs"
    value={stats.dueEmis}
    icon={Calendar}
    loading={loading.stats}
    onClick={handleNavigateToEMIs}
    subtitle="Require attention"
  />
</div>

          {/* Quick Actions */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <button
                  onClick={() => setViewMode("add-borrower")}
                  className="flex items-center justify-center p-4 sm:p-6 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                >
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-105 transition-transform">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-blue-900">Add Borrower</span>
                  </div>
                </button>

                <button
                  onClick={() => setViewMode("create-loan")}
                  disabled={borrowers.length === 0}
                  className="flex items-center justify-center p-4 sm:p-6 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-105 transition-transform">
                      <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-green-900">Create Loan</span>
                  </div>
                </button>

                <button
                  onClick={() => setViewMode("record-payment")}
                  disabled={loans.length === 0}
                  className="flex items-center justify-center p-4 sm:p-6 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-105 transition-transform">
                      <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-purple-900">Record Payment</span>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Loans */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Recent Loans</h2>
                  <p className="text-sm text-gray-600">Your latest lending activity</p>
                </div>
                {loans.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNavigateToLoans}
                  >
                    View All
                  </Button>
                )}
              </div>

              {loading.loans ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading loans...</p>
                </div>
              ) : loans.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <CreditCard className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Loans Yet</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto text-sm sm:text-base">
                    Create your first loan to start building your lending portfolio.
                  </p>
                  <Button
                    onClick={() => setViewMode("create-loan")}
                    disabled={borrowers.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Loan
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {loans.slice(0, 4).map((loan) => (
                    <LoanCard
                      key={loan.id}
                      loan={loan}
                      onRecordPayment={handleRecordPaymentForLoan}
                      onViewDetails={handleViewLoanDetails}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Borrowers */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Recent Borrowers</h2>
                  <p className="text-sm text-gray-600">Your customer base</p>
                </div>
                {borrowers.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNavigateToBorrowers}
                  >
                    View All
                  </Button>
                )}
              </div>

              {loading.borrowers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading borrowers...</p>
                </div>
              ) : borrowers.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Users className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Borrowers Yet</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto text-sm sm:text-base">
                    Add your first borrower to start building your lending network.
                  </p>
                  <Button onClick={() => setViewMode("add-borrower")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Borrower
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {borrowers.slice(0, 4).map((borrower) => (
                    <BorrowerCard
                      key={borrower.id}
                      borrower={borrower}
                      onCreateLoan={handleCreateLoanForBorrower}
                      onViewDetails={handleViewBorrowerDetails}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        <LoanDetailsModal
          loan={selectedLoanForDetails}
          isOpen={showLoanDetailsModal}
          onClose={() => setShowLoanDetailsModal(false)}
          onRecordPayment={handleRecordPaymentForLoan}
        />

        <BorrowerDetailsModal
          borrower={selectedBorrowerForDetails}
          isOpen={showBorrowerDetailsModal}
          onClose={() => setShowBorrowerDetailsModal(false)}
          onCreateLoan={handleCreateLoanForBorrower}
        />
      </div>
    </DashboardLayout>
  );
}