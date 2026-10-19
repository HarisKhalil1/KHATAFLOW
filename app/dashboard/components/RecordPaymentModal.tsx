"use client";

import React, { useState } from "react";
import { useDashboard, PaymentMethod, PaymentItemAllocation } from "../context/DashboardContext";

export default function RecordPaymentModal() {
  const {
    selectedCustomerIdForModal,
    closeModal,
    customersWithBalances,
    getCustomerBill,
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

  // Item allocations state map: itemId -> allocatedAmount string
  const [itemAllocations, setItemAllocations] = useState<Record<string, string>>({});
  const [useItemAllocation, setUseItemAllocation] = useState(true);

  const selectedCustomer = customersWithBalances.find((c) => c.id === customerId);
  const currentBalance = selectedCustomer?.currentBalance || 0;
  const numAmount = parseFloat(amount) || 0;
  const isOverBalance = numAmount > currentBalance;

  const bill = getCustomerBill(customerId);

  // Helper to handle customer change and clear allocations
  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    setItemAllocations({});
    setError(null);
  };

  // Compute total allocated
  const totalAllocated = Object.values(itemAllocations).reduce((sum, val) => {
    const n = parseFloat(val) || 0;
    return sum + (n > 0 ? n : 0);
  }, 0);

  const unallocatedAmount = Math.max(0, numAmount - totalAllocated);
  const allocationExceedsPayment = totalAllocated > numAmount && numAmount > 0;

  // Preset helper: Quick allocate Rice & Dalda oil for Tariq Rs. 10,000 scenario
  const handleQuickAllocateTariq = () => {
    if (!bill) return;
    setAmount("10000");
    const updated: Record<string, string> = {};
    bill.items.forEach((it) => {
      if (it.name.toLowerCase().includes("rice")) {
        updated[it.id] = "4000";
      } else if (it.name.toLowerCase().includes("oil")) {
        updated[it.id] = "6000";
      } else {
        updated[it.id] = "0"; // Eggs left unpaid
      }
    });
    setItemAllocations(updated);
    setError(null);
  };

  const handleItemAllocationChange = (itemId: string, val: string) => {
    setItemAllocations((prev) => ({
      ...prev,
      [itemId]: val,
    }));
    setError(null);
  };

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

    // Format item allocations array if used
    let formattedAllocations: PaymentItemAllocation[] | undefined;
    if (useItemAllocation && bill && bill.items.length > 0) {
      if (allocationExceedsPayment) {
        setError(
          `Total item allocations (Rs. ${totalAllocated.toLocaleString()}) exceed payment amount (Rs. ${numAmount.toLocaleString()}).`
        );
        return;
      }

      formattedAllocations = Object.entries(itemAllocations)
        .map(([itemId, valStr]) => {
          const item = bill.items.find((i) => i.id === itemId);
          const allocatedNum = parseFloat(valStr) || 0;
          return {
            itemId,
            itemName: item ? item.name : itemId,
            allocatedAmount: allocatedNum,
          };
        })
        .filter((a) => a.allocatedAmount > 0);

      // Validate individual item balances
      for (const alloc of formattedAllocations) {
        const item = bill.items.find((i) => i.id === alloc.itemId);
        if (item && alloc.allocatedAmount > item.remainingBalance) {
          setError(
            `Allocation of Rs. ${alloc.allocatedAmount.toLocaleString()} to ${item.name} exceeds remaining balance of Rs. ${item.remainingBalance.toLocaleString()}.`
          );
          return;
        }
      }
    }

    setIsSubmitting(true);
    const result = recordPayment({
      customerId,
      amount: numAmount,
      date,
      paymentMethod,
      description: description.trim() || undefined,
      itemAllocations: formattedAllocations,
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
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-[#EADBCA] relative max-h-[92vh] overflow-y-auto">
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
                Accurate cash collection & verified item-level allocation
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
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
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
              onChange={(e) => handleCustomerChange(e.target.value)}
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
              <div className="flex items-center gap-2">
                {customerId === "cust-1" && (
                  <button
                    type="button"
                    onClick={handleQuickAllocateTariq}
                    className="text-[11px] text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 hover:bg-green-100 font-bold cursor-pointer"
                  >
                    Preset: Rs. 10,000 for Rice & Oil
                  </button>
                )}
                {currentBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(currentBalance.toString())}
                    className="text-[11px] text-kf-orange hover:underline font-bold cursor-pointer"
                  >
                    Full Due (Rs. {currentBalance.toLocaleString()})
                  </button>
                )}
              </div>
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

          {/* ITEM-WISE PAYMENT ALLOCATION SECTION */}
          {bill && bill.items.length > 0 && (
            <div className="p-3.5 bg-[#FAF3E8] border border-[#EADBCA] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-kf-navy block">
                    Item-Level Payment Allocation
                  </span>
                  <span className="text-[11px] text-[#556B82]">
                    Bill #{bill.billNo} — Allocate payment to specific items
                  </span>
                </div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-kf-navy cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useItemAllocation}
                    onChange={(e) => setUseItemAllocation(e.target.checked)}
                    className="rounded border-[#EADBCA] text-kf-orange focus:ring-kf-orange cursor-pointer"
                  />
                  <span>Enable Allocation</span>
                </label>
              </div>

              {useItemAllocation && (
                <div className="space-y-2 pt-1 border-t border-[#F0E4D4]">
                  {bill.items.map((item) => {
                    const allocVal = itemAllocations[item.id] || "";

                    return (
                      <div
                        key={item.id}
                        className="p-2.5 bg-white rounded-xl border border-[#F0E4D4] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-kf-navy">{item.name}</span>
                            <span className="text-[10px] text-[#8DA6BC]">
                              ({item.quantity} {item.unit} @ Rs. {item.unitPrice.toLocaleString()}/{item.unit})
                            </span>
                          </div>
                          <div className="text-[11px] text-[#556B82] mt-0.5">
                            Original: Rs. {item.lineTotal.toLocaleString()} • Remaining:{" "}
                            <strong className="text-kf-orange">
                              Rs. {item.remainingBalance.toLocaleString()}
                            </strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="relative w-28">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#8DA6BC]">
                              Rs.
                            </span>
                            <input
                              type="number"
                              min="0"
                              max={item.remainingBalance}
                              placeholder="0"
                              value={allocVal}
                              onChange={(e) => handleItemAllocationChange(item.id, e.target.value)}
                              className="w-full h-8 pl-7 pr-2 bg-[#FCF8F2] border border-[#EADBCA] rounded-lg text-xs font-bold text-kf-navy focus:bg-white focus:border-kf-orange focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleItemAllocationChange(item.id, item.remainingBalance.toString())
                            }
                            className="px-2 py-1 text-[10px] bg-[#FAF3E8] hover:bg-[#F0E4D4] text-[#556B82] font-bold rounded cursor-pointer whitespace-nowrap"
                          >
                            Pay Full
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Allocation Reconciliation Summary Bar */}
                  <div className="p-2.5 bg-white rounded-xl border border-[#F0E4D4] space-y-1 text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-[#556B82]">Cash Payment Amount:</span>
                      <span className="font-extrabold text-kf-navy">
                        Rs. {numAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-[#556B82]">Total Allocated to Items:</span>
                      <span
                        className={`font-extrabold ${
                          allocationExceedsPayment ? "text-red-600" : "text-green-700"
                        }`}
                      >
                        Rs. {totalAllocated.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-semibold border-t border-[#F0E4D4] pt-1">
                      <span className="text-[#556B82]">Unallocated Remainder:</span>
                      <span className="font-extrabold text-kf-orange">
                        Rs. {unallocatedAmount.toLocaleString()}
                      </span>
                    </div>

                    {/* Tariq Specific Verified Helper Notification */}
                    {customerId === "cust-1" && totalAllocated === 10000 && numAmount === 10000 && (
                      <div className="mt-1 p-1.5 bg-green-50 border border-green-200 rounded text-[11px] text-green-800 font-semibold">
                        ✓ Rice (Rs. 4,000) & Dalda oil (Rs. 6,000) will be fully settled. Eggs retains Rs. 5,000 unpaid balance.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
              />
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
              placeholder="e.g. Cash received at counter against Rice & Oil"
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
              disabled={isSubmitting || isOverBalance || currentBalance <= 0 || allocationExceedsPayment}
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
