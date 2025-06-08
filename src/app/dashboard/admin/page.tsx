// app/dashboard/admin/page.tsx - ENTERPRISE ADMIN DASHBOARD
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  Shield, Users, DollarSign, CreditCard, LogOut, Home, 
  TrendingUp, AlertTriangle, Eye, CheckCircle, XCircle,
  UserCheck, UserX, Building, BarChart3, Activity,
  Clock, Target, Zap
} from 'lucide-react'

interface PlatformStats {
  totalUsers: number
  totalLenders: number
  totalBorrowers: number
  pendingLenders: number
  totalLoans: number
  totalPortfolio: number
  totalOutstanding: number
  averageCollectionRate: number
  overdueLoans: number
  activeLoans: number
}

interface UserOverview {
  id: string
  email: string
  full_name: string
  role: string
  roles: string[]
  active: boolean
  email_verified: boolean
  pending_approval: boolean
  created_at: string
  last_login?: string
  loan_count?: number
  portfolio_value?: number
}

interface LenderPerformance {
  id: string
  name: string
  email: string
  borrowers_count: number
  loans_count: number
  portfolio_value: number
  outstanding_amount: number
  collection_rate: number
  overdue_amount: number
  active_since: string
}

interface LoanOverview {
  id: string
  loan_number: string
  lender_name: string
  borrower_name: string
  principal_amount: number
  outstanding_balance: number
  status: string
  days_overdue: number
  collection_rate: number
  created_at: string
}

