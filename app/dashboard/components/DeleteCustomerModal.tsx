"use client";

import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext";

export default function DeleteCustomerModal() {
  const {
    selectedCustomerIdForModal,
    closeModal,
    openModal,
    getCustomerWithBalance,
    getCustomerFinancialSummary,
    archiveCustomer,
    deleteCustomer,
  } = useDashboard();

  const [archiveReason, setArchiveReason] = useState("");
  const [showPermanentSection, setShowPermanentSection] = useState(false);
  const [typedConfirmName, setTypedConfirmName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!selectedCustomerIdForModal) return null;

  const customer = getCustomerWithBalance(selectedCustomerIdForModal);
  if (!customer) return null;

  const summary = getCustomerFinancialSummary(customer.id);
  const isNameConfirmed = typedConfirmName.trim() === customer.name.trim();

  // Handle Safe Archive
  const handleArchive = () => {
    setError(null);
    setIsSubmitting(true);
    const result = archiveCustomer(customer.id, archiveReason.trim() || undefined);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to archive customer.");
    } else {
      setSuccessMsg(`Customer "${customer.name}" has been safely archived. Financial records preserved.`);
      setTimeout(() => {
        closeModal();
      }, 1200);
    }
  };

  // Handle Permanent Delete
  const handlePermanentDelete = (force: boolean) => {
    setError(null);
    if (force && !isNameConfirmed) {
      setError(`Please type the exact customer name "${customer.name}" to confirm.`);
      return;
    }

    setIsSubmitting(true);
    const result = deleteCustomer(customer.id, force);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to delete customer.");
    } else {
      setSuccessMsg(`Customer "${customer.name}" was permanently removed.`);
      setTimeout(() => {
        closeModal();
      }, 1200);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-customer-modal-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-[#EADBCA] relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#F0E4D4] mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm ${
                summary.hasFinancialHistory ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
              }`}
            >
              {summary.hasFinancialHistory ? "📦" : "🗑️"}
            </div>
            <div>
              <h2 id="delete-customer-modal-title" className="text-base sm:text-lg font-extrabold text-kf-navy">
                {summary.hasFinancialHistory ? "Archive or Delete Customer" : "Delete Customer"}
              </h2>
              <p className="text-xs text-[#556B82] font-medium">
                Customer: <strong className="text-kf-navy">{customer.name}</strong> ({customer.phone})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#556B82] hover:bg-[#F5ECE1] hover:text-kf-navy transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Feedback Alert Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-xs text-green-900 font-bold flex items-center gap-2">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Case 1: Customer Has Financial History */}
        {summary.hasFinancialHistory ? (
          <div className="space-y-4">
            {/* Financial History Detected Warning */}
            <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-black text-amber-900 mb-2">
                <span>⚠️</span>
                <span>Financial History Detected</span>
              </div>
              <p className="text-xs text-amber-950/80 mb-3 leading-relaxed">
                <strong>{customer.name}</strong> has financial records in the shop ledger. Permanently deleting this customer would violate record-keeping rules and purge their transaction history.
              </p>

              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 bg-white/90 p-2.5 rounded-xl border border-amber-200 text-center">
                <div>
                  <span className="text-[10px] text-[#556B82] uppercase font-bold block">Outstanding</span>
                  <span className="text-xs font-black text-kf-orange">
                    Rs. {summary.currentBalance.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#556B82] uppercase font-bold block">Bills</span>
                  <span className="text-xs font-black text-kf-navy">{summary.billsCount} Bill(s)</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#556B82] uppercase font-bold block">Transactions</span>
                  <span className="text-xs font-black text-kf-navy">{summary.transactionsCount} Entries</span>
                </div>
              </div>
            </div>

            {/* Recommended Safe Action: Archive */}
            <div className="p-4 bg-[#FAF3E8] border-2 border-kf-orange/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-kf-navy flex items-center gap-1.5">
                  <span>📦</span>
                  <span>Archive Customer (Recommended &amp; Reversible)</span>
                </span>
                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-black rounded-md">
                  Safe
                </span>
              </div>
              <p className="text-xs text-[#556B82] leading-relaxed">
                Hides <strong>{customer.name}</strong> from active customer lists and prevents new credit or payments. All existing bills, payments, and ledger transactions are 100% preserved. You can restore them anytime from the <strong>Archived</strong> tab.
              </p>

              <div>
                <label htmlFor="archive-reason" className="block text-[11px] font-bold text-kf-navy mb-1">
                  Reason for Archiving (Optional)
                </label>
                <input
                  id="archive-reason"
                  type="text"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  placeholder="e.g. Moved away, Account settled, Inactive customer"
                  className="w-full h-9 px-3 bg-white border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:outline-none focus:border-kf-orange"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-2 text-xs font-bold text-kf-navy hover:bg-[#F0E4D4] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleArchive}
                  className="px-4 py-2 bg-gradient-to-r from-[#FF6A00] to-[#FF7E1F] hover:from-[#E85E00] hover:to-[#FF6A00] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>📦</span>
                  <span>{isSubmitting ? "Archiving..." : "Archive Customer Safely"}</span>
                </button>
              </div>
            </div>

            {/* Advanced Irreversible Deletion Option (Accordion) */}
            <div className="border border-red-200/80 rounded-2xl overflow-hidden bg-red-50/30">
              <button
                type="button"
                onClick={() => setShowPermanentSection(!showPermanentSection)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-red-700 hover:bg-red-50/80 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Advanced: Permanent Deletion (Purge All History)</span>
                </span>
                <span className="text-[10px]">{showPermanentSection ? "▲ Hide" : "▼ Expand"}</span>
              </button>

              {showPermanentSection && (
                <div className="p-4 pt-1 border-t border-red-200/60 space-y-3">
                  <p className="text-[11px] text-red-900 leading-relaxed font-semibold">
                    Permanent deletion is irreversible. It will wipe this customer and remove all their {summary.billsCount} bill(s) and {summary.transactionsCount} transaction(s) permanently.
                  </p>

                  <div className="p-3 bg-white rounded-xl border border-red-200 space-y-1.5">
                    <label htmlFor="confirm-customer-name" className="block text-[11px] font-bold text-kf-navy">
                      Type exact customer name <span className="text-red-600 underline font-extrabold">{customer.name}</span> to unlock:
                    </label>
                    <input
                      id="confirm-customer-name"
                      type="text"
                      value={typedConfirmName}
                      onChange={(e) => setTypedConfirmName(e.target.value)}
                      placeholder={customer.name}
                      className="w-full h-9 px-3 bg-red-50/30 border border-red-200 rounded-xl text-xs font-bold text-red-900 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!isNameConfirmed || isSubmitting}
                      onClick={() => handlePermanentDelete(true)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🗑️</span>
                      <span>Permanently Delete Customer &amp; Records</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Case 2: Empty Customer (No financial records) */
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-blue-900">
                <span>✓</span>
                <span>No Financial History</span>
              </div>
              <p className="text-xs text-blue-950/80 leading-relaxed">
                <strong>{customer.name}</strong> has no bills, no payments, and Rs. 0 outstanding balance. This customer can be deleted permanently without affecting any financial records.
              </p>
            </div>

            <div className="p-3 bg-[#FAF3E8] border border-[#EADBCA] rounded-xl text-xs text-[#556B82]">
              Are you sure you want to permanently delete <strong>{customer.name}</strong>?
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 text-xs font-bold text-kf-navy hover:bg-[#F5ECE1] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handlePermanentDelete(false)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>🗑️</span>
                <span>{isSubmitting ? "Deleting..." : "Confirm Delete Customer"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Alternative: Edit Details instead */}
        <div className="mt-5 pt-3 border-t border-[#F0E4D4] flex items-center justify-between text-xs text-[#556B82]">
          <span>Need to update phone, name, or address instead?</span>
          <button
            type="button"
            onClick={() => {
              openModal("edit-customer", customer.id);
            }}
            className="text-kf-orange font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>✏️</span>
            <span>Edit Customer Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
