export const APP_CONFIG = {
  name: 'MicroLoan Manager',
  version: '1.0.0',
  description: 'Enterprise-grade microloan management platform',
  author: 'MicroLoan Team',
  
  // Database
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
  
  // File uploads
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: ['image/*', 'application/pdf'],
  
  // EMI calculations
  defaultInterestRate: 12.0,
  maxLoanAmount: 10000000, // 1 Crore
  maxTenureMonths: 360, // 30 years
  
  // UI
  toastDuration: 3000,
  debounceDelay: 300,
} as const
