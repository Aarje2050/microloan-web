// app/dashboard/admin/page.tsx - SIMPLE ADMIN DASHBOARD (Same pattern as lender)
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  AlertTriangle,
  Plus,
  Settings,
  TrendingUp,
  Calendar,
  ArrowRight,
  RefreshCw,
  Eye,
  Clock,
  ChevronRight,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

// Simple interfaces - no complex types
interface SimpleUser {
  id: string
  email: string
  full_name: string
  role: string
  active: boolean
  pending_approval: boolean
  created_at: string
}

interface SimpleLoan {
  id: string
  loan_number: string
  borrower_id: string
  principal_amount: number
  total_amount: number
  status: string
  disbursement_date: string
  created_at: string
  borrower_name?: string
  lender_name?: string
}

interface SimpleEMI {
  id: string
  loan_id: string
  emi_number: number
  due_date: string
  amount: number
  status: string
  paid_amount: number
  loan_number?: string
  borrower_name?: string
}

interface SimpleStats {
  totalUsers: number
  totalLenders: number
  totalBorrowers: number
  totalLoans: number
  activeLoans: number
  totalPortfolio: number
  totalOutstanding: number
  overdueEMIs: number
  pendingUsers: number
}

export default function SimpleAdminDashboard() {
  const router = useRouter()
  const { user, isAdmin, initialized, isAuthenticated } = useAuth()
  
  // Simple state - following lender pattern
  const [stats, setStats] = React.useState<SimpleStats>({
    totalUsers: 0,
    totalLenders: 0,
    totalBorrowers: 0,
    totalLoans: 0,
    activeLoans: 0,
    totalPortfolio: 0,
    totalOutstanding: 0,
    overdueEMIs: 0,
    pendingUsers: 0
  })
  
  const [recentUsers, setRecentUsers] = React.useState<SimpleUser[]>([])
  const [recentLoans, setRecentLoans] = React.useState<SimpleLoan[]>([])
  const [upcomingEMIs, setUpcomingEMIs] = React.useState<SimpleEMI[]>([])
  
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  console.log('🔧 ADMIN DASHBOARD - State:', { 
    user: user?.email, 
    isAdmin, 
    initialized,
    isAuthenticated,
    statsLoaded: stats.totalUsers > 0
  })

  // Auth handling (same as lender)
  React.useEffect(() => {
    if (!initialized) return

    if (!isAuthenticated) {
      console.log('🚫 ADMIN - Not authenticated, redirecting to login')
      router.replace('/login')
      return
    }

    if (!isAdmin) {
      console.log('🚫 ADMIN - Not admin, redirecting to dashboard')
      router.replace('/dashboard')
      return
    }

    console.log('✅ ADMIN - Access granted')
  }, [initialized, isAuthenticated, isAdmin, router])

  // Load dashboard data (same pattern as lender)
  React.useEffect(() => {
    if (!user || !isAdmin) return
    loadDashboardData()
  }, [user, isAdmin])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      console.log('📊 ADMIN - Loading dashboard data for super admin:', user.email)
      setLoading(true)

      await Promise.all([
        loadUsers(),
        loadLoans(),
        loadEMIs()
      ])

    } catch (error: unknown) {
      console.error('❌ ADMIN - Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load users (direct query like lender does)
  const loadUsers = async () => {
    try {
      console.log('👥 ADMIN - Loading users...')
      
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      if (!usersData || usersData.length === 0) {
        console.log('👥 ADMIN - No users found')
        setRecentUsers([])
        return
      }

      // Transform users data
      const transformedUsers: SimpleUser[] = usersData.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name || 'Unknown',
        role: user.role,
        active: user.active,
        pending_approval: user.pending_approval || false,
        created_at: user.created_at
      }))

      // Set recent users (last 5)
      setRecentUsers(transformedUsers.slice(0, 5))

      // Calculate user stats
      const totalUsers = transformedUsers.length
      const totalLenders = transformedUsers.filter(u => u.role === 'lender').length
      const totalBorrowers = transformedUsers.filter(u => u.role === 'borrower').length
      const pendingUsers = transformedUsers.filter(u => u.pending_approval).length

      // Update stats
      setStats(prev => ({
        ...prev,
        totalUsers,
        totalLenders,
        totalBorrowers,
        pendingUsers
      }))

      console.log('✅ ADMIN - Users loaded:', { totalUsers, totalLenders, totalBorrowers, pendingUsers })

    } catch (error: unknown) {
      console.error('❌ ADMIN - Failed to load users:', error)
      setRecentUsers([])
    }
  }

  // Load loans (direct query like lender does)
  const loadLoans = async () => {
    try {
      console.log('💰 ADMIN - Loading loans...')
      
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false })

      if (loansError) throw loansError

      if (!loansData || loansData.length === 0) {
        console.log('💰 ADMIN - No loans found')
        setRecentLoans([])
        return
      }

      // Get borrower names
      const borrowerIds = Array.from(new Set(loansData.map(l => l.borrower_id).filter(Boolean)))
      const { data: borrowersData, error: borrowersError } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', borrowerIds)

      if (borrowersError) {
        console.warn('⚠️ ADMIN - Borrowers query warning:', borrowersError)
      }

      // Get lender names
      const lenderIds = Array.from(new Set(loansData.map(l => l.created_by).filter(Boolean)))
      const { data: lendersData, error: lendersError } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', lenderIds)

      if (lendersError) {
        console.warn('⚠️ ADMIN - Lenders query warning:', lendersError)
      }

      // Transform loans data
      const transformedLoans: SimpleLoan[] = loansData.map(loan => {
        const borrower = borrowersData?.find(b => b.id === loan.borrower_id)
        const lender = lendersData?.find(l => l.id === loan.created_by)

        return {
          id: loan.id,
          loan_number: loan.loan_number || `LOAN-${loan.id.slice(0, 8)}`,
          borrower_id: loan.borrower_id,
          principal_amount: loan.principal_amount,
          total_amount: loan.total_amount || loan.principal_amount,
          status: loan.status,
          disbursement_date: loan.disbursement_date || loan.created_at,
          created_at: loan.created_at,
          borrower_name: borrower?.full_name || 'Unknown',
          lender_name: lender?.full_name || 'Unknown'
        }
      })

      // Set recent loans (last 5)
      setRecentLoans(transformedLoans.slice(0, 5))

      // Calculate loan stats
      const totalLoans = transformedLoans.length
      const activeLoans = transformedLoans.filter(l => l.status === 'active').length
      const totalPortfolio = transformedLoans.reduce((sum, l) => sum + l.principal_amount, 0)

      // Update stats
      setStats(prev => ({
        ...prev,
        totalLoans,
        activeLoans,
        totalPortfolio
      }))

      console.log('✅ ADMIN - Loans loaded:', { totalLoans, activeLoans, totalPortfolio })

    } catch (error: unknown) {
      console.error('❌ ADMIN - Failed to load loans:', error)
      setRecentLoans([])
    }
  }

  // Load EMIs (direct query like lender does)
  const loadEMIs = async () => {
    try {
      console.log('📅 ADMIN - Loading EMIs...')
      
      const { data: emisData, error: emisError } = await supabase
        .from('emis')
        .select('*')
        .order('due_date', { ascending: true })

      if (emisError) throw emisError

      if (!emisData || emisData.length === 0) {
        console.log('📅 ADMIN - No EMIs found')
        setUpcomingEMIs([])
        return
      }

      // Get loan details for EMIs
      const loanIds = Array.from(new Set(emisData.map(e => e.loan_id).filter(Boolean)))
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('id, loan_number, borrower_id')
        .in('id', loanIds)

      if (loansError) {
        console.warn('⚠️ ADMIN - Loans for EMIs query warning:', loansError)
      }

      // Get borrower names for EMIs
      const borrowerIds = Array.from(new Set(
        loansData?.map(l => l.borrower_id).filter(Boolean) || []
      ))
      const { data: borrowersData, error: borrowersError } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', borrowerIds)

      if (borrowersError) {
        console.warn('⚠️ ADMIN - Borrowers for EMIs query warning:', borrowersError)
      }

      // Transform EMI data
      const transformedEMIs: SimpleEMI[] = emisData.map(emi => {
        const loan = loansData?.find(l => l.id === emi.loan_id)
        const borrower = borrowersData?.find(b => b.id === loan?.borrower_id)

        return {
          id: emi.id,
          loan_id: emi.loan_id,
          emi_number: emi.emi_number,
          due_date: emi.due_date,
          amount: emi.amount,
          status: emi.status,
          paid_amount: emi.paid_amount || 0,
          loan_number: loan?.loan_number || 'Unknown',
          borrower_name: borrower?.full_name || 'Unknown'
        }
      })

      // Filter upcoming EMIs (next 30 days)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      const upcomingEMIs = transformedEMIs.filter(emi => {
        const dueDate = new Date(emi.due_date)
        return dueDate <= thirtyDaysFromNow && emi.status === 'pending'
      }).slice(0, 5)

      setUpcomingEMIs(upcomingEMIs)

      // Calculate EMI stats
      const overdueEMIs = transformedEMIs.filter(emi => {
        const dueDate = new Date(emi.due_date)
        const today = new Date()
        return dueDate < today && emi.status === 'pending'
      }).length

      // Update stats
      setStats(prev => ({
        ...prev,
        overdueEMIs
      }))

      console.log('✅ ADMIN - EMIs loaded:', { totalEMIs: transformedEMIs.length, overdueEMIs, upcomingCount: upcomingEMIs.length })

    } catch (error: unknown) {
      console.error('❌ ADMIN - Failed to load EMIs:', error)
      setUpcomingEMIs([])
    }
  }

  // Refresh handler (same as lender)
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadDashboardData()
      // Haptic feedback
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  // Loading state (same as lender)
  if (!initialized) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Not authenticated state (same as lender)
  if (!isAuthenticated || !isAdmin) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Users className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Admin Access Required</h2>
            <p className="text-sm text-gray-600">Redirecting...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Refresh (same as lender) */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Platform overview • {stats.totalUsers} users • {stats.totalLoans} loans
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Platform Health Indicator */}
        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  stats.overdueEMIs === 0 ? "bg-green-500" :
                  stats.overdueEMIs < 5 ? "bg-yellow-500" : "bg-red-500"
                )}></div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Platform Status: {stats.overdueEMIs === 0 ? 'Excellent' : 
                                    stats.overdueEMIs < 5 ? 'Good' : 'Needs Attention'}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {stats.overdueEMIs} overdue EMIs • {stats.pendingUsers} pending approvals
                  </p>
                </div>
              </div>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Stats Cards (same pattern as lender) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Users */}
          <div 
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => router.push('/dashboard/admin/users')}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Total Users
                </p>
                <p className="text-2xl font-semibold text-gray-900 mb-1">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">
                  {stats.totalLenders} lenders • {stats.totalBorrowers} borrowers
                </p>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
            {stats.pendingUsers > 0 && (
              <div className="mt-4">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                  {stats.pendingUsers} Pending
                </span>
              </div>
            )}
          </div>

          {/* Active Loans */}
          <div 
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => router.push('/dashboard/admin/loans')}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Active Loans
                </p>
                <p className="text-2xl font-semibold text-gray-900 mb-1">
                  {stats.activeLoans.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">
                  {stats.totalLoans} total loans
                </p>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                  <CreditCard className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-gray-600">
                {stats.totalLoans > 0 ? Math.round((stats.activeLoans / stats.totalLoans) * 100) : 0}% of total loans
              </span>
            </div>
          </div>

          {/* Total Portfolio */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Total Portfolio
                </p>
                <p className="text-2xl font-semibold text-gray-900 mb-1">
                  {formatCurrency(stats.totalPortfolio)}
                </p>
                <p className="text-xs text-gray-600">
                  Loans disbursed
                </p>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Overdue EMIs */}
          <div 
            className={cn(
              "border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer",
              stats.overdueEMIs > 0 
                ? "bg-red-50 border-red-200" 
                : "bg-white border-gray-200"
            )}
            onClick={() => router.push('/dashboard/admin/emis?filter=overdue')}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Overdue EMIs
                </p>
                <p className={cn(
                  "text-2xl font-semibold mb-1",
                  stats.overdueEMIs > 0 ? "text-red-900" : "text-gray-900"
                )}>
                  {stats.overdueEMIs.toLocaleString()}
                </p>
                <p className={cn(
                  "text-xs",
                  stats.overdueEMIs > 0 ? "text-red-700" : "text-gray-600"
                )}>
                  {stats.overdueEMIs > 0 ? "Require attention" : "All clear"}
                </p>
              </div>
              <div className="ml-4">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  stats.overdueEMIs > 0 ? "bg-red-100" : "bg-gray-50"
                )}>
                  <AlertTriangle className={cn(
                    "h-6 w-6",
                    stats.overdueEMIs > 0 ? "text-red-600" : "text-gray-600"
                  )} />
                </div>
              </div>
            </div>
            {stats.overdueEMIs > 0 && (
              <div className="mt-4">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                  Needs Review
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Data Sections (same as before but with real data) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming EMIs */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <h3 className="text-base font-medium text-gray-900">Upcoming EMIs</h3>
                </div>
                <button
                  onClick={() => router.push('/dashboard/admin/emis')}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {upcomingEMIs.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">No upcoming EMIs</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingEMIs.map((emi) => (
                    <div key={emi.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{emi.borrower_name}</p>
                        <p className="text-xs text-gray-500">
                          {emi.loan_number} • EMI #{emi.emi_number}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {formatDate(emi.due_date)}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(emi.amount)}</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                          {emi.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Loans */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <h3 className="text-base font-medium text-gray-900">Recent Loans</h3>
                </div>
                <button
                  onClick={() => router.push('/dashboard/admin/loans')}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentLoans.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">No recent loans</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentLoans.map((loan) => (
                    <div key={loan.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{loan.borrower_name}</p>
                        <p className="text-xs text-gray-500">{loan.loan_number}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(loan.disbursement_date)}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(loan.principal_amount)}</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                          {loan.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <h3 className="text-base font-medium text-gray-900">Recent Users</h3>
                </div>
                <button
                  onClick={() => router.push('/dashboard/admin/users')}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">No recent users</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-600 font-medium text-xs">
                            {user.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          {user.role}
                        </span>
                        {user.pending_approval && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 ml-1">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}