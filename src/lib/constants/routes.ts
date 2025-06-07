export const ROUTES = {
  // Public routes
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Dashboard routes
  DASHBOARD: '/dashboard',
  
  // Admin routes
  ADMIN: {
    DASHBOARD: '/dashboard/admin',
    LENDERS: '/dashboard/admin/lenders',
    ANALYTICS: '/dashboard/admin/analytics',
    SETTINGS: '/dashboard/admin/settings',
  },
  
  // Lender routes
  LENDER: {
    DASHBOARD: '/dashboard/lender',
    BORROWERS: '/dashboard/lender/borrowers',
    LOANS: '/dashboard/lender/loans',
    PAYMENTS: '/dashboard/lender/payments',
  },
  
  // Borrower routes
  BORROWER: {
    DASHBOARD: '/dashboard/borrower',
    LOANS: '/dashboard/borrower/loans',
    EMIS: '/dashboard/borrower/emis',
    PAYMENTS: '/dashboard/borrower/payments',
  },
} as const