type ViewMode = 'dashboard' | 'users' | 'lenders' | 'loans' | 'analytics'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, signOut, isAdmin, initialized, isAuthenticated } = useAuth()
  
  // ✅ ALL HOOKS AT TOP LEVEL
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const [redirectHandled, setRedirectHandled] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>('dashboard')
  const [isLoading, setIsLoading] = React.useState(true)
  
  // Data states
  const [platformStats, setPlatformStats] = React.useState<PlatformStats>({
    totalUsers: 0,
    totalLenders: 0,
    totalBorrowers: 0,
    pendingLenders: 0,
    totalLoans: 0,
    totalPortfolio: 0,
    totalOutstanding: 0,
    averageCollectionRate: 0,
    overdueLoans: 0,
    activeLoans: 0
  })
  
  const [users, setUsers] = React.useState<UserOverview[]>([])
  const [lenderPerformance, setLenderPerformance] = React.useState<LenderPerformance[]>([])
  const [recentLoans, setRecentLoans] = React.useState<LoanOverview[]>([])

  console.log('🛡️ ADMIN DASHBOARD - State:', { 
    user: user?.email, 
    isAdmin, 
    initialized,
    isAuthenticated,
    viewMode,
    redirectHandled
  })

  // ✅ Auth handling
  React.useEffect(() => {
    if (!initialized) return
    if (redirectHandled) return

    if (!isAuthenticated) {
      console.log('🚫 ADMIN - Not authenticated, redirecting to login')
      setRedirectHandled(true)
      router.replace('/login')
      return
    }

    if (!isAdmin) {
      console.log('🚫 ADMIN - Not admin, redirecting to dashboard')
      setRedirectHandled(true) 
      router.replace('/dashboard')
      return
    }

    console.log('✅ ADMIN - Access granted')
  }, [initialized, isAuthenticated, isAdmin, redirectHandled, router])

  // Load admin data
  React.useEffect(() => {
    if (!user || !isAdmin) return
    
    loadAdminData()
  }, [user, isAdmin])

  // Load all platform data
  const loadAdminData = async () => {
    if (!user) return
    
    try {
      console.log('📊 ADMIN - Loading platform data...')
      setIsLoading(true)
      
      await Promise.all([
        loadPlatformStats(),
        loadUsersOverview(),
        loadLenderPerformance(),
        loadRecentLoans()
      ])
      
    } catch (error: any) {
      console.error('❌ ADMIN - Failed to load platform data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load platform-wide statistics
  const loadPlatformStats = async () => {
    try {
      console.log('📊 ADMIN - Loading platform statistics...')
      
      // Get user counts by role
      const { data: userStats, error: userError } = await supabase
        .from('users')
        .select('role, roles, active, pending_approval')
      
      if (userError) throw userError

      // Calculate user statistics
      const totalUsers = userStats?.length || 0
      const totalLenders = userStats?.filter(u => 
        u.role === 'lender' || u.roles?.includes('lender')
      ).length || 0
      const totalBorrowers = userStats?.filter(u => 
        u.role === 'borrower' || u.roles?.includes('borrower')
      ).length || 0
      const pendingLenders = userStats?.filter(u => 
        u.pending_approval && (u.role === 'lender' || u.roles?.includes('lender'))
      ).length || 0

      // Get loan statistics
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('id, principal_amount, total_amount, status')
      
      if (loansError) throw loansError

      const totalLoans = loans?.length || 0
      const activeLoans = loans?.filter(l => l.status === 'active' || l.status === 'disbursed').length || 0
      const totalPortfolio = loans?.reduce((sum, loan) => sum + (loan.total_amount || loan.principal_amount), 0) || 0

      // Get EMI data for outstanding calculations
      const { data: emis, error: emisError } = await supabase
        .from('emis')
        .select('amount, paid_amount, status, due_date')
      
      if (emisError) throw emisError

      const totalOutstanding = emis?.reduce((sum, emi) => {
        const remaining = emi.amount - (emi.paid_amount || 0)
        return sum + Math.max(0, remaining)
      }, 0) || 0

      const overdueLoans = emis?.filter(emi => {
        const isOverdue = new Date(emi.due_date) < new Date() && (emi.paid_amount || 0) < emi.amount
        return isOverdue
      }).length || 0

      const totalPaid = (totalPortfolio - totalOutstanding)
      const averageCollectionRate = totalPortfolio > 0 ? Math.round((totalPaid / totalPortfolio) * 100) : 0

      setPlatformStats({
        totalUsers,
        totalLenders,
        totalBorrowers,
        pendingLenders,
        totalLoans,
        totalPortfolio,
        totalOutstanding,
        averageCollectionRate,
        overdueLoans,
        activeLoans
      })

      console.log('✅ ADMIN - Platform stats loaded:', {
        totalUsers,
        totalLenders,
        totalBorrowers,
        totalLoans,
        totalPortfolio
      })

    } catch (error: any) {
      console.error('❌ ADMIN - Failed to load platform stats:', error)
    }
  }

  // Load users overview
  const loadUsersOverview = async () => {
    try {
      console.log('📊 ADMIN - Loading users overview...')
      
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (usersError) throw usersError

      // Get loan counts for each user
      const userIds = usersData?.map(u => u.id) || []
      const { data: loanCounts, error: loanError } = await supabase
        .from('loans')
        .select('created_by, principal_amount')
        .in('created_by', userIds)
      
      if (loanError) {
        console.warn('⚠️ ADMIN - Loan counts warning:', loanError)
      }

      // Process user data
      const processedUsers: UserOverview[] = (usersData || []).map(user => {
        const userLoans = loanCounts?.filter(l => l.created_by === user.id) || []
        const portfolioValue = userLoans.reduce((sum, loan) => sum + loan.principal_amount, 0)

        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name || 'N/A',
          role: user.role,
          roles: user.roles || [user.role],
          active: user.active,
          email_verified: user.email_verified,
          pending_approval: user.pending_approval || false,
          created_at: user.created_at,
          loan_count: userLoans.length,
          portfolio_value: portfolioValue
        }
      })

      setUsers(processedUsers)
      console.log('✅ ADMIN - Users overview loaded:', processedUsers.length)

    } catch (error: any) {
      console.error('❌ ADMIN - Failed to load users overview:', error)
    }
  }

  // Load lender performance
  const loadLenderPerformance = async () => {
    try {
      console.log('📊 ADMIN - Loading lender performance...')
      
      // Get all lenders
      const { data: lenders, error: lendersError } = await supabase
        .from('users')
        .select('id, full_name, email, created_at, role, roles')
        .or('role.eq.lender,roles.cs.["lender"]')
        .eq('active', true)
      
      if (lendersError) throw lendersError

      // Get borrower counts and loan data for each lender
      const performance: LenderPerformance[] = []

      for (const lender of lenders || []) {
        // Get borrower count
        const { data: borrowers, error: borrowerError } = await supabase
          .from('borrowers')
          .select('id')
          .eq('lender_id', lender.id)
        
        // Get loans created by this lender
        const { data: loans, error: loansError } = await supabase
          .from('loans')
          .select('id, principal_amount, total_amount')
          .eq('created_by', lender.id)
        
        // Get EMI data for collection rate
        const loanIds = loans?.map(l => l.id) || []
        let collectionRate = 0
        let overdueAmount = 0

        if (loanIds.length > 0) {
          const { data: emis } = await supabase
            .from('emis')
            .select('amount, paid_amount, due_date')
            .in('loan_id', loanIds)

          if (emis && emis.length > 0) {
            const totalEmiAmount = emis.reduce((sum, emi) => sum + emi.amount, 0)
            const totalPaid = emis.reduce((sum, emi) => sum + (emi.paid_amount || 0), 0)
            collectionRate = totalEmiAmount > 0 ? Math.round((totalPaid / totalEmiAmount) * 100) : 0

            // Calculate overdue
            const today = new Date()
            overdueAmount = emis
              .filter(emi => new Date(emi.due_date) < today && (emi.paid_amount || 0) < emi.amount)
              .reduce((sum, emi) => sum + (emi.amount - (emi.paid_amount || 0)), 0)
          }
        }

        const portfolioValue = loans?.reduce((sum, loan) => sum + (loan.total_amount || loan.principal_amount), 0) || 0
        const outstandingAmount = portfolioValue * (1 - collectionRate / 100)

        performance.push({
          id: lender.id,
          name: lender.full_name || 'N/A',
          email: lender.email,
          borrowers_count: borrowers?.length || 0,
          loans_count: loans?.length || 0,
          portfolio_value: portfolioValue,
          outstanding_amount: outstandingAmount,
          collection_rate: collectionRate,
          overdue_amount: overdueAmount,
          active_since: lender.created_at
        })
      }

      // Sort by portfolio value
      performance.sort((a, b) => b.portfolio_value - a.portfolio_value)
      setLenderPerformance(performance)

      console.log('✅ ADMIN - Lender performance loaded:', performance.length)

    } catch (error: any) {
      console.error('❌ ADMIN - Failed to load lender performance:', error)
    }
  }

  // Load recent loans
  const loadRecentLoans = async () => {
    try {
      console.log('📊 ADMIN - Loading recent loans...')
      
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select(`
          id,
          loan_number,
          principal_amount,
          total_amount,
          status,
          created_at,
          created_by,
          borrower_id
        `)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (loansError) throw loansError

      // Get lender and borrower names
      const lenderIds = loans?.map(l => l.created_by).filter(Boolean) || []
      const borrowerIds = loans?.map(l => l.borrower_id).filter(Boolean) || []
      
      const { data: lenders } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', lenderIds)
      
      const { data: borrowers } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', borrowerIds)

      // Get EMI data for outstanding calculation
      const loanIds = loans?.map(l => l.id) || []
      const { data: emis } = await supabase
        .from('emis')
        .select('loan_id, amount, paid_amount, due_date')
        .in('loan_id', loanIds)

      const processedLoans: LoanOverview[] = (loans || []).map(loan => {
        const lender = lenders?.find(l => l.id === loan.created_by)
        const borrower = borrowers?.find(b => b.id === loan.borrower_id)
        const loanEmis = emis?.filter(e => e.loan_id === loan.id) || []
        
        // Calculate outstanding and collection rate
        const totalEmiAmount = loanEmis.reduce((sum, emi) => sum + emi.amount, 0)
        const totalPaid = loanEmis.reduce((sum, emi) => sum + (emi.paid_amount || 0), 0)
        const outstandingBalance = Math.max(0, (loan.total_amount || loan.principal_amount) - totalPaid)
        const collectionRate = totalEmiAmount > 0 ? Math.round((totalPaid / totalEmiAmount) * 100) : 0

        // Calculate days overdue
        const today = new Date()
        const overdueEmis = loanEmis.filter(emi => 
          new Date(emi.due_date) < today && (emi.paid_amount || 0) < emi.amount
        )
        const daysOverdue = overdueEmis.length > 0 ? 
          Math.max(...overdueEmis.map(emi => 
            Math.floor((today.getTime() - new Date(emi.due_date).getTime()) / (1000 * 3600 * 24))
          )) : 0

        return {
          id: loan.id,
          loan_number: loan.loan_number || `LOAN-${loan.id.slice(0, 8)}`,
          lender_name: lender?.full_name || 'Unknown',
          borrower_name: borrower?.full_name || 'Unknown',
          principal_amount: loan.principal_amount,
          outstanding_balance: outstandingBalance,
          status: loan.status,
          days_overdue: daysOverdue,
          collection_rate: collectionRate,
          created_at: loan.created_at
        }
      })

      setRecentLoans(processedLoans)
      console.log('✅ ADMIN - Recent loans loaded:', processedLoans.length)

    } catch (error: any) {
      console.error('❌ ADMIN - Failed to load recent loans:', error)
    }
  }

  // Handle user actions
  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'approve' | 'reject') => {
    try {
      console.log(`🔧 ADMIN - ${action} user:`, userId)
      
      let updateData: any = {}
      
      switch (action) {
        case 'activate':
          updateData = { active: true }
          break
        case 'deactivate':
          updateData = { active: false }
          break
        case 'approve':
          updateData = { pending_approval: false, active: true }
          break
        case 'reject':
          updateData = { pending_approval: false, active: false }
          break
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (error) throw error

      console.log(`✅ ADMIN - User ${action} successful`)
      
      // Reload data
      await loadUsersOverview()
      await loadPlatformStats()

    } catch (error: any) {
      console.error(`❌ ADMIN - Failed to ${action} user:`, error)
    }
  }

  // Sign out handler
  const handleSignOut = React.useCallback(async () => {
    if (isSigningOut) return
    
    console.log('🚪 ADMIN - Sign out clicked')
    setIsSigningOut(true)
    
    try {
      await signOut()
      console.log('✅ ADMIN - Sign out completed')
      setRedirectHandled(false)
      router.replace('/login')
    } catch (error) {
      console.error('❌ ADMIN - Sign out error:', error)
      setRedirectHandled(false)
      router.replace('/login')
    }
  }, [isSigningOut, signOut, router])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600'
      case 'inactive': return 'text-red-600'
      case 'pending': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  // ✅ LOADING STATE
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  // ✅ NOT AUTHENTICATED STATE
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // ✅ NOT ADMIN STATE
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Admin Access Required</h2>
          <p className="text-sm text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  // ✅ MAIN ADMIN DASHBOARD CONTENT
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Platform Management & Analytics</p>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'dashboard', label: 'Overview', icon: BarChart3 },
                  { key: 'users', label: 'Users', icon: Users },
                  { key: 'lenders', label: 'Lenders', icon: Building },
                  { key: 'loans', label: 'Loans', icon: CreditCard }
                ].map((nav) => {
                  const Icon = nav.icon
                  return (
                    <button
                      key={nav.key}
                      onClick={() => setViewMode(nav.key as ViewMode)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === nav.key
                          ? 'bg-white text-purple-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 inline mr-2" />
                      {nav.label}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </button>
              
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Platform Statistics */}
        {viewMode === 'dashboard' && (
          <>
            {/* Platform Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{platformStats.totalUsers}</p>
                    <p className="text-xs text-gray-500">
                      {platformStats.totalLenders} lenders, {platformStats.totalBorrowers} borrowers
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <CreditCard className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Platform Loans</p>
                    <p className="text-2xl font-bold text-gray-900">{platformStats.totalLoans}</p>
                    <p className="text-xs text-gray-500">{platformStats.activeLoans} active loans</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Portfolio</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(platformStats.totalPortfolio)}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(platformStats.totalOutstanding)} outstanding</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{platformStats.averageCollectionRate}%</p>
                    <p className="text-xs text-gray-500">Platform average</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {(platformStats.pendingLenders > 0 || platformStats.overdueLoans > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {platformStats.pendingLenders > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                      <div>
                        <h3 className="text-yellow-800 font-medium">Pending Approvals</h3>
                        <p className="text-yellow-700 text-sm">
                          {platformStats.pendingLenders} lender applications need approval
                        </p>
                        <button 
                          onClick={() => setViewMode('users')}
                          className="text-yellow-600 hover:text-yellow-800 text-sm font-medium mt-1"
                        >
                          Review Applications →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {platformStats.overdueLoans > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                      <div>
                        <h3 className="text-red-800 font-medium">Overdue Payments</h3>
                        <p className="text-red-700 text-sm">
                          {platformStats.overdueLoans} EMIs are overdue across platform
                        </p>
                        <button 
                          onClick={() => setViewMode('loans')}
                          className="text-red-600 hover:text-red-800 text-sm font-medium mt-1"
                        >
                          View Overdue →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Top Lenders Performance */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Performing Lenders</h3>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading lender data...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {lenderPerformance.slice(0, 3).map((lender) => (
                      <div key={lender.id} className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900">{lender.name}</h4>
                        <p className="text-sm text-gray-600">{lender.email}</p>
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Portfolio:</span>
                            <span className="font-medium">{formatCurrency(lender.portfolio_value)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Collection:</span>
                            <span className="font-medium">{lender.collection_rate}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Loans:</span>
                            <span className="font-medium">{lender.loans_count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Loans */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Recent Loans</h3>
                  <button 
                    onClick={() => setViewMode('loans')}
                    className="text-purple-600 hover:text-purple-800 text-sm"
                  >
                    View All →
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading loans...</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lender
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Borrower
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Collection
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentLoans.slice(0, 5).map((loan) => (
                        <tr key={loan.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {loan.loan_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {loan.lender_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {loan.borrower_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(loan.principal_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              loan.status === 'active' ? 'bg-green-100 text-green-800' :
                              loan.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {loan.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {loan.collection_rate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {/* Users Management View */}
        {viewMode === 'users' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">User Management</h3>
            </div>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading users...</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loans
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Portfolio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.roles.join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.active ? 'Active' : 'Inactive'}
                            </span>
                            {user.pending_approval && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.loan_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(user.portfolio_value || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            {user.pending_approval && (
                              <>
                                <button
                                  onClick={() => handleUserAction(user.id, 'approve')}
                                  className="text-green-600 hover:text-green-800"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleUserAction(user.id, 'reject')}
                                  className="text-red-600 hover:text-red-800"
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {!user.pending_approval && (
                              <button
                                onClick={() => handleUserAction(user.id, user.active ? 'deactivate' : 'activate')}
                                className={user.active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                                title={user.active ? 'Deactivate' : 'Activate'}
                              >
                                {user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                              </button>
                            )}
                            <button className="text-gray-600 hover:text-gray-800" title="View Details">
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Lenders Performance View */}
        {viewMode === 'lenders' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Lender Performance</h3>
            </div>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading lender data...</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lender
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Borrowers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loans
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Portfolio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Outstanding
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Collection Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Active Since
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lenderPerformance.map((lender) => (
                      <tr key={lender.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{lender.name}</div>
                            <div className="text-sm text-gray-500">{lender.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {lender.borrowers_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {lender.loans_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(lender.portfolio_value)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(lender.outstanding_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${
                              lender.collection_rate >= 90 ? 'text-green-600' :
                              lender.collection_rate >= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {lender.collection_rate}%
                            </span>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  lender.collection_rate >= 90 ? 'bg-green-600' :
                                  lender.collection_rate >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                                }`}
                                style={{ width: `${lender.collection_rate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(lender.active_since)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Loans Overview */}
        {viewMode === 'loans' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">All Platform Loans</h3>
            </div>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading loans...</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loan ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lender
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Borrower
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Principal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Outstanding
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Collection
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {loan.loan_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {loan.lender_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {loan.borrower_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(loan.principal_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(loan.outstanding_balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            loan.status === 'active' ? 'bg-green-100 text-green-800' :
                            loan.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {loan.status}
                            {loan.days_overdue > 0 && ` (${loan.days_overdue}d)`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${
                              loan.collection_rate >= 90 ? 'text-green-600' :
                              loan.collection_rate >= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {loan.collection_rate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(loan.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}