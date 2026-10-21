"use client";

import React, { useState, useMemo } from "react";
import { useDashboard, PaymentMethod, PaymentItemAllocation } from "../context/DashboardContext";
import WhatsAppShareModal from "./WhatsAppShareModal";
import { generatePaymentReceiptText } from "../utils/whatsapp";

function formatItemQuantityDisplay(qty: number, unit: string): string {
  if (unit === "kg" || unit === "liters" || unit === "L") {
    if (Math.abs(qty - 0.25) < 0.001) return `¼ ${unit} (0.25 ${unit})`;
    if (Math.abs(qty - 0.5) < 0.001) return `½ ${unit} (0.5 ${unit})`;
    if (Math.abs(qty - 0.75) < 0.001) return `¾ ${unit} (0.75 ${unit})`;
  }
  return `${qty} ${unit}`;
}

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
  const [paymentRecorded, setPaymentRecorded] = useState(false);
  const [recordedAmount, setRecordedAmount] = useState(0);
  const [recordedReceiptNo, setRecordedReceiptNo] = useState("REC-1001");
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  // Advanced toggles
  const [showCustomItems, setShowCustomItems] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [itemAllocations, setItemAllocations] = useState<Record<string, string>>({});

  const selectedCustomer = customersWithBalances.find((c) => c.id === customerId);
  const currentBalance = selectedCustomer?.currentBalance || 0;
  const numAmount = parseFloat(amount) || 0;
  const isOverBalance = numAmount > currentBalance && currentBalance > 0;

  const bill = getCustomerBill(customerId);
  const pendingItems = useMemo(
    () => (bill?.items || []).filter((item) => item.remainingBalance > 0),
    [bill]
  );
  const pendingItemsTotal = useMemo(
    () => pendingItems.reduce((sum, it) => sum + it.remainingBalance, 0),
    [pendingItems]
  );

  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    setItemAllocations({});
    setAmount("");
    setError(null);
  };

  // Manual allocation calculation
  const manualTotalAllocated = useMemo(() => {
    return Object.values(itemAllocations).reduce((sum, val) => {
      const n = parseFloat(val) || 0;
      return sum + (n > 0 ? n : 0);
    }, 0);
  }, [itemAllocations]);

  // Projected auto-allocation breakdown (FIFO)
  const autoAllocations = useMemo(() => {
    if (showCustomItems && manualTotalAllocated > 0) return [];
    let rem = numAmount;
    const list: { itemId: string; name: string; amount: number }[] = [];
    for (const it of pendingItems) {
      if (it.remainingBalance > 0 && rem > 0) {
        const alloc = Math.min(it.remainingBalance, rem);
        list.push({ itemId: it.id, name: it.name, amount: alloc });
        rem -= alloc;
      }
    }
    return list;
  }, [showCustomItems, manualTotalAllocated, numAmount, pendingItems]);

  const effectiveAllocatedAmount = useMemo(() => {
    if (showCustomItems && manualTotalAllocated > 0) {
      return manualTotalAllocated;
    }
    return Math.min(numAmount, pendingItemsTotal);
  }, [showCustomItems, manualTotalAllocated, numAmount, pendingItemsTotal]);

  const remainingCustomerBalance = Math.max(0, currentBalance - numAmount);

  const handleItemAllocationChange = (itemId: string, val: string) => {
    setItemAllocations((prev) => {
      const updated = { ...prev, [itemId]: val };
      const newTotal = Object.entries(updated).reduce((sum, [, v]) => {
        const n = parseFloat(v) || 0;
        return sum + (n > 0 ? n : 0);
      }, 0);
      if (newTotal > 0) {
        setAmount(newTotal.toString());
      }
      return updated;
    });
    setError(null);
  };

  const handleAllocateFullItem = (itemId: string, maxAmt: number) => {
    setItemAllocations((prev) => {
      const updated = { ...prev, [itemId]: maxAmt.toString() };
      const newTotal = Object.entries(updated).reduce((sum, [, v]) => {
        const n = parseFloat(v) || 0;
        return sum + (n > 0 ? n : 0);
      }, 0);
      setAmount(newTotal.toString());
      return updated;
    });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate clicks
    setError(null);

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    if (numAmount <= 0) {
      setError("Please enter a payment amount greater than zero.");
      return;
    }

    if (currentBalance > 0 && numAmount > currentBalance) {
      setError(
        `Payment cannot exceed outstanding balance of Rs. ${currentBalance.toLocaleString()}. Customer only owes Rs. ${currentBalance.toLocaleString()}.`
      );
      return;
    }

    let finalAllocations: PaymentItemAllocation[] | undefined;
    if (showCustomItems && manualTotalAllocated > 0) {
      if (manualTotalAllocated > numAmount) {
        setError(
          `Allocated item total (Rs. ${manualTotalAllocated.toLocaleString()}) cannot exceed payment amount (Rs. ${numAmount.toLocaleString()}).`
        );
        return;
      }
      finalAllocations = Object.entries(itemAllocations)
        .map(([itemId, valStr]) => {
          const item = pendingItems.find((i) => i.id === itemId);
          const allocatedNum = parseFloat(valStr) || 0;
          return {
            itemId,
            itemName: item ? item.name : itemId,
            allocatedAmount: allocatedNum,
          };
        })
        .filter((a) => a.allocatedAmount > 0);
    }

    setIsSubmitting(true);
    const result = recordPayment({
      customerId,
      amount: numAmount,
      date,
      paymentMethod,
      description: description.trim() || undefined,
      itemAllocations: finalAllocations,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to record payment.");
    } else {
      setPaymentRecorded(true);
      setRecordedAmount(numAmount);
      setRecordedReceiptNo(result.transaction?.receiptNo || "REC-1001");
      setSuccessMsg(
        `✓ Payment of Rs. ${numAmount.toLocaleString()} successfully recorded for ${selectedCustomer?.name}!`
      );
      setTimeout(() => {
        if (!showWhatsApp) {
          closeModal();
        }
      }, 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-payment-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-7 shadow-2xl border border-[#EADBCA] relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F0E4D4] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F8EE] text-[#1E7E34] flex items-center justify-center text-lg font-extrabold shadow-xs">
              💰
            </div>
            <div>
              <h2 id="record-payment-title" className="text-base sm:text-lg font-extrabold text-kf-navy">
                Receive Payment
              </h2>
              <p className="text-xs text-[#556B82]">
                Record payment collected from customer (Raqam Wasooli)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close modal"
            className="p-1.5 rounded-xl text-[#556B82] hover:bg-[#F5ECE1] hover:text-kf-navy transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-900 rounded-2xl text-xs font-bold flex items-center justify-between gap-2">
            <span>{successMsg}</span>
            <button
              type="button"
              onClick={() => setShowWhatsApp(true)}
              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[11px] font-bold cursor-pointer whitespace-nowrap"
            >
              💬 WhatsApp Receipt
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {paymentRecorded ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <div>
              <h3 className="text-base font-extrabold text-kf-navy">Payment Recorded!</h3>
              <p className="text-xs text-[#556B82] mt-0.5">
                Receipt #{recordedReceiptNo} · Rs. {recordedAmount.toLocaleString()} from {selectedCustomer?.name}
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowWhatsApp(true)}
                className="py-2.5 px-4 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>💬 Send WhatsApp Receipt</span>
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-kf-navy rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Step 1: Customer Selection */}
            <div>
              <label htmlFor="payment-customer-select" className="block text-xs font-bold text-kf-navy mb-1.5">
                1. Select Customer <span className="text-red-500">*</span>
              </label>
              <select
                id="payment-customer-select"
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                required
                className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-2xl text-xs font-bold text-kf-navy outline-none focus:bg-white focus:border-kf-orange transition-all cursor-pointer"
              >
                <option value="" disabled>Choose Customer...</option>
                {customersWithBalances.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.currentBalance > 0 ? `Owes Rs. ${c.currentBalance.toLocaleString()}` : "Cleared (Rs. 0)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Outstanding Balance Highlight Card */}
            {selectedCustomer && (
              <div className="p-3.5 bg-gradient-to-r from-[#FFF5EA] to-[#FFF9F3] border border-[#FFDEC0] rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#A04500] uppercase tracking-wider block">
                    Current Outstanding Balance
                  </span>
                  <span className="text-xl font-extrabold text-[#D94F00]">
                    Rs. {currentBalance.toLocaleString()}
                  </span>
                </div>
                {currentBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setAmount(currentBalance.toString());
                      setError(null);
                    }}
                    className="px-3 py-1.5 bg-[#FF6A00] hover:bg-[#E55F00] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors"
                  >
                    Full Balance
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Amount Received */}
            <div>
              <label htmlFor="payment-amount-input" className="block text-xs font-bold text-kf-navy mb-1.5">
                2. Amount Received (Rs.) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#7B90A2]">
                  Rs.
                </span>
                <input
                  id="payment-amount-input"
                  type="number"
                  step="any"
                  min="1"
                  max={currentBalance > 0 ? currentBalance : undefined}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. 2000"
                  required
                  className="w-full h-12 pl-11 pr-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-2xl text-base font-extrabold text-kf-navy outline-none focus:bg-white focus:border-kf-orange transition-all"
                />
              </div>
              {isOverBalance && (
                <p className="text-[11px] font-semibold text-red-600 mt-1">
                  Amount exceeds outstanding balance (Rs. {currentBalance.toLocaleString()}).
                </p>
              )}
            </div>

            {/* Step 3: Payment Method */}
            <div>
              <label className="block text-xs font-bold text-kf-navy mb-1.5">
                3. Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Cash", "EasyPaisa", "JazzCash"] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      paymentMethod === method
                        ? "bg-kf-navy text-white border-kf-navy shadow-xs"
                        : "bg-[#FAF4EC] text-[#556B82] border-[#EADBCA] hover:bg-[#F2E8DC]"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Card (Before Saving) — Core Requirement */}
            <div className="p-3.5 bg-[#F6F9FC] border border-[#DCE6F0] rounded-2xl space-y-2">
              <div className="text-[11px] font-extrabold text-kf-navy uppercase tracking-wider border-b border-[#E3EDF5] pb-1.5">
                Payment Summary
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#556B82]">Amount Received:</span>
                <span className="font-extrabold text-kf-navy">
                  Rs. {numAmount > 0 ? numAmount.toLocaleString() : "0"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#556B82]">Allocated to Pending Items:</span>
                <span className="font-extrabold text-green-700">
                  Rs. {effectiveAllocatedAmount.toLocaleString()}
                  {!showCustomItems && pendingItems.length > 0 && numAmount > 0 && (
                    <span className="text-[10px] font-medium text-green-600 block text-right">
                      (Auto-allocated oldest unpaid first)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-1.5 border-t border-[#E3EDF5]">
                <span className="font-bold text-kf-navy">Remaining Customer Balance:</span>
                <span className={`font-extrabold ${remainingCustomerBalance > 0 ? "text-[#D94F00]" : "text-green-700"}`}>
                  Rs. {remainingCustomerBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Optional: Choose Specific Items Accordion */}
            {pendingItems.length > 0 && (
              <div className="border border-[#EADBCA] rounded-2xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setShowCustomItems(!showCustomItems)}
                  className="w-full py-2.5 px-3.5 flex items-center justify-between text-xs font-bold text-[#556B82] hover:text-kf-navy hover:bg-[#FAF4EC] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span>📋</span>
                    <span>Choose Specific Items to Pay (Optional)</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                      {pendingItems.length} Unpaid
                    </span>
                  </span>
                  <span>{showCustomItems ? "▲ Hide" : "▼ Choose"}</span>
                </button>

                {showCustomItems && (
                  <div className="p-3 bg-[#FCF9F5] border-t border-[#EADBCA] space-y-2">
                    <p className="text-[11px] text-[#7B90A2]">
                      By default, payments auto-settle the oldest unpaid items. Use below only if customer asked to pay for specific goods.
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {pendingItems.map((item) => {
                        const allocatedVal = itemAllocations[item.id] || "";
                        return (
                          <div
                            key={item.id}
                            className="p-2.5 bg-white border border-[#EADBCA] rounded-xl flex items-center justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-kf-navy truncate block">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-[#7B90A2]">
                                {formatItemQuantityDisplay(item.quantity, item.unit)} · Unpaid: Rs. {item.remainingBalance.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAllocateFullItem(item.id, item.remainingBalance)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Full
                              </button>
                              <input
                                type="number"
                                min="0"
                                max={item.remainingBalance}
                                value={allocatedVal}
                                onChange={(e) => handleItemAllocationChange(item.id, e.target.value)}
                                placeholder="0"
                                className="w-20 h-8 px-2 text-right bg-[#FAF4EC] border border-[#EADBCA] rounded-lg text-xs font-bold text-kf-navy outline-none focus:bg-white focus:border-kf-orange"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Optional Details Accordion (Date, Notes) */}
            <div className="border border-[#EADBCA] rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="w-full py-2 px-3.5 flex items-center justify-between text-xs font-bold text-[#7B90A2] hover:text-kf-navy hover:bg-[#FAF4EC] transition-colors cursor-pointer"
              >
                <span>⚙️ Date & Notes (Optional)</span>
                <span>{showMoreOptions ? "▲" : "▼"}</span>
              </button>
              {showMoreOptions && (
                <div className="p-3 bg-[#FCF9F5] border-t border-[#EADBCA] space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-kf-navy mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full h-9 px-2.5 bg-white border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-kf-navy mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Paid in cash at shop counter"
                      className="w-full h-9 px-2.5 bg-white border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              id="btn-save-payment"
              type="submit"
              disabled={isSubmitting || numAmount <= 0 || isOverBalance}
              className={`w-full h-12 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                isSubmitting || numAmount <= 0 || isOverBalance
                  ? "bg-gray-400 cursor-not-allowed opacity-70"
                  : "bg-gradient-to-r from-[#1E7E34] to-[#28A745] hover:from-[#19692C] hover:to-[#218838] shadow-green-600/30 active:scale-[0.99]"
              }`}
            >
              <span>💾 Save Payment</span>
              {numAmount > 0 && !isOverBalance && (
                <span>(Rs. {numAmount.toLocaleString()})</span>
              )}
            </button>
          </form>
        )}

        {/* WhatsApp Share Modal Integration */}
        {selectedCustomer && (
          <WhatsAppShareModal
            isOpen={showWhatsApp}
            onClose={() => {
              setShowWhatsApp(false);
              closeModal();
            }}
            customerPhone={selectedCustomer.phone}
            customerName={selectedCustomer.name}
            title="Send Payment Receipt on WhatsApp"
            initialMessageEn={generatePaymentReceiptText({
              customerName: selectedCustomer.name,
              amountPaid: recordedAmount,
              newBalance: remainingCustomerBalance,
              receiptNo: recordedReceiptNo,
              date,
              paymentMethod,
              lang: "en",
            })}
            initialMessageUr={generatePaymentReceiptText({
              customerName: selectedCustomer.name,
              amountPaid: recordedAmount,
              newBalance: remainingCustomerBalance,
              receiptNo: recordedReceiptNo,
              date,
              paymentMethod,
              lang: "ur",
            })}
          />
        )}
      </div>
    </div>
  );
}
