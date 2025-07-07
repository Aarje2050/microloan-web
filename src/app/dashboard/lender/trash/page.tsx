// app/dashboard/lender/trash/page.tsx - NEW FILE - Trash Management Page
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Calendar,
  User,
  RefreshCw,
  ArrowLeft,
  IndianRupee,
  Clock,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoanSummary, formatTrashDate, canRestoreLoan } from "@/lib/loan-utils";
import { 
  getTrashedLoans, 
  restoreFromTrash, 
  permanentlyDelete,
  cleanupOldTrashedLoans 
} from "@/lib/trash-utils";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TrashedLoanCardProps {
  loan: LoanSummary;
  onRestore: (loanId: string) => void;
  onPermanentDelete: (loanId: string) => void;
}

function TrashedLoanCard({ loan, onRestore, onPermanentDelete }: TrashedLoanCardProps) {
  const canRestore = loan.deleted_at ? canRestoreLoan(loan.deleted_at) : false;
  const timeLeft = loan.deleted_at ? formatTrashDate(loan.deleted_at) : '';
  
  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{loan.loan_number}</h3>
              <Badge className="bg-red-100 text-red-800 border-red-200">
                <Trash2 className="w-3 h-3 mr-1" />
                Deleted
              </Badge>
            </div>
            <div className="flex items-center text-sm text-gray-600 space-x-4">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                <span className="font-medium">{loan.borrower_name}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{formatDate(loan.disbursement_date)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Amount */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Loan Amount
          </p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(loan.principal_amount)}
          </p>
        </div>

        {/* Deletion Info */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                Deleted: {loan.deleted_at ? formatDate(loan.deleted_at) : 'Unknown'}
              </span>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${canRestore ? 'text-orange-900' : 'text-red-900'}`}>
                {timeLeft}
              </p>
            </div>
          </div>
        </div>

        {/* Purpose and Notes */}
        {(loan.purpose || loan.notes) && (
          <div className="mb-4 space-y-2">
            {loan.purpose && (
              <div className="text-sm">
                <span className="text-gray-500 font-medium">Purpose: </span>
                <span className="text-gray-700">{loan.purpose}</span>
              </div>
            )}
            {loan.notes && (
              <div className="text-sm">
                <span className="text-gray-500 font-medium">Notes: </span>
                <span className="text-gray-700">{loan.notes}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRestore(loan.id)}
            disabled={!canRestore}
            className="flex-1 h-9 text-sm font-medium disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {canRestore ? 'Restore' : 'Expired'}
          </Button>
          <Button
            size="sm"
            onClick={() => onPermanentDelete(loan.id)}
            className="flex-1 h-9 text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Forever
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrashPage() {
  const router = useRouter();
  const { user, isLender, initialized, isAuthenticated } = useAuth();

  const [trashedLoans, setTrashedLoans] = React.useState<LoanSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Modal states
  const [showRestoreConfirmation, setShowRestoreConfirmation] = React.useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false);
  const [selectedLoanId, setSelectedLoanId] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  console.log("🗑️ TRASH PAGE - State:", {
    user: user?.email,
    trashedLoansCount: trashedLoans.length,
    isLoading
  });

  // Auth check
  React.useEffect(() => {
    if (!initialized) return;
    
    if (!isAuthenticated || !isLender) {
      router.replace("/dashboard");
      return;
    }
  }, [initialized, isAuthenticated, isLender, router]);

  // Load trashed loans
  React.useEffect(() => {
    if (!user || !isLender) return;
    loadTrashedLoans();
  }, [user, isLender]);

  const loadTrashedLoans = async () => {
    try {
      setIsLoading(true);
      console.log("📊 Loading trashed loans for lender:", user?.id);

      const loans = await getTrashedLoans(user?.id || '');
      setTrashedLoans(loans);
    } catch (error) {
      console.error("❌ Failed to load trashed loans:", error);
      setTrashedLoans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTrashedLoans();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleRestoreRequest = (loanId: string) => {
    setSelectedLoanId(loanId);
    setShowRestoreConfirmation(true);
  };

  const handleDeleteRequest = (loanId: string) => {
    setSelectedLoanId(loanId);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedLoanId || !user) return;
    
    setIsProcessing(true);
    try {
      await restoreFromTrash(selectedLoanId, user.id);
      
      // Success
      setShowRestoreConfirmation(false);
      setSelectedLoanId(null);
      alert("Loan restored successfully!");
      
      // Refresh data
      await loadTrashedLoans();
    } catch (error) {
      alert(`Failed to restore loan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedLoanId || !user) return;
    
    setIsProcessing(true);
    try {
      await permanentlyDelete(selectedLoanId, user.id);
      
      // Success
      setShowDeleteConfirmation(false);
      setSelectedLoanId(null);
      alert("Loan permanently deleted!");
      
      // Refresh data
      await loadTrashedLoans();
    } catch (error) {
      alert(`Failed to delete loan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCleanupOldLoans = async () => {
    if (!user) return;
    
    try {
      const count = await cleanupOldTrashedLoans(user.id);
      if (count > 0) {
        alert(`Cleaned up ${count} expired loans`);
        await loadTrashedLoans();
      } else {
        alert("No expired loans to clean up");
      }
    } catch (error) {
      alert(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const selectedLoan = selectedLoanId ? trashedLoans.find(l => l.id === selectedLoanId) : null;

  if (!initialized || !isAuthenticated || !isLender) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Trash">
      <div className="bg-gray-50 min-h-screen">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  size="sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Trash2 className="h-6 w-6 mr-3 text-red-600" />
                    Trash
                  </h1>
                  <p className="text-gray-600">Deleted loans are kept here for 30 days</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {trashedLoans.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleCleanupOldLoans}
                    size="sm"
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Cleanup Expired
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white border-b border-gray-200">
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Trash2 className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Deleted Loans</p>
                    <p className="text-2xl font-bold text-red-900">{trashedLoans.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <RotateCcw className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-orange-700">Can Restore</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {trashedLoans.filter(l => l.deleted_at && canRestoreLoan(l.deleted_at)).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-8 w-8 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Expired</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {trashedLoans.filter(l => l.deleted_at && !canRestoreLoan(l.deleted_at)).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Loading trashed loans...</p>
            </div>
          ) : trashedLoans.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Trash is Empty</h3>
              <p className="text-gray-600 mb-6 text-sm max-w-sm mx-auto">
                When you delete loans, they'll appear here for 30 days before being permanently removed.
              </p>
              <Button
                onClick={() => router.push('/dashboard/lender/loans')}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Loans
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trashedLoans.map((loan) => (
                <TrashedLoanCard
                  key={loan.id}
                  loan={loan}
                  onRestore={handleRestoreRequest}
                  onPermanentDelete={handleDeleteRequest}
                />
              ))}
            </div>
          )}
        </div>

        {/* Restore Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showRestoreConfirmation}
          onClose={() => {
            setShowRestoreConfirmation(false);
            setSelectedLoanId(null);
          }}
          onConfirm={handleConfirmRestore}
          isDeleting={isProcessing}
          title="Restore Loan"
          message="Are you sure you want to restore this loan? It will be moved back to your active loans list."
          itemName={selectedLoan?.loan_number}
        />

        {/* Permanent Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteConfirmation}
          onClose={() => {
            setShowDeleteConfirmation(false);
            setSelectedLoanId(null);
          }}
          onConfirm={handleConfirmDelete}
          isDeleting={isProcessing}
          title="Delete Permanently"
          message="Are you sure you want to permanently delete this loan? This action cannot be undone and all related data will be lost forever."
          itemName={selectedLoan?.loan_number}
        />
      </div>
    </DashboardLayout>
  );
}