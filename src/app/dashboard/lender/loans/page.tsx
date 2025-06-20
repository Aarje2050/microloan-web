// app/dashboard/lender/loans/page.tsx - ENTERPRISE LOANS MANAGEMENT
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { LoanCard, SectionContainer } from "@/components/ui/enterprise-cards";
import { FilterBar, StatsBar } from "@/components/ui/filter-bar";
import {
  CreditCard,
  Plus,
  RefreshCw,
  Download
} from "lucide-react";

import { LoanSummary, calculateLoanStatus } from '@/lib/loan-utils';
import { UnifiedLoanCard } from '@/components/ui/unified-loan-card';
import {
  X,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";



type FilterStatus = 'all' | 'active' | 'disbursed' | 'completed' | 'overdue';
type SortOption = 'newest' | 'oldest' | 'amount-high' | 'amount-low' | 'status';

export default function LenderLoansPage() {
  const router = useRouter();
  const { user, isLender, initialized, isAuthenticated } = useAuth();

  const [loans, setLoans] = React.useState<LoanSummary[]>([]);
  const [filteredLoans, setFilteredLoans] = React.useState<LoanSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<FilterStatus>('all');
  const [sortOption, setSortOption] = React.useState<SortOption>('newest');
  const [showFilters, setShowFilters] = React.useState(false);

  console.log("💳 LENDER LOANS - State:", {
    user: user?.email,
    loansCount: loans.length,
    filteredCount: filteredLoans.length,
    filterStatus,
    searchQuery
  });

  // Auth check
  React.useEffect(() => {
    if (!initialized) return;
    
    if (!isAuthenticated || !isLender) {
      router.replace("/dashboard");
      return;
    }
  }, [initialized, isAuthenticated, isLender, router]);

  // Load loans
  React.useEffect(() => {
    if (!user || !isLender) return;
    loadLoans();
  }, [user, isLender]);

  // Filter and sort loans
  React.useEffect(() => {
    let filtered = [...loans];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(loan =>
        loan.loan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.borrower_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(loan => loan.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.disbursement_date).getTime() - new Date(a.disbursement_date).getTime();
        case 'oldest':
          return new Date(a.disbursement_date).getTime() - new Date(b.disbursement_date).getTime();
        case 'amount-high':
          return b.total_amount - a.total_amount;
        case 'amount-low':
          return a.total_amount - b.total_amount;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredLoans(filtered);
  }, [loans, searchQuery, filterStatus, sortOption]);

  const loadLoans = async () => {
    try {
      setIsLoading(true);
      console.log("📊 Loading loans for lender:", user?.id);

      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false });

      if (loansError) throw loansError;

      if (!loansData || loansData.length === 0) {
        setLoans([]);
        return;
      }

      // Get borrower names
      const borrowerIds = loansData.map(l => l.borrower_id);
      const { data: borrowersData } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", borrowerIds);

      // Get EMI data
      const loanIds = loansData.map(l => l.id);
      const { data: emisData } = await supabase
        .from("emis")
        .select("*")
        .in("loan_id", loanIds);

      // Transform loans
  // Replace the transformedLoans mapping in /app/dashboard/lender/page.tsx loadLoans function

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
    purpose: loan.purpose || null,     // ✅ Added
    notes: loan.notes || null,         // ✅ Added
    emis: loanEMIs // Include EMI data for status calculation
  };

  // Calculate smart status
  const smartStatus = calculateLoanStatus(loanData);

  return {
    ...loanData,
    status: smartStatus // ✅ Use calculated status
  };
});

      setLoans(transformedLoans);
    } catch (error) {
      console.error("❌ Failed to load loans:", error);
      setLoans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLoans();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleRecordPayment = (loanId: string) => {
    router.push(`/dashboard/lender?mode=record-payment&loan=${loanId}`);
  };

  const handleViewDetails = (loanId: string) => {
    console.log('View loan details:', loanId);
    // TODO: Navigate to loan details page
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusCounts = () => {
    const counts = {
      all: loans.length,
      active: loans.filter(l => l.status === 'active').length,
      disbursed: loans.filter(l => l.status === 'disbursed').length,
      completed: loans.filter(l => l.status === 'completed').length,
      overdue: loans.filter(l => l.status === 'overdue').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

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

  return (
    <DashboardLayout title="Loans Management">
      <div className="bg-gray-50 min-h-screen">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Loans Management</h1>
                <p className="text-gray-600">Manage your loan portfolio and track payments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Stats Bar */}
        <StatsBar
          stats={[
            { label: "Total", value: statusCounts.all },
            { label: "Active", value: statusCounts.active, color: "green" },
            { label: "Disbursed", value: statusCounts.disbursed, color: "blue" },
            { label: "Completed", value: statusCounts.completed },
            { label: "Overdue", value: statusCounts.overdue, color: "red" }
          ]}
        />

        {/* Professional Filter Bar */}
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search loans by number or borrower name..."
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'all', label: 'All Loans', count: statusCounts.all },
                { value: 'active', label: 'Active', count: statusCounts.active },
                { value: 'disbursed', label: 'Disbursed', count: statusCounts.disbursed },
                { value: 'completed', label: 'Completed', count: statusCounts.completed },
                { value: 'overdue', label: 'Overdue', count: statusCounts.overdue }
              ],
              value: filterStatus,
              onChange: (value) => setFilterStatus(value as FilterStatus)
            }
          ]}
          sortOptions={[
            { value: 'newest', label: 'Newest First' },
            { value: 'oldest', label: 'Oldest First' },
            { value: 'amount-high', label: 'Amount: High to Low' },
            { value: 'amount-low', label: 'Amount: Low to High' },
            { value: 'status', label: 'By Status' }
          ]}
          sortValue={sortOption}
          onSortChange={(value) => setSortOption(value as SortOption)}
          customActions={
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => router.push('/dashboard/lender?mode=create-loan')}
                className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Create Loan</span>
                <span className="sm:hidden">Create</span>
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Download className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          }
        />

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Loading loans...</p>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || filterStatus !== 'all' ? 'No Matching Loans' : 'No Loans Yet'}
              </h3>
              <p className="text-gray-600 mb-6 text-sm max-w-sm mx-auto">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Create your first loan to start building your portfolio.'
                }
              </p>
              {(!searchQuery && filterStatus === 'all') && (
                <button
                  onClick={() => router.push('/dashboard/lender?mode=create-loan')}
                  className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Loan
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
   {filteredLoans.map((loan) => (
  <UnifiedLoanCard
    key={loan.id}
    loan={loan}
    onRecordPayment={(loanId) => handleRecordPayment(loanId)}
    onViewDetails={(loan) => handleViewDetails(loan.id)}
    formatCurrency={formatCurrency}
    formatDate={formatDate}
  />
))}
              
              {/* Load More (if needed for pagination) */}
              {filteredLoans.length >= 20 && (
                <div className="text-center py-6">
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    Load More Loans
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}