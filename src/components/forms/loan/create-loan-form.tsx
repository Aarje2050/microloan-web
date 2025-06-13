// File: src/components/forms/loan/create-loan-form.tsx - COMPLETE ENHANCED VERSION WITH INTEREST-ONLY SUPPORT
'use client'

import React from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  CreditCard, Calculator, User, DollarSign, Calendar, 
  AlertTriangle, CheckCircle, ArrowLeft, Clock, Edit3, RefreshCw,
  IndianRupee
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreateLoanFormProps {
  borrowerId?: string
  onSuccess?: (loanId: string) => void
  onCancel?: () => void
}

interface LoanProduct {
  id: string
  name: string
  min_amount: number
  max_amount: number
  min_tenure_days: number
  max_tenure_days: number
  interest_rate: number
  late_fee_rate: number
  repayment_frequency: string
  loan_type: string
}

interface Borrower {
  id: string
  user_id: string
  full_name: string
  email: string
  monthly_income: number | null
  credit_score: number | null
}

interface EMICalculation {
  emi_amount: number
  total_amount: number
  total_interest: number
  effective_interest_rate: number
  schedule: Array<{
    emi_number: number
    due_date: string | undefined
    principal: number
    interest: number
    emi_amount: number
    balance: number
  }>
}

interface FormData {
  borrower_id: string
  loan_product_id: string
  principal_amount: string
  tenure_value: string
  tenure_unit: string
  interest_rate: string
  interest_rate_unit: string
  interest_calculation_method: 'flat' | 'reducing'
  repayment_frequency: string
  loan_type: string
  is_interest_only: boolean // 🆕 NEW: Interest-only loan flag
  purpose: string
  disbursement_date: string
  notes: string
}

export default function CreateLoanForm({ borrowerId, onSuccess, onCancel }: CreateLoanFormProps) {
  const { user } = useAuth()
  
  // State management
  const [currentStep, setCurrentStep] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  
  // Data states
  const [borrowers, setBorrowers] = React.useState<Borrower[]>([])
  const [loanProducts, setLoanProducts] = React.useState<LoanProduct[]>([])
  const [selectedBorrower, setSelectedBorrower] = React.useState<Borrower | null>(null)
  const [emiCalculation, setEmiCalculation] = React.useState<EMICalculation | null>(null)
  const [isCalculating, setIsCalculating] = React.useState(false)
  const [isLoadingBorrowers, setIsLoadingBorrowers] = React.useState(true)
  
  // Manual EMI adjustment states
  const [isEmiEditable, setIsEmiEditable] = React.useState(false)
  const [customEmiAmount, setCustomEmiAmount] = React.useState('')
  const [isRecalculating, setIsRecalculating] = React.useState(false)
  
  // Form data
  const [formData, setFormData] = React.useState<FormData>({
    borrower_id: borrowerId || '',
    loan_product_id: '',
    principal_amount: '',
    tenure_value: '',
    tenure_unit: 'days',
    interest_rate: '',
    interest_rate_unit: 'annual',
    interest_calculation_method: 'flat',
    repayment_frequency: 'daily',
    loan_type: 'daily',
    is_interest_only: false, // 🆕 NEW: Default to regular loan
    purpose: '',
    disbursement_date: new Date().toISOString().split('T')[0] || '',
    notes: ''
  })

  console.log('💰 CREATE LOAN - Enhanced form loaded for lender:', user?.email)

  // Load initial data
  React.useEffect(() => {
    if (user) {
      loadBorrowers()
      loadLoanProducts()
    }
  }, [user])

  // Auto-select borrower if provided
  React.useEffect(() => {
    if (borrowerId && borrowers.length > 0) {
      const borrower = borrowers.find(b => b.user_id === borrowerId)
      if (borrower) {
        setSelectedBorrower(borrower)
        setFormData(prev => ({ ...prev, borrower_id: borrower.user_id }))
      }
    }
  }, [borrowerId, borrowers])

  // Load lender's borrowers
  const loadBorrowers = async () => {
    try {
      console.log('📊 LOAN - Loading borrowers for lender:', user?.id)
      setIsLoadingBorrowers(true)
      
      const { data: borrowersData, error: borrowersError } = await supabase
        .from('borrowers')
        .select('id, user_id, monthly_income, credit_score')
        .eq('lender_id', user?.id)
        .order('created_at', { ascending: false })

      if (borrowersError) throw borrowersError

      if (!borrowersData || borrowersData.length === 0) {
        setBorrowers([])
        return
      }

      const userIds = borrowersData.map(b => b.user_id)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds)

      if (usersError) throw usersError

      const transformedBorrowers: Borrower[] = borrowersData.map(borrower => {
        const userInfo = usersData?.find(u => u.id === borrower.user_id)

        return {
          id: borrower.id,
          user_id: borrower.user_id,
          full_name: userInfo?.full_name || 'Unknown',
          email: userInfo?.email || 'No email',
          monthly_income: borrower.monthly_income,
          credit_score: borrower.credit_score
        }
      })

      setBorrowers(transformedBorrowers)
      
    } catch (error: any) {
      console.error('❌ LOAN - Failed to load borrowers:', error)
      setError(`Failed to load borrowers: ${error.message}`)
    } finally {
      setIsLoadingBorrowers(false)
    }
  }

  // Load loan products
  const loadLoanProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('active', true)
        .order('loan_type', { ascending: true })

      if (error) {
        setLoanProducts([])
        return
      }

      setLoanProducts(data || [])
      
    } catch (error: any) {
      console.error('❌ LOAN - Failed to load loan products:', error)
      setLoanProducts([])
    }
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
    
    // Reset custom EMI when key fields change
    if (['principal_amount', 'tenure_value', 'interest_rate', 'interest_rate_unit', 'interest_calculation_method', 'repayment_frequency', 'is_interest_only'].includes(name)) {
      setIsEmiEditable(false)
      setCustomEmiAmount('')
      calculateEMI({
        ...formData,
        [name]: value
      })
    }
  }

  // 🆕 NEW: Handle loan structure change (regular vs interest-only)
  const handleLoanStructureChange = (isInterestOnly: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_interest_only: isInterestOnly,
      // Reset some fields when switching loan structure
      loan_product_id: '', // Clear product selection as it might not be compatible
      repayment_frequency: isInterestOnly ? 'monthly' : 'daily' // Default to monthly for interest-only
    }))
    
    setIsEmiEditable(false)
    setCustomEmiAmount('')
    setError('')
    
    // Recalculate with new structure
    calculateEMI({
      ...formData,
      is_interest_only: isInterestOnly,
      repayment_frequency: isInterestOnly ? 'monthly' : 'daily'
    })
  }

  // Handle borrower selection
  const handleBorrowerSelect = (borrowerId: string) => {
    const borrower = borrowers.find(b => b.user_id === borrowerId)
    setSelectedBorrower(borrower || null)
    setFormData(prev => ({ ...prev, borrower_id: borrowerId }))
  }

  // Handle loan product selection
  const handleProductSelect = (productId: string) => {
    const product = loanProducts.find(p => p.id === productId)
    if (product) {
      setFormData(prev => ({
        ...prev,
        loan_product_id: productId,
        interest_rate: product.interest_rate.toString(),
        repayment_frequency: product.repayment_frequency,
        loan_type: product.loan_type,
        tenure_unit: product.loan_type === 'daily' ? 'days' : 
                    product.loan_type === 'weekly' ? 'weeks' : 'months'
      }))
      
      setIsEmiEditable(false)
      setCustomEmiAmount('')
      calculateEMI({
        ...formData,
        loan_product_id: productId,
        interest_rate: product.interest_rate.toString(),
        repayment_frequency: product.repayment_frequency,
        loan_type: product.loan_type
      })
    }
  }

  // 🆕 ENHANCED: EMI Calculation with Interest-Only Support
  const calculateEMI = async (data: typeof formData) => {
    const { 
      principal_amount, 
      tenure_value, 
      interest_rate, 
      interest_rate_unit, 
      repayment_frequency,
      interest_calculation_method,
      is_interest_only
    } = data
    
    if (!principal_amount || !tenure_value || !interest_rate) {
      setEmiCalculation(null)
      return
    }

    setIsCalculating(true)
    
    try {
      const principal = parseFloat(principal_amount)
      const tenure = parseInt(tenure_value)
      const rate = parseFloat(interest_rate)
      
      if (principal <= 0 || tenure <= 0 || rate <= 0) {
        setEmiCalculation(null)
        return
      }

      // Convert interest rate to period rate based on unit
      let periodRate = rate
      if (interest_rate_unit === 'daily') {
        if (repayment_frequency === 'monthly') {
          periodRate = rate * 30
        } else if (repayment_frequency === 'weekly') {
          periodRate = rate * 7
        }
      } else if (interest_rate_unit === 'monthly') {
        if (repayment_frequency === 'daily') {
          periodRate = rate / 30
        } else if (repayment_frequency === 'weekly') {
          periodRate = rate / 4
        }
      } else if (interest_rate_unit === 'annual') {
        if (repayment_frequency === 'daily') {
          periodRate = rate / 365
        } else if (repayment_frequency === 'weekly') {
          periodRate = rate / 52
        } else if (repayment_frequency === 'monthly') {
          periodRate = rate / 12
        }
      }

      const totalPeriods = tenure
      let emiAmount: number
      let totalAmount: number
      let totalInterest: number

      // 🆕 NEW: Interest-Only Calculation
      if (is_interest_only) {
        console.log('💰 LOAN - Using INTEREST-ONLY calculation')
        
        // Interest-only: Only interest payment each period, principal remains
        const interestPerPeriod = principal * (periodRate / 100)
        totalInterest = interestPerPeriod * totalPeriods
        totalAmount = principal + totalInterest
        emiAmount = interestPerPeriod
        
      } else if (interest_calculation_method === 'flat') {
        // FLAT INTEREST METHOD
        console.log('💰 LOAN - Using FLAT interest calculation')
        
        totalInterest = principal * (periodRate / 100) * totalPeriods
        totalAmount = principal + totalInterest
        emiAmount = totalAmount / totalPeriods
        
      } else {
        // REDUCING BALANCE METHOD
        console.log('💰 LOAN - Using REDUCING BALANCE calculation')
        
        const periodicRate = periodRate / 100
        
        if (repayment_frequency === 'bullet') {
          const dailyInterestRate = (rate / 100) / 365
          let totalInterestDays = tenure
          
          if (data.tenure_unit === 'weeks') {
            totalInterestDays = tenure * 7
          } else if (data.tenure_unit === 'months') {
            totalInterestDays = tenure * 30
          }
          
          totalInterest = principal * dailyInterestRate * totalInterestDays
          totalAmount = principal + totalInterest
          emiAmount = totalInterest / (totalPeriods - 1)
        } else {
          if (periodicRate === 0) {
            emiAmount = principal / totalPeriods
            totalInterest = 0
          } else {
            emiAmount = principal * periodicRate * Math.pow(1 + periodicRate, totalPeriods) / 
                       (Math.pow(1 + periodicRate, totalPeriods) - 1)
          }
          totalAmount = emiAmount * totalPeriods
          totalInterest = totalAmount - principal
        }
      }

      // Generate schedule based on loan type
      const schedule = is_interest_only 
        ? generateInterestOnlySchedule(data, emiAmount, totalPeriods, principal)
        : generateEMISchedule(data, emiAmount, totalPeriods, principal, totalInterest, interest_calculation_method, periodRate)

      const calculation: EMICalculation = {
        emi_amount: Math.round(emiAmount * 100) / 100,
        total_amount: Math.round(totalAmount * 100) / 100,
        total_interest: Math.round(totalInterest * 100) / 100,
        effective_interest_rate: parseFloat(interest_rate),
        schedule
      }

      console.log(`💰 LOAN - ${is_interest_only ? 'INTEREST-ONLY' : interest_calculation_method.toUpperCase()} calculation completed:`, calculation)
      setEmiCalculation(calculation)
      
    } catch (error) {
      console.error('❌ LOAN - EMI calculation error:', error)
      setEmiCalculation(null)
    } finally {
      setIsCalculating(false)
    }
  }

  // 🆕 NEW: Generate Interest-Only Schedule
  const generateInterestOnlySchedule = (
    data: typeof formData,
    interestAmount: number,
    totalPeriods: number,
    principal: number
  ) => {
    const schedule = []
    const startDate = new Date(data.disbursement_date || new Date())

    for (let i = 1; i <= totalPeriods; i++) {
      // Interest-only: No principal payment in regular schedule
      const interestForPeriod = interestAmount
      const principalForPeriod = 0 // Principal remains unchanged
      const balance = principal // Principal balance stays same

      // Calculate due date
      const dueDate = new Date(startDate)
      if (data.repayment_frequency === 'daily') {
        dueDate.setDate(startDate.getDate() + i)
      } else if (data.repayment_frequency === 'weekly') {
        dueDate.setDate(startDate.getDate() + (i * 7))
      } else if (data.repayment_frequency === 'monthly') {
        dueDate.setMonth(startDate.getMonth() + i)
      }

      schedule.push({
        emi_number: i,
        due_date: dueDate.toISOString().split('T')[0],
        principal: principalForPeriod,
        interest: Math.round(interestForPeriod * 100) / 100,
        emi_amount: Math.round(interestForPeriod * 100) / 100,
        balance: Math.round(balance * 100) / 100
      })
    }

    return schedule
  }

  // Reverse calculation - Calculate interest rate from custom EMI
  const calculateFromCustomEMI = async (customEmi: number) => {
    if (!emiCalculation || customEmi <= 0) return

    setIsRecalculating(true)

    try {
      const principal = parseFloat(formData.principal_amount)
      const tenure = parseInt(formData.tenure_value)
      const { interest_calculation_method, is_interest_only } = formData

      let effectiveRate: number

      if (is_interest_only) {
        // Interest-only: Rate = (EMI / Principal) * 100
        effectiveRate = (customEmi / principal) * 100
      } else if (interest_calculation_method === 'flat') {
        const totalAmount = customEmi * tenure
        const totalInterest = totalAmount - principal
        effectiveRate = (totalInterest / (principal * tenure)) * 100
      } else {
        effectiveRate = findInterestRateForEMI(principal, customEmi, tenure)
      }

      // Convert back to the selected unit
      let displayRate = effectiveRate
      if (formData.interest_rate_unit === 'daily') {
        if (formData.repayment_frequency === 'monthly') {
          displayRate = effectiveRate / 30
        } else if (formData.repayment_frequency === 'weekly') {
          displayRate = effectiveRate / 7
        }
      } else if (formData.interest_rate_unit === 'monthly') {
        if (formData.repayment_frequency === 'daily') {
          displayRate = effectiveRate * 30
        } else if (formData.repayment_frequency === 'weekly') {
          displayRate = effectiveRate * 4
        }
      } else if (formData.interest_rate_unit === 'annual') {
        if (formData.repayment_frequency === 'daily') {
          displayRate = effectiveRate * 365
        } else if (formData.repayment_frequency === 'weekly') {
          displayRate = effectiveRate * 52
        } else if (formData.repayment_frequency === 'monthly') {
          displayRate = effectiveRate * 12
        }
      }

      const totalAmount = customEmi * tenure
      const totalInterest = totalAmount - principal

      const schedule = formData.is_interest_only
        ? generateInterestOnlySchedule(formData, customEmi, tenure, principal)
        : generateEMISchedule(
            formData, 
            customEmi, 
            tenure, 
            principal, 
            totalInterest, 
            formData.interest_calculation_method, 
            effectiveRate
          )

      const updatedCalculation: EMICalculation = {
        emi_amount: customEmi,
        total_amount: totalAmount,
        total_interest: totalInterest,
        effective_interest_rate: Math.round(displayRate * 100) / 100,
        schedule
      }

      setEmiCalculation(updatedCalculation)
      
      setFormData(prev => ({
        ...prev,
        interest_rate: (Math.round(displayRate * 100) / 100).toString()
      }))

      console.log('💰 CUSTOM EMI - Reverse calculation completed:', {
        customEmi,
        effectiveRate: displayRate,
        totalAmount,
        totalInterest
      })

    } catch (error) {
      console.error('❌ CUSTOM EMI - Reverse calculation error:', error)
    } finally {
      setIsRecalculating(false)
    }
  }

  // Helper: Find interest rate for given EMI (reducing balance)
  const findInterestRateForEMI = (principal: number, targetEmi: number, tenure: number): number => {
    let rate = 0.1
    let iteration = 0
    const maxIterations = 1000
    const tolerance = 0.01

    while (iteration < maxIterations) {
      const periodicRate = rate / 100
      let calculatedEmi: number

      if (periodicRate === 0) {
        calculatedEmi = principal / tenure
      } else {
        calculatedEmi = principal * periodicRate * Math.pow(1 + periodicRate, tenure) / 
                      (Math.pow(1 + periodicRate, tenure) - 1)
      }

      if (Math.abs(calculatedEmi - targetEmi) < tolerance) {
        return rate
      }

      if (calculatedEmi > targetEmi) {
        rate -= 0.01
      } else {
        rate += 0.01
      }

      iteration++
    }

    return rate
  }

  // Helper: Generate EMI schedule (existing function - unchanged)
  const generateEMISchedule = (
    data: typeof formData,
    emiAmount: number,
    totalPeriods: number,
    principal: number,
    totalInterest: number,
    method: 'flat' | 'reducing',
    periodRate: number
  ) => {
    const schedule = []
    let balance = principal
    const startDate = new Date(data.disbursement_date || new Date())

    for (let i = 1; i <= totalPeriods; i++) {
      let interestForPeriod: number
      let principalForPeriod: number
      let emiForPeriod = emiAmount

      if (method === 'flat') {
        interestForPeriod = totalInterest / totalPeriods
        principalForPeriod = principal / totalPeriods
        balance -= principalForPeriod
        
      } else if (data.repayment_frequency === 'bullet') {
        if (i < totalPeriods) {
          interestForPeriod = totalInterest / (totalPeriods - 1)
          principalForPeriod = 0
          emiForPeriod = interestForPeriod
        } else {
          interestForPeriod = totalInterest / (totalPeriods - 1)
          principalForPeriod = balance
          emiForPeriod = interestForPeriod + principalForPeriod
        }
      } else {
        interestForPeriod = balance * (periodRate / 100)
        principalForPeriod = emiAmount - interestForPeriod
        balance -= principalForPeriod
      }

      const dueDate = new Date(startDate)
      if (data.repayment_frequency === 'daily') {
        dueDate.setDate(startDate.getDate() + i)
      } else if (data.repayment_frequency === 'weekly') {
        dueDate.setDate(startDate.getDate() + (i * 7))
      } else if (data.repayment_frequency === 'monthly') {
        dueDate.setMonth(startDate.getMonth() + i)
      }

      schedule.push({
        emi_number: i,
        due_date: dueDate.toISOString().split('T')[0],
        principal: Math.round(principalForPeriod * 100) / 100,
        interest: Math.round(interestForPeriod * 100) / 100,
        emi_amount: Math.round(emiForPeriod * 100) / 100,
        balance: Math.max(0, Math.round(balance * 100) / 100)
      })
    }

    return schedule
  }

  // Handle custom EMI input
  const handleCustomEmiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomEmiAmount(value)

    if (value && !isNaN(parseFloat(value))) {
      calculateFromCustomEMI(parseFloat(value))
    }
  }

  // Toggle EMI editing
  const toggleEmiEditing = () => {
    if (!isEmiEditable) {
      setCustomEmiAmount(emiCalculation?.emi_amount.toString() || '')
    } else {
      setCustomEmiAmount('')
      calculateEMI(formData)
    }
    setIsEmiEditable(!isEmiEditable)
  }

  // Validation functions
  const validateStep1 = () => {
    if (!formData.borrower_id) return 'Please select a borrower'
    if (!selectedBorrower) return 'Selected borrower not found'
    return null
  }

  const validateStep2 = () => {
    if (!formData.principal_amount) return 'Principal amount is required'
    if (!formData.tenure_value) return 'Loan tenure is required'
    if (!formData.interest_rate) return 'Interest rate is required'
    
    const amount = parseFloat(formData.principal_amount)
    const tenure = parseInt(formData.tenure_value)
    const rate = parseFloat(formData.interest_rate)
    
    if (amount <= 0) return 'Principal amount must be greater than 0'
    if (tenure <= 0) return 'Tenure must be greater than 0'
    if (rate <= 0) return 'Interest rate must be greater than 0'
    
    if (formData.loan_product_id) {
      const product = loanProducts.find(p => p.id === formData.loan_product_id)
      if (product) {
        if (amount < product.min_amount || amount > product.max_amount) {
          return `Amount must be between ₹${product.min_amount} and ₹${product.max_amount}`
        }
      }
    }
    
    return null
  }

  const validateStep3 = () => {
    if (!emiCalculation) return 'EMI calculation is required'
    return null
  }

  // Step navigation
  const handleNextStep = () => {
    let validationError = null
    
    if (currentStep === 1) validationError = validateStep1()
    if (currentStep === 2) validationError = validateStep2()
    if (currentStep === 3) validationError = validateStep3()
    
    if (validationError) {
      setError(validationError)
      return
    }
    
    setError('')
    setCurrentStep(prev => prev + 1)
  }

  const handlePrevStep = () => {
    setError('')
    setCurrentStep(prev => prev - 1)
  }

  // Submit loan application
  const handleSubmit = async () => {
    const validationError = validateStep3()
    if (validationError) {
      setError(validationError)
      return
    }
    if (!user || !emiCalculation) return
    setIsLoading(true)
    setError('')
    
    try {
      console.log('🚀 LOAN - Creating loan...')
      
      const timestamp = Date.now().toString().slice(-8)
      const random = Math.floor(Math.random() * 99).toString().padStart(2, '0')
      const loanNumber = `ML${timestamp}${random}`
      
      const maturityDate = emiCalculation.schedule[emiCalculation.schedule.length - 1]?.due_date
      
      // 🆕 ENHANCED: Create loan record with interest-only support
      const loanData = {
        loan_number: loanNumber,
        lender_id: user.id,
        borrower_id: formData.borrower_id,
        principal_amount: parseFloat(formData.principal_amount),
        interest_rate: emiCalculation.effective_interest_rate,
        total_amount: emiCalculation.total_amount,
        tenure_value: parseInt(formData.tenure_value),
        tenure_unit: formData.tenure_unit,
        loan_type: formData.loan_type,
        repayment_frequency: formData.repayment_frequency,
        status: 'approved',
        disbursement_date: formData.disbursement_date,
        maturity_date: maturityDate,
        created_by: user.id,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        notes: formData.notes,
        // 🆕 NEW: Interest-only specific fields
        is_interest_only: formData.is_interest_only,
        current_principal_balance: formData.is_interest_only 
          ? parseFloat(formData.principal_amount) 
          : null
      }

      const { data: loanResult, error: loanError } = await supabase
        .from('loans')
        .insert(loanData)
        .select()
        .single()

      if (loanError) throw loanError
      if (!loanResult) throw new Error('Failed to create loan - no data returned')

      // Update borrower's roles to include 'borrower'
      try {
        const { data: borrowerUser, error: borrowerError } = await supabase
          .from('users')
          .select('id, role, roles')
          .eq('id', formData.borrower_id)
          .single()

        if (borrowerUser && !borrowerError) {
          const currentRoles = borrowerUser.roles || [borrowerUser.role]
          
          if (!currentRoles.includes('borrower')) {
            const newRoles = [...currentRoles, 'borrower']
            
            await supabase
              .from('users')
              .update({ roles: newRoles })
              .eq('id', formData.borrower_id)

            console.log('✅ LOAN - Borrower roles updated:', newRoles)
          }
        }
      } catch (error) {
        console.warn('⚠️ LOAN - Role update warning:', error)
      }

      // Create EMI schedule
      const emiScheduleData = emiCalculation.schedule.map(emi => ({
        loan_id: loanResult.id,
        emi_number: emi.emi_number,
        due_date: emi.due_date,
        amount: emi.emi_amount,
        principal_amount: emi.principal,
        interest_amount: emi.interest,
        outstanding_balance: emi.balance,
        status: 'pending'
      }))

      const { error: emiError } = await supabase
        .from('emis')
        .insert(emiScheduleData)

      if (emiError) throw emiError

      setSuccess(`${formData.is_interest_only ? 'Interest-only loan' : 'Loan'} ${loanResult.loan_number} created successfully!`)
      
      // Reset form
      setFormData({
        borrower_id: borrowerId || '',
        loan_product_id: '',
        principal_amount: '',
        tenure_value: '',
        tenure_unit: 'days',
        interest_rate: '',
        interest_rate_unit: 'annual',
        interest_calculation_method: 'flat',
        repayment_frequency: 'daily',
        loan_type: 'daily',
        is_interest_only: false,
        purpose: '',
        disbursement_date: new Date().toISOString().split('T')[0] || '',
        notes: ''
      })
      setCurrentStep(1)
      setEmiCalculation(null)
      setSelectedBorrower(null)
      setIsEmiEditable(false)
      setCustomEmiAmount('')

      if (onSuccess) {
        setTimeout(() => onSuccess(loanResult.id), 2000)
      }

    } catch (error: any) {
      console.error('💥 LOAN - Creation failed:', error)
      setError(`Failed to create loan: ${error.message}`)
    } finally {
      setIsLoading(false)
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

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-green-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 mr-3" />
            <h2 className="text-xl font-bold">Create New Loan</h2>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-white hover:text-gray-200"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          )}
        </div>
        
        {/* Progress Steps */}
        <div className="mt-4 flex items-center">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step 
                  ? 'bg-white text-green-600' 
                  : 'bg-green-400 text-white'
              }`}>
                {step}
              </div>
              {step < 4 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  currentStep > step ? 'bg-white' : 'bg-green-400'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-2 text-sm opacity-90">
          {currentStep === 1 && 'Select Borrower'}
          {currentStep === 2 && 'Loan Details & Structure'}
          {currentStep === 3 && 'EMI Calculation & Adjustment'}
          {currentStep === 4 && 'Review & Submit'}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-6 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg mb-6 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            {success}
          </div>
        )}

        {/* Step 1: Select Borrower */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Select Borrower</h3>
            
            {isLoadingBorrowers ? (
              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                      <div className="w-16 h-6 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : borrowers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Borrowers Found</h4>
                <p className="text-gray-600 mb-4">You need to add borrowers before creating loans.</p>
                <button 
                  onClick={onCancel}
                  className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back to Add Borrowers
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {borrowers.map((borrower) => (
                  <div
                    key={borrower.user_id}
                    onClick={() => handleBorrowerSelect(borrower.user_id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.borrower_id === borrower.user_id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{borrower.full_name}</h4>
                        <p className="text-sm text-gray-600">{borrower.email}</p>
                        {borrower.monthly_income && (
                          <p className="text-sm text-gray-500">
                            Monthly Income: {formatCurrency(borrower.monthly_income)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {borrower.credit_score && (
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            borrower.credit_score >= 700 ? 'bg-green-100 text-green-800' :
                            borrower.credit_score >= 600 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Credit: {borrower.credit_score}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Loan Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Loan Details & Structure</h3>
            
            {/* Selected Borrower Info */}
            {selectedBorrower && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Selected Borrower</h4>
                <p className="text-sm text-gray-600">{selectedBorrower.full_name} - {selectedBorrower.email}</p>
              </div>
            )}

            {/* 🆕 NEW: Loan Structure Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Loan Structure <span className="text-red-500">*</span>
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Regular EMI Loan */}
                <div
                  onClick={() => handleLoanStructureChange(false)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    !formData.is_interest_only
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Regular EMI Loan</h4>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      !formData.is_interest_only
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {!formData.is_interest_only && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Fixed EMI with principal + interest. Standard loan structure.
                  </p>
                </div>

                {/* Interest-Only Loan */}
                <div
                  onClick={() => handleLoanStructureChange(true)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.is_interest_only
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Interest-Only Loan</h4>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      formData.is_interest_only
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.is_interest_only && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pay only interest regularly. Principal payable anytime.
                  </p>
                </div>
              </div>

              {/* Interest-Only Info */}
              {formData.is_interest_only && (
                <div className="mt-3 bg-green-50 border border-green-200 p-3 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                    <div className="text-sm text-green-800">
                      <strong>Interest-Only Loan Features:</strong>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>Borrower pays only interest on schedule</li>
                        <li>Principal can be paid anytime (partial or full)</li>
                        <li>Interest automatically recalculates on reduced principal</li>
                        <li>No sequential payment restrictions for principal</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Interest Calculation Method (only for regular loans) */}
            {!formData.is_interest_only && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Interest Calculation Method <span className="text-red-500">*</span>
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Flat Interest Option */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, interest_calculation_method: 'flat' }))}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.interest_calculation_method === 'flat'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Flat Interest</h4>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        formData.interest_calculation_method === 'flat'
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'
                      }`}>
                        {formData.interest_calculation_method === 'flat' && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Simple interest calculation. Easy to understand.
                    </p>
                  </div>

                  {/* Reducing Balance Option */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, interest_calculation_method: 'reducing' }))}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.interest_calculation_method === 'reducing'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Reducing Balance</h4>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        formData.interest_calculation_method === 'reducing'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {formData.interest_calculation_method === 'reducing' && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Interest on outstanding balance. Banking standard.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Loan Product Selection */}
            {loanProducts.length > 0 && !formData.is_interest_only && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Product <span className="text-gray-400">(Optional)</span>
                </label>
                <select
                  value={formData.loan_product_id}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                >
                  <option value="">Custom Loan</option>
                  {loanProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.interest_rate}% - {formatCurrency(product.min_amount)} to {formatCurrency(product.max_amount)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Principal Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Principal Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="principal_amount"
                    value={formData.principal_amount}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-500"
                    placeholder="Enter loan amount"
                    min="1000"
                    step="1000"
                    required
                  />
                </div>
              </div>

              {/* Interest Rate with Unit Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Rate <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="interest_rate"
                    value={formData.interest_rate}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-500"
                    placeholder="Enter rate"
                    min="0.1"
                    max="50"
                    step="0.1"
                    required
                  />
                  <select
                    name="interest_rate_unit"
                    value={formData.interest_rate_unit}
                    onChange={handleInputChange}
                    className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                  >
                    <option value="daily">% per day</option>
                    <option value="monthly">% per month</option>
                    <option value="annual">% per annum</option>
                  </select>
                </div>
              </div>

              {/* Tenure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Tenure <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="tenure_value"
                    value={formData.tenure_value}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-500"
                    placeholder="Tenure"
                    min="1"
                    required
                  />
                  <select
                    name="tenure_unit"
                    value={formData.tenure_unit}
                    onChange={handleInputChange}
                    className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>

              {/* Repayment Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repayment Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  name="repayment_frequency"
                  value={formData.repayment_frequency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  {!formData.is_interest_only && (
                    <option value="bullet">Bullet Payment (Interest only + Principal at end)</option>
                  )}
                </select>
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Purpose <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-500"
                placeholder="Describe the purpose of this loan"
              />
            </div>

            {/* Disbursement Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disbursement Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  name="disbursement_date"
                  value={formData.disbursement_date}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: EMI Calculation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">
              {formData.is_interest_only ? 'Interest Calculation & Manual Adjustment' : 'EMI Calculation & Manual Adjustment'}
            </h3>
            
            {isCalculating ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  {formData.is_interest_only ? 'Calculating interest schedule...' : 'Calculating EMI schedule...'}
                </p>
              </div>
            ) : emiCalculation ? (
              <div className="space-y-6">
                {/* Summary Cards with Loan Type Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Loan Type Indicator */}
                  <div className={`p-4 rounded-lg ${
                    formData.is_interest_only 
                      ? 'bg-green-50 border border-green-200' 
                      : formData.interest_calculation_method === 'flat' 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <h4 className={`font-medium ${
                      formData.is_interest_only ? 'text-green-900' :
                      formData.interest_calculation_method === 'flat' ? 'text-green-900' : 'text-blue-900'
                    }`}>
                      Loan Type
                    </h4>
                    <p className={`text-lg font-bold ${
                      formData.is_interest_only ? 'text-green-900' :
                      formData.interest_calculation_method === 'flat' ? 'text-green-900' : 'text-blue-900'
                    }`}>
                      {formData.is_interest_only ? 'Interest-Only' : 
                       formData.interest_calculation_method === 'flat' ? 'Flat' : 'Reducing'}
                    </p>
                    <p className={`text-sm ${
                      formData.is_interest_only ? 'text-green-700' :
                      formData.interest_calculation_method === 'flat' ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {formData.is_interest_only ? 'Interest only' :
                       formData.interest_calculation_method === 'flat' ? 'Traditional' : 'Banking standard'}
                    </p>
                  </div>

                  {/* Editable EMI/Interest Amount */}
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-purple-900">
                        {formData.is_interest_only ? 'Interest Amount' : 
                         formData.repayment_frequency === 'bullet' ? 'Interest Payment' : 'EMI Amount'}
                      </h4>
                      <button
                        onClick={toggleEmiEditing}
                        disabled={isRecalculating}
                        className={`p-1 rounded transition-colors ${
                          isEmiEditable ? 'bg-purple-200 text-purple-800' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                        }`}
                        title={isEmiEditable ? 'Cancel editing' : 'Edit amount'}
                      >
                        {isRecalculating ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Edit3 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    
                    {isEmiEditable ? (
                      <div>
                        <input
                          type="number"
                          value={customEmiAmount}
                          onChange={handleCustomEmiChange}
                          className="w-full text-lg font-bold bg-white border border-purple-300 rounded px-2 py-1 text-purple-900"
                          placeholder={`Enter custom ${formData.is_interest_only ? 'interest' : 'EMI'}`}
                          min="1"
                          step="1"
                        />
                        <p className="text-xs text-purple-700 mt-1">Interest rate will auto-adjust</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-purple-900">{formatCurrency(emiCalculation.emi_amount)}</p>
                        <p className="text-sm text-purple-700">
                          Click edit to customize →
                        </p>
                      </>
                    )}
                  </div>
                  
                  {/* Total Amount */}
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-900">Total Amount</h4>
                    <p className="text-2xl font-bold text-orange-900">{formatCurrency(emiCalculation.total_amount)}</p>
                    <p className="text-sm text-orange-700">Principal + Interest</p>
                  </div>
                  
                  {/* Total Interest */}
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <h4 className="font-medium text-red-900">Total Interest</h4>
                    <p className="text-2xl font-bold text-red-900">{formatCurrency(emiCalculation.total_interest)}</p>
                    <p className="text-sm text-red-700">
                      {((emiCalculation.total_interest / parseFloat(formData.principal_amount)) * 100).toFixed(1)}% of principal
                    </p>
                  </div>
                </div>

                {/* Interest Rate Adjustment Info */}
                {isEmiEditable && emiCalculation.effective_interest_rate !== parseFloat(formData.interest_rate) && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">📊 Interest Rate Adjustment</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-yellow-700">Original Rate: </span>
                        <span className="font-medium">{parseFloat(formData.interest_rate)}% {formData.interest_rate_unit}</span>
                      </div>
                      <div>
                        <span className="text-yellow-700">Effective Rate: </span>
                        <span className="font-medium">{emiCalculation.effective_interest_rate}% {formData.interest_rate_unit}</span>
                      </div>
                    </div>
                    <p className="text-xs text-yellow-700 mt-2">
                      Interest rate automatically adjusted to match your custom amount of {formatCurrency(emiCalculation.emi_amount)}
                    </p>
                  </div>
                )}

                {/* Interest-Only Special Info */}
                {formData.is_interest_only && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">💡 Interest-Only Loan Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-700">Principal Balance: </span>
                        <span className="font-medium">{formatCurrency(parseFloat(formData.principal_amount))}</span>
                        <p className="text-xs text-green-600 mt-1">Remains unchanged until manual payment</p>
                      </div>
                      <div>
                        <span className="text-green-700">Interest per {formData.repayment_frequency.slice(0, -2)}: </span>
                        <span className="font-medium">{formatCurrency(emiCalculation.emi_amount)}</span>
                        <p className="text-xs text-green-600 mt-1">Recalculates when principal is paid</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Schedule Table */}
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">
                      {formData.is_interest_only ? 'Interest Payment Schedule' : 'Repayment Schedule'}
                    </h4>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm text-gray-900">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">#</th>
                          <th className="px-4 py-2 text-left">Due Date</th>
                          <th className="px-4 py-2 text-right">Principal</th>
                          <th className="px-4 py-2 text-right">Interest</th>
                          <th className="px-4 py-2 text-right">
                            {formData.is_interest_only ? 'Payment' : 'EMI Amount'}
                          </th>
                          <th className="px-4 py-2 text-right">
                            {formData.is_interest_only ? 'Principal Balance' : 'Balance'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {emiCalculation.schedule.map((emi) => (
                          <tr key={emi.emi_number} className="border-b border-gray-200">
                            <td className="px-4 py-2">{emi.emi_number}</td>
                            <td className="px-4 py-2">{new Date(emi.due_date || new Date()).toLocaleDateString('en-IN')}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(emi.principal)}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(emi.interest)}</td>
                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(emi.emi_amount)}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(emi.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">Complete loan details to calculate payments</p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Review Loan Details</h3>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4 text-gray-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Borrower</label>
                  <p className="font-medium text-gray-900">{selectedBorrower?.full_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Principal Amount</label>
                  <p className="font-medium">{formatCurrency(parseFloat(formData.principal_amount || '0'))}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Loan Structure</label>
                  <p className="font-medium">
                    {formData.is_interest_only ? 'Interest-Only Loan' : 
                     `Regular EMI (${formData.interest_calculation_method === 'flat' ? 'Flat Interest' : 'Reducing Balance'})`}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Interest Rate</label>
                  <p className="font-medium">
                    {emiCalculation?.effective_interest_rate || formData.interest_rate}% {formData.interest_rate_unit}
                    {emiCalculation && emiCalculation.effective_interest_rate !== parseFloat(formData.interest_rate) && (
                      <span className="text-xs text-yellow-600 ml-1">(Adjusted)</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Tenure</label>
                  <p className="font-medium">{formData.tenure_value} {formData.tenure_unit}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Repayment Frequency</label>
                  <p className="font-medium capitalize">{formData.repayment_frequency}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Disbursement Date</label>
                  <p className="font-medium">{new Date(formData.disbursement_date || new Date()).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {emiCalculation && (
                <div className="border-t pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">
                        {formData.is_interest_only ? 'Interest Amount' : 'EMI Amount'}
                      </label>
                      <p className="font-bold text-lg">{formatCurrency(emiCalculation.emi_amount)}</p>
                      {isEmiEditable && (
                        <span className="text-xs text-blue-600">Custom amount</span>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Total Amount</label>
                      <p className="font-bold text-lg">{formatCurrency(emiCalculation.total_amount)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Total Interest</label>
                      <p className="font-bold text-lg">{formatCurrency(emiCalculation.total_interest)}</p>
                    </div>
                  </div>
                  
                  {formData.is_interest_only && (
                    <div className="mt-4 p-3 bg-green-100 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Interest-Only Loan:</strong> Principal balance of {formatCurrency(parseFloat(formData.principal_amount))} 
                        can be paid anytime. Interest will automatically recalculate on reduced principal.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-500"
                placeholder="Any additional notes for this loan"
              />
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isLoading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
            )}
          </div>

          <div>
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={isLoading || (currentStep === 2 && isCalculating)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {currentStep === 2 && isCalculating ? (
                  <span className="flex items-center">
                    <Clock className="animate-spin h-4 w-4 mr-2" />
                    Calculating...
                  </span>
                ) : (
                  'Next'
                )}
              </button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                loading={isLoading}
                className="px-8 py-2 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Creating Loan...' : 'Create Loan'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}