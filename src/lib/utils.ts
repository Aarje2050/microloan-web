import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, differenceInDays, addMonths, isAfter } from 'date-fns'

// Tailwind utility function
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency for Indian Rupees
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format numbers with Indian number system
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num)
}

// Format phone numbers
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  return phone
}

// Date formatting utilities
export function formatDate(date: string | Date, formatStr: string = 'dd MMM yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr)
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd MMM yyyy, h:mm a')
}

export function getRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const days = differenceInDays(new Date(), dateObj)
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

// EMI Calculations
export function calculateEMI(principal: number, rate: number, tenure: number): number {
  const monthlyRate = rate / (12 * 100)
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
              (Math.pow(1 + monthlyRate, tenure) - 1)
  return Math.round(emi)
}

export function calculateTotalAmount(principal: number, rate: number, tenure: number): number {
  const emi = calculateEMI(principal, rate, tenure)
  return emi * tenure
}

export function calculateTotalInterest(principal: number, rate: number, tenure: number): number {
  return calculateTotalAmount(principal, rate, tenure) - principal
}

// Generate EMI schedule
export interface EMIScheduleItem {
  emi_number: number
  due_date: string
  amount: number
  principal_component: number
  interest_component: number
  remaining_balance: number
}

export function generateEMISchedule(
  principal: number, 
  rate: number, 
  tenure: number, 
  startDate: Date = new Date()
): EMIScheduleItem[] {
  const monthlyRate = rate / (12 * 100)
  const emi = calculateEMI(principal, rate, tenure)
  const schedule: EMIScheduleItem[] = []
  
  let remainingBalance = principal
  
  for (let i = 1; i <= tenure; i++) {
    const interestComponent = Math.round(remainingBalance * monthlyRate)
    const principalComponent = emi - interestComponent
    remainingBalance = Math.max(0, remainingBalance - principalComponent)
    
    const dueDate = addMonths(startDate, i)
    
    schedule.push({
      emi_number: i,
      due_date: format(dueDate, 'yyyy-MM-dd'),
      amount: emi,
      principal_component: principalComponent,
      interest_component: interestComponent,
      remaining_balance: remainingBalance
    })
  }
  
  return schedule
}

// Loan status utilities
export function getLoanStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-50'
    case 'pending_approval':
      return 'text-yellow-600 bg-yellow-50'
    case 'completed':
      return 'text-blue-600 bg-blue-50'
    case 'defaulted':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export function getEMIStatusColor(status: string): string {
  switch (status) {
    case 'paid':
      return 'text-green-600 bg-green-50'
    case 'pending':
      return 'text-blue-600 bg-blue-50'
    case 'overdue':
      return 'text-red-600 bg-red-50'
    case 'partially_paid':
      return 'text-orange-600 bg-orange-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

// Check if EMI is overdue
export function isEMIOverdue(dueDate: string): boolean {
  return isAfter(new Date(), parseISO(dueDate))
}

export function getOverdueDays(dueDate: string): number {
  if (!isEMIOverdue(dueDate)) return 0
  return differenceInDays(new Date(), parseISO(dueDate))
}

// Form validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[+]?[1-9][\d]{9,14}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function validatePAN(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan.toUpperCase())
}

export function validateAadhar(aadhar: string): boolean {
  const aadharRegex = /^[0-9]{12}$/
  return aadharRegex.test(aadhar.replace(/\s/g, ''))
}

// Generate unique loan number
export function generateLoanNumber(): string {
  const year = new Date().getFullYear().toString().slice(-2)
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ML-${year}${month}-${random}`
}

// Pagination utilities
export function getPaginationData(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    startItem: (page - 1) * limit + 1,
    endItem: Math.min(page * limit, total)
  }
}

// Search and filter utilities
export function searchInObject(obj: Record<string, any>, searchTerm: string): boolean {
  const searchLower = searchTerm.toLowerCase()
  
  return Object.values(obj).some(value => {
    if (typeof value === 'string') {
      return value.toLowerCase().includes(searchLower)
    }
    if (typeof value === 'number') {
      return value.toString().includes(searchLower)
    }
    return false
  })
}

// Mobile detection
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

export function isTablet(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 768 && window.innerWidth < 1024
}

export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 1024
}

// Local storage utilities with error handling
export function setStorageItem(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
  }
}

export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.warn('Failed to read from localStorage:', error)
    return defaultValue
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error)
  }
}

// Error handling utilities
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.error_description) return error.error_description
  return 'An unexpected error occurred'
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.warn('Failed to copy to clipboard:', error)
    return false
  }
}

// File size formatting
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}