// Database Types (matching your existing schema)
export type UserRole = 'super_admin' | 'lender' | 'borrower';
export type LoanStatus = 'pending_approval' | 'active' | 'completed' | 'defaulted';
export type EMIStatus = 'pending' | 'paid' | 'overdue' | 'partially_paid';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'cheque';
export type DocumentType = 'aadhar' | 'pan' | 'salary_slip' | 'bank_statement' | 'photo';
export type KYCStatus = 'pending' | 'verified' | 'rejected';

// UI Types
export type ChangeType = 'positive' | 'negative' | 'neutral';

// Core User Types
export interface User {
  id: string;
  email: string;
  role: UserRole;
  phone: string;
  full_name: string;
  active: boolean;
  email_verified: boolean;
  pending_approval: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  avatar_url?: string;
  address?: string;
  kyc_status: KYCStatus;
  created_at: string;
  updated_at: string;
}

export interface Borrower {
  id: string;
  user_id: string;
  lender_id: string;
  credit_score?: number;
  employment_type?: string;
  monthly_income?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Joined data
  user?: User;
  lender?: User;
}

export interface Loan {
  id: string;
  borrower_id: string;
  loan_number: string;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  status: LoanStatus;
  approved_by?: string;
  approved_at?: string;
  disbursed_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Joined data
  borrower?: Borrower;
  approved_by_user?: User;
}

// Dashboard Types - THIS WAS MISSING!
export interface DashboardStat {
  title: string;
  value: string | number;
  change?: string;
  changeType?: ChangeType;
  icon: React.ComponentType<any> | string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  active: boolean;
  email_verified: boolean;
  pending_approval: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  phone: string;
  role: UserRole;
}