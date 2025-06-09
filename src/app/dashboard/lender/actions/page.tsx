// app/dashboard/lender/actions/page.tsx - ENTERPRISE QUICK ACTIONS CENTER
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  Plus,
  CreditCard,
  Users,
  Receipt,
  Download,
  Upload,
  Calculator,
  FileText,
  TrendingUp,
  Bell,
  Settings,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign
} from "lucide-react";

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action?: () => void;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  action: () => void;
  disabled?: boolean;
  badge?: string;
}

export default function LenderActionsPage() {
  const router = useRouter();
  const { user, isLender, initialized, isAuthenticated } = useAuth();

  const [stats, setStats] = React.useState({
    pendingPayments: 0,
    overdueLoans: 0,
    newApplications: 0,
    todaysDue: 0,
    pendingKyc: 0,
    activeLoans: 0
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  console.log("⚡ LENDER ACTIONS - State:", {
    user: user?.email,
    stats
  });

  // Auth check
  React.useEffect(() => {
    if (!initialized) return;
    
    if (!isAuthenticated || !isLender) {
      router.replace("/dashboard");
      return;
    }
  }, [initialized, isAuthenticated, isLender, router]);

  // Load quick stats
  React.useEffect(() => {
    if (!user || !isLender) return;
    loadQuickStats();
  }, [user, isLender]);

  const loadQuickStats = async () => {
    try {
      setIsLoading(true);
      console.log("📊 Loading quick stats for lender:", user?.id);

      // Get loans data
      const { data: loansData } = await supabase
        .from("loans")
        .select("id, status, borrower_id")
        .eq("created_by", user?.id);

      // Get EMI data for due calculations
      const loanIds = (loansData || []).map(l => l.id);
      const today = new Date().toISOString().split('T')[0];
      
      const { data: emisData } = await supabase
        .from("emis")
        .select("*")
        .in("loan_id", loanIds)
        .lte("due_date", today);

      // Get borrowers for KYC status
      const borrowerIds = (loansData || []).map(l => l.borrower_id);
      const { data: profilesData } = await supabase
        .from("user_profiles")
        .select("user_id, kyc_status")
        .in("user_id", borrowerIds);

      // Calculate stats
      const activeLoans = (loansData || []).filter(l => l.status === 'active' || l.status === 'disbursed').length;
      const overdueLoans = (loansData || []).filter(l => l.status === 'overdue').length;
      
      const pendingPayments = (emisData || []).filter(e => {
        const paidAmount = e.paid_amount || 0;
        return paidAmount < e.amount;
      }).length;

      const todaysDue = (emisData || []).filter(e => {
        const dueDate = new Date(e.due_date).toISOString().split('T')[0];
        const paidAmount = e.paid_amount || 0;
        return dueDate === today && paidAmount < e.amount;
      }).length;

      const pendingKyc = (profilesData || []).filter(p => p.kyc_status === 'pending').length;

      setStats({
        pendingPayments,
        overdueLoans,
        newApplications: 0, // TODO: Implement loan applications
        todaysDue,
        pendingKyc,
        activeLoans
      });

    } catch (error) {
      console.error("❌ Failed to load quick stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadQuickStats();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Quick stats configuration
  const quickStats: QuickStat[] = [
    {
      label: "Today's Due",
      value: stats.todaysDue,
      icon: Calendar,
      color: "text-blue-600",
      action: () => router.push("/dashboard/lender/loans?filter=due-today")
    },
    {
      label: "Pending Payments",
      value: stats.pendingPayments,
      icon: Clock,
      color: "text-orange-600",
      action: () => router.push("/dashboard/lender/loans?filter=pending-payments")
    },
    {
      label: "Overdue Loans",
      value: stats.overdueLoans,
      icon: AlertCircle,
      color: "text-red-600",
      action: () => router.push("/dashboard/lender/loans?filter=overdue")
    },
    {
      label: "Pending KYC",
      value: stats.pendingKyc,
      icon: Users,
      color: "text-yellow-600",
      action: () => router.push("/dashboard/lender/borrowers?filter=pending")
    }
  ];

  // Primary actions
  const primaryActions: QuickAction[] = [
    {
      title: "Add New Borrower",
      description: "Register a new customer with their basic information",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      action: () => router.push("/dashboard/lender?mode=add-borrower")
    },
    {
      title: "Create Loan",
      description: "Issue a new loan to an existing borrower",
      icon: CreditCard,
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100",
      action: () => router.push("/dashboard/lender?mode=create-loan")
    },
    {
      title: "Record Payment",
      description: "Process EMI payments and update loan status",
      icon: Receipt,
      color: "text-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
      action: () => router.push("/dashboard/lender?mode=record-payment")
    }
  ];

  // Secondary actions
  const secondaryActions: QuickAction[] = [
    {
      title: "EMI Calculator",
      description: "Calculate EMI amounts for loan planning",
      icon: Calculator,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 hover:bg-indigo-100",
      action: () => console.log("EMI Calculator") // TODO: Implement
    },
    {
      title: "Generate Reports",
      description: "Create detailed portfolio and performance reports",
      icon: FileText,
      color: "text-teal-600",
      bgColor: "bg-teal-50 hover:bg-teal-100",
      action: () => console.log("Generate Reports") // TODO: Implement
    },
    {
      title: "Bulk Import",
      description: "Import multiple borrowers or loans from CSV",
      icon: Upload,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 hover:bg-cyan-100",
      action: () => console.log("Bulk Import") // TODO: Implement
    },
    {
      title: "Export Data",
      description: "Download your portfolio data in various formats",
      icon: Download,
      color: "text-gray-600",
      bgColor: "bg-gray-50 hover:bg-gray-100",
      action: () => console.log("Export Data") // TODO: Implement
    },
    {
      title: "Analytics Dashboard",
      description: "View detailed insights and performance metrics",
      icon: TrendingUp,
      color: "text-pink-600",
      bgColor: "bg-pink-50 hover:bg-pink-100",
      action: () => console.log("Analytics") // TODO: Implement
    },
    {
      title: "Notifications",
      description: "Manage alerts and reminder settings",
      icon: Bell,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 hover:bg-yellow-100",
      action: () => console.log("Notifications") // TODO: Implement
    }
  ];

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
    <DashboardLayout title="Quick Actions">
      <div className="bg-gray-50 min-h-screen">
        {/* Professional Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quick Actions</h1>
                <p className="text-gray-600">Fast access to common tasks and operations</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Quick Stats Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    onClick={stat.action}
                    className={`bg-white border border-gray-200 rounded-lg p-4 ${
                      stat.action ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''
                    } transition-all duration-200`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                      {typeof stat.value === 'number' && stat.value > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {stat.value}
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {isLoading ? (
                        <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        stat.value
                      )}
                    </p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-8">
          {/* Primary Actions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Essential Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {primaryActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    disabled={action.disabled}
                    className={`p-6 rounded-lg border border-gray-200 text-left transition-all duration-200 ${action.bgColor} ${
                      action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-white border border-gray-200`}>
                        <Icon className={`h-6 w-6 ${action.color}`} />
                      </div>
                      {action.badge && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Actions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {secondaryActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    disabled={action.disabled}
                    className={`p-4 rounded-lg border border-gray-200 text-left transition-all duration-200 ${action.bgColor} ${
                      action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg bg-white border border-gray-200 shrink-0`}>
                        <Icon className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">{action.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{action.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Payment recorded for LOAN-001</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New loan created for John Doe</p>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New borrower added: Jane Smith</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">💡 Quick Tips</h2>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• Use the EMI calculator to provide accurate loan terms to borrowers</p>
              <p>• Record payments regularly to maintain accurate portfolio tracking</p>
              <p>• Check pending KYC approvals to ensure compliance</p>
              <p>• Export data regularly for backup and reporting purposes</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}