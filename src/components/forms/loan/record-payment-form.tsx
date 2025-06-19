// File: src/components/forms/loan/record-payment-form.tsx - PRODUCTION READY VERSION
'use client'

import React from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  DollarSign, CreditCard, Calendar, AlertTriangle, 
  CheckCircle, ArrowLeft, Clock, Receipt, IndianRupee,
  Percent, TrendingDown, Calculator, Info, User, Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RecordPaymentFormProps {
  loanId?: string
  emiId?: string
  onSuccess?: (paymentId: string) => void
  onCancel?: () => void
}

interface LoanDetails {
  id: string
  loan_number: string
  borrower_name: string
  borrower_email: string
  loan_disbursed: number // 🔧 FIXED: Clear terminology
  disbursement_date: string
  maturity_date: string
  status: string
  repayment_frequency: string
  interest_rate: number
  tenure_value: number
  tenure_unit: string
  outstanding_balance: number
  is_interest_only: boolean
  current_principal_balance: number
  total_emis: number // 🆕 NEW
  paid_emis: number // 🆕 NEW
  overdue_emis: number // 🆕 NEW
}

interface EMIDetails {
  id: string
  emi_number: number
  due_date: string
  amount: number
  principal_amount: number | null
  interest_amount: number | null
  outstanding_balance: number | null
  status: string
  paid_amount: number | null
  late_fee: number | null
  days_overdue: number
  is_current: boolean // 🆕 NEW: Is this the current EMI to pay
}

interface PaymentCalculation {
  payment_amount: number
  principal_paid: number
  interest_paid: number
  late_fee_paid: number
  excess_amount: number
  new_emi_status: string
  remaining_balance: number
  is_overpayment: boolean
  is_underpayment: boolean
  principal_reduction: number
  new_principal_balance: number
  future_interest_recalculation: boolean
  new_interest_amount: number
  monthly_savings: number // 🆕 NEW
  pending_interest_cleared: number // 🔧 FIXED: Only DUE interest
  is_smart_allocation: boolean // 🔧 FIXED: Smart allocation flag
  total_pending_interest: number // 🔧 FIXED: Only DUE interest
}

export default function RecordPaymentForm({ loanId, emiId, onSuccess, onCancel }: RecordPaymentFormProps) {
  const { user } = useAuth()
  
  // State management
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  const [isLoadingData, setIsLoadingData] = React.useState(true)
  
  // Data states
  const [loanDetails, setLoanDetails] = React.useState<LoanDetails | null>(null)
  const [availableEMIs, setAvailableEMIs] = React.useState<EMIDetails[]>([])
  const [selectedEMI, setSelectedEMI] = React.useState<EMIDetails | null>(null)
  const [paymentCalculation, setPaymentCalculation] = React.useState<PaymentCalculation | null>(null)
  const [isCalculating, setIsCalculating] = React.useState(false)
  
  // Search and filter states
  const [emiSearch, setEmiSearch] = React.useState('')
  const [emiFilter, setEmiFilter] = React.useState<'all' | 'pending' | 'overdue' | 'partial'>('pending')
  
  // Form data
  const [formData, setFormData] = React.useState({
    loan_id: loanId || '',
    emi_id: emiId || '',
    payment_amount: '',
    payment_method: 'cash',
    payment_reference: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'emi_payment', // 'emi_payment', 'principal_payment', 'interest_payment'
    notes: ''
  })

  console.log('💳 PAYMENT - Production-ready form loaded for lender:', user?.email)

  // Load initial data
  React.useEffect(() => {
    if (user) {
      if (loanId) {
        loadLoanDetails(loanId)
      } else {
        loadLenderLoans()
      }
    }
  }, [user, loanId])

  // Auto-select EMI if provided
  React.useEffect(() => {
    if (emiId && availableEMIs.length > 0) {
      const emi = availableEMIs.find(e => e.id === emiId)
      if (emi) {
        setSelectedEMI(emi)
        setFormData(prev => ({ 
          ...prev, 
          emi_id: emi.id,
          payment_amount: emi.amount.toString(),
          payment_type: 'emi_payment'
        }))
      }
    }
  }, [emiId, availableEMIs])

  // 🔧 ENHANCED: Load loan details with accurate calculations
  const loadLoanDetails = async (loanId: string) => {
    try {
      console.log('📊 PAYMENT - Loading enhanced loan details:', loanId)
      setIsLoadingData(true)
      
      // 🔧 BACKWARDS COMPATIBLE: Try enhanced query first, fallback to basic query
      const { data: basicLoanData, error: basicLoanError } = await supabase
        .from('loan_details')
        .select('*')
        .eq('id', loanId)
        .eq('lender_id', user?.id)
        .single()

      if (basicLoanError) {
        console.error('❌ PAYMENT - Basic loan query error:', basicLoanError)
        throw basicLoanError
      }

      if (!basicLoanData) {
        throw new Error('Loan not found or access denied')
      }

      // Get enhanced fields from loans table (if columns exist)
      let enhancedLoanData: any = null
      try {
        const { data: extraData, error: extraError } = await supabase
          .from('loans')
          .select('is_interest_only, current_principal_balance, interest_rate, disbursement_date, maturity_date, tenure_value, tenure_unit')
          .eq('id', loanId)
          .single()

        if (!extraError && extraData) {
          enhancedLoanData = extraData
          console.log('✅ PAYMENT - Enhanced fields loaded:', enhancedLoanData)
        }
      } catch (enhanceError) {
        console.log('⚠️ PAYMENT - Enhanced fields not available, using defaults')
      }

      // Get EMI statistics
      const { data: allEMIs, error: emiStatsError } = await supabase
        .from('emis')
        .select('status, paid_amount, amount, due_date')
        .eq('loan_id', loanId)

      let totalEMIs = 0
      let paidEMIs = 0
      let overdueEMIs = 0
      let totalPaid = 0
      const today = new Date()

      if (!emiStatsError && allEMIs) {
        totalEMIs = allEMIs.length
        
        allEMIs.forEach(emi => {
          const paidAmount = emi.paid_amount || 0
          const emiAmount = emi.amount
          const dueDate = new Date(emi.due_date)
          
          // Calculate accurate status
          if (paidAmount >= emiAmount) {
            paidEMIs++
            totalPaid += paidAmount
          } else {
            totalPaid += paidAmount
            // Check if overdue
            if (dueDate < today && paidAmount < emiAmount) {
              overdueEMIs++
            }
          }
        })
      }

      // 🔧 ENHANCED: Calculate accurate outstanding balance
      let currentOutstanding = basicLoanData.principal_amount
      let currentPrincipalBalance = basicLoanData.principal_amount

      if (enhancedLoanData?.is_interest_only) {
        console.log('💰 PAYMENT - Processing interest-only loan')
        
        // For interest-only loans, get actual current principal balance
        const { data: principalPayments, error: principalError } = await supabase
          .from('payments')
          .select('amount')
          .eq('loan_id', loanId)
          .eq('payment_type', 'principal_payment')

        if (!principalError && principalPayments) {
          const totalPrincipalPaid = principalPayments.reduce((sum, p) => sum + p.amount, 0)
          currentPrincipalBalance = basicLoanData.principal_amount - totalPrincipalPaid
        }

        // For interest-only, outstanding = remaining principal + any unpaid interest
        const { data: unpaidInterest, error: interestError } = await supabase
          .from('emis')
          .select('amount, paid_amount, status')
          .eq('loan_id', loanId)
          .in('status', ['pending', 'partial'])

        let totalUnpaidInterest = 0
        if (!interestError && unpaidInterest) {
          totalUnpaidInterest = unpaidInterest.reduce((sum, emi) => {
            const pendingAmount = emi.amount - (emi.paid_amount || 0)
            return sum + Math.max(0, pendingAmount)
          }, 0)
        }

        currentOutstanding = currentPrincipalBalance + totalUnpaidInterest
      } else {
        // Regular loan: outstanding = total amount - total paid
        currentOutstanding = Math.max(0, basicLoanData.total_amount - totalPaid)
        currentPrincipalBalance = enhancedLoanData?.current_principal_balance || basicLoanData.principal_amount
      }

      const loanDetails: LoanDetails = {
        id: basicLoanData.id,
        loan_number: basicLoanData.loan_number,
        borrower_name: basicLoanData.borrower_name,
        borrower_email: basicLoanData.borrower_email,
        loan_disbursed: basicLoanData.principal_amount, // 🔧 FIXED: Clear terminology
        disbursement_date: enhancedLoanData?.disbursement_date || basicLoanData.disbursement_date,
        maturity_date: enhancedLoanData?.maturity_date || basicLoanData.maturity_date,
        status: basicLoanData.status,
        repayment_frequency: basicLoanData.repayment_frequency,
        interest_rate: enhancedLoanData?.interest_rate || basicLoanData.interest_rate || 0,
        tenure_value: enhancedLoanData?.tenure_value || 12,
        tenure_unit: enhancedLoanData?.tenure_unit || 'months',
        outstanding_balance: currentOutstanding,
        is_interest_only: enhancedLoanData?.is_interest_only || false,
        current_principal_balance: currentPrincipalBalance,
        total_emis: totalEMIs, // 🆕 NEW
        paid_emis: paidEMIs, // 🆕 NEW
        overdue_emis: overdueEMIs // 🆕 NEW
      }

      console.log('✅ PAYMENT - Enhanced loan details loaded:', loanDetails)
      setLoanDetails(loanDetails)
      setFormData(prev => ({ 
        ...prev, 
        loan_id: loanId,
        payment_type: loanDetails.is_interest_only ? 'interest_payment' : 'emi_payment'
      }))

      await loadEMIs(loanId)
      
    } catch (error: any) {
      console.error('❌ PAYMENT - Failed to load loan:', error)
      setError(`Failed to load loan: ${error.message}`)
    } finally {
      setIsLoadingData(false)
    }
  }

  // 🔧 ENHANCED: Load EMIs with better status calculation
  const loadEMIs = async (loanId: string) => {
    try {
      console.log('📊 PAYMENT - Loading EMIs for loan:', loanId)
      
      const { data: emisData, error: emisError } = await supabase
        .from('emis')
        .select('*')
        .eq('loan_id', loanId)
        .order('emi_number', { ascending: true })

      if (emisError) {
        console.error('❌ PAYMENT - EMIs query error:', emisError)
        throw emisError
      }

      const today = new Date()
      const allEMIs: EMIDetails[] = (emisData || []).map((emi, index, array) => {
        const dueDate = new Date(emi.due_date)
        const paidAmount = emi.paid_amount || 0
        const emiAmount = emi.amount
        
        // 🔧 FIXED: Accurate status calculation
        let actualStatus = emi.status
        if (paidAmount >= emiAmount) {
          actualStatus = 'paid'
        } else if (paidAmount > 0) {
          actualStatus = 'partial'
        } else {
          actualStatus = 'pending'
        }
        
        const daysOverdue = actualStatus !== 'paid' && dueDate < today 
          ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24))
          : 0

        // 🆕 NEW: Determine if this is the current EMI to pay
        const previousEMIsPaid = array.slice(0, index).every(prevEmi => {
          const prevPaidAmount = prevEmi.paid_amount || 0
          return prevPaidAmount >= prevEmi.amount
        })
        const isCurrent = actualStatus !== 'paid' && previousEMIsPaid

        return {
          ...emi,
          status: actualStatus,
          days_overdue: daysOverdue,
          is_current: isCurrent
        }
      })

      console.log('✅ PAYMENT - EMIs processed:', {
        total: allEMIs.length,
        paid: allEMIs.filter(e => e.status === 'paid').length,
        partial: allEMIs.filter(e => e.status === 'partial').length,
        pending: allEMIs.filter(e => e.status === 'pending').length,
        overdue: allEMIs.filter(e => e.days_overdue > 0).length
      })
      
      setAvailableEMIs(allEMIs)
      
    } catch (error: any) {
      console.error('❌ PAYMENT - Failed to load EMIs:', error)
      setError(`Failed to load EMIs: ${error.message}`)
    }
  }

  // Load all loans for lender (basic version)
  const loadLenderLoans = async () => {
    try {
      console.log('📊 PAYMENT - Loading lender loans')
      setIsLoadingData(true)
      
      const { data: loansData, error: loansError } = await supabase
        .from('loan_details')
        .select('id, loan_number, borrower_name, status, principal_amount')
        .eq('lender_id', user?.id)
        .in('status', ['active', 'disbursed', 'approved'])
        .order('created_at', { ascending: false })

      if (loansError) {
        console.error('❌ PAYMENT - Loans query error:', loansError)
        throw loansError
      }

      console.log('✅ PAYMENT - Loans loaded:', loansData?.length || 0)
      
    } catch (error: any) {
      console.error('❌ PAYMENT - Failed to load loans:', error)
      setError(`Failed to load loans: ${error.message}`)
    } finally {
      setIsLoadingData(false)
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
    
    // Auto-calculate payment allocation when amount changes
    if (name === 'payment_amount') {
      if (formData.payment_type === 'principal_payment') {
        calculatePrincipalPayment(parseFloat(value) || 0)
      } else if (selectedEMI) {
        calculatePayment(selectedEMI, parseFloat(value) || 0)
      }
    }
  }

  // Handle payment type change
  const handlePaymentTypeChange = (paymentType: string) => {
    setFormData(prev => ({
      ...prev,
      payment_type: paymentType,
      payment_amount: '',
      emi_id: paymentType === 'principal_payment' ? '' : prev.emi_id
    }))
    
    setSelectedEMI(paymentType === 'principal_payment' ? null : selectedEMI)
    setPaymentCalculation(null)
    setError('')
  }

  // Handle EMI selection
  const handleEMISelect = (emi: EMIDetails) => {
    console.log('💰 PAYMENT - EMI selected:', emi.emi_number)
    setSelectedEMI(emi)
    setFormData(prev => ({ 
      ...prev, 
      emi_id: emi.id,
      payment_amount: (emi.amount - (emi.paid_amount || 0)).toString()
    }))
    calculatePayment(emi, emi.amount - (emi.paid_amount || 0))
  }

  // 🔧 FIXED: Calculate principal payment with accurate elapsed interest (not future interest)
  const calculatePrincipalPayment = async (paymentAmount: number) => {
    if (!loanDetails || !loanDetails.is_interest_only || paymentAmount <= 0) {
      setPaymentCalculation(null)
      return
    }

    setIsCalculating(true)
    
    try {
      console.log('🧮 PAYMENT - Calculating smart principal payment with elapsed interest:', paymentAmount)
      
      const currentPrincipal = loanDetails.current_principal_balance
      
      // 🔧 FIXED: Calculate ONLY elapsed interest with proper date handling
      const disbursementDate = new Date(loanDetails.disbursement_date + 'T00:00:00') // Avoid timezone issues
      const paymentDate = new Date(formData.payment_date + 'T00:00:00')
      
      // 🔧 FIXED: More accurate elapsed days calculation
      const elapsedDays = Math.floor((paymentDate.getTime() - disbursementDate.getTime()) / (1000 * 3600 * 24))
      
      console.log('📅 ELAPSED TIME CALCULATION:', {
        disbursementDate: disbursementDate.toISOString().split('T')[0],
        paymentDate: paymentDate.toISOString().split('T')[0],
        elapsedDays,
        monthsElapsed: (elapsedDays / 30.44).toFixed(2) // Average days per month
      })

      // 🔧 FIXED: Calculate due interest based on elapsed time only
      const annualRate = loanDetails.interest_rate
      const dailyRateDecimal = annualRate / 365 / 100 // Convert to daily decimal rate
      let dueInterest = 0
      
      if (elapsedDays > 0) {
        // Calculate daily interest on current principal for elapsed days
        dueInterest = currentPrincipal * dailyRateDecimal * elapsedDays
      }

      console.log('💰 DUE INTEREST CALCULATION:', {
        currentPrincipal,
        annualRate: annualRate + '%',
        dailyRateDecimal: (dailyRateDecimal * 100).toFixed(6) + '% per day',
        elapsedDays,
        calculatedDueInterest: dueInterest,
        dailyInterestAmount: (currentPrincipal * dailyRateDecimal).toFixed(2)
      })

      // Get only the EMIs that have actually become due (based on elapsed time)
      const paymentDateTime = paymentDate.getTime()
      const dueEMIs = availableEMIs.filter(emi => {
        const emiDueDate = new Date(emi.due_date + 'T00:00:00')
        return emiDueDate.getTime() <= paymentDateTime && (emi.status === 'pending' || emi.status === 'partial')
      })

      // Calculate unpaid amount from actually due EMIs only
      const unpaidDueInterest = dueEMIs.reduce((sum, emi) => {
        const paidAmount = emi.paid_amount || 0
        const pendingAmount = emi.amount - paidAmount
        return sum + Math.max(0, pendingAmount)
      }, 0)

      // Use the calculated due interest (more accurate than EMI amounts)
      const finalDueInterest = Math.round(dueInterest * 100) / 100 // Round to nearest paisa

      console.log('💰 FINAL DUE INTEREST:', {
        calculatedDueInterest: finalDueInterest,
        unpaidDueEMIs: unpaidDueInterest,
        dueEMIsCount: dueEMIs.length,
        usingCalculatedAmount: true
      })

      // 🆕 SMART ALLOCATION: Due Interest → Principal (not future interest!)
      let interestCleared = 0
      let actualPrincipalPayment = 0
      let isSmartAllocation = false

      if (finalDueInterest > 0) {
        // Smart allocation: Clear only DUE interest first
        isSmartAllocation = true
        interestCleared = Math.min(paymentAmount, finalDueInterest)
        actualPrincipalPayment = Math.max(0, paymentAmount - interestCleared)
        
        console.log('🎯 SMART ALLOCATION (DUE INTEREST ONLY):', {
          totalPayment: paymentAmount,
          dueInterestCleared: interestCleared,
          principalPayment: actualPrincipalPayment
        })
      } else {
        // No due interest, full amount goes to principal
        actualPrincipalPayment = Math.min(paymentAmount, currentPrincipal)
      }

      const newPrincipalBalance = Math.max(0, currentPrincipal - actualPrincipalPayment)
      
      // Calculate new interest amount based on repayment frequency
      let newInterestAmount = 0
      let oldInterestAmount = 0
      
      if (newPrincipalBalance > 0) {
        let periodRate = annualRate / 12 // Default to monthly
        
        // Adjust rate based on repayment frequency
        if (loanDetails.repayment_frequency === 'weekly') {
          periodRate = annualRate / 52
        } else if (loanDetails.repayment_frequency === 'daily') {
          periodRate = annualRate / 365
        } else if (loanDetails.repayment_frequency === 'monthly') {
          periodRate = annualRate / 12
        }
        
        newInterestAmount = newPrincipalBalance * (periodRate / 100)
        oldInterestAmount = currentPrincipal * (periodRate / 100)
      } else {
        // If principal is fully paid, no more interest
        let periodRate = annualRate / 12
        if (loanDetails.repayment_frequency === 'weekly') {
          periodRate = annualRate / 52
        } else if (loanDetails.repayment_frequency === 'daily') {
          periodRate = annualRate / 365
        }
        oldInterestAmount = currentPrincipal * (periodRate / 100)
      }
      
      const monthlySavings = Math.max(0, oldInterestAmount - newInterestAmount)
      
      const calculation: PaymentCalculation = {
        payment_amount: paymentAmount,
        principal_paid: 0, // Not applicable for principal payments
        interest_paid: 0,
        late_fee_paid: 0,
        excess_amount: paymentAmount > (currentPrincipal + finalDueInterest) ? paymentAmount - (currentPrincipal + finalDueInterest) : 0,
        new_emi_status: 'completed',
        remaining_balance: newPrincipalBalance,
        is_overpayment: paymentAmount > (currentPrincipal + finalDueInterest),
        is_underpayment: false,
        principal_reduction: actualPrincipalPayment,
        new_principal_balance: newPrincipalBalance,
        future_interest_recalculation: actualPrincipalPayment > 0 && newPrincipalBalance > 0,
        new_interest_amount: newInterestAmount,
        monthly_savings: monthlySavings,
        pending_interest_cleared: interestCleared, // 🔧 FIXED: Only DUE interest
        is_smart_allocation: isSmartAllocation,
        total_pending_interest: finalDueInterest // 🔧 FIXED: Only DUE interest
      }

      console.log('✅ PAYMENT - Smart allocation completed (ELAPSED INTEREST ONLY):', calculation)
      setPaymentCalculation(calculation)
      
    } catch (error) {
      console.error('❌ PAYMENT - Principal calculation error:', error)
      setPaymentCalculation(null)
    } finally {
      setIsCalculating(false)
    }
  }

  // 🔧 ENHANCED: Payment calculation engine
  const calculatePayment = async (emi: EMIDetails, paymentAmount: number) => {
    if (!emi || paymentAmount <= 0) {
      setPaymentCalculation(null)
      return
    }

    setIsCalculating(true)
    
    try {
      console.log('🧮 PAYMENT - Calculating payment allocation:', { emi: emi.emi_number, amount: paymentAmount })
      
      const dueAmount = emi.amount
      const alreadyPaid = emi.paid_amount || 0
      const pendingAmount = dueAmount - alreadyPaid
      const lateFee = emi.late_fee || 0
      const interestComponent = emi.interest_amount || (dueAmount * 0.8) // Better default estimate
      const principalComponent = emi.principal_amount || (dueAmount * 0.2)
      
      // Payment allocation priority: Late Fee → Interest → Principal → Excess
      let remainingPayment = paymentAmount
      let lateFeesPaid = 0
      let interestPaid = 0
      let principalPaid = 0
      let excessAmount = 0
      
      // 1. Pay late fees first
      if (lateFee > 0 && remainingPayment > 0) {
        lateFeesPaid = Math.min(lateFee, remainingPayment)
        remainingPayment -= lateFeesPaid
      }
      
      // 2. Pay interest
      if (remainingPayment > 0) {
        const pendingInterest = Math.max(0, interestComponent - (alreadyPaid > lateFee ? Math.min(alreadyPaid - lateFee, interestComponent) : 0))
        interestPaid = Math.min(pendingInterest, remainingPayment)
        remainingPayment -= interestPaid
      }
      
      // 3. Pay principal
      if (remainingPayment > 0) {
        const pendingPrincipal = Math.max(0, principalComponent - Math.max(0, alreadyPaid - lateFee - interestComponent))
        principalPaid = Math.min(pendingPrincipal, remainingPayment)
        remainingPayment -= principalPaid
      }
      
      // 4. Excess payment
      if (remainingPayment > 0) {
        excessAmount = remainingPayment
      }
      
      const totalPaidAfter = alreadyPaid + paymentAmount
      let newStatus = 'pending'
      
      if (totalPaidAfter >= dueAmount + lateFee) {
        newStatus = 'paid'
      } else if (totalPaidAfter > 0) {
        newStatus = 'partial'
      }
      
      const calculation: PaymentCalculation = {
        payment_amount: paymentAmount,
        principal_paid: principalPaid,
        interest_paid: interestPaid,
        late_fee_paid: lateFeesPaid,
        excess_amount: excessAmount,
        new_emi_status: newStatus,
        remaining_balance: Math.max(0, pendingAmount - (interestPaid + principalPaid)),
        is_overpayment: excessAmount > 0,
        is_underpayment: totalPaidAfter < dueAmount + lateFee,
        principal_reduction: 0,
        new_principal_balance: loanDetails?.current_principal_balance || 0,
        future_interest_recalculation: false,
        new_interest_amount: 0,
        monthly_savings: 0,
        pending_interest_cleared: 0, // 🔧 FIXED: Add missing properties
        is_smart_allocation: false, // 🔧 FIXED: Add missing properties  
        total_pending_interest: 0 // 🔧 FIXED: Add missing properties
      }

      console.log('✅ PAYMENT - Calculation completed:', calculation)
      setPaymentCalculation(calculation)
      
    } catch (error) {
      console.error('❌ PAYMENT - Calculation error:', error)
      setPaymentCalculation(null)
    } finally {
      setIsCalculating(false)
    }
  }

  // Submit payment (keeping the same logic but with better error handling)
  const handleSubmit = async () => {
    if (!loanDetails || !paymentCalculation) {
      setError('Please complete payment details')
      return
    }

    if (!user) {
      setError('You must be logged in as a lender')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log('🚀 PAYMENT - Recording enhanced payment...')

      const paymentAmount = parseFloat(formData.payment_amount)
      if (paymentAmount <= 0) {
        throw new Error('Payment amount must be greater than 0')
      }

      // Create payment record
      const paymentData = {
        loan_id: loanDetails.id,
        emi_id: formData.payment_type === 'principal_payment' ? null : selectedEMI?.id,
        amount: paymentAmount,
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        payment_reference: formData.payment_reference || null,
        late_fee_paid: paymentCalculation.late_fee_paid,
        penalty_paid: 0,
        notes: formData.notes || null,
        recorded_by: user.id,
        payment_status: 'completed',
        payment_type: formData.payment_type
      }

      const { data: paymentResult, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single()

      if (paymentError) throw paymentError

      // Handle different payment types
      if (formData.payment_type === 'principal_payment' && loanDetails.is_interest_only) {
        // 🆕 ENHANCED: Handle smart allocation for principal payments
        console.log('💰 PAYMENT - Processing smart allocation principal payment')

        // Step 1: Clear due interest EMIs first (if any) - ONLY elapsed/due EMIs
        if (paymentCalculation.pending_interest_cleared > 0) {
          console.log('🎯 SMART ALLOCATION - Clearing DUE interest only:', paymentCalculation.pending_interest_cleared)
          
          // Ensure payment_date is defined before creating a Date object
                    const paymentDate = formData.payment_date 
                      ? new Date(formData.payment_date) 
                      : new Date(); // Fallback to current date if undefined
          const dueEMIs = availableEMIs.filter(emi => {
            const emiDueDate = new Date(emi.due_date)
            return emiDueDate <= paymentDate && (emi.status === 'pending' || emi.status === 'partial')
          })
          
          let remainingInterestPayment = paymentCalculation.pending_interest_cleared

          for (const emi of dueEMIs) {
            if (remainingInterestPayment <= 0) break

            const pendingAmount = emi.amount - (emi.paid_amount || 0)
            const paymentForThisEMI = Math.min(remainingInterestPayment, pendingAmount)
            const newPaidAmount = (emi.paid_amount || 0) + paymentForThisEMI
            const newStatus = newPaidAmount >= emi.amount ? 'paid' : 'partial'

            // Update this EMI
            await supabase
              .from('emis')
              .update({
                paid_amount: newPaidAmount,
                status: newStatus,
                payment_status: newStatus,
                paid_date: newStatus === 'paid' ? formData.payment_date : null
              })
              .eq('id', emi.id)

            remainingInterestPayment -= paymentForThisEMI
            console.log(`✅ DUE EMI #${emi.emi_number} updated: ${formatCurrency(paymentForThisEMI)} paid, status: ${newStatus}`)
          }
        }

        // Step 2: Apply remaining amount to principal (if any)
        if (paymentCalculation.principal_reduction > 0) {
          console.log('💰 PAYMENT - Applying remaining to principal:', paymentCalculation.principal_reduction)
          
          const { error: loanUpdateError } = await supabase
            .from('loans')
            .update({ 
              current_principal_balance: paymentCalculation.new_principal_balance 
            })
            .eq('id', loanDetails.id)

          if (loanUpdateError) throw loanUpdateError

          // Recalculate future interest EMIs if principal was reduced
          if (paymentCalculation.future_interest_recalculation) {
            await recalculateFutureInterestEMIs(
              loanDetails.id, 
              paymentCalculation.new_principal_balance,
              paymentCalculation.new_interest_amount
            )
          }
        }

        // Step 3: Check if loan is fully paid
        if (paymentCalculation.new_principal_balance <= 0) {
          console.log('🎉 PAYMENT - Loan fully paid, updating status')
          await supabase
            .from('loans')
            .update({ status: 'completed' })
            .eq('id', loanDetails.id)
        }
        
      } else if (formData.payment_type === 'interest_payment' || formData.payment_type === 'emi_payment') {
        // Handle regular interest/EMI payments
        if (!selectedEMI) {
          throw new Error('EMI selection required for interest/EMI payments')
        }

        const updatedPaidAmount = (selectedEMI.paid_amount || 0) + paymentAmount
        const newEMIStatus = updatedPaidAmount >= selectedEMI.amount ? 'paid' : 'partial'
        
        const emiUpdateData = {
          paid_amount: updatedPaidAmount,
          payment_status: newEMIStatus,
          status: newEMIStatus,
          paid_date: newEMIStatus === 'paid' ? formData.payment_date : null,
          days_overdue: newEMIStatus === 'paid' ? 0 : selectedEMI.days_overdue
        }

        const { error: emiUpdateError } = await supabase
          .from('emis')
          .update(emiUpdateData)
          .eq('id', selectedEMI.id)

        if (emiUpdateError) throw emiUpdateError

        // Handle excess payment for regular loans
        if (paymentCalculation.excess_amount > 0 && !loanDetails.is_interest_only) {
          const nextEMIs = availableEMIs.filter(e => 
            e.emi_number > selectedEMI.emi_number && 
            e.status === 'pending'
          ).slice(0, 3)
          
          if (nextEMIs.length > 0) {
            const excessPerEMI = paymentCalculation.excess_amount / nextEMIs.length
            
            for (const nextEMI of nextEMIs) {
              await supabase
                .from('emis')
                .update({
                  amount: Math.max(0, nextEMI.amount - excessPerEMI),
                  outstanding_balance: Math.max(0, (nextEMI.outstanding_balance || 0) - excessPerEMI)
                })
                .eq('id', nextEMI.id)
            }
          }
        }

        // Check if all EMIs are paid for regular loans
        if (!loanDetails.is_interest_only) {
          const totalPaid = (selectedEMI.paid_amount || 0) + paymentAmount
          const allEMIsPaid = availableEMIs.every(e => 
            e.id === selectedEMI.id ? totalPaid >= e.amount : e.status === 'paid'
          )
          
          if (allEMIsPaid) {
            await supabase
              .from('loans')
              .update({ status: 'completed' })
              .eq('id', loanDetails.id)
          }
        }
      }

      // Success message based on payment type with smart allocation info
      let successMessage = `Payment of ${formatCurrency(paymentAmount)} recorded successfully!`
      if (formData.payment_type === 'principal_payment') {
        if (paymentCalculation.is_smart_allocation) {
          successMessage = `🎯 Smart Payment: ${formatCurrency(paymentCalculation.pending_interest_cleared)} cleared DUE interest, ${formatCurrency(paymentCalculation.principal_reduction)} reduced principal! Future interest reduced by ${formatCurrency(paymentCalculation.monthly_savings)} per ${loanDetails.repayment_frequency.slice(0, -2)}.`
        } else {
          successMessage = `Principal payment of ${formatCurrency(paymentAmount)} recorded! Future interest reduced by ${formatCurrency(paymentCalculation.monthly_savings)} per ${loanDetails.repayment_frequency.slice(0, -2)}.`
        }
      }
      
      setSuccess(successMessage)
      
      // Reset form
      setFormData({
        loan_id: loanDetails.id,
        emi_id: '',
        payment_amount: '',
        payment_method: 'cash',
        payment_reference: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_type: loanDetails.is_interest_only ? 'interest_payment' : 'emi_payment',
        notes: ''
      })
      setSelectedEMI(null)
      setPaymentCalculation(null)

      // Reload data
      await loadLoanDetails(loanDetails.id)

      if (onSuccess) {
        setTimeout(() => onSuccess(paymentResult.id), 2000)
      }

    } catch (error: any) {
      console.error('💥 PAYMENT - Recording failed:', error)
      setError(`Failed to record payment: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Recalculate future interest EMIs for interest-only loans
  const recalculateFutureInterestEMIs = async (
    loanId: string, 
    newPrincipalBalance: number, 
    newInterestAmount: number
  ) => {
    try {
      console.log('🔄 PAYMENT - Recalculating future interest EMIs:', {
        loanId,
        newPrincipalBalance,
        newInterestAmount
      })

      if (newPrincipalBalance <= 0) {
        // If principal is fully paid, mark all future EMIs as completed
        await supabase
          .from('emis')
          .update({
            status: 'paid',
            paid_amount: 0,
            outstanding_balance: 0
          })
          .eq('loan_id', loanId)
          .eq('status', 'pending')

        console.log('✅ PAYMENT - All future EMIs marked as completed (principal fully paid)')
        return
      }

      // Update future pending EMIs with new interest amount
      await supabase
        .from('emis')
        .update({
          amount: newInterestAmount,
          interest_amount: newInterestAmount,
          outstanding_balance: newPrincipalBalance
        })
        .eq('loan_id', loanId)
        .eq('status', 'pending')

      console.log('✅ PAYMENT - Future EMIs recalculated with new interest amount:', newInterestAmount)

    } catch (error) {
      console.error('❌ PAYMENT - Recalculation error:', error)
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
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  // Payment Type Selector Component
  const PaymentTypeSelector = () => {
    if (!loanDetails?.is_interest_only) return null

    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Type <span className="text-red-500">*</span>
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Interest Payment */}
          <div
            onClick={() => handlePaymentTypeChange('interest_payment')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              formData.payment_type === 'interest_payment'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Percent className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="font-medium text-gray-900">Interest Payment</h4>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                formData.payment_type === 'interest_payment'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {formData.payment_type === 'interest_payment' && (
                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Pay scheduled interest from EMI schedule
            </p>
          </div>

          {/* Principal Payment */}
          <div
            onClick={() => handlePaymentTypeChange('principal_payment')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              formData.payment_type === 'principal_payment'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <TrendingDown className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="font-medium text-gray-900">Principal Payment</h4>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                formData.payment_type === 'principal_payment'
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-300'
              }`}>
                {formData.payment_type === 'principal_payment' && (
                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Reduce principal balance anytime
            </p>
          </div>
        </div>

        {/* Payment Type Benefits */}
        {formData.payment_type === 'principal_payment' && (
          <div className="mt-3 bg-green-50 border border-green-200 p-3 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
              <div className="text-sm text-green-800">
                <strong>🎯 Smart Principal Payment:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li><strong>Elapsed interest first:</strong> System clears only DUE interest (elapsed time), not future interest</li>
                  <li><strong>Fair allocation:</strong> Borrower doesn't pay future interest upfront</li>
                  <li><strong>Remaining to principal:</strong> Maximizes principal reduction benefit</li>
                  <li><strong>Instant recalculation:</strong> Future EMIs adjust immediately with new principal</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Current Principal Balance Display */}
        <div className="mt-3 bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Current Principal Balance:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(loanDetails.current_principal_balance)}
            </span>
          </div>
          {formData.payment_type === 'principal_payment' && (
            <div className="mt-2 text-xs text-gray-500">
              Max payment: {formatCurrency(loanDetails.current_principal_balance)}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Filter EMIs based on search and filter
  const getFilteredEMIs = () => {
    let filtered = availableEMIs

    // Apply status filter
    if (emiFilter !== 'all') {
      filtered = filtered.filter(emi => {
        if (emiFilter === 'pending') return emi.status === 'pending'
        if (emiFilter === 'overdue') return emi.days_overdue > 0
        if (emiFilter === 'partial') return emi.status === 'partial'
        return true
      })
    }

    // Apply search filter
    if (emiSearch) {
      filtered = filtered.filter(emi => 
        emi.emi_number.toString().includes(emiSearch) ||
        emi.due_date.includes(emiSearch) ||
        formatCurrency(emi.amount).toLowerCase().includes(emiSearch.toLowerCase())
      )
    }

    return filtered
  }

  // Loading state
  if (isLoadingData) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    )
  }

  // No loan selected state
  if (!loanDetails) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Loan Selected</h3>
          <p className="text-gray-600 mb-4">Please select a loan to record payments.</p>
          <button 
            onClick={onCancel}
            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg">
      {/* 🔧 ENHANCED Header */}
      <div className="bg-green-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 mr-3" />
            <div>
              <h2 className="text-xl font-bold">Record Payment</h2>
              <div className="flex items-center mt-1 space-x-4 text-sm opacity-90">
                <span>Loan: {loanDetails.loan_number}</span>
                {loanDetails.is_interest_only && (
                  <span className="px-2 py-1 bg-green-500 text-xs rounded-full">
                    Interest-Only
                  </span>
                )}
                <span>Borrower: {loanDetails.borrower_name}</span>
              </div>
            </div>
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

        {/* 🔧 ENHANCED Loan Information */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Loan Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Basic Info */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Loan Details</label>
              <div className="mt-1">
                <p className="font-medium text-gray-900">{formatCurrency(loanDetails.loan_disbursed)}</p>
                <p className="text-sm text-gray-600">Disbursed on {formatDate(loanDetails.disbursement_date)}</p>
                <p className="text-sm text-gray-600">
                  {loanDetails.tenure_value} {loanDetails.tenure_unit} @ {loanDetails.interest_rate}%
                </p>
              </div>
            </div>

            {/* Outstanding */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Outstanding</label>
              <div className="mt-1">
                <p className="font-medium text-orange-600 text-lg">{formatCurrency(loanDetails.outstanding_balance)}</p>
                {loanDetails.is_interest_only && (
                  <p className="text-sm text-gray-600">
                    Principal: {formatCurrency(loanDetails.current_principal_balance)}
                  </p>
                )}
              </div>
            </div>

            {/* EMI Progress */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">EMI Progress</label>
              <div className="mt-1">
                <p className="font-medium text-gray-900">
                  {loanDetails.paid_emis} / {loanDetails.total_emis} paid
                </p>
                <div className="mt-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(loanDetails.paid_emis / loanDetails.total_emis) * 100}%` }}
                  ></div>
                </div>
                {loanDetails.overdue_emis > 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    {loanDetails.overdue_emis} overdue
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Status</label>
              <div className="mt-1">
                <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${
                  loanDetails.status === 'completed' ? 'bg-green-100 text-green-800' :
                  loanDetails.status === 'active' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {loanDetails.status.charAt(0).toUpperCase() + loanDetails.status.slice(1)}
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  Due: {formatDate(loanDetails.maturity_date)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Type Selector (only for interest-only loans) */}
        <PaymentTypeSelector />

        {/* EMI Selection (only for interest/EMI payments) */}
        {formData.payment_type !== 'principal_payment' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Select {loanDetails.is_interest_only ? 'Interest Payment' : 'EMI'} to Pay
              </h3>
              
              {/* EMI Filters */}
              <div className="flex items-center space-x-2">
                <select
                  value={emiFilter}
                  onChange={(e) => setEmiFilter(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="all">All EMIs</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
            </div>

            {/* EMI Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={emiSearch}
                onChange={(e) => setEmiSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-500"
                placeholder="Search EMIs by number, date, or amount..."
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
              <div className="flex items-start">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                <div className="text-sm text-blue-800">
                  <strong>Payment Policy:</strong> Pay current/overdue EMIs first. Extra payments automatically reduce future EMIs.
                </div>
              </div>
            </div>
            
            {getFilteredEMIs().length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">
                  {emiSearch || emiFilter !== 'all' ? 'No EMIs match your search criteria.' : 'No EMIs found for this loan.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                {/* Header */}
                <div className="bg-gray-100 p-3 grid grid-cols-6 gap-4 text-sm font-medium text-gray-700 sticky top-0">
                  <div>EMI #</div>
                  <div>Due Date</div>
                  <div>Amount</div>
                  <div>Status</div>
                  <div>Paid</div>
                  <div>Action</div>
                </div>

                {/* EMI List */}
                {getFilteredEMIs().map((emi) => {
                  const pendingAmount = emi.amount - (emi.paid_amount || 0)
                  const isPayable = emi.status !== 'paid' && emi.is_current
                  
                  return (
                    <div
                      key={emi.id}
                      className={`p-3 grid grid-cols-6 gap-4 items-center text-sm border-b border-gray-100 ${
                        selectedEMI?.id === emi.id
                          ? 'bg-green-50 border-green-200'
                          : isPayable 
                            ? 'hover:bg-gray-50 cursor-pointer'
                            : 'opacity-50'
                      }`}
                      onClick={() => isPayable ? handleEMISelect(emi) : null}
                    >
                      {/* EMI Number */}
                      <div className="font-medium text-gray-900">
                        #{emi.emi_number}
                        {emi.is_current && (
                          <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">CURRENT</span>
                        )}
                      </div>

                      {/* Due Date */}
                      <div className="text-gray-600">
                        {formatDate(emi.due_date)}
                        {emi.days_overdue > 0 && (
                          <div className="text-xs text-red-600">{emi.days_overdue}d overdue</div>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="font-medium">
                        {formatCurrency(emi.amount)}
                      </div>

                      {/* Status */}
                      <div>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          emi.status === 'paid' ? 'bg-green-100 text-green-800' :
                          emi.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          emi.days_overdue > 0 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {emi.status === 'paid' ? 'PAID' :
                           emi.status === 'partial' ? 'PARTIAL' :
                           emi.days_overdue > 0 ? 'OVERDUE' : 'PENDING'}
                        </span>
                      </div>

                      {/* Paid Amount */}
                      <div className="text-gray-600">
                        {emi.paid_amount ? formatCurrency(emi.paid_amount) : '-'}
                      </div>

                      {/* Action */}
                      <div>
                        {emi.status === 'paid' ? (
                          <span className="text-green-600 text-xs">✓ Complete</span>
                        ) : isPayable ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEMISelect(emi)
                            }}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                          >
                            Pay {formatCurrency(pendingAmount)}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">Pay current first</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Payment Details Form */}
        {(selectedEMI || formData.payment_type === 'principal_payment') && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="payment_amount"
                    value={formData.payment_amount}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-500"
                    placeholder="Enter payment amount"
                    min="1"
                    step="1"
                    required
                  />
                </div>
                
                {/* Quick Amount Buttons */}
                <div className="mt-2 flex gap-2 flex-wrap">
                  {formData.payment_type === 'principal_payment' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const fullPrincipal = loanDetails.current_principal_balance
                          setFormData(prev => ({ ...prev, payment_amount: fullPrincipal.toString() }))
                          calculatePrincipalPayment(fullPrincipal)
                        }}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Full Principal ({formatCurrency(loanDetails.current_principal_balance)})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const halfPrincipal = loanDetails.current_principal_balance / 2
                          setFormData(prev => ({ ...prev, payment_amount: halfPrincipal.toString() }))
                          calculatePrincipalPayment(halfPrincipal)
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Half Principal
                      </button>
                    </>
                  ) : selectedEMI && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const pendingAmount = selectedEMI.amount - (selectedEMI.paid_amount || 0)
                          setFormData(prev => ({ ...prev, payment_amount: pendingAmount.toString() }))
                          calculatePayment(selectedEMI, pendingAmount)
                        }}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Full Amount ({formatCurrency(selectedEMI.amount - (selectedEMI.paid_amount || 0))})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const halfAmount = (selectedEMI.amount - (selectedEMI.paid_amount || 0)) / 2
                          setFormData(prev => ({ ...prev, payment_amount: halfAmount.toString() }))
                          calculatePayment(selectedEMI, halfAmount)
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Half Amount
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online Payment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Payment Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Reference <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="payment_reference"
                  value={formData.payment_reference}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Transaction ID, Cheque number, etc."
                />
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-500"
                placeholder="Any additional notes about this payment"
              />
            </div>
          </div>
        )}

        {/* 🔧 ENHANCED Payment Calculation */}
        {paymentCalculation && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {formData.payment_type === 'principal_payment' ? 'Principal Payment Impact' : 'Payment Breakdown'}
            </h3>
            
            {isCalculating ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Calculating payment impact...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Cards */}
                {formData.payment_type === 'principal_payment' ? (
                  // 🆕 ENHANCED: Principal Payment Summary with Smart Allocation
                  paymentCalculation.is_smart_allocation ? (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900">Total Payment</h4>
                        <p className="text-xl font-bold text-blue-900">{formatCurrency(paymentCalculation.payment_amount)}</p>
                        <p className="text-xs text-blue-700">Smart allocation</p>
                      </div>
                      
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="font-medium text-orange-900">DUE Interest Cleared</h4>
                        <p className="text-xl font-bold text-orange-900">{formatCurrency(paymentCalculation.pending_interest_cleared)}</p>
                        <p className="text-xs text-orange-700">Elapsed period only</p>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900">Principal Reduced</h4>
                        <p className="text-xl font-bold text-green-900">{formatCurrency(paymentCalculation.principal_reduction)}</p>
                        <p className="text-xs text-green-700">Balance reduction</p>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-900">New Principal</h4>
                        <p className="text-xl font-bold text-purple-900">{formatCurrency(paymentCalculation.new_principal_balance)}</p>
                        <p className="text-xs text-purple-700">Remaining balance</p>
                      </div>
                      
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-medium text-yellow-900">Monthly Savings</h4>
                        <p className="text-xl font-bold text-yellow-900">{formatCurrency(paymentCalculation.monthly_savings)}</p>
                        <p className="text-xs text-yellow-700">Interest saved</p>
                      </div>
                    </div>
                  ) : (
                    // Regular Principal Payment (no pending interest)
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900">Principal Payment</h4>
                        <p className="text-xl font-bold text-green-900">{formatCurrency(paymentCalculation.payment_amount)}</p>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900">New Principal Balance</h4>
                        <p className="text-xl font-bold text-blue-900">{formatCurrency(paymentCalculation.new_principal_balance)}</p>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-900">New Interest</h4>
                        <p className="text-xl font-bold text-purple-900">{formatCurrency(paymentCalculation.new_interest_amount)}</p>
                        <p className="text-xs text-purple-700">per {loanDetails.repayment_frequency.slice(0, -2)}</p>
                      </div>
                      
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="font-medium text-orange-900">Savings</h4>
                        <p className="text-xl font-bold text-orange-900">{formatCurrency(paymentCalculation.monthly_savings)}</p>
                        <p className="text-xs text-orange-700">per {loanDetails.repayment_frequency.slice(0, -2)}</p>
                      </div>
                    </div>
                  )
                ) : (
                  // EMI Payment Summary
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900">Payment Amount</h4>
                      <p className="text-xl font-bold text-blue-900">{formatCurrency(paymentCalculation.payment_amount)}</p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900">Interest Paid</h4>
                      <p className="text-xl font-bold text-green-900">{formatCurrency(paymentCalculation.interest_paid)}</p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900">Principal Paid</h4>
                      <p className="text-xl font-bold text-purple-900">{formatCurrency(paymentCalculation.principal_paid)}</p>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-900">
                        {paymentCalculation.is_overpayment ? 'Excess' : 'Remaining'}
                      </h4>
                      <p className="text-xl font-bold text-orange-900">
                        {formatCurrency(paymentCalculation.is_overpayment ? paymentCalculation.excess_amount : paymentCalculation.remaining_balance)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Impact */}
                <div className={`p-4 rounded-lg ${
                  formData.payment_type === 'principal_payment' ? 'bg-green-50 border border-green-200' :
                  paymentCalculation.is_overpayment ? 'bg-green-50 border border-green-200' :
                  paymentCalculation.is_underpayment ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center">
                    {formData.payment_type === 'principal_payment' ? (
                      <>
                        <Calculator className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          {paymentCalculation.is_smart_allocation ? (
                            <>
                              <p className="font-medium text-green-900">🎯 Smart Payment Allocation Applied!</p>
                              <p className="text-sm text-green-700 mb-2">
                                <strong>Step 1:</strong> Cleared ₹{paymentCalculation.pending_interest_cleared.toLocaleString()} DUE interest (elapsed period only - protecting your earnings) ✅<br/>
                                <strong>Step 2:</strong> Applied ₹{paymentCalculation.principal_reduction.toLocaleString()} to principal reduction ✅
                              </p>
                              <p className="text-sm text-green-700">
                                {paymentCalculation.future_interest_recalculation 
                                  ? `🎉 Result: You'll save ${formatCurrency(paymentCalculation.monthly_savings)} on every future payment! All pending EMIs recalculated.`
                                  : '🎉 Amazing! Loan fully paid - no more interest payments required!'
                                }
                              </p>
                              {paymentCalculation.total_pending_interest > paymentCalculation.pending_interest_cleared && (
                                <p className="text-xs text-blue-600 mt-1">
                                  ℹ️ Future EMIs: System only recovered elapsed period interest, not future interest (fair to borrower)
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-green-900">💰 Excellent Investment Decision!</p>
                              <p className="text-sm text-green-700">
                                {paymentCalculation.future_interest_recalculation 
                                  ? `You'll save ${formatCurrency(paymentCalculation.monthly_savings)} on every future payment! All pending EMIs will be recalculated with the new principal balance.`
                                  : '🎉 Loan fully paid! No more interest payments required. This loan is now completed.'
                                }
                              </p>
                            </>
                          )}
                        </div>
                      </>
                    ) : paymentCalculation.is_overpayment ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="font-medium text-green-900">Overpayment Detected</p>
                          <p className="text-sm text-green-700">
                            Excess amount of {formatCurrency(paymentCalculation.excess_amount)} will be applied to reduce future EMIs.
                          </p>
                        </div>
                      </>
                    ) : paymentCalculation.is_underpayment ? (
                      <>
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                        <div>
                          <p className="font-medium text-yellow-900">Partial Payment</p>
                          <p className="text-sm text-yellow-700">
                            EMI will be marked as partial. Remaining: {formatCurrency(paymentCalculation.remaining_balance)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                        <div>
                          <p className="font-medium text-blue-900">Full Payment</p>
                          <p className="text-sm text-blue-700">
                            {loanDetails.is_interest_only ? 'Interest payment' : 'EMI'} will be marked as paid.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Late Fee Warning */}
                {paymentCalculation.late_fee_paid > 0 && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                      <div>
                        <p className="font-medium text-red-900">Late Fee Included</p>
                        <p className="text-sm text-red-700">
                          Late fee of {formatCurrency(paymentCalculation.late_fee_paid)} has been included in this payment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <div>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>

          <div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (!selectedEMI && formData.payment_type !== 'principal_payment') || !paymentCalculation || !formData.payment_amount}
              loading={isLoading}
              className="px-8 py-2 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Recording Payment...' : 'Record Payment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}