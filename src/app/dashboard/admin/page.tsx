// app/dashboard/admin/page.tsx - ENTERPRISE MOBILE-FIRST ADMIN DASHBOARD
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { FilterBar, StatsBar } from '@/components/ui/filter-bar'
import { StatsCard } from '@/components/ui/stats-card'
import { 
  Shield, Users, DollarSign, CreditCard, TrendingUp, AlertTriangle,
  Eye, CheckCircle, XCircle, UserCheck, UserX, Building, BarChart3, 
  Activity, Clock, Target, Zap, RefreshCw, Download, Search,
  Mail, Phone, Calendar, MapPin, Plus, Filter, Settings,
  Award, Percent, AlertCircle, CheckCircle2
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
  completedLoans: number
  totalRevenue: number
  monthlyGrowth: number
}

interface UserOverview {
  id: string
  email: string
  full_name: string
  phone: string
  role: string
  roles: string[]
  active: boolean
  email_verified: boolean
  pending_approval: boolean
  created_at: string
  last_login?: string
  loan_count?: number
  portfolio_value?: number
  kyc_status?: string
  location?: string
}

interface LenderPerformance {
  id: string
  name: string
  email: string
  phone: string
  borrowers_count: number
  loans_count: number
  portfolio_value: number
  outstanding_amount: number
  collection_rate: number
  overdue_amount: number
  active_since: string
  avg_loan_amount: number
  total_revenue: number
  risk_score: number
  location: string
}

interface LoanOverview {
  id: string
  loan_number: string
  lender_name: string
  lender_email: string
  borrower_name: string
  borrower_email: string
  principal_amount: number
  total_amount: number
  outstanding_balance: number
  status: string
  days_overdue: number
  collection_rate: number
  created_at: string
  disbursement_date: string
  emi_count: number
  paid_emis: number
  next_due_date: string
  risk_level: string
}

type ViewMode = 'dashboard' | 'users' | 'lenders' | 'loans' | 'analytics'
type UserFilter = 'all' | 'lenders' | 'borrowers' | 'pending' | 'active' | 'inactive'
type LenderFilter = 'all' | 'top-performers' | 'underperforming' | 'new' | 'high-volume'
type LoanFilter = 'all' | 'active' | 'overdue' | 'completed' | 'high-risk' | 'recent'
type SortOption = 'newest' | 'oldest' | 'amount-high' | 'amount-low' | 'performance-high' | 'performance-low' | 'risk-high' | 'risk-low'

export default function EnterpriseAdminDashboard() {
  const router = useRouter()
  const { user, signOut, isAdmin, initialized, isAuthenticated } = useAuth()
  
  // ✅ ALL HOOKS AT TOP LEVEL
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const [redirectHandled, setRedirectHandled] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>('dashboard')
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  
  // Filter states
  const [searchQuery, setSearchQuery] = React.useState('')
  const [userFilter, setUserFilter] = React.useState<UserFilter>('all')
  const [lenderFilter, setLenderFilter] = React.useState<LenderFilter>('all')
  const [loanFilter, setLoanFilter] = React.useState<LoanFilter>('all')
  const [sortOption, setSortOption] = React.useState<SortOption>('newest')
  const [dateRange, setDateRange] = React.useState({ from: '', to: '' })
  
  // Data states
  const [platformStats, setPlatformStats] = React.useState<PlatformStats>({
    totalUsers: 0, totalLenders: 0, totalBorrowers: 0, pendingLenders: 0,
    totalLoans: 0, totalPortfolio: 0, totalOutstanding: 0, averageCollectionRate: 0,
    overdueLoans: 0, activeLoans: 0, completedLoans: 0, totalRevenue: 0, monthlyGrowth: 0
  })
  
  const [users, setUsers] = React.useState<UserOverview[]>([])
  const [filteredUsers, setFilteredUsers] = React.useState<UserOverview[]>([])
  const [lenderPerformance, setLenderPerformance] = React.useState<LenderPerformance[]>([])
  const [filteredLenders, setFilteredLenders] = React.useState<LenderPerformance[]>([])
  const [loans, setLoans] = React.useState<LoanOverview[]>([])
  const [filteredLoans, setFilteredLoans] = React.useState<LoanOverview[]>([])

  console.log('🛡️ ENTERPRISE ADMIN - State:', { 
    user: user?.email, 
    isAdmin, 
    viewMode,
    usersCount: users.length,
    lendersCount: lenderPerformance.length,
    loansCount: loans.length
  })

  // ✅ Auth handling
  React.useEffect(() => {
    if (!initialized) return
    if (redirectHandled) return

    if (!isAuthenticated) {
      console.log('🚫 ADMIN - Not authenticated')
      setRedirectHandled(true)
      router.replace('/login')
      return
    }

    if (!isAdmin) {
      console.log('🚫 ADMIN - Not admin')
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

  // Apply filters
  React.useEffect(() => {
    applyFilters()
  }, [users, lenderPerformance, loans, searchQuery, userFilter, lenderFilter, loanFilter, sortOption])

  const loadAdminData = async () => {
    if (!user) return
    
    try {
      console.log('📊 ADMIN - Loading enterprise data...')
      setIsLoading(true)
      
      await Promise.all([
        loadPlatformStats(),
        loadUsersOverview(),
        loadLenderPerformance(),
        loadLoansOverview()
      ])
      
    } catch (error: any) {
      console.error('❌ ADMIN - Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadAdminData()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Load comprehensive platform statistics
  const loadPlatformStats = async () => {
    try {
      console.log('📊 ADMIN - Loading platform statistics...')
      
      // Get user counts by role
      const { data: userStats, error: userError } = await supabase
        .from('users')
        .select('role, roles, active, pending_approval, created_at')
      
      if (userError) throw userError

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

      // Get comprehensive loan statistics
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('id, principal_amount, total_amount, status, created_at, disbursement_date')
      
      if (loansError) throw loansError

      const totalLoans = loans?.length || 0
      const activeLoans = loans?.filter(l => l.status === 'active' || l.status === 'disbursed').length || 0
      const completedLoans = loans?.filter(l => l.status === 'completed').length || 0
      const totalPortfolio = loans?.reduce((sum, loan) => sum + (loan.total_amount || loan.principal_amount), 0) || 0

      // Get EMI data for advanced calculations
      const { data: emis, error: emisError } = await supabase
        .from('emis')
        .select('amount, paid_amount, status, due_date, created_at')
      
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

      // Calculate revenue and growth
      const totalRevenue = emis?.reduce((sum, emi) => sum + (emi.paid_amount || 0), 0) || 0
      
      // Monthly growth calculation
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentUsers = userStats?.filter(u => new Date(u.created_at) > thirtyDaysAgo).length || 0
      const monthlyGrowth = totalUsers > 0 ? Math.round((recentUsers / totalUsers) * 100) : 0

      setPlatformStats({
        totalUsers, totalLenders, totalBorrowers, pendingLenders,
        totalLoans, totalPortfolio, totalOutstanding, averageCollectionRate,
        overdueLoans, activeLoans, completedLoans, totalRevenue, monthlyGrowth
      })

      console.log('✅ ADMIN - Platform stats loaded')

    } catch (error: any) {
      console.error('❌ ADMIN - Failed to load platform stats:', error)
    }
  }

  // Load comprehensive users data
  const loadUsersOverview = async () => {
    try {
      console.log('📊 ADMIN - Loading users overview...')
      
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (usersError) throw usersError

      // Get loan counts and portfolio values
      const userIds = usersData?.map(u => u.id) || []
      const { data: loanCounts } = await supabase
        .from('loans')
        .select('created_by, principal_amount, total_amount')
        .in('created_by', userIds)

      // Get profile data
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, kyc_status, city, state')
        .in('user_id', userIds)

      const processedUsers: UserOverview[] = (usersData || []).map(user => {
        const userLoans = loanCounts?.filter(l => l.created_by === user.id) || []
        const portfolioValue = userLoans.reduce((sum, loan) => sum + (loan.total_amount || loan.principal_amount), 0)
        const profile = profiles?.find(p => p.user_id === user.id)

        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name || 'N/A',
          phone: user.phone || 'N/A',
          role: user.role,
          roles: user.roles || [user.role],
          active: user.active,
          email_verified: user.email_verified,
          pending_approval: user.pending_approval || false,
          created_at: user.created_at,
          loan_count: userLoans.length,
          portfolio_value: portfolioValue,
          kyc_status: profile?.kyc_status || 'pending',
          location: profile ? `${profile.city || ''}, ${profile.state || ''}`.trim().replace(/^,|,$/, '') : 'N/A'
        }
      })

      setUsers(processedUsers)
      console.log('✅ ADMIN - Users loaded:', processedUsers.length)

    } catch (error: any) {
      console.error('❌ ADMIN - Failed to load users:', error)
    }
  }

  // Load comprehensive lender performance
  const loadLenderPerformance = async () => {
    try {
      console.log('📊 ADMIN - Loading lender performance...')
      
      const { data: lenders, error: lendersError } = await supabase
        .from('users')
        .select('id, full_name, email, phone, created_at, role, roles')
        .or('role.eq.lender,roles.cs.["lender"]')
        .eq('active', true)
      
      if (lendersError) throw lendersError

      const performance: LenderPerformance[] = []

      for (const lender of lenders || []) {
        // Get borrower count
        const { data: borrowers } = await supabase
          .from('borrowers')
          .select('id')
          .eq('lender_id', lender.id)
        
        // Get loans data
        const { data: loans } = await supabase
          .from('loans')
          .select('id, principal_amount, total_amount, status')
          .eq('created_by', lender.id)
        
        // Get EMI data for advanced metrics
        const loanIds = loans?.map(l => l.id) || []
        let collectionRate = 0
        let overdueAmount = 0
        let totalRevenue = 0

        if (loanIds.length > 0) {
          const { data: emis } = await supabase
            .from('emis')
            .select('amount, paid_amount, due_date')
            .in('loan_id', loanIds)

          if (emis && emis.length > 0) {
            const totalEmiAmount = emis.reduce((sum, emi) => sum + emi.amount, 0)
            const totalPaid = emis.reduce((sum, emi) => sum + (emi.paid_amount || 0), 0)
            collectionRate = totalEmiAmount > 0 ? Math.round((totalPaid / totalEmiAmount) * 100) : 0
            totalRevenue = totalPaid

            const today = new Date()
            overdueAmount = emis
              .filter(emi => new Date(emi.due_date) < today && (emi.paid_amount || 0) < emi.amount)
              .reduce((sum, emi) => sum + (emi.amount - (emi.paid_amount || 0)), 0)
          }
        }

        const portfolioValue = loans?.reduce((sum, loan) => sum + (loan.total_amount || loan.principal_amount), 0) || 0
        const outstandingAmount = portfolioValue * (1 - collectionRate / 100)
        const avgLoanAmount = loans?.length ? portfolioValue / loans.length : 0
        const riskScore = Math.max(0, 100 - collectionRate)

        // Get location from profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('city, state')
          .eq('user_id', lender.id)
          .single()

        const location = profile ? `${profile.city || ''}, ${profile.state || ''}`.trim().replace(/^,|,$/, '') : 'N/A'

        performance.push({
          id: lender.id,
          name: lender.full_name || 'N/A',
          email: lender.email,
          phone: lender.phone || 'N/A',
          borrowers_count: borrowers?.length || 0,
          loans_count: loans?.length || 0,
          portfolio_value: portfolioValue,
          outstanding_amount: outstandingAmount,
          collection_rate: collectionRate,
          overdue_amount: overdueAmount,
          active_since: lender.created_at,
          avg_loan_amount: avgLoanAmount,
          total_revenue: totalRevenue,
          risk_score: riskScore,
          location
        })
      }

      setLenderPerformance(performance)
      console.log('✅ ADMIN - Lender performance loaded:', performance.length)

    } catch (error: any) {
      console.error('❌ ADMIN - Failed to load lender performance:', error)
    }
  }

  // Load comprehensive loans data
  const loadLoansOverview = async () => {
    try {
      console.log('📊 ADMIN - Loading loans overview...')
      
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select(`
          id, loan_number, principal_amount, total_amount, status, 
          created_at, disbursement_date, created_by, borrower_id
        `)
        .order('created_at', { ascending: false })
      
      if (loansError) throw loansError

      // Get lender and borrower details
      const lenderIds = loans?.map(l => l.created_by).filter(Boolean) || []
      const borrowerIds = loans?.map(l => l.borrower_id).filter(Boolean) || []
      
      const { data: lenders } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', lenderIds)
      
      const { data: borrowers } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', borrowerIds)

      // Get EMI data for comprehensive analysis
      const loanIds = loans?.map(l => l.id) || []
      const { data: emis } = await supabase
        .from('emis')
        .select('loan_id, amount, paid_amount, due_date, emi_number')
        .in('loan_id', loanIds)

      const processedLoans: LoanOverview[] = (loans || []).map(loan => {
        const lender = lenders?.find(l => l.id === loan.created_by)
        const borrower = borrowers?.find(b => b.id === loan.borrower_id)
        const loanEmis = emis?.filter(e => e.loan_id === loan.id) || []
        
        // Calculate metrics
        const totalEmiAmount = loanEmis.reduce((sum, emi) => sum + emi.amount, 0)
        const totalPaid = loanEmis.reduce((sum, emi) => sum + (emi.paid_amount || 0), 0)
        const outstandingBalance = Math.max(0, (loan.total_amount || loan.principal_amount) - totalPaid)
        const collectionRate = totalEmiAmount > 0 ? Math.round((totalPaid / totalEmiAmount) * 100) : 0

        // Calculate overdue days and risk
        const today = new Date()
        const overdueEmis = loanEmis.filter(emi => 
          new Date(emi.due_date) < today && (emi.paid_amount || 0) < emi.amount
        )
        const daysOverdue = overdueEmis.length > 0 ? 
          Math.max(...overdueEmis.map(emi => 
            Math.floor((today.getTime() - new Date(emi.due_date).getTime()) / (1000 * 3600 * 24))
          )) : 0

        const paidEmis = loanEmis.filter(emi => (emi.paid_amount || 0) >= emi.amount).length
        
        // Next due date
        const unpaidEmis = loanEmis
          .filter(emi => (emi.paid_amount || 0) < emi.amount)
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        const nextDueDate = unpaidEmis[0]?.due_date || ''

        // Risk assessment
        let riskLevel = 'low'
        if (daysOverdue > 30 || collectionRate < 60) riskLevel = 'high'
        else if (daysOverdue > 7 || collectionRate < 80) riskLevel = 'medium'

        return {
          id: loan.id,
          loan_number: loan.loan_number || `LOAN-${loan.id.slice(0, 8)}`,
          lender_name: lender?.full_name || 'Unknown',
          lender_email: lender?.email || 'Unknown',
          borrower_name: borrower?.full_name || 'Unknown',
          borrower_email: borrower?.email || 'Unknown',
          principal_amount: loan.principal_amount,
          total_amount: loan.total_amount || loan.principal_amount,
          outstanding_balance: outstandingBalance,
          status: loan.status,
          days_overdue: daysOverdue,
          collection_rate: collectionRate,
          created_at: loan.created_at,
          disbursement_date: loan.disbursement_date || loan.created_at,
          emi_count: loanEmis.length,
          paid_emis: paidEmis,
          next_due_date: nextDueDate,
          risk_level: riskLevel
        }
      })

      setLoans(processedLoans)
      console.log('✅ ADMIN - Loans loaded:', processedLoans.length)

    } catch (error: any) {
      console.error('❌ ADMIN - Failed to load loans:', error)
    }
  }

  // Apply filters to all data
  const applyFilters = () => {
    // Filter users
    let filteredUserData = [...users]
    
    if (searchQuery) {
      filteredUserData = filteredUserData.filter(user =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery)
      )
    }

    if (userFilter !== 'all') {
      switch (userFilter) {
        case 'lenders':
          filteredUserData = filteredUserData.filter(u => u.role === 'lender' || u.roles.includes('lender'))
          break
        case 'borrowers':
          filteredUserData = filteredUserData.filter(u => u.role === 'borrower' || u.roles.includes('borrower'))
          break
        case 'pending':
          filteredUserData = filteredUserData.filter(u => u.pending_approval)
          break
        case 'active':
          filteredUserData = filteredUserData.filter(u => u.active)
          break
        case 'inactive':
          filteredUserData = filteredUserData.filter(u => !u.active)
          break
      }
    }

    // Sort users
    filteredUserData.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'performance-high':
          return (b.portfolio_value || 0) - (a.portfolio_value || 0)
        case 'performance-low':
          return (a.portfolio_value || 0) - (b.portfolio_value || 0)
        default:
          return 0
      }
    })

    setFilteredUsers(filteredUserData)

    // Filter lenders
    let filteredLenderData = [...lenderPerformance]
    
    if (searchQuery) {
      filteredLenderData = filteredLenderData.filter(lender =>
        lender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lender.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lender.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (lenderFilter !== 'all') {
      switch (lenderFilter) {
        case 'top-performers':
          filteredLenderData = filteredLenderData.filter(l => l.collection_rate >= 90)
          break
        case 'underperforming':
          filteredLenderData = filteredLenderData.filter(l => l.collection_rate < 70)
          break
        case 'new':
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          filteredLenderData = filteredLenderData.filter(l => new Date(l.active_since) > thirtyDaysAgo)
          break
        case 'high-volume':
          filteredLenderData = filteredLenderData.filter(l => l.portfolio_value > 100000)
          break
      }
    }

    // Sort lenders
    filteredLenderData.sort((a, b) => {
      switch (sortOption) {
        case 'performance-high':
          return b.collection_rate - a.collection_rate
        case 'performance-low':
          return a.collection_rate - b.collection_rate
        case 'amount-high':
          return b.portfolio_value - a.portfolio_value
        case 'amount-low':
          return a.portfolio_value - b.portfolio_value
        case 'risk-high':
          return b.risk_score - a.risk_score
        case 'risk-low':
          return a.risk_score - b.risk_score
        default:
          return new Date(b.active_since).getTime() - new Date(a.active_since).getTime()
      }
    })

    setFilteredLenders(filteredLenderData)

    // Filter loans
    let filteredLoanData = [...loans]
    
    if (searchQuery) {
      filteredLoanData = filteredLoanData.filter(loan =>
        loan.loan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.lender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.borrower_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (loanFilter !== 'all') {
      switch (loanFilter) {
        case 'active':
          filteredLoanData = filteredLoanData.filter(l => l.status === 'active' || l.status === 'disbursed')
          break
        case 'overdue':
          filteredLoanData = filteredLoanData.filter(l => l.days_overdue > 0)
          break
        case 'completed':
          filteredLoanData = filteredLoanData.filter(l => l.status === 'completed')
          break
        case 'high-risk':
          filteredLoanData = filteredLoanData.filter(l => l.risk_level === 'high')
          break
        case 'recent':
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          filteredLoanData = filteredLoanData.filter(l => new Date(l.created_at) > sevenDaysAgo)
          break
      }
    }

    // Sort loans
    filteredLoanData.sort((a, b) => {
      switch (sortOption) {
        case 'amount-high':
          return b.principal_amount - a.principal_amount
        case 'amount-low':
          return a.principal_amount - b.principal_amount
        case 'performance-high':
          return b.collection_rate - a.collection_rate
        case 'performance-low':
          return a.collection_rate - b.collection_rate
        case 'risk-high':
          return b.days_overdue - a.days_overdue
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredLoans(filteredLoanData)
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
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  // Get filter counts
  const getFilterCounts = () => {
    const userCounts = {
      all: users.length,
      lenders: users.filter(u => u.role === 'lender' || u.roles.includes('lender')).length,
      borrowers: users.filter(u => u.role === 'borrower' || u.roles.includes('borrower')).length,
      pending: users.filter(u => u.pending_approval).length,
      active: users.filter(u => u.active).length,
      inactive: users.filter(u => !u.active).length
    }

    const lenderCounts = {
      all: lenderPerformance.length,
      'top-performers': lenderPerformance.filter(l => l.collection_rate >= 90).length,
      underperforming: lenderPerformance.filter(l => l.collection_rate < 70).length,
      new: lenderPerformance.filter(l => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return new Date(l.active_since) > thirtyDaysAgo
      }).length,
      'high-volume': lenderPerformance.filter(l => l.portfolio_value > 100000).length
    }

    const loanCounts = {
      all: loans.length,
      active: loans.filter(l => l.status === 'active' || l.status === 'disbursed').length,
      overdue: loans.filter(l => l.days_overdue > 0).length,
      completed: loans.filter(l => l.status === 'completed').length,
      'high-risk': loans.filter(l => l.risk_level === 'high').length,
      recent: loans.filter(l => {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return new Date(l.created_at) > sevenDaysAgo
      }).length
    }

    return { userCounts, lenderCounts, loanCounts }
  }

  const { userCounts, lenderCounts, loanCounts } = getFilterCounts()

  // ✅ LOADING STATE
  if (!initialized || !isAuthenticated || !isAdmin) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="bg-gray-50 min-h-screen">
        {/* Professional Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Platform management and analytics</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 overflow-x-auto">
              {[
                { key: 'dashboard', label: 'Overview', icon: BarChart3 },
                { key: 'users', label: 'Users', icon: Users },
                { key: 'lenders', label: 'Lenders', icon: Building },
                { key: 'loans', label: 'Loans', icon: CreditCard },
                { key: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map((nav) => {
                const Icon = nav.icon
                return (
                  <button
                    key={nav.key}
                    onClick={() => setViewMode(nav.key as ViewMode)}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                      viewMode === nav.key
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {nav.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Dashboard Overview */}
        {viewMode === 'dashboard' && (
          <div className="p-4 space-y-6">
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Users"
                value={platformStats.totalUsers}
                change={`+${platformStats.monthlyGrowth}% this month`}
                changeType="positive"
                icon={Users}
                subtitle={`${platformStats.totalLenders} lenders, ${platformStats.totalBorrowers} borrowers`}
              />
              <StatsCard
                title="Active Loans"
                value={platformStats.activeLoans}
                icon={CreditCard}
                subtitle={`${platformStats.completedLoans} completed`}
              />
              <StatsCard
                title="Portfolio Value"
                value={formatCurrency(platformStats.totalPortfolio)}
                icon={DollarSign}
                subtitle={`${formatCurrency(platformStats.totalOutstanding)} outstanding`}
              />
              <StatsCard
                title="Collection Rate"
                value={`${platformStats.averageCollectionRate}%`}
                changeType={platformStats.averageCollectionRate >= 90 ? "positive" : platformStats.averageCollectionRate >= 75 ? "neutral" : "negative"}
                change={platformStats.averageCollectionRate >= 90 ? "Excellent" : platformStats.averageCollectionRate >= 75 ? "Good" : "Needs attention"}
                icon={Percent}
                subtitle="Platform average"
              />
            </div>

            {/* Alerts Section */}
            {(platformStats.pendingLenders > 0 || platformStats.overdueLoans > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platformStats.pendingLenders > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                      <div className="flex-1">
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
                      <div className="flex-1">
                        <h3 className="text-red-800 font-medium">Overdue Payments</h3>
                        <p className="text-red-700 text-sm">
                          {platformStats.overdueLoans} EMIs are overdue
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

            {/* Quick Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Top Performing Lenders</h3>
                </div>
                <div className="p-4">
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lenderPerformance.slice(0, 3).map((lender, index) => (
                        <div key={lender.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                              <span className="text-white font-bold text-sm">{index + 1}</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{lender.name}</h4>
                              <p className="text-sm text-gray-600">{formatCurrency(lender.portfolio_value)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{lender.collection_rate}%</p>
                            <p className="text-sm text-gray-500">{lender.loans_count} loans</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Loans</h3>
                </div>
                <div className="p-4">
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {loans.slice(0, 3).map((loan) => (
                        <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{loan.loan_number}</h4>
                            <p className="text-sm text-gray-600">{loan.lender_name} → {loan.borrower_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{formatCurrency(loan.principal_amount)}</p>
                            <p className={`text-sm ${
                              loan.status === 'active' ? 'text-green-600' : 
                              loan.status === 'overdue' ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {loan.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Management */}
        {viewMode === 'users' && (
          <div className="space-y-4">
            {/* Stats Bar */}
            <StatsBar
              stats={[
                { label: "Total", value: userCounts.all },
                { label: "Lenders", value: userCounts.lenders, color: "blue" },
                { label: "Borrowers", value: userCounts.borrowers, color: "green" },
                { label: "Pending", value: userCounts.pending, color: "yellow" },
                { label: "Active", value: userCounts.active, color: "green" },
                { label: "Inactive", value: userCounts.inactive, color: "red" }
              ]}
            />

            {/* Filter Bar */}
            <FilterBar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search users by name, email, or phone..."
              filters={[
                {
                  key: 'role',
                  label: 'User Type',
                  options: [
                    { value: 'all', label: 'All Users', count: userCounts.all },
                    { value: 'lenders', label: 'Lenders', count: userCounts.lenders },
                    { value: 'borrowers', label: 'Borrowers', count: userCounts.borrowers },
                    { value: 'pending', label: 'Pending', count: userCounts.pending },
                    { value: 'active', label: 'Active', count: userCounts.active },
                    { value: 'inactive', label: 'Inactive', count: userCounts.inactive }
                  ],
                  value: userFilter,
                  onChange: (value) => setUserFilter(value as UserFilter)
                }
              ]}
              sortOptions={[
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'performance-high', label: 'Portfolio: High to Low' },
                { value: 'performance-low', label: 'Portfolio: Low to High' }
              ]}
              sortValue={sortOption}
              onSortChange={(value) => setSortOption(value as SortOption)}
              customActions={
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Download className="h-4 w-4 text-gray-600" />
                </button>
              }
            />

            {/* Users Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role & Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portfolio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-white font-semibold">
                                  {user.full_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                <div className="text-sm text-gray-500">{user.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {user.roles.join(', ')}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.active ? 'Active' : 'Inactive'}
                                </span>
                                {user.pending_approval && (
                                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div>{user.loan_count || 0} loans</div>
                            <div className="font-medium">{formatCurrency(user.portfolio_value || 0)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {user.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              {user.pending_approval && (
                                <>
                                  <button
                                    onClick={() => handleUserAction(user.id, 'approve')}
                                    className="text-green-600 hover:text-green-800 p-1 rounded"
                                    title="Approve"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleUserAction(user.id, 'reject')}
                                    className="text-red-600 hover:text-red-800 p-1 rounded"
                                    title="Reject"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {!user.pending_approval && (
                                <button
                                  onClick={() => handleUserAction(user.id, user.active ? 'deactivate' : 'activate')}
                                  className={`p-1 rounded ${user.active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                                  title={user.active ? 'Deactivate' : 'Activate'}
                                >
                                  {user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </button>
                              )}
                              <button className="text-gray-600 hover:text-gray-800 p-1 rounded" title="View Details">
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lenders Performance */}
        {viewMode === 'lenders' && (
          <div className="space-y-4">
            <StatsBar
              stats={[
                { label: "Total", value: lenderCounts.all },
                { label: "Top Performers", value: lenderCounts['top-performers'], color: "green" },
                { label: "Underperforming", value: lenderCounts.underperforming, color: "red" },
                { label: "New (30d)", value: lenderCounts.new, color: "blue" },
                { label: "High Volume", value: lenderCounts['high-volume'], color: "purple" }
              ]}
            />

            <FilterBar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search lenders by name, email, or location..."
              filters={[
                {
                  key: 'performance',
                  label: 'Performance',
                  options: [
                    { value: 'all', label: 'All Lenders', count: lenderCounts.all },
                    { value: 'top-performers', label: 'Top Performers (90%+)', count: lenderCounts['top-performers'] },
                    { value: 'underperforming', label: 'Underperforming (<70%)', count: lenderCounts.underperforming },
                    { value: 'new', label: 'New (30 days)', count: lenderCounts.new },
                    { value: 'high-volume', label: 'High Volume (₹1L+)', count: lenderCounts['high-volume'] }
                  ],
                  value: lenderFilter,
                  onChange: (value) => setLenderFilter(value as LenderFilter)
                }
              ]}
              sortOptions={[
                { value: 'performance-high', label: 'Collection Rate: High to Low' },
                { value: 'performance-low', label: 'Collection Rate: Low to High' },
                { value: 'amount-high', label: 'Portfolio: High to Low' },
                { value: 'amount-low', label: 'Portfolio: Low to High' },
                { value: 'risk-high', label: 'Risk: High to Low' },
                { value: 'newest', label: 'Newest First' }
              ]}
              sortValue={sortOption}
              onSortChange={(value) => setSortOption(value as SortOption)}
              customActions={
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Download className="h-4 w-4 text-gray-600" />
                </button>
              }
            />

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading lenders...</p>
                </div>
              ) : filteredLenders.length === 0 ? (
                <div className="p-6 text-center">
                  <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lenders Found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lender</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portfolio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metrics</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Since</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLenders.map((lender) => (
                        <tr key={lender.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-white font-semibold">
                                  {lender.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{lender.name}</div>
                                <div className="text-sm text-gray-500">{lender.email}</div>
                                <div className="text-sm text-gray-500">{lender.location}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="font-semibold text-gray-900">{formatCurrency(lender.portfolio_value)}</div>
                            <div className="text-gray-600">{formatCurrency(lender.outstanding_amount)} outstanding</div>
                            <div className="text-gray-500">{lender.loans_count} loans</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`text-sm font-semibold ${
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
                                />
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {formatCurrency(lender.total_revenue)} collected
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div>{lender.borrowers_count} borrowers</div>
                            <div className="text-gray-600">₹{Math.round(lender.avg_loan_amount / 1000)}k avg loan</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              lender.risk_score <= 10 ? 'bg-green-100 text-green-800' :
                              lender.risk_score <= 30 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {lender.risk_score <= 10 ? 'Low' : lender.risk_score <= 30 ? 'Medium' : 'High'} Risk
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(lender.active_since)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loans Overview */}
        {viewMode === 'loans' && (
          <div className="space-y-4">
            <StatsBar
              stats={[
                { label: "Total", value: loanCounts.all },
                { label: "Active", value: loanCounts.active, color: "green" },
                { label: "Overdue", value: loanCounts.overdue, color: "red" },
                { label: "Completed", value: loanCounts.completed, color: "blue" },
                { label: "High Risk", value: loanCounts['high-risk'], color: "red" },
                { label: "Recent (7d)", value: loanCounts.recent, color: "blue" }
              ]}
            />

            <FilterBar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search loans by number, lender, or borrower..."
              filters={[
                {
                  key: 'status',
                  label: 'Status & Risk',
                  options: [
                    { value: 'all', label: 'All Loans', count: loanCounts.all },
                    { value: 'active', label: 'Active', count: loanCounts.active },
                    { value: 'overdue', label: 'Overdue', count: loanCounts.overdue },
                    { value: 'completed', label: 'Completed', count: loanCounts.completed },
                    { value: 'high-risk', label: 'High Risk', count: loanCounts['high-risk'] },
                    { value: 'recent', label: 'Recent (7 days)', count: loanCounts.recent }
                  ],
                  value: loanFilter,
                  onChange: (value) => setLoanFilter(value as LoanFilter)
                }
              ]}
              sortOptions={[
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'amount-high', label: 'Amount: High to Low' },
                { value: 'amount-low', label: 'Amount: Low to High' },
                { value: 'performance-high', label: 'Collection: High to Low' },
                { value: 'risk-high', label: 'Risk: High to Low' }
              ]}
              sortValue={sortOption}
              onSortChange={(value) => setSortOption(value as SortOption)}
              customActions={
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Download className="h-4 w-4 text-gray-600" />
                </button>
              }
            />

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading loans...</p>
                </div>
              ) : filteredLoans.length === 0 ? (
                <div className="p-6 text-center">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Loans Found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parties</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount & Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk & Due</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLoans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{loan.loan_number}</div>
                              <div className="text-sm text-gray-500">Created: {formatDate(loan.created_at)}</div>
                              <div className="text-sm text-gray-500">Disbursed: {formatDate(loan.disbursement_date)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span className="font-medium text-gray-900">Lender:</span> {loan.lender_name}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-900">Borrower:</span> {loan.borrower_name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{formatCurrency(loan.principal_amount)}</div>
                              <div className="text-sm text-gray-600">{formatCurrency(loan.outstanding_balance)} outstanding</div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                loan.status === 'active' ? 'bg-green-100 text-green-800' :
                                loan.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                loan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {loan.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">{loan.paid_emis}/{loan.emi_count} EMIs</div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${loan.emi_count > 0 ? (loan.paid_emis / loan.emi_count) * 100 : 0}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {loan.emi_count > 0 ? Math.round((loan.paid_emis / loan.emi_count) * 100) : 0}% complete
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`text-sm font-semibold ${
                                loan.collection_rate >= 90 ? 'text-green-600' :
                                loan.collection_rate >= 70 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {loan.collection_rate}%
                              </span>
                              <div className="ml-2 w-12 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    loan.collection_rate >= 90 ? 'bg-green-600' :
                                    loan.collection_rate >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                                  }`}
                                  style={{ width: `${loan.collection_rate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                loan.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                                loan.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {loan.risk_level} risk
                              </span>
                              {loan.days_overdue > 0 && (
                                <div className="text-xs text-red-600 font-medium">
                                  {loan.days_overdue} days overdue
                                </div>
                              )}
                              {loan.next_due_date && (
                                <div className="text-xs text-gray-500">
                                  Next: {formatDate(loan.next_due_date)}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics View */}
        {viewMode === 'analytics' && (
          <div className="p-4 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
              <p className="text-gray-600 mb-4">Comprehensive platform analytics and insights coming soon.</p>
              <p className="text-sm text-gray-500">This section will include detailed charts, trends, and predictive analytics.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}