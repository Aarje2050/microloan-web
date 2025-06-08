// File: src/components/forms/loan/record-payment-form.tsx
'use client'

import React from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  DollarSign, CreditCard, Calendar, AlertTriangle, 
  CheckCircle, ArrowLeft, Clock, Receipt
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
    notes: ''
  })

  console.log('💳 PAYMENT - Form loaded for lender:', user?.email)

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
          payment_amount: emi.amount.toString()
        }))
      }
    }
  }, [emiId, availableEMIs])

  // Load specific loan details
  const loadLoanDetails = async (loanId: string) => {
    try {
      console.log('📊 PAYMENT - Loading loan details:', loanId)
      setIsLoadingData(true)
      
      // Get loan details with borrower info
      const { data: loanData, error: loanError } = await supabase
        .from('loan_details')
        .select('*')
        .eq('id', loanId)
        .eq('lender_id', user?.id) // Ensure lender owns this loan
        .single()

      if (loanError) {
        console.error('❌ PAYMENT - Loan query error:', loanError)
        throw loanError
      }

      if (!loanData) {
        throw new Error('Loan not found or access denied')
      }

      // Calculate outstanding balance - FIXED calculation
      const { data: allEMIs, error: emiBalanceError } = await supabase
        .from('emis')
        .select('amount, paid_amount, status')
        .eq('loan_id', loanId)

      let currentOutstanding = loanData.total_amount
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

      const loanDetails: LoanDetails = {
        id: loanData.id,
        loan_number: loanData.loan_number,
        borrower_name: loanData.borrower_name,
        borrower_email: loanData.borrower_email,
        principal_amount: loanData.principal_amount,
        total_amount: loanData.total_amount,
        status: loanData.status,
        repayment_frequency: loanData.repayment_frequency,
        outstanding_balance: currentOutstanding
      }

      console.log('✅ PAYMENT - Loan details loaded:', loanDetails)
      setLoanDetails(loanDetails)
      setFormData(prev => ({ ...prev, loan_id: loanId }))

      // Load EMIs for this loan
      await loadEMIs(loanId)
      
    } catch (error: any) {
      console.error('❌ PAYMENT - Failed to load loan:', error)
      setError(`Failed to load loan: ${error.message}`)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Load EMIs for loan - FIXED: Proper status calculation and sequential payment logic
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

      // FIXED: Properly calculate EMI status and overdue days
      const today = new Date()
      const allEMIs: EMIDetails[] = (emisData || []).map(emi => {
        const dueDate = new Date(emi.due_date)
        const paidAmount = emi.paid_amount || 0
        const emiAmount = emi.amount
        
        // CORRECTED STATUS LOGIC
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
          status: actualStatus, // Use corrected status
          days_overdue: daysOverdue
        }
      })

      // SEQUENTIAL PAYMENT LOGIC: Only show payable EMIs
      const paidEMIs = allEMIs.filter(e => e.status === 'paid')
      const partialEMIs = allEMIs.filter(e => e.status === 'partial')
      const pendingEMIs = allEMIs.filter(e => e.status === 'pending')
      
      // Find the earliest unpaid EMI (current due)
      const earliestUnpaidEMI = [...partialEMIs, ...pendingEMIs]
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]
      
      // Show paid EMIs (for reference) + current payable EMIs
      const payableEMIs = allEMIs.filter(emi => {
        // Always show paid EMIs for reference
        if (emi.status === 'paid') return true
        
        // Show partial EMIs (they need completion)
        if (emi.status === 'partial') return true
        
        // Show current/overdue pending EMIs only
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

  // Load all loans for lender (if no specific loan selected)
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
      
      // Store loans data for selection (implement loan selection UI if needed)
      
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
    if (name === 'payment_amount' && selectedEMI) {
      calculatePayment(selectedEMI, parseFloat(value) || 0)
    }
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

  // Payment calculation engine
  const calculatePayment = async (emi: EMIDetails, paymentAmount: number) => {
    if (!emi || paymentAmount <= 0) {
      setPaymentCalculation(null)
      return
    }

    setIsCalculating(true)
    
    try {
      console.log('🧮 PAYMENT - Calculating payment allocation:', { emi: emi.emi_number, amount: paymentAmount })
      
      // Get current EMI details
      const dueAmount = emi.amount
      const alreadyPaid = emi.paid_amount || 0
      const pendingAmount = dueAmount - alreadyPaid
      const lateFee = emi.late_fee || 0
      const interestComponent = emi.interest_amount || (dueAmount * 0.7) // Fallback estimation
      const principalComponent = emi.principal_amount || (dueAmount * 0.3) // Fallback estimation
      
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
      
      // 4. Excess payment (prepayment)
      if (remainingPayment > 0) {
        excessAmount = remainingPayment
      }
      
      // Determine new EMI status
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
        is_underpayment: totalPaidAfter < dueAmount + lateFee
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

  // Submit payment record
  const handleSubmit = async () => {
    if (!selectedEMI || !paymentCalculation || !loanDetails) {
      setError('Please select an EMI and enter payment amount')
      return
    }

    if (!user) {
      setError('You must be logged in as a lender')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log('🚀 PAYMENT - Recording payment...')

      const paymentAmount = parseFloat(formData.payment_amount)
      if (paymentAmount <= 0) {
        throw new Error('Payment amount must be greater than 0')
      }

      // Step 1: Create payment record
      const paymentData = {
        loan_id: loanDetails.id,
        emi_id: selectedEMI.id,
        amount: paymentAmount,
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        payment_reference: formData.payment_reference || null,
        late_fee_paid: paymentCalculation.late_fee_paid,
        penalty_paid: 0, // Can be extended for penalties
        notes: formData.notes || null,
        recorded_by: user.id,
        payment_status: 'completed'
      }

      console.log('📝 PAYMENT - Creating payment record:', paymentData)

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

      // Step 2: Update EMI record with CORRECTED status logic
      const updatedPaidAmount = (selectedEMI.paid_amount || 0) + paymentAmount
      const newEMIStatus = updatedPaidAmount >= selectedEMI.amount ? 'paid' : 'partial'
      
      const emiUpdateData = {
        paid_amount: updatedPaidAmount,
        payment_status: newEMIStatus,
        status: newEMIStatus, // Update both fields for consistency
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

      // Step 3: Handle excess payment (prepayment)
      if (paymentCalculation.excess_amount > 0) {
        console.log('💰 PAYMENT - Processing excess payment:', paymentCalculation.excess_amount)
        
        // Find next pending EMIs to apply excess amount
        const nextEMIs = availableEMIs.filter(e => 
          e.emi_number > selectedEMI.emi_number && 
          e.status === 'pending'
        ).slice(0, 3) // Apply to next 3 EMIs
        
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

      // Step 4: Update loan status if fully paid
      const totalPaid = (selectedEMI.paid_amount || 0) + paymentAmount
      const allEMIsPaid = availableEMIs.every(e => 
        e.id === selectedEMI.id ? totalPaid >= e.amount : e.status === 'paid'
      )
      
      if (allEMIsPaid) {
        console.log('🎉 PAYMENT - Loan fully paid, updating status')
        
        const { error: loanStatusError } = await supabase
          .from('loans')
          .update({ status: 'completed' })
          .eq('id', loanDetails.id)
          
        if (loanStatusError) {
          console.warn('⚠️ PAYMENT - Loan status update warning:', loanStatusError)
        }
      }

      // Success!
      setSuccess(`Payment of ${formatCurrency(paymentAmount)} recorded successfully!`)
      
      // Reset form
      setFormData({
        loan_id: loanDetails.id,
        emi_id: '',
        payment_amount: '',
        payment_method: 'cash',
        payment_reference: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      setSelectedEMI(null)
      setPaymentCalculation(null)

      // Reload EMI data to reflect changes
      await loadEMIs(loanDetails.id)
      
      // Force refresh the loan details to update outstanding balance
      await loadLoanDetails(loanDetails.id)

      // Call success callback
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // // Get EMI status color
  // const getEMIStatusColor = (emi: EMIDetails) => {
  //   if (emi.status === 'paid') return 'bg-green-100 text-green-800 border-green-200'
  //   if (emi.status === 'partial') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  //   if (emi.days_overdue > 0) return 'bg-red-100 text-red-800 border-red-200'
  //   return 'bg-blue-100 text-blue-800 border-blue-200'
  // }

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
              <p className="text-sm opacity-90">Loan: {loanDetails.loan_number}</p>
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

        {/* Loan Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Loan Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-900">
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
          </div>
        </div>

        {/* EMI Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select EMI to Pay</h3>
          
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
                    Completed EMIs ({availableEMIs.filter(emi => emi.status === 'paid').length})
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
                              <span className="font-medium text-green-900">EMI #{emi.emi_number}</span>
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
                    Pending EMIs ({availableEMIs.filter(emi => emi.status !== 'paid').length})
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
                                <span className="font-medium text-gray-900">EMI #{emi.emi_number}</span>
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
                                    Pay current EMIs first
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

              {availableEMIs.length === 0 && (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">No EMIs available for payment.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment Details Form */}
        {selectedEMI && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const pendingAmount = selectedEMI.amount - (selectedEMI.paid_amount || 0)
                      setFormData(prev => ({ ...prev, payment_amount: pendingAmount.toString() }))
                      calculatePayment(selectedEMI, pendingAmount)
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Full EMI ({formatCurrency(selectedEMI.amount - (selectedEMI.paid_amount || 0))})
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
                    Half EMI
                  </button>
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Breakdown</h3>
            
            {isCalculating ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Calculating payment allocation...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Cards */}
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

                {/* Payment Status */}
                <div className={`p-4 rounded-lg ${
                  paymentCalculation.is_overpayment ? 'bg-green-50 border border-green-200' :
                  paymentCalculation.is_underpayment ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center">
                    {paymentCalculation.is_overpayment ? (
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
                          <p className="font-medium text-blue-900">Full EMI Payment</p>
                          <p className="text-sm text-blue-700">EMI will be marked as paid.</p>
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
              disabled={isLoading || !selectedEMI || !paymentCalculation || !formData.payment_amount}
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