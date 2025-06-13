// lib/api/types.ts - Updated API Types with missing properties
export interface PlatformStats {
  totalUsers: number
  totalLenders: number
  totalBorrowers: number
  pendingUsers: number
  totalLoans: number
  totalPortfolio: number
  totalOutstanding: number
  averageCollectionRate: number
  overdueEMIs: number
  activeLoans: number
  completedLoans: number
  totalRevenue: number
  monthlyGrowth: number
  platformHealth: 'excellent' | 'good' | 'warning' | 'critical'
}

export interface EnhancedUser {
  id: string
  email: string
  full_name: string
  phone: string
  role: string
  roles?: string[]
  active: boolean
  email_verified: boolean
  pending_approval: boolean
  created_at: string
  updated_at: string
  loan_count: number
  portfolio_value: number
  kyc_status: string
  location: string
  risk_score: number
  profile?: {
    avatar_url?: string
    address?: string
    kyc_status?: string
  }
}

export interface EnhancedLoan {
  id: string
  loan_number: string
  borrower_id: string
  borrower_name: string
  borrower_email: string
  borrower_phone?: string
  lender_id: string
  lender_name: string
  lender_email: string
  lender_phone?: string
  principal_amount: number
  total_amount: number
  interest_rate: number
  tenure_value: number
  tenure_unit: string
  loan_type?: string
  repayment_frequency?: string
  status: string
  disbursement_date?: string
  maturity_date?: string
  outstanding_balance: number
  outstanding_amount?: number // Alternative field name
  collection_rate: number
  days_overdue: number
  created_at: string
  risk_level: 'low' | 'medium' | 'high'
  payment_consistency: number
  late_payment_count: number
  total_paid: number
  total_interest_earned: number
  processing_fees: number
  late_fees_collected: number
  // EMI related fields
  paid_emis?: number
  total_emis?: number
  overdue_emis?: number
  emi_amount?: number
  next_emi_date?: string
}

export interface EnhancedEMI {
  id: string
  loan_id: string
  loan_number: string
  borrower_id: string
  borrower_name: string
  borrower_email?: string
  borrower_phone?: string
  lender_id: string
  lender_name: string
  lender_email?: string
  lender_phone?: string
  emi_number: number
  due_date: string
  amount: number
  principal_amount: number
  interest_amount: number
  paid_amount?: number
  status: 'pending' | 'paid' | 'overdue' | 'partial'
  payment_status: string
  days_overdue: number
  outstanding_balance: number
  late_fee?: number
  penalty_amount?: number
  payment_date?: string
  payment_method?: string
  payment_reference?: string
  risk_score: number
  collection_probability: number
}

export interface UserFilters {
  role?: 'all' | 'lender' | 'borrower' | 'admin'
  status?: 'active' | 'inactive' | 'pending' | 'verified'
  date_range?: {
    start: string
    end: string
  }
  search?: string
}

export interface LoanFilters {
  status?: 'all' | 'pending' | 'active' | 'completed' | 'overdue' | 'defaulted'
  amount_range?: {
    min: number
    max: number
  }
  interest_range?: {
    min: number
    max: number
  }
  date_range?: {
    start: string
    end: string
  }
  risk_level?: 'all' | 'low' | 'medium' | 'high'
  collection_rate?: {
    min: number
    max: number
  }
}

export interface EMIFilters {
  status?: 'all' | 'pending' | 'paid' | 'overdue' | 'partial'
  due_date_range?: {
    start: string
    end: string
  }
  amount_range?: {
    min: number
    max: number
  }
  overdue_days?: {
    min: number
    max: number
  }
  risk_level?: 'all' | 'low' | 'medium' | 'high'
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface ApiResponse<T> {
  data: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface UserAction {
  type: 'activate' | 'deactivate' | 'approve' | 'reject' | 'delete' | 'verify_kyc' | 'reset_password'
  userId: string
  reason?: string
  notes?: string
}

export interface LoanAction {
  type: 'approve' | 'reject' | 'disburse' | 'close' | 'mark_default'
  loanId: string
  reason?: string
  notes?: string
}

export interface EMIAction {
  type: 'mark_paid' | 'add_late_fee' | 'waive_fee' | 'extend_due_date'
  emiId: string
  amount?: number
  new_due_date?: string
  reason?: string
  notes?: string
}

export interface BulkAction {
  action: string
  items: string[]
  reason?: string
  notes?: string
}

export interface AnalyticsData {
  period: 'daily' | 'weekly' | 'monthly'
  data: Array<{
    date: string
    loans_created: number
    loans_disbursed: number
    collections: number
    defaults: number
    new_users: number
    revenue: number
  }>
}

export interface SystemSettings {
  platform_fee_rate: number
  late_fee_rate: number
  default_interest_rate: number
  max_loan_amount: number
  min_loan_amount: number
  kyc_verification_required: boolean
  auto_approval_enabled: boolean
  email_notifications_enabled: boolean
  sms_notifications_enabled: boolean
  maintenance_mode: boolean
}

export interface AuditLog {
  id: string
  user_id: string
  user_name: string
  action: string
  resource_type: string
  resource_id: string
  details: Record<string, any>
  ip_address: string
  user_agent: string
  created_at: string
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf'
  filters?: Record<string, any>
  columns?: string[]
}