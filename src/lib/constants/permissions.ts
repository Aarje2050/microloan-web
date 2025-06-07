import { UserRole } from '@/lib/types'

export const PERMISSIONS = {
  // Admin permissions
  MANAGE_USERS: ['super_admin'],
  MANAGE_LENDERS: ['super_admin'],
  VIEW_ANALYTICS: ['super_admin'],
  SYSTEM_SETTINGS: ['super_admin'],
  
  // Lender permissions
  CREATE_BORROWERS: ['super_admin', 'lender'],
  MANAGE_LOANS: ['super_admin', 'lender'],
  RECORD_PAYMENTS: ['super_admin', 'lender'],
  VIEW_BORROWER_DATA: ['super_admin', 'lender'],
  
  // Borrower permissions
  VIEW_OWN_LOANS: ['super_admin', 'lender', 'borrower'],
  VIEW_OWN_PAYMENTS: ['super_admin', 'lender', 'borrower'],
  UPLOAD_DOCUMENTS: ['borrower'],
  
} as const

export function hasPermission(userRole: UserRole, permission: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[permission].includes(userRole)
}
