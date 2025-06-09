// app/dashboard/lender/page.tsx - MOBILE-FIRST LENDER DASHBOARD
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  Briefcase,
  Users,
  User,
  CreditCard,
  DollarSign,
  Plus,
  TrendingUp,
  Eye,
  Receipt,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  IndianRupee
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { LoanCard, BorrowerCard, SectionContainer } from "@/components/ui/enterprise-cards";
import AddBorrowerForm from "@/components/forms/add-borrower-form";
import CreateLoanForm from "@/components/forms/loan/create-loan-form";
import RecordPaymentForm from "@/components/forms/loan/record-payment-form";

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

interface LoanSummary {
  id: string;
  loan_number: string;
  borrower_name: string;
  principal_amount: number;
  total_amount: number;
  status: string;
  disbursement_date: string;
  pending_emis: number;
  total_emis: number;
  paid_emis: number;
  outstanding_balance: number;
  next_due_date: string | null;
  next_due_amount: number;
}

type ViewMode = "dashboard" | "add-borrower" | "create-loan" | "record-payment";

export default function LenderDashboard() {
  const router = useRouter();
  const { user, isLender, initialized, isAuthenticated } = useAuth();

  // ✅ ALL HOOKS AT TOP LEVEL
  const [redirectHandled, setRedirectHandled] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<ViewMode>("dashboard");
  const [selectedBorrowerForLoan, setSelectedBorrowerForLoan] = React.useState<string>("");
  const [selectedLoanForPayment, setSelectedLoanForPayment] = React.useState<string>("");
  const [borrowers, setBorrowers] = React.useState<Borrower[]>([]);
  const [loans, setLoans] = React.useState<LoanSummary[]>([]);
  const [isLoadingBorrowers, setIsLoadingBorrowers] = React.useState(true);
  const [isLoadingLoans, setIsLoadingLoans] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const [stats, setStats] = React.useState({
    totalBorrowers: 0,
    activeLoans: 0,
    portfolioValue: 0,
    collectionRate: 95,
    overdueAmount: 0,
    paymentsToday: 0,
  });

  console.log("💼 MOBILE LENDER DASHBOARD - State:", {
    user: user?.email,
    isLender,
    viewMode,
    borrowersCount: borrowers.length,
    loansCount: loans.length,
  });

  // ✅ AUTH HANDLING
  React.useEffect(() => {
    if (!initialized) return;
    if (redirectHandled) return;

    if (!isAuthenticated) {
      console.log("🚫 LENDER - Not authenticated, redirecting to login");
      setRedirectHandled(true);
      router.replace("/login");
      return;
    }

    if (!isLender) {
      console.log("🚫 LENDER - Not lender, redirecting to dashboard");
      setRedirectHandled(true);
      router.replace("/dashboard");
      return;
    }

    console.log("✅ LENDER - Access granted");
  }, [initialized, isAuthenticated, isLender, redirectHandled, router]);

  // Load dashboard data
  React.useEffect(() => {
    if (!user || !isLender) return;
    loadDashboardData();
  }, [user, isLender]);

  // ENHANCED: Load borrowers and loan statistics
  const loadDashboardData = async () => {
    if (!user) return;

    try {
      console.log("📊 LENDER - Loading dashboard data for lender:", user.id);
      setIsLoadingBorrowers(true);
      setIsLoadingLoans(true);

      await Promise.all([loadBorrowers(), loadLoans()]);
    } catch (error: unknown) {
      console.error("❌ LENDER - Failed to load dashboard data:", error);
    }
  };

  // Pull to refresh functionality
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadDashboardData();
      // Simulate haptic feedback
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Min 500ms for visual feedback
    }
  };

  // Load borrowers
  const loadBorrowers = async () => {
    try {
      const { data: borrowersData, error: borrowersError } = await supabase
        .from("borrowers")
        .select(`
          id, user_id, credit_score, employment_type, monthly_income, created_at
        `)
        .eq("lender_id", user?.id)
        .order("created_at", { ascending: false });

      if (borrowersError) throw borrowersError;

      if (!borrowersData || borrowersData.length === 0) {
        setBorrowers([]);
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
    } catch (error: unknown) {
      console.error("❌ LENDER - Failed to load borrowers:", error);
      setBorrowers([]);
    } finally {
      setIsLoadingBorrowers(false);
    }
  };

  // Load loans with EMI information
  const loadLoans = async () => {
    try {
      console.log("📊 LENDER - Loading loans with EMI data...");

      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false });

      if (loansError) throw loansError;

      if (!loansData || loansData.length === 0) {
        setLoans([]);
        updateStats([], 0, 0, 0, borrowers.length);
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

        return {
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
        };
      });

      setLoans(transformedLoans);

      const totalPortfolio = transformedLoans.reduce(
        (sum, loan) => sum + loan.total_amount,
        0
      );
      const totalOutstanding = transformedLoans.reduce(
        (sum, loan) => sum + loan.outstanding_balance,
        0
      );
      const totalPaid = totalPortfolio - totalOutstanding;

      updateStats(transformedLoans, totalPortfolio, totalPaid, 0, borrowers.length);

    } catch (error: unknown) {
      console.error("❌ LENDER - Failed to load loans:", error);
      setLoans([]);
      updateStats([], 0, 0, 0, borrowers.length);
    } finally {
      setIsLoadingLoans(false);
    }
  };

  // Update dashboard statistics
  const updateStats = (
    loans: LoanSummary[],
    portfolioValue: number,
    totalPaid: number,
    overdueAmount: number,
    borrowersCount: number  // ✅ Add this parameter
  ) => {
    const collectionRate =
      portfolioValue > 0 ? Math.round((totalPaid / portfolioValue) * 100) : 0;

    setStats({
      totalBorrowers: borrowersCount,
      activeLoans: loans.length,
      portfolioValue: portfolioValue,
      collectionRate: Math.min(collectionRate, 100),
      overdueAmount: overdueAmount,
      paymentsToday: 0,
    });
  };

  // Handle success callbacks
  const handleAddBorrowerSuccess = () => {
    setViewMode("dashboard");
    loadDashboardData();
  };

  const handleCreateLoanSuccess = (loanId: string) => {
    setViewMode("dashboard");
    setSelectedBorrowerForLoan("");
    loadDashboardData();
  };

  const handleRecordPaymentSuccess = (paymentId: string) => {
    setViewMode("dashboard");
    setSelectedLoanForPayment("");
    loadDashboardData();
  };

  // Handle actions
  const handleCreateLoanForBorrower = (borrowerId: string) => {
    setSelectedBorrowerForLoan(borrowerId);
    setViewMode("create-loan");
  };

  const handleRecordPaymentForLoan = (loanId: string) => {
    setSelectedLoanForPayment(loanId);
    setViewMode("record-payment");
  };

  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ✅ LOADING STATE
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

  // ✅ NOT AUTHENTICATED STATE
  if (!isAuthenticated || !isLender) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Briefcase className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Access Required</h2>
            <p className="text-sm text-gray-600">Redirecting...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show different views based on mode
  if (viewMode === "add-borrower") {
    return (
      <DashboardLayout title="Add Borrower" showBackButton>
        <div className="p-4">
          <AddBorrowerForm
            onSuccess={handleAddBorrowerSuccess}
            onCancel={() => setViewMode("dashboard")}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (viewMode === "create-loan") {
    return (
      <DashboardLayout title="Create Loan" showBackButton>
        <div className="p-4">
          <CreateLoanForm
            borrowerId={selectedBorrowerForLoan}
            onSuccess={handleCreateLoanSuccess}
            onCancel={() => {
              setViewMode("dashboard");
              setSelectedBorrowerForLoan("");
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (viewMode === "record-payment") {
    return (
      <DashboardLayout title="Record Payment" showBackButton>
        <div className="p-4">
          <RecordPaymentForm
            loanId={selectedLoanForPayment}
            onSuccess={handleRecordPaymentSuccess}
            onCancel={() => {
              setViewMode("dashboard");
              setSelectedLoanForPayment("");
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  // ✅ MAIN MOBILE-FIRST LENDER DASHBOARD
  return (
    <DashboardLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Pull to Refresh Header */}
        <div className="bg-white px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Portfolio Overview</h2>
              <p className="text-sm text-gray-600">
                {loans.length} active loans • {borrowers.length} borrowers
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Professional Stats Grid - Minimal Design */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Borrowers"
              value={stats.totalBorrowers}
              icon={Users}
              loading={isLoadingBorrowers}
              className="col-span-1"
              subtitle="Active users"
            />
            <StatsCard
              title="Active Loans"
              value={stats.activeLoans}
              icon={CreditCard}
              loading={isLoadingLoans}
              className="col-span-1"
              subtitle="In progress"
            />
            <StatsCard
              title="Portfolio Value"
              value={formatCurrency(stats.portfolioValue)}
              icon={IndianRupee}
              loading={isLoadingLoans}
              className="col-span-2 lg:col-span-1"
              subtitle="Total disbursed"
            />
            <StatsCard
              title="Collection Rate"
              value={`${stats.collectionRate}%`}
              change={stats.collectionRate >= 90 ? "Excellent" : stats.collectionRate >= 75 ? "Good" : "Needs attention"}
              changeType={stats.collectionRate >= 90 ? "positive" : stats.collectionRate >= 75 ? "neutral" : "negative"}
              icon={TrendingUp}
              loading={isLoadingLoans}
              className="col-span-2 lg:col-span-1"
              subtitle="Performance"
            />
          </div>

          {/* Mobile-Optimized Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setViewMode("add-borrower")}
                className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-blue-900">Add Borrower</span>
                </div>
              </button>

              <button
                onClick={() => setViewMode("create-loan")}
                disabled={borrowers.length === 0}
                className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-green-900">Create Loan</span>
                </div>
              </button>

              <button
                onClick={() => setViewMode("record-payment")}
                disabled={loans.length === 0}
                className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-purple-900">Record Payment</span>
                </div>
              </button>
            </div>
          </div>

          {/* Enterprise-Grade Recent Loans */}
          <SectionContainer
            title="Recent Loans"
            subtitle="Active loan portfolio"
            count={loans.length}
            action={
              loans.length > 0 && (
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All
                </button>
              )
            }
          >
            {isLoadingLoans ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading loans...</p>
              </div>
            ) : loans.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Loans Yet</h3>
                <p className="text-gray-600 mb-6 text-sm max-w-sm mx-auto">
                  Create your first loan to start tracking payments and managing your portfolio.
                </p>
                <button
                  onClick={() => setViewMode("create-loan")}
                  disabled={borrowers.length === 0}
                  className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Loan
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {loans.slice(0, 3).map((loan) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    onRecordPayment={handleRecordPaymentForLoan}
                    onViewDetails={(loanId) => console.log('View loan details:', loanId)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ))}
                
                {loans.length > 3 && (
                  <div className="text-center pt-4 border-t border-gray-200">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View all {loans.length} loans →
                    </button>
                  </div>
                )}
              </div>
            )}
          </SectionContainer>

          {/* Enterprise-Grade Recent Borrowers */}
          <SectionContainer
            title="Recent Borrowers"
            subtitle="Your customer base"
            count={borrowers.length}
            action={
              borrowers.length > 0 && (
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All
                </button>
              )
            }
          >
            {isLoadingBorrowers ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading borrowers...</p>
              </div>
            ) : borrowers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Borrowers Yet</h3>
                <p className="text-gray-600 mb-6 text-sm max-w-sm mx-auto">
                  Add your first borrower to start building your lending portfolio.
                </p>
                <button
                  onClick={() => setViewMode("add-borrower")}
                  className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Borrower
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {borrowers.slice(0, 3).map((borrower) => (
                  <BorrowerCard
                    key={borrower.id}
                    borrower={borrower}
                    onCreateLoan={handleCreateLoanForBorrower}
                    onViewDetails={(borrowerId) => console.log('View borrower details:', borrowerId)}
                    formatCurrency={formatCurrency}
                  />
                ))}
                
                {borrowers.length > 3 && (
                  <div className="text-center pt-4 border-t border-gray-200">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View all {borrowers.length} borrowers →
                    </button>
                  </div>
                )}
              </div>
            )}
          </SectionContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}