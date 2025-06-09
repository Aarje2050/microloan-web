// app/dashboard/lender/borrowers/page.tsx - ENTERPRISE BORROWERS MANAGEMENT
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { BorrowerCard, SectionContainer } from "@/components/ui/enterprise-cards";
import { FilterBar, StatsBar } from "@/components/ui/filter-bar";
import {
  Users,
  Plus,
  Download,
  UserCheck,
  UserX,
  Clock,
  RefreshCw,
  Mail,
  Phone,
  TrendingUp
} from "lucide-react";

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
  total_loans: number;
  active_loans: number;
  total_borrowed: number;
  total_outstanding: number;
}

type FilterKyc = 'all' | 'verified' | 'pending' | 'rejected';
type SortOption = 'newest' | 'oldest' | 'name-az' | 'name-za' | 'income-high' | 'income-low' | 'credit-high' | 'credit-low';

export default function LenderBorrowersPage() {
  const router = useRouter();
  const { user, isLender, initialized, isAuthenticated } = useAuth();

  const [borrowers, setBorrowers] = React.useState<Borrower[]>([]);
  const [filteredBorrowers, setFilteredBorrowers] = React.useState<Borrower[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterKyc, setFilterKyc] = React.useState<FilterKyc>('all');
  const [sortOption, setSortOption] = React.useState<SortOption>('newest');

  console.log("👥 LENDER BORROWERS - State:", {
    user: user?.email,
    borrowersCount: borrowers.length,
    filteredCount: filteredBorrowers.length,
    filterKyc,
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

  // Load borrowers
  React.useEffect(() => {
    if (!user || !isLender) return;
    loadBorrowers();
  }, [user, isLender]);

  // Filter and sort borrowers
  React.useEffect(() => {
    let filtered = [...borrowers];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(borrower =>
        borrower.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        borrower.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        borrower.phone.includes(searchQuery)
      );
    }

    // KYC filter
    if (filterKyc !== 'all') {
      filtered = filtered.filter(borrower => borrower.kyc_status === filterKyc);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name-az':
          return a.full_name.localeCompare(b.full_name);
        case 'name-za':
          return b.full_name.localeCompare(a.full_name);
        case 'income-high':
          return (b.monthly_income || 0) - (a.monthly_income || 0);
        case 'income-low':
          return (a.monthly_income || 0) - (b.monthly_income || 0);
        case 'credit-high':
          return (b.credit_score || 0) - (a.credit_score || 0);
        case 'credit-low':
          return (a.credit_score || 0) - (b.credit_score || 0);
        default:
          return 0;
      }
    });

    setFilteredBorrowers(filtered);
  }, [borrowers, searchQuery, filterKyc, sortOption]);

  const loadBorrowers = async () => {
    try {
      setIsLoading(true);
      console.log("📊 Loading borrowers for lender:", user?.id);

      // Get borrowers for this lender
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

      // Get user details
      const userIds = borrowersData.map(b => b.user_id);
      const { data: usersData } = await supabase
        .from("users")
        .select("id, full_name, email, phone")
        .in("id", userIds);

      // Get user profiles (KYC status)
      let profilesData: Array<Record<string, any>> = [];
      try {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("user_id, kyc_status")
          .in("user_id", userIds);
        profilesData = profiles || [];
      } catch (profileError) {
        console.log("⚠️ Profiles table might not exist:", profileError);
      }

      // Get loan statistics for each borrower
      const { data: loansData } = await supabase
        .from("loans")
        .select("borrower_id, principal_amount, total_amount, status")
        .in("borrower_id", userIds)
        .eq("created_by", user?.id);

      // Transform borrowers with loan statistics
      const transformedBorrowers: Borrower[] = borrowersData.map(borrower => {
        const userInfo = usersData?.find(u => u.id === borrower.user_id);
        const profileInfo = profilesData.find(p => p.user_id === borrower.user_id);
        const borrowerLoans = (loansData || []).filter(l => l.borrower_id === borrower.user_id);

        const totalLoans = borrowerLoans.length;
        const activeLoans = borrowerLoans.filter(l => l.status === 'active' || l.status === 'disbursed').length;
        const totalBorrowed = borrowerLoans.reduce((sum, loan) => sum + (loan.total_amount || loan.principal_amount), 0);
        
        // For outstanding, we'd need EMI data, but for now we'll estimate
        const totalOutstanding = borrowerLoans
          .filter(l => l.status === 'active' || l.status === 'disbursed')
          .reduce((sum, loan) => sum + (loan.total_amount || loan.principal_amount), 0);

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
          total_loans: totalLoans,
          active_loans: activeLoans,
          total_borrowed: totalBorrowed,
          total_outstanding: totalOutstanding,
        };
      });

      setBorrowers(transformedBorrowers);
    } catch (error) {
      console.error("❌ Failed to load borrowers:", error);
      setBorrowers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBorrowers();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCreateLoan = (borrowerId: string) => {
    router.push(`/dashboard/lender?mode=create-loan&borrower=${borrowerId}`);
  };

  const handleViewDetails = (borrowerId: string) => {
    console.log('View borrower details:', borrowerId);
    // TODO: Navigate to borrower details page
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getKycCounts = () => {
    const counts = {
      all: borrowers.length,
      verified: borrowers.filter(b => b.kyc_status === 'verified').length,
      pending: borrowers.filter(b => b.kyc_status === 'pending').length,
      rejected: borrowers.filter(b => b.kyc_status === 'rejected').length,
    };
    return counts;
  };

  const kycCounts = getKycCounts();

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
    <DashboardLayout title="Borrowers Management">
      <div className="bg-gray-50 min-h-screen">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Borrowers Management</h1>
                <p className="text-gray-600">Manage your customer relationships and KYC status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Stats Bar */}
        <StatsBar
          stats={[
            { label: "Total", value: kycCounts.all },
            { label: "Verified", value: kycCounts.verified, color: "green" },
            { label: "Pending", value: kycCounts.pending, color: "yellow" },
            { label: "Rejected", value: kycCounts.rejected, color: "red" }
          ]}
        />

        {/* Professional Filter Bar */}
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by name, email, or phone..."
          filters={[
            {
              key: 'kyc',
              label: 'KYC Status',
              options: [
                { value: 'all', label: 'All Borrowers', count: kycCounts.all },
                { value: 'verified', label: 'Verified', count: kycCounts.verified },
                { value: 'pending', label: 'Pending', count: kycCounts.pending },
                { value: 'rejected', label: 'Rejected', count: kycCounts.rejected }
              ],
              value: filterKyc,
              onChange: (value) => setFilterKyc(value as FilterKyc)
            }
          ]}
          sortOptions={[
            { value: 'newest', label: 'Newest First' },
            { value: 'oldest', label: 'Oldest First' },
            { value: 'name-az', label: 'Name: A to Z' },
            { value: 'name-za', label: 'Name: Z to A' },
            { value: 'income-high', label: 'Income: High to Low' },
            { value: 'income-low', label: 'Income: Low to High' },
            { value: 'credit-high', label: 'Credit: High to Low' },
            { value: 'credit-low', label: 'Credit: Low to High' }
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
                onClick={() => router.push('/dashboard/lender?mode=add-borrower')}
                className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Borrower</span>
                <span className="sm:hidden">Add</span>
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
              <p className="text-sm text-gray-600">Loading borrowers...</p>
            </div>
          ) : filteredBorrowers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || filterKyc !== 'all' ? 'No Matching Borrowers' : 'No Borrowers Yet'}
              </h3>
              <p className="text-gray-600 mb-6 text-sm max-w-sm mx-auto">
                {searchQuery || filterKyc !== 'all' 
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Add your first borrower to start building your customer base.'
                }
              </p>
              {(!searchQuery && filterKyc === 'all') && (
                <button
                  onClick={() => router.push('/dashboard/lender?mode=add-borrower')}
                  className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Borrower
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBorrowers.map((borrower) => (
                <div key={borrower.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
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
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                borrower.kyc_status === 'verified' 
                                  ? 'bg-green-50 text-green-800 border-green-200'
                                  : borrower.kyc_status === 'pending'
                                  ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                                  : 'bg-red-50 text-red-800 border-red-200'
                              }`}>
                                {borrower.kyc_status === 'verified' && <UserCheck className="w-3 h-3 mr-1" />}
                                {borrower.kyc_status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                {borrower.kyc_status === 'rejected' && <UserX className="w-3 h-3 mr-1" />}
                                {borrower.kyc_status.charAt(0).toUpperCase() + borrower.kyc_status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Loan Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      {/* Contact Information */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Contact Information</h4>
                        <div className="space-y-2">
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
                          {borrower.employment_type && (
                            <div className="flex items-center text-sm text-gray-600">
                              <TrendingUp className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="capitalize">{borrower.employment_type}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Loan Statistics */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Loan Portfolio</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Total Loans</p>
                            <p className="text-xl font-bold text-gray-900">{borrower.total_loans}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Active Loans</p>
                            <p className="text-xl font-bold text-green-600">{borrower.active_loans}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Borrowed</p>
                            <p className="text-lg font-bold text-blue-600">
                              {formatCurrency(borrower.total_borrowed)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Outstanding</p>
                            <p className="text-lg font-bold text-red-600">
                              {formatCurrency(borrower.total_outstanding)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {borrower.monthly_income && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Monthly Income</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(borrower.monthly_income)}
                          </p>
                        </div>
                      )}
                      {borrower.credit_score && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Credit Score</p>
                          <p className={`text-lg font-bold ${
                            borrower.credit_score >= 700 ? "text-green-600" : 
                            borrower.credit_score >= 600 ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {borrower.credit_score}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleCreateLoan(borrower.user_id)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Create Loan
                      </button>
                      <button
                        onClick={() => handleViewDetails(borrower.id)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Load More (if needed for pagination) */}
              {filteredBorrowers.length >= 20 && (
                <div className="text-center py-6">
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    Load More Borrowers
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