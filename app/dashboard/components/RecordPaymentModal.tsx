"use client";

import React, { useState } from "react";
import { useDashboard, PaymentMethod } from "../context/DashboardContext";

export default function RecordPaymentModal() {
  const {
    selectedCustomerIdForModal,
    closeModal,
    customersWithBalances,
    recordPayment,
  } = useDashboard();

  const [customerId, setCustomerId] = useState(
    () => selectedCustomerIdForModal || customersWithBalances[0]?.id || ""
  );
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedCustomer = customersWithBalances.find((c) => c.id === customerId);
  const currentBalance = selectedCustomer?.currentBalance || 0;
  const numAmount = parseFloat(amount) || 0;
  const isOverBalance = numAmount > currentBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    if (numAmount <= 0) {
      setError("Payment amount must be greater than zero.");
      return;
    }

    if (isOverBalance) {
      setError(
        `Payment cannot exceed outstanding balance of Rs. ${currentBalance.toLocaleString()}. Customer only owes Rs. ${currentBalance.toLocaleString()}.`
      );
      return;
    }

    setIsSubmitting(true);
    const result = recordPayment({
      customerId,
      amount: numAmount,
      date,
      paymentMethod,
      description: description || `Payment received via ${paymentMethod}`,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to record payment.");
    } else {
      setSuccessMsg(`Payment of Rs. ${numAmount.toLocaleString()} successfully recorded!`);
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
      aria-labelledby="record-payment-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-[#EADBCA] relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0E4D4] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold">
              ↓
            </div>
            <div>
              <h2 id="record-payment-title" className="text-lg font-extrabold text-kf-navy">
                Record Customer Payment
              </h2>
              <p className="text-xs text-[#556B82]">
                Reduces customer udhaar balance and logs cash received
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
            <label htmlFor="payment-customer-select" className="block text-xs font-bold text-kf-navy mb-1.5">
              Select Customer <span className="text-red-500">*</span>
            </label>
            <select
              id="payment-customer-select"
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
                  {c.name} — Rs. {c.currentBalance.toLocaleString()} {c.currentBalance === 0 ? "(Cleared)" : "owed"}
                </option>
              ))}
            </select>
          </div>

          {/* Current Balance Notice */}
          {selectedCustomer && (
            <div className="p-3 bg-[#FFF8F0] border border-[#FFE2C2] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#556B82] font-semibold">Current Outstanding Balance:</span>
              <span className="font-extrabold text-kf-navy text-sm">
                Rs. {currentBalance.toLocaleString()}
              </span>
            </div>
          )}

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="payment-amount-input" className="text-xs font-bold text-kf-navy">
                Payment Amount (PKR) <span className="text-red-500">*</span>
              </label>
              {currentBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(currentBalance.toString())}
                  className="text-[11px] text-kf-orange hover:underline font-bold cursor-pointer"
                >
                  Pay Full Balance (Rs. {currentBalance.toLocaleString()})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-[#8DA6BC]">
                Rs.
              </span>
              <input
                id="payment-amount-input"
                type="number"
                step="any"
                min="1"
                max={currentBalance}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="0"
                required
                className={`w-full h-11 pl-11 pr-4 bg-[#FCF7F0] border rounded-xl text-sm font-bold text-kf-navy focus:bg-white focus:outline-none transition-all ${
                  isOverBalance
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-[#EADBCA] focus:border-kf-orange focus:ring-1 focus:ring-kf-orange"
                }`}
              />
            </div>
            {isOverBalance && (
              <p className="text-[11px] text-red-600 font-semibold mt-1">
                Amount exceeds customer balance of Rs. {currentBalance.toLocaleString()}.
              </p>
            )}
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="payment-method-select" className="block text-xs font-bold text-kf-navy mb-1.5">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <select
                id="payment-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-semibold text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
              >
                <option value="Cash">Cash (Shop Counter)</option>
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label htmlFor="payment-date-input" className="block text-xs font-bold text-kf-navy mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                id="payment-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-semibold text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
              >
              </input>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="payment-desc-input" className="block text-xs font-bold text-kf-navy mb-1.5">
              Note / Reference (Optional)
            </label>
            <input
              id="payment-desc-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Paid in full for sugar & tea bags"
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
              disabled={isSubmitting || isOverBalance || currentBalance <= 0}
              className="px-5 py-2.5 bg-gradient-to-r from-[#FF6A00] to-[#FF7E1F] hover:from-[#E85E00] hover:to-[#FF6A00] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF6A00]/25 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? "Recording..." : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
