// /lib/trash-utils.ts - NEW FILE - Trash Management Functions
import { supabase } from './supabase';
import { LoanSummary } from './loan-utils';

// Soft delete a loan (move to trash)
export async function moveToTrash(loanId: string, userId: string) {
  try {
    console.log("🗑️ Moving loan to trash:", loanId);
    
    const now = new Date().toISOString();
    
    // Soft delete the loan
    const { error: loanError } = await supabase
      .from('loans')
      .update({ 
        is_deleted: true, 
        deleted_at: now 
      })
      .eq('id', loanId)
      .eq('created_by', userId); // Security: only allow deleting own loans

    if (loanError) {
      console.error("❌ Failed to move loan to trash:", loanError);
      throw new Error(`Failed to move loan to trash: ${loanError.message}`);
    }

    console.log("✅ Loan moved to trash successfully");
    return true;
  } catch (error) {
    console.error("❌ Move to trash error:", error);
    throw error;
  }
}

// Restore a loan from trash
export async function restoreFromTrash(loanId: string, userId: string) {
  try {
    console.log("♻️ Restoring loan from trash:", loanId);
    
    // Restore the loan
    const { error: loanError } = await supabase
      .from('loans')
      .update({ 
        is_deleted: false, 
        deleted_at: null 
      })
      .eq('id', loanId)
      .eq('created_by', userId)
      .eq('is_deleted', true); // Only restore deleted loans

    if (loanError) {
      console.error("❌ Failed to restore loan:", loanError);
      throw new Error(`Failed to restore loan: ${loanError.message}`);
    }

    console.log("✅ Loan restored successfully");
    return true;
  } catch (error) {
    console.error("❌ Restore error:", error);
    throw error;
  }
}

// Permanently delete a loan and all its EMIs
export async function permanentlyDelete(loanId: string, userId: string) {
  try {
    console.log("🗑️ Permanently deleting loan:", loanId);
    
    // First, permanently delete all EMIs
    const { error: emisError } = await supabase
      .from('emis')
      .delete()
      .eq('loan_id', loanId);

    if (emisError) {
      console.error("❌ Failed to delete EMIs:", emisError);
      throw new Error(`Failed to delete EMIs: ${emisError.message}`);
    }

    // Then, permanently delete the loan
    const { error: loanError } = await supabase
      .from('loans')
      .delete()
      .eq('id', loanId)
      .eq('created_by', userId);

    if (loanError) {
      console.error("❌ Failed to permanently delete loan:", loanError);
      throw new Error(`Failed to permanently delete loan: ${loanError.message}`);
    }

    console.log("✅ Loan permanently deleted");
    return true;
  } catch (error) {
    console.error("❌ Permanent delete error:", error);
    throw error;
  }
}

// Get all trashed loans for a user
export async function getTrashedLoans(userId: string): Promise<LoanSummary[]> {
  try {
    console.log("📊 Loading trashed loans for user:", userId);

    const { data: loansData, error: loansError } = await supabase
      .from("loans")
      .select("*")
      .eq("created_by", userId)
      .eq("is_deleted", true)
      .order("deleted_at", { ascending: false });

    if (loansError) throw loansError;

    if (!loansData || loansData.length === 0) {
      return [];
    }

    // Get borrower names
    const borrowerIds = loansData.map(l => l.borrower_id);
    const { data: borrowersData } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", borrowerIds);

    // Get EMI data (including deleted EMIs for trashed loans)
    const loanIds = loansData.map(l => l.id);
    const { data: emisData } = await supabase
      .from("emis")
      .select("*")
      .in("loan_id", loanIds);

    // Transform loans
    const transformedLoans: LoanSummary[] = loansData.map((loan) => {
      const borrower = borrowersData?.find((b) => b.id === loan.borrower_id);
      const loanEMIs = (emisData || []).filter((e) => e.loan_id === loan.id);

      const totalEMIs = loanEMIs.length;
      const paidEMIs = loanEMIs.filter((e) => {
        const paidAmount = e.paid_amount || 0;
        return paidAmount >= e.amount;
      }).length;

      const partialEMIs = loanEMIs.filter((e) => {
        const paidAmount = e.paid_amount || 0;
        return paidAmount > 0 && paidAmount < e.amount;
      });

      const pendingEMIs = loanEMIs.filter((e) => {
        const paidAmount = e.paid_amount || 0;
        return paidAmount === 0;
      });

      const totalPaid = loanEMIs.reduce((sum, emi) => {
        const paidAmount = emi.paid_amount || 0;
        return sum + Math.min(paidAmount, emi.amount);
      }, 0);

      const outstandingBalance = Math.max(
        0,
        (loan.total_amount || loan.principal_amount) - totalPaid
      );

      return {
        id: loan.id,
        loan_number: loan.loan_number || `LOAN-${loan.id.slice(0, 8)}`,
        borrower_name: borrower?.full_name || "Unknown",
        principal_amount: loan.principal_amount,
        total_amount: loan.total_amount || loan.principal_amount,
        interest_rate: loan.interest_rate || 0,
        interest_tenure: loan.interest_tenure || "N/A",
        status: loan.status,
        disbursement_date: loan.disbursement_date || loan.created_at,
        pending_emis: pendingEMIs.length + partialEMIs.length,
        total_emis: totalEMIs,
        paid_emis: paidEMIs,
        outstanding_balance: outstandingBalance,
        next_due_date: null, // Not relevant for trashed loans
        next_due_amount: 0,
        purpose: loan.purpose || null,
        notes: loan.notes || null,
        is_deleted: true,
        deleted_at: loan.deleted_at
      };
    });

    return transformedLoans;
  } catch (error) {
    console.error("❌ Failed to load trashed loans:", error);
    return [];
  }
}

// Get count of trashed loans
export async function getTrashedLoansCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("loans")
      .select("*", { count: "exact", head: true })
      .eq("created_by", userId)
      .eq("is_deleted", true);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("❌ Failed to get trashed loans count:", error);
    return 0;
  }
}

// Clean up old trashed loans (run manually or as scheduled job)
export async function cleanupOldTrashedLoans(userId: string) {
  try {
    console.log("🧹 Cleaning up old trashed loans");
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get loans that are older than 30 days in trash
    const { data: oldLoans, error: fetchError } = await supabase
      .from("loans")
      .select("id")
      .eq("created_by", userId)
      .eq("is_deleted", true)
      .lt("deleted_at", thirtyDaysAgo.toISOString());

    if (fetchError) throw fetchError;

    if (!oldLoans || oldLoans.length === 0) {
      console.log("✅ No old trashed loans to clean up");
      return 0;
    }

    // Permanently delete these loans
    for (const loan of oldLoans) {
      await permanentlyDelete(loan.id, userId);
    }

    console.log(`✅ Cleaned up ${oldLoans.length} old trashed loans`);
    return oldLoans.length;
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    throw error;
  }
}