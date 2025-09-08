// src/components/features/payments/universal-payment-form.tsx
'use client'

import React from 'react'
import RecordPaymentForm from '@/components/forms/loan/record-payment-form'

interface UniversalPaymentFormProps {
  loanId?: string
  emiId?: string
  onSuccess?: (paymentId: string) => void
  onCancel?: () => void
  variant?: 'modal' | 'page' | 'inline'
}

export default function UniversalPaymentForm({ 
  loanId, 
  emiId, 
  onSuccess, 
  onCancel,
  variant = 'page'
}: UniversalPaymentFormProps) {
  console.log('💳 UNIVERSAL PAYMENT - Using enhanced record payment form for lender')
        
            return (
    <RecordPaymentForm
      loanId={loanId}
      emiId={emiId}
      onSuccess={onSuccess}
      onCancel={onCancel}
      variant={variant}
    />
    )
  }
