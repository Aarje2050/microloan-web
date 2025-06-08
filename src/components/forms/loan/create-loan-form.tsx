// File: src/components/forms/loan/create-loan-form.tsx (FIXED VERSION)
'use client'

import React from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  CreditCard, Calculator, User, DollarSign, Calendar, 
  FileText, AlertTriangle, CheckCircle, ArrowLeft, Clock
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
  schedule: Array<{
    emi_number: number
    due_date: string
    principal: number
    interest: number
    emi_amount: number
    balance: number
  }>
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
  
  // Form data
  const [formData, setFormData] = React.useState({
    borrower_id: borrowerId || '',
    loan_product_id: '',
    principal_amount: '',
    tenure_value: '',
    tenure_unit: 'days',
    interest_rate: '',
    interest_rate_unit: 'annual', // NEW: per day, per month, annual
    repayment_frequency: 'daily',
    loan_type: 'daily',
    purpose: '',
    disbursement_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  console.log('💰 CREATE LOAN - Form loaded for lender:', user?.email)

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

  // FIXED: Load lender's borrowers with separate queries
  const loadBorrowers = async () => {
    try {
      console.log('📊 LOAN - Loading borrowers for lender:', user?.id)
      setIsLoadingBorrowers(true)
      
      // Step 1: Get borrowers for this lender (simple query)
      const { data: borrowersData, error: borrowersError } = await supabase
        .from('borrowers')
        .select('id, user_id, monthly_income, credit_score')
        .eq('lender_id', user?.id)
        .order('created_at', { ascending: false })

      if (borrowersError) {
        console.error('❌ LOAN - Borrowers query error:', borrowersError)
        throw borrowersError
      }

      console.log('📋 LOAN - Borrowers found:', borrowersData?.length || 0)

      if (!borrowersData || borrowersData.length === 0) {
        setBorrowers([])
        return
      }

      // Step 2: Get user details separately (avoid join issues)
      const userIds = borrowersData.map(b => b.user_id)
      console.log('🔍 LOAN - Fetching user details for IDs:', userIds)

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds)

      if (usersError) {
        console.error('❌ LOAN - Users query error:', usersError)
        throw usersError
      }

      console.log('📋 LOAN - Users found:', usersData?.length || 0)

      // Step 3: Combine the data
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

      console.log('✅ LOAN - Borrowers processed:', transformedBorrowers.length)
      setBorrowers(transformedBorrowers)
      
    } catch (error: any) {
      console.error('❌ LOAN - Failed to load borrowers:', error)
      console.error('❌ LOAN - Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      setError(`Failed to load borrowers: ${error.message}`)
    } finally {
      setIsLoadingBorrowers(false)
    }
  }

  // Load loan products
  const loadLoanProducts = async () => {
    try {
      console.log('📊 LOAN - Loading loan products...')
      
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('active', true)
        .order('loan_type', { ascending: true })

      if (error) {
        console.error('❌ LOAN - Loan products error:', error)
        // Don't fail the whole form if loan products don't load
        setLoanProducts([])
        return
      }

      console.log('✅ LOAN - Loan products loaded:', data?.length || 0)
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
    
    // Auto-calculate EMI when key fields change
    if (['principal_amount', 'tenure_value', 'interest_rate', 'interest_rate_unit', 'repayment_frequency'].includes(name)) {
      calculateEMI({
        ...formData,
        [name]: value
      })
    }
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
      
      // Recalculate with new product
      calculateEMI({
        ...formData,
        loan_product_id: productId,
        interest_rate: product.interest_rate.toString(),
        repayment_frequency: product.repayment_frequency,
        loan_type: product.loan_type
      })
    }
  }

  // EMI Calculation Engine - ENHANCED for flexible interest rate units
  const calculateEMI = async (data: typeof formData) => {
    const { principal_amount, tenure_value, interest_rate, interest_rate_unit, repayment_frequency } = data
    
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

      // Convert interest rate to annual rate first
      let annualRate = rate
      if (interest_rate_unit === 'daily') {
        annualRate = rate * 365 // Convert daily % to annual %
      } else if (interest_rate_unit === 'monthly') {
        annualRate = rate * 12 // Convert monthly % to annual %
      }
      // If annual, use as is

      // Calculate based on repayment frequency
      let periodsPerYear = 365 // Daily
      if (repayment_frequency === 'weekly') periodsPerYear = 52
      if (repayment_frequency === 'monthly') periodsPerYear = 12
      
      const periodicRate = annualRate / 100 / periodsPerYear
      const totalPeriods = tenure
      
      let emiAmount: number
      let totalAmount: number
      let totalInterest: number

      if (repayment_frequency === 'bullet') {
        // Bullet payment - pay only interest during term, principal at end
        const dailyInterestRate = annualRate / 100 / 365
        let totalInterestDays = tenure
        
        // Convert tenure to days for interest calculation
        if (data.tenure_unit === 'weeks') {
          totalInterestDays = tenure * 7
        } else if (data.tenure_unit === 'months') {
          totalInterestDays = tenure * 30 // Approximate
        }
        
        totalInterest = principal * dailyInterestRate * totalInterestDays
        totalAmount = principal + totalInterest
        emiAmount = totalInterest / (totalPeriods - 1) // Interest spread over periods except last
      } else {
        // Regular EMI calculation
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

      // Generate EMI schedule
      const schedule = []
      let balance = principal
      const startDate = new Date(data.disbursement_date || new Date())

      for (let i = 1; i <= totalPeriods; i++) {
        let interestForPeriod: number
        let principalForPeriod: number
        let emiForPeriod: number

        if (repayment_frequency === 'bullet') {
          if (i < totalPeriods) {
            // Interest only payments
            interestForPeriod = totalInterest / (totalPeriods - 1)
            principalForPeriod = 0
            emiForPeriod = interestForPeriod
          } else {
            // Final payment: remaining interest + full principal
            interestForPeriod = totalInterest / (totalPeriods - 1)
            principalForPeriod = balance
            emiForPeriod = interestForPeriod + principalForPeriod
          }
        } else {
          // Regular EMI calculation
          interestForPeriod = balance * periodicRate
          principalForPeriod = emiAmount - interestForPeriod
          emiForPeriod = emiAmount
        }
        
        balance -= principalForPeriod

        // Calculate due date
        const dueDate = new Date(startDate)
        if (repayment_frequency === 'daily') {
          dueDate.setDate(startDate.getDate() + i)
        } else if (repayment_frequency === 'weekly') {
          dueDate.setDate(startDate.getDate() + (i * 7))
        } else if (repayment_frequency === 'monthly') {
          dueDate.setMonth(startDate.getMonth() + i)
        } else if (repayment_frequency === 'bullet') {
          if (i < totalPeriods) {
            // Monthly interest payments for bullet
            dueDate.setMonth(startDate.getMonth() + i)
          } else {
            // Final payment
            dueDate.setMonth(startDate.getMonth() + i)
          }
        }

        schedule.push({
          emi_number: i,
          due_date: dueDate.toISOString().split('T')[0] || '',
          principal: Math.round(principalForPeriod * 100) / 100,
          interest: Math.round(interestForPeriod * 100) / 100,
          emi_amount: Math.round(emiForPeriod * 100) / 100,
          balance: Math.max(0, Math.round(balance * 100) / 100)
        })
      }

      const calculation: EMICalculation = {
        emi_amount: repayment_frequency === 'bullet' ? (totalInterest / (totalPeriods - 1)) : Math.round(emiAmount * 100) / 100,
        total_amount: Math.round(totalAmount * 100) / 100,
        total_interest: Math.round(totalInterest * 100) / 100,
        schedule
      }

      console.log('💰 LOAN - EMI Calculated:', calculation)
      setEmiCalculation(calculation)
      
    } catch (error) {
      console.error('❌ LOAN - EMI calculation error:', error)
      setEmiCalculation(null)
    } finally {
      setIsCalculating(false)
    }
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
    
    // Validate against loan product limits if selected
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

  // FIXED: Submit loan application with better error handling
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

      // Calculate maturity date
      const maturityDate = emiCalculation.schedule[emiCalculation.schedule.length - 1]?.due_date

      // Step 1: Create loan record
      const loanData = {
        borrower_id: formData.borrower_id,
        principal_amount: parseFloat(formData.principal_amount),
        interest_rate: parseFloat(formData.interest_rate),
        total_amount: emiCalculation.total_amount,
        tenure_value: parseInt(formData.tenure_value),
        tenure_unit: formData.tenure_unit,
        loan_type: formData.loan_type,
        repayment_frequency: formData.repayment_frequency,
        status: 'approved', // Auto-approve for now
        disbursement_date: formData.disbursement_date,
        maturity_date: maturityDate,
        created_by: user.id,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        notes: formData.notes
      }

      console.log('📝 LOAN - Creating loan with data:', loanData)

      const { data: loanResult, error: loanError } = await supabase
        .from('loans')
        .insert(loanData)
        .select()
        .single()

      if (loanError) {
        console.error('❌ LOAN - Loan creation error:', loanError)
        throw loanError
      }
      
      if (!loanResult) {
        throw new Error('Failed to create loan - no data returned')
      }

      console.log('✅ LOAN - Loan created:', loanResult.id)

      // Step 2: Create EMI schedule
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

      console.log('📝 LOAN - Creating EMI schedule:', emiScheduleData.length, 'entries')

      const { error: emiError } = await supabase
        .from('emis')
        .insert(emiScheduleData)

      if (emiError) {
        console.error('❌ LOAN - EMI creation error:', emiError)
        throw emiError
      }

      console.log('✅ LOAN - EMI schedule created')

      // Success!
      setSuccess(`Loan ${loanResult.loan_number} created successfully!`)
      
      // Reset form
      setFormData({
        borrower_id: borrowerId || '',
        loan_product_id: '',
        principal_amount: '',
        tenure_value: '',
        tenure_unit: 'days',
        interest_rate: '',
        interest_rate_unit: 'annual',
        repayment_frequency: 'daily',
        loan_type: 'daily',
        purpose: '',
        disbursement_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      setCurrentStep(1)
      setEmiCalculation(null)
      setSelectedBorrower(null)

      // Call success callback
      if (onSuccess) {
        setTimeout(() => onSuccess(loanResult.id), 2000)
      }

    } catch (error: any) {
      console.error('💥 LOAN - Creation failed:', error)
      console.error('💥 LOAN - Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
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
          {currentStep === 2 && 'Loan Details'}
          {currentStep === 3 && 'EMI Calculation'}
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
              // Loading skeleton
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
            <h3 className="text-lg font-medium text-gray-900">Loan Details</h3>
            
            {/* Selected Borrower Info */}
            {selectedBorrower && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Selected Borrower</h4>
                <p className="text-sm text-gray-600">{selectedBorrower.full_name} - {selectedBorrower.email}</p>
              </div>
            )}

            {/* Loan Product Selection */}
            {loanProducts.length > 0 && (
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
                {formData.repayment_frequency === 'bullet' && (
                  <p className="text-xs text-amber-600 mt-1 bg-amber-50 p-2 rounded">
                    <strong>Bullet Payment:</strong> Pay only interest during the loan term, then pay the full principal amount at the end.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Principal Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Principal Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                <p className="text-xs text-gray-500 mt-1">
                  {formData.interest_rate_unit === 'daily' && 'Daily interest rate (e.g., 0.1% per day)'}
                  {formData.interest_rate_unit === 'monthly' && 'Monthly interest rate (e.g., 2% per month)'}
                  {formData.interest_rate_unit === 'annual' && 'Annual interest rate (e.g., 24% per year)'}
                </p>
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
                  <option value="bullet">Bullet Payment (Interest only + Principal at end)</option>
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
            <h3 className="text-lg font-medium text-gray-900">EMI Calculation</h3>
            
            {isCalculating ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Calculating EMI schedule...</p>
              </div>
            ) : emiCalculation ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">
                      {formData.repayment_frequency === 'bullet' ? 'Interest Payment' : 'EMI Amount'}
                    </h4>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(emiCalculation.emi_amount)}</p>
                    <p className="text-sm text-blue-700">
                      {formData.repayment_frequency === 'bullet' 
                        ? 'Interest per payment + Principal at end'
                        : `Per ${formData.repayment_frequency.slice(0, -2)}`
                      }
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">Total Amount</h4>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(emiCalculation.total_amount)}</p>
                    <p className="text-sm text-green-700">Principal + Interest</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900">Total Interest</h4>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(emiCalculation.total_interest)}</p>
                    <p className="text-sm text-purple-700">Interest component</p>
                  </div>
                </div>

                {/* EMI Schedule Table */}
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Repayment Schedule</h4>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm text-gray-900">
                  <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">EMI</th>
                          <th className="px-4 py-2 text-left">Due Date</th>
                          <th className="px-4 py-2 text-right">Principal</th>
                          <th className="px-4 py-2 text-right">Interest</th>
                          <th className="px-4 py-2 text-right">EMI Amount</th>
                          <th className="px-4 py-2 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {emiCalculation.schedule.map((emi) => (
                          <tr key={emi.emi_number} className="border-b border-gray-200">
                            <td className="px-4 py-2">{emi.emi_number}</td>
                            <td className="px-4 py-2">{new Date(emi.due_date).toLocaleDateString('en-IN')}</td>
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
                <p className="text-gray-600">Complete loan details to calculate EMI</p>
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
                  <label className="text-sm text-gray-600">Interest Rate</label>
                  <p className="font-medium">{formData.interest_rate}% {formData.interest_rate_unit}</p>
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
                      <label className="text-sm text-gray-600">EMI Amount</label>
                      <p className="font-bold text-lg">{formatCurrency(emiCalculation.emi_amount)}</p>
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