// File: src/components/forms/loan/record-payment-form.tsx - COMPLETE ENHANCED VERSION WITH INTEREST-ONLY SUPPORT
'use client'

import React from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  DollarSign, CreditCard, Calendar, AlertTriangle, 
  CheckCircle, ArrowLeft, Clock, Receipt, IndianRupee,
  Percent, TrendingDown, Calculator
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
  principal_amount: number
  total_amount: number
  status: string
  repayment_frequency: string
  outstanding_balance: number
  is_interest_only: boolean // 🆕 NEW
  current_principal_balance: number // 🆕 NEW
  interest_rate: number // 🆕 NEW
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
  principal_reduction: number // 🆕 NEW
  new_principal_balance: number // 🆕 NEW
  future_interest_recalculation: boolean // 🆕 NEW
  new_monthly_interest: number // 🆕 NEW
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
  
  // Form data
  const [formData, setFormData] = React.useState({
    loan_id: loanId || '',
    emi_id: emiId || '',
    payment_amount: '',
    payment_method: 'cash',
    payment_reference: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'emi_payment', // 🆕 NEW: 'emi_payment', 'principal_payment', 'interest_payment'
    notes: ''
  })

  console.log('💳 PAYMENT - Enhanced form loaded for lender:', user?.email)

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

  // 🆕 ENHANCED: Load specific loan details with interest-only support
  const loadLoanDetails = async (loanId: string) => {
    try {
      console.log('📊 PAYMENT - Loading enhanced loan details:', loanId)
      setIsLoadingData(true)
      
      // 🔧 BACKWARDS COMPATIBLE: Try enhanced query first, fallback to basic query
      let loanData: any = null
      let loanError: any = null

      // First, try the original loan_details view query
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

      // Now try to get enhanced fields from loans table (if columns exist)
      let enhancedLoanData: any = null
      try {
        const { data: extraData, error: extraError } = await supabase
          .from('loans')
          .select('is_interest_only, current_principal_balance, interest_rate')
          .eq('id', loanId)
          .single()

        if (!extraError && extraData) {
          enhancedLoanData = extraData
          console.log('✅ PAYMENT - Enhanced fields loaded:', enhancedLoanData)
        } else {
          console.log('⚠️ PAYMENT - Enhanced fields not available, using defaults')
        }
      } catch (enhanceError) {
        console.log('⚠️ PAYMENT - Enhanced fields not available, using defaults:', enhanceError)
      }

      // Merge basic data with enhanced data (if available)
      loanData = {
        ...basicLoanData,
        is_interest_only: enhancedLoanData?.is_interest_only || false,
        current_principal_balance: enhancedLoanData?.current_principal_balance || basicLoanData.principal_amount,
        interest_rate: enhancedLoanData?.interest_rate || basicLoanData.interest_rate || 0
      }

      // 🆕 ENHANCED: Calculate outstanding balance for different loan types
      let currentOutstanding = loanData.total_amount
      let currentPrincipalBalance = loanData.current_principal_balance || loanData.principal_amount

      if (loanData.is_interest_only) {
        console.log('💰 PAYMENT - Processing interest-only loan')
        
        // For interest-only loans, get actual current principal balance
        const { data: principalPayments, error: principalError } = await supabase
          .from('payments')
          .select('amount')
          .eq('loan_id', loanId)
          .eq('payment_type', 'principal_payment')

        if (!principalError && principalPayments) {
          const totalPrincipalPaid = principalPayments.reduce((sum, p) => sum + p.amount, 0)
          currentPrincipalBalance = loanData.principal_amount - totalPrincipalPaid
          console.log('💰 PAYMENT - Current principal balance:', currentPrincipalBalance)
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
        // Regular loan calculation (existing logic)
        const { data: allEMIs, error: emiBalanceError } = await supabase
          .from('emis')
          .select('amount, paid_amount, status')
          .eq('loan_id', loanId)

        if (!emiBalanceError && allEMIs) {
          const totalPaid = allEMIs.reduce((sum, emi) => {
            if (emi.status === 'paid') {
              return sum + (emi.paid_amount || emi.amount)
            } else if (emi.status === 'partial') {
              return sum + (emi.paid_amount || 0)
            }
            return sum
          }, 0)
          currentOutstanding = Math.max(0, loanData.total_amount - totalPaid)
        }
      }

      const loanDetails: LoanDetails = {
        id: loanData.id,
        loan_number: loanData.loan_number,
        borrower_name: loanData.borrower_name,
        borrower_email: loanData.borrower_email,
        principal_amount: loanData.principal_amount,
        total_amount: loanData.total_amount,
        status: loanData.status,
        repayment_frequency: loanData.repayment_frequency,
        outstanding_balance: currentOutstanding,
        is_interest_only: loanData.is_interest_only || false, // 🆕 NEW
        current_principal_balance: currentPrincipalBalance, // 🆕 NEW
        interest_rate: loanData.interest_rate || 0 // 🆕 NEW
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

  // Load EMIs for loan (existing logic - unchanged)
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
      const allEMIs: EMIDetails[] = (emisData || []).map(emi => {
        const dueDate = new Date(emi.due_date)
        const paidAmount = emi.paid_amount || 0
        const emiAmount = emi.amount
        
        let actualStatus = emi.status
        if (paidAmount >= emiAmount) {
          actualStatus = 'paid'
        } else if (paidAmount > 0) {
          actualStatus = 'partial'
        } else {
          actualStatus = 'pending'
        }
        
        const daysOverdue = actualStatus === 'pending' && dueDate < today 
          ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24))
          : 0

        return {
          ...emi,
          status: actualStatus,
          days_overdue: daysOverdue
        }
      })

      const paidEMIs = allEMIs.filter(e => e.status === 'paid')
      const partialEMIs = allEMIs.filter(e => e.status === 'partial')
      const pendingEMIs = allEMIs.filter(e => e.status === 'pending')
      
      const earliestUnpaidEMI = [...partialEMIs, ...pendingEMIs]
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]
      
      const payableEMIs = allEMIs.filter(emi => {
        if (emi.status === 'paid') return true
        if (emi.status === 'partial') return true
        if (emi.status === 'pending') {
          return emi.emi_number <= (earliestUnpaidEMI?.emi_number || 1)
        }
        return false
      })

      console.log('✅ PAYMENT - EMIs processed:', {
        total: allEMIs.length,
        paid: paidEMIs.length,
        partial: partialEMIs.length,
        pending: pendingEMIs.length,
        payable: payableEMIs.length,
        currentDue: earliestUnpaidEMI?.emi_number
      })
      
      setAvailableEMIs(payableEMIs)
      
    } catch (error: any) {
      console.error('❌ PAYMENT - Failed to load EMIs:', error)
      setError(`Failed to load EMIs: ${error.message}`)
    }
  }

  // Load all loans for lender (existing logic - unchanged)
  const loadLenderLoans = async () => {
    try {
      console.log('📊 PAYMENT - Loading lender loans')
      setIsLoadingData(true)
      
      const { data: loansData, error: loansError } = await supabase
        .from('loan_details')
        .select('id, loan_number, borrower_name, status, total_amount')
        .eq('lender_id', user?.id)
        .in('status', ['active', 'disbursed'])
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

  // 🆕 NEW: Handle payment type change
  const handlePaymentTypeChange = (paymentType: string) => {
    setFormData(prev => ({
      ...prev,
      payment_type: paymentType,
      payment_amount: '', // Reset amount when changing type
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
      payment_amount: emi.amount.toString()
    }))
    calculatePayment(emi, emi.amount)
  }

  // 🆕 NEW: Calculate principal payment for interest-only loans
  const calculatePrincipalPayment = async (paymentAmount: number) => {
    if (!loanDetails || !loanDetails.is_interest_only || paymentAmount <= 0) {
      setPaymentCalculation(null)
      return
    }

    setIsCalculating(true)
    
    try {
      console.log('🧮 PAYMENT - Calculating principal payment:', paymentAmount)
      
      const currentPrincipal = loanDetails.current_principal_balance
      const maxPrincipalPayment = currentPrincipal
      const actualPrincipalPayment = Math.min(paymentAmount, maxPrincipalPayment)
      const newPrincipalBalance = Math.max(0, currentPrincipal - actualPrincipalPayment)
      
      // Calculate new monthly interest based on new principal
      let newMonthlyInterest = 0
      if (newPrincipalBalance > 0) {
        const annualRate = loanDetails.interest_rate
        let monthlyRate = annualRate / 12
        
        // Adjust rate based on repayment frequency
        if (loanDetails.repayment_frequency === 'weekly') {
          monthlyRate = annualRate / 52
        } else if (loanDetails.repayment_frequency === 'daily') {
          monthlyRate = annualRate / 365
        }
        
        newMonthlyInterest = newPrincipalBalance * (monthlyRate / 100)
      }
      
      const calculation: PaymentCalculation = {
        payment_amount: paymentAmount,
        principal_paid: 0, // Not applicable for principal payments
        interest_paid: 0,
        late_fee_paid: 0,
        excess_amount: paymentAmount > maxPrincipalPayment ? paymentAmount - maxPrincipalPayment : 0,
        new_emi_status: 'completed',
        remaining_balance: newPrincipalBalance,
        is_overpayment: paymentAmount > maxPrincipalPayment,
        is_underpayment: false,
        principal_reduction: actualPrincipalPayment, // 🆕 NEW
        new_principal_balance: newPrincipalBalance, // 🆕 NEW
        future_interest_recalculation: actualPrincipalPayment > 0 && newPrincipalBalance > 0, // 🆕 NEW
        new_monthly_interest: newMonthlyInterest // 🆕 NEW
      }

      console.log('✅ PAYMENT - Principal calculation completed:', calculation)
      setPaymentCalculation(calculation)
      
    } catch (error) {
      console.error('❌ PAYMENT - Principal calculation error:', error)
      setPaymentCalculation(null)
    } finally {
      setIsCalculating(false)
    }
  }

  // Payment calculation engine (enhanced for interest-only)
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
      const interestComponent = emi.interest_amount || (dueAmount * 0.7)
      const principalComponent = emi.principal_amount || (dueAmount * 0.3)
      
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
        principal_reduction: 0, // Not applicable for EMI payments
        new_principal_balance: loanDetails?.current_principal_balance || 0,
        future_interest_recalculation: false,
        new_monthly_interest: 0
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

  // 🆕 ENHANCED: Submit payment record with interest-only support
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

      // Step 1: Create payment record with enhanced data
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
        payment_type: formData.payment_type // 🆕 NEW
      }

      console.log('📝 PAYMENT - Creating enhanced payment record:', paymentData)

      const { data: paymentResult, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single()

      if (paymentError) {
        console.error('❌ PAYMENT - Payment creation error:', paymentError)
        throw paymentError
      }

      console.log('✅ PAYMENT - Payment record created:', paymentResult.id)

      // Step 2: Handle different payment types
      if (formData.payment_type === 'principal_payment' && loanDetails.is_interest_only) {
        // 🆕 NEW: Handle principal payment for interest-only loans
        console.log('💰 PAYMENT - Processing principal payment updates')
        
        // Update loan's current principal balance
        const { error: loanUpdateError } = await supabase
          .from('loans')
          .update({ 
            current_principal_balance: paymentCalculation.new_principal_balance 
          })
          .eq('id', loanDetails.id)

        if (loanUpdateError) {
          console.error('❌ PAYMENT - Loan update error:', loanUpdateError)
          throw loanUpdateError
        }

        console.log('✅ PAYMENT - Principal balance updated:', paymentCalculation.new_principal_balance)

        // Recalculate future interest EMIs if principal was reduced
        if (paymentCalculation.future_interest_recalculation) {
          await recalculateFutureInterestEMIs(
            loanDetails.id, 
            paymentCalculation.new_principal_balance,
            paymentCalculation.new_monthly_interest
          )
        }

        // Check if loan is fully paid
        if (paymentCalculation.new_principal_balance <= 0) {
          console.log('🎉 PAYMENT - Loan fully paid, updating status')
          await supabase
            .from('loans')
            .update({ status: 'completed' })
            .eq('id', loanDetails.id)
        }
        
      } else if (formData.payment_type === 'interest_payment' || formData.payment_type === 'emi_payment') {
        // Handle regular interest/EMI payments (existing logic)
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

        console.log('📝 PAYMENT - Updating EMI record:', emiUpdateData)

        const { error: emiUpdateError } = await supabase
          .from('emis')
          .update(emiUpdateData)
          .eq('id', selectedEMI.id)

        if (emiUpdateError) {
          console.error('❌ PAYMENT - EMI update error:', emiUpdateError)
          throw emiUpdateError
        }

        console.log('✅ PAYMENT - EMI record updated')

        // Handle excess payment for regular loans
        if (paymentCalculation.excess_amount > 0 && !loanDetails.is_interest_only) {
          console.log('💰 PAYMENT - Processing excess payment:', paymentCalculation.excess_amount)
          
          const nextEMIs = availableEMIs.filter(e => 
            e.emi_number > selectedEMI.emi_number && 
            e.status === 'pending'
          ).slice(0, 3)
          
          if (nextEMIs.length > 0) {
            const excessPerEMI = paymentCalculation.excess_amount / nextEMIs.length
            
            for (const nextEMI of nextEMIs) {
              const { error: excessUpdateError } = await supabase
                .from('emis')
                .update({
                  amount: Math.max(0, nextEMI.amount - excessPerEMI),
                  outstanding_balance: Math.max(0, (nextEMI.outstanding_balance || 0) - excessPerEMI)
                })
                .eq('id', nextEMI.id)
                
              if (excessUpdateError) {
                console.warn('⚠️ PAYMENT - Excess payment update warning:', excessUpdateError)
              }
            }
            
            console.log('✅ PAYMENT - Excess payment applied to future EMIs')
          }
        }

        // Check if all EMIs are paid for regular loans
        if (!loanDetails.is_interest_only) {
          const totalPaid = (selectedEMI.paid_amount || 0) + paymentAmount
          const allEMIsPaid = availableEMIs.every(e => 
            e.id === selectedEMI.id ? totalPaid >= e.amount : e.status === 'paid'
          )
          
          if (allEMIsPaid) {
            console.log('🎉 PAYMENT - All EMIs paid, updating loan status')
            
            const { error: loanStatusError } = await supabase
              .from('loans')
              .update({ status: 'completed' })
              .eq('id', loanDetails.id)
              
            if (loanStatusError) {
              console.warn('⚠️ PAYMENT - Loan status update warning:', loanStatusError)
            }
          }
        }
      }

      // Success message based on payment type
      let successMessage = `Payment of ${formatCurrency(paymentAmount)} recorded successfully!`
      if (formData.payment_type === 'principal_payment') {
        successMessage = `Principal payment of ${formatCurrency(paymentAmount)} recorded successfully! Future interest reduced.`
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

      // Reload data to reflect changes
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

  // 🆕 NEW: Recalculate future interest EMIs for interest-only loans
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
        // If principal is fully paid, mark all future EMIs as paid
        const { error: emiUpdateError } = await supabase
          .from('emis')
          .update({
            status: 'paid',
            paid_amount: 0,
            outstanding_balance: 0
          })
          .eq('loan_id', loanId)
          .eq('status', 'pending')

        if (emiUpdateError) {
          console.warn('⚠️ PAYMENT - EMI completion warning:', emiUpdateError)
        } else {
          console.log('✅ PAYMENT - All future EMIs marked as completed (principal fully paid)')
        }
        return
      }

      // Update future pending EMIs with new interest amount
      const { error: emiUpdateError } = await supabase
        .from('emis')
        .update({
          amount: newInterestAmount,
          interest_amount: newInterestAmount,
          outstanding_balance: newPrincipalBalance
        })
        .eq('loan_id', loanId)
        .eq('status', 'pending')

      if (emiUpdateError) {
        console.warn('⚠️ PAYMENT - EMI recalculation warning:', emiUpdateError)
      } else {
        console.log('✅ PAYMENT - Future EMIs recalculated with new interest amount:', newInterestAmount)
      }

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

  // 🆕 NEW: Payment Type Selector Component
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
              Pay scheduled interest amount from EMI list
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

        {/* Payment Type Info */}
        {formData.payment_type === 'principal_payment' && (
          <div className="mt-3 bg-green-50 border border-green-200 p-3 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
              <div className="text-sm text-green-800">
                <strong>Principal Payment Benefits:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Reduces remaining principal balance immediately</li>
                  <li>Future interest automatically recalculates</li>
                  <li>Can pay partial or full principal anytime</li>
                  <li>Immediate savings on future interest payments</li>
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
              Maximum principal payment: {formatCurrency(loanDetails.current_principal_balance)}
            </div>
          )}
        </div>
      </div>
    )
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
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-green-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 mr-3" />
            <div>
              <h2 className="text-xl font-bold">Record Payment</h2>
              <p className="text-sm opacity-90">
                Loan: {loanDetails.loan_number}
                {loanDetails.is_interest_only && (
                  <span className="ml-2 px-2 py-1 bg-green-500 text-xs rounded-full">
                    Interest-Only
                  </span>
                )}
              </p>
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

        {/* Enhanced Loan Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Loan Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-900">
            <div>
              <label className="text-gray-600">Borrower:</label>
              <p className="font-medium">{loanDetails.borrower_name}</p>
            </div>
            <div>
              <label className="text-gray-600">Total Amount:</label>
              <p className="font-medium">{formatCurrency(loanDetails.total_amount)}</p>
            </div>
            <div>
              <label className="text-gray-600">Outstanding:</label>
              <p className="font-medium">{formatCurrency(loanDetails.outstanding_balance)}</p>
            </div>
            {loanDetails.is_interest_only && (
              <div>
                <label className="text-gray-600">Principal Balance:</label>
                <p className="font-medium text-green-600">
                  {formatCurrency(loanDetails.current_principal_balance)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 🆕 NEW: Payment Type Selector (only for interest-only loans) */}
        <PaymentTypeSelector />

        {/* EMI Selection (only for interest/EMI payments) */}
        {formData.payment_type !== 'principal_payment' && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select {loanDetails.is_interest_only ? 'Interest Payment' : 'EMI'} to Pay
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                <div className="text-sm text-blue-800">
                  <strong>Sequential Payment Policy:</strong> You can only pay current/overdue EMIs first. 
                  Extra payments will automatically reduce future EMI amounts.
                </div>
              </div>
            </div>
            
            {availableEMIs.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">No EMIs found for this loan.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {/* Paid EMIs Section */}
                {availableEMIs.filter(emi => emi.status === 'paid').length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Completed Payments ({availableEMIs.filter(emi => emi.status === 'paid').length})
                    </h4>
                    <div className="space-y-2">
                      {availableEMIs.filter(emi => emi.status === 'paid').map((emi) => (
                        <div
                          key={emi.id}
                          className="p-3 border border-green-200 bg-green-50 rounded-lg opacity-75"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <span className="font-medium text-green-900">
                                  {loanDetails.is_interest_only ? 'Interest' : 'EMI'} #{emi.emi_number}
                                </span>
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                                  ✓ PAID
                                </span>
                                {(emi.paid_amount || 0) > emi.amount && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                    Overpaid
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 text-sm text-green-700">
                                Due: {new Date(emi.due_date).toLocaleDateString('en-IN')} | 
                                Paid: {formatCurrency(emi.paid_amount || emi.amount)} 
                                {(emi.paid_amount || 0) > emi.amount && (
                                  <span className="text-blue-600">
                                    (Extra: {formatCurrency((emi.paid_amount || 0) - emi.amount)})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-green-800">Completed</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending/Partial EMIs Section */}
                {availableEMIs.filter(emi => emi.status !== 'paid').length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-orange-800 mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Pending Payments ({availableEMIs.filter(emi => emi.status !== 'paid').length})
                    </h4>
                    <div className="space-y-2">
                      {availableEMIs.filter(emi => emi.status !== 'paid').map((emi) => {
                        const isPayable = emi.status === 'partial' || 
                          (emi.status === 'pending' && (emi.days_overdue >= 0 || 
                            emi.emi_number <= Math.min(...availableEMIs.filter(e => e.status !== 'paid').map(e => e.emi_number))))
                        
                        return (
                          <div
                            key={emi.id}
                            onClick={() => isPayable ? handleEMISelect(emi) : null}
                            className={`p-4 border rounded-lg transition-colors ${
                              selectedEMI?.id === emi.id
                                ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                                : isPayable 
                                  ? 'cursor-pointer border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                                  : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <span className="font-medium text-gray-900">
                                    {loanDetails.is_interest_only ? 'Interest' : 'EMI'} #{emi.emi_number}
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    emi.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                    emi.days_overdue > 0 ? 'bg-red-100 text-red-800' :
                                    isPayable ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {emi.status === 'partial' ? 'PARTIAL' :
                                     emi.days_overdue > 0 ? `OVERDUE (${emi.days_overdue}d)` : 
                                     isPayable ? 'DUE NOW' : 'FUTURE'}
                                  </span>
                                  {!isPayable && emi.status === 'pending' && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      Pay current first
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                  Due: {new Date(emi.due_date).toLocaleDateString('en-IN')} | 
                                  Amount: {formatCurrency(emi.amount)}
                                  {emi.paid_amount && emi.paid_amount > 0 && (
                                    <span className="text-orange-600"> | Paid: {formatCurrency(emi.paid_amount)}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-medium ${
                                  emi.status === 'partial' ? 'text-orange-600' : 
                                  emi.days_overdue > 0 ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  {formatCurrency(emi.amount - (emi.paid_amount || 0))}
                                </div>
                                <div className="text-xs text-gray-500">Remaining</div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
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

        {/* Payment Calculation */}
        {paymentCalculation && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {formData.payment_type === 'principal_payment' ? 'Principal Payment Impact' : 'Payment Breakdown'}
            </h3>
            
            {isCalculating ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Calculating payment allocation...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Cards */}
                {formData.payment_type === 'principal_payment' ? (
                  // 🆕 NEW: Principal Payment Summary
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
                      <h4 className="font-medium text-purple-900">New Interest Amount</h4>
                      <p className="text-xl font-bold text-purple-900">{formatCurrency(paymentCalculation.new_monthly_interest)}</p>
                      <p className="text-xs text-purple-700">per {loanDetails.repayment_frequency.slice(0, -2)}</p>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-900">Monthly Savings</h4>
                      <p className="text-xl font-bold text-orange-900">
                        {formatCurrency(Math.max(0, (loanDetails.current_principal_balance * (loanDetails.interest_rate / 12 / 100)) - paymentCalculation.new_monthly_interest))}
                      </p>
                      <p className="text-xs text-orange-700">interest saved</p>
                    </div>
                  </div>
                ) : (
                  // Existing EMI Payment Summary
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
                        {paymentCalculation.is_overpayment ? 'Excess Amount' : 'Remaining'}
                      </h4>
                      <p className="text-xl font-bold text-orange-900">
                        {formatCurrency(paymentCalculation.is_overpayment ? paymentCalculation.excess_amount : paymentCalculation.remaining_balance)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Status */}
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
                          <p className="font-medium text-green-900">Principal Payment Impact</p>
                          <p className="text-sm text-green-700">
                            {paymentCalculation.future_interest_recalculation 
                              ? `Future interest payments reduced to ${formatCurrency(paymentCalculation.new_monthly_interest)} per ${loanDetails.repayment_frequency.slice(0, -2)}.`
                              : 'Loan fully paid! No more interest payments required.'
                            }
                          </p>
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

                {/* Late Fee */}
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