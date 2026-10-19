"use client";

import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext";

export default function AddCreditModal() {
  const {
    selectedCustomerIdForModal,
    closeModal,
    customersWithBalances,
    addCredit,
  } = useDashboard();

  const [customerId, setCustomerId] = useState(
    () => selectedCustomerIdForModal || customersWithBalances[0]?.id || ""
  );
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [receiptNo, setReceiptNo] = useState(
    () => `REC-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedCustomer = customersWithBalances.find((c) => c.id === customerId);
  const currentBalance = selectedCustomer?.currentBalance || 0;
  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    if (numAmount <= 0) {
      setError("Credit amount must be greater than zero.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter the description of items purchased on credit.");
      return;
    }

    setIsSubmitting(true);
    const result = addCredit({
      customerId,
      amount: numAmount,
      date,
      description: description.trim(),
      receiptNo: receiptNo.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to record credit.");
    } else {
      setSuccessMsg(`Rs. ${numAmount.toLocaleString()} credit added to ${selectedCustomer?.name}!`);
      setTimeout(() => {
        closeModal();
      }, 1200);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-credit-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-[#EADBCA] relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0E4D4] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-kf-orange flex items-center justify-center font-bold">
              ↑
            </div>
            <div>
              <h2 id="add-credit-title" className="text-lg font-extrabold text-kf-navy">
                Give Credit (Udhaar)
              </h2>
              <p className="text-xs text-[#556B82]">
                Log items purchased on credit to customer khata
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

        {/* Success Feedback */}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Selection */}
          <div>
            <label htmlFor="credit-customer-select" className="block text-xs font-bold text-kf-navy mb-1.5">
              Select Customer <span className="text-red-500">*</span>
            </label>
            <select
              id="credit-customer-select"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setError(null);
              }}
              required
              className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-semibold text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
            >
              <option value="" disabled>Select customer...</option>
              {customersWithBalances.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — Current balance: Rs. {c.currentBalance.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* New Balance Projection */}
          {selectedCustomer && (
            <div className="p-3 bg-[#FFF8F0] border border-[#FFE2C2] rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[#556B82]">Current: </span>
                <span className="font-bold text-kf-navy">Rs. {currentBalance.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[#556B82]">New Balance will be: </span>
                <span className="font-extrabold text-kf-orange text-sm">
                  Rs. {(currentBalance + numAmount).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="credit-amount-input" className="block text-xs font-bold text-kf-navy mb-1.5">
                Credit Amount (PKR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-[#8DA6BC]">
                  Rs.
                </span>
                <input
                  id="credit-amount-input"
                  type="number"
                  step="any"
                  min="1"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError(null);
                  }}
                  placeholder="0"
                  required
                  className="w-full h-11 pl-11 pr-4 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-sm font-bold text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="credit-date-input" className="block text-xs font-bold text-kf-navy mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                id="credit-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-semibold text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="credit-desc-input" className="block text-xs font-bold text-kf-navy mb-1.5">
              Purchased Items / Note <span className="text-red-500">*</span>
            </label>
            <input
              id="credit-desc-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 2 bags Dalda Ghee, 5kg Rice, 1 Carton Milk"
              required
              className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
            />
          </div>

          {/* Receipt No */}
          <div>
            <label htmlFor="credit-receipt-input" className="block text-xs font-bold text-kf-navy mb-1.5">
              Receipt / Bill # (Optional)
            </label>
            <input
              id="credit-receipt-input"
              type="text"
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value)}
              className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0E4D4]">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-kf-navy hover:bg-[#F5ECE1] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-[#FF6A00] to-[#FF7E1F] hover:from-[#E85E00] hover:to-[#FF6A00] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF6A00]/25 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? "Adding..." : "Add to Khata"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
