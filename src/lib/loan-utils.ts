// /lib/loan-utils.ts
export interface LoanSummary {
    id: string;
    loan_number: string;
    borrower_name: string;
    principal_amount: number;
    total_amount: number;
    status: string;
    disbursement_date: string;
    pending_emis: number;
    total_emis: number;
    paid_emis: number;
    outstanding_balance: number;
    next_due_date: string | null;
    next_due_amount: number;
    purpose?: string;    // Added
    notes?: string;      // Added
  }
  
  export function calculateLoanStatus(loan: {
    id: string;
    status: string;
    outstanding_balance: number;
    total_emis: number;
    paid_emis: number;
    pending_emis: number;
    disbursement_date: string | null;
    next_due_date: string | null;
    emis?: Array<{
      due_date: string;
      paid_amount?: number;
      amount: number;
    }>;
  }) {
    const today = new Date();
    const { outstanding_balance, total_emis, paid_emis, status, disbursement_date, emis } = loan;
    
    // If fully paid (no outstanding balance and all EMIs paid)
    if (outstanding_balance <= 0 && total_emis > 0 && paid_emis === total_emis) {
      return 'completed';
    }
    
    // If there are EMIs and outstanding balance
    if (total_emis > 0 && outstanding_balance > 0) {
      // Check for overdue EMIs if EMI data is available
      if (emis && emis.length > 0) {
        const overdueEMIs = emis.filter((emi) => {
          const dueDate = new Date(emi.due_date);
          const paidAmount = emi.paid_amount || 0;
          return dueDate < today && paidAmount < emi.amount;
        });
        
        if (overdueEMIs.length > 0) {
          return 'overdue';
        }
      } else if (loan.next_due_date) {
        // Fallback: check next due date
        const nextDueDate = new Date(loan.next_due_date);
        if (nextDueDate < today) {
          return 'overdue';
        }
      }
      
      // If has payments or is disbursed, it's active
      if (paid_emis > 0 || disbursement_date) {
        return 'active';
      }
    }
    
    // If approved but not disbursed
    if (status === 'approved' && !disbursement_date) {
      return 'pending';
    }
    
    return status; // Fallback to database status
  }