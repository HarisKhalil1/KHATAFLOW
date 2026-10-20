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

  // Item allocations state map: itemId -> allocatedAmount string
  const [itemAllocations, setItemAllocations] = useState<Record<string, string>>({});
  const [useItemAllocation, setUseItemAllocation] = useState(true);

  const selectedCustomer = customersWithBalances.find((c) => c.id === customerId);
  const currentBalance = selectedCustomer?.currentBalance || 0;
  const numAmount = parseFloat(amount) || 0;
  const isOverBalance = numAmount > currentBalance;

  const bill = getCustomerBill(customerId);

  // Pending items that have remaining balance > 0
  const pendingItems = useMemo(() => (bill?.items || []).filter((item) => item.remainingBalance > 0), [bill]);
  const hasBillItemsOnRecord = (bill?.items || []).length > 0;

  // Helper to handle customer change and clear allocations
  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    setItemAllocations({});
    setAmount("");
    setError(null);
  };

  // Compute total allocated across items
  const totalAllocated = useMemo(() => {
    return Object.values(itemAllocations).reduce((sum, val) => {
      const n = parseFloat(val) || 0;
      return sum + (n > 0 ? n : 0);
    }, 0);
  }, [itemAllocations]);

  const unallocatedAmount = Math.max(0, numAmount - totalAllocated);
  const allocationExceedsPayment = totalAllocated > numAmount && numAmount > 0;

  // Two-way sync: changing item allocation automatically updates amount
  const handleItemAllocationChange = (itemId: string, val: string) => {
    setItemAllocations((prev) => {
      const updated = {
        ...prev,
        [itemId]: val,
      };

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

  // Quick action: Allocate specific amount to an item
  const handleAllocateSpecific = (itemId: string, allocAmt: number) => {
    setItemAllocations((prev) => {
      const updated = {
        ...prev,
        [itemId]: allocAmt.toString(),
      };

      const newTotalAlloc = Object.entries(updated).reduce((sum, [, val]) => {
        const n = parseFloat(val) || 0;
        return sum + (n > 0 ? n : 0);
      }, 0);

      setAmount(newTotalAlloc.toString());
      return updated;
    });
    setError(null);
  };

  // Formatted allocations array for submission
  const formattedAllocations: PaymentItemAllocation[] = useMemo(() => {
    if (!useItemAllocation || pendingItems.length === 0) return [];
    return Object.entries(itemAllocations)
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
  }, [useItemAllocation, pendingItems, itemAllocations]);

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

    if (useItemAllocation && pendingItems.length > 0) {
      if (allocationExceedsPayment) {
        setError(
          `Total item allocations (Rs. ${totalAllocated.toLocaleString()}) exceed payment amount (Rs. ${numAmount.toLocaleString()}).`
        );
        return;
      }

      // Validate individual item balances
      for (const alloc of formattedAllocations) {
        const item = pendingItems.find((i) => i.id === alloc.itemId);
        if (item && alloc.allocatedAmount > item.remainingBalance) {
          setError(
            `Allocation of Rs. ${alloc.allocatedAmount.toLocaleString()} to ${item.name} exceeds its remaining balance of Rs. ${item.remainingBalance.toLocaleString()}.`
          );
          return;
        }
      }
    }

    setIsSubmitting(true);
    const result = recordPayment({
      customerId,
      billId: bill?.id,
      amount: numAmount,
      date,
      paymentMethod,
      description: description.trim() || undefined,
      itemAllocations: formattedAllocations.length > 0 ? formattedAllocations : undefined,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to record payment.");
    } else {
      const rec = result.transaction?.receiptNo || "REC-PAID";
      setRecordedReceiptNo(rec);
      setRecordedAmount(numAmount);
      setSuccessMsg(`Payment of Rs. ${numAmount.toLocaleString()} successfully recorded!`);
      setPaymentRecorded(true);
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
                Accurate payment recording &amp; live bill outstanding recalculation
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

        {paymentRecorded ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <div>
              <h3 className="text-base font-extrabold text-kf-navy">Payment Recorded Successfully</h3>
              <p className="text-xs text-[#556B82] mt-1 max-w-sm mx-auto">
                Rs. {recordedAmount.toLocaleString()} received from <strong>{selectedCustomer?.name}</strong>.
                Remaining balance: <strong className="text-green-700">Rs. {Math.max(0, currentBalance - recordedAmount).toLocaleString()}</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowWhatsApp(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>💬 Send WhatsApp Receipt</span>
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#FAF3E8] hover:bg-[#F0E4D4] text-kf-navy border border-[#EADBCA] text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Done
              </button>
            </div>

            <WhatsAppShareModal
              isOpen={showWhatsApp}
              onClose={() => {
                setShowWhatsApp(false);
                closeModal();
              }}
              customerName={selectedCustomer?.name || ""}
              customerPhone={selectedCustomer?.phone || ""}
              title="Send Payment Receipt on WhatsApp"
              initialMessageEn={generatePaymentReceiptText({
                customerName: selectedCustomer?.name || "",
                receiptNo: recordedReceiptNo,
                date,
                amountPaid: recordedAmount,
                newBalance: Math.max(0, currentBalance - recordedAmount),
                paymentMethod,
                lang: "en",
              })}
              initialMessageUr={generatePaymentReceiptText({
                customerName: selectedCustomer?.name || "",
                receiptNo: recordedReceiptNo,
                date,
                amountPaid: recordedAmount,
                newBalance: Math.max(0, currentBalance - recordedAmount),
                paymentMethod,
                lang: "ur",
              })}
            />
          </div>
        ) : (
          <>
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

              {/* Bill Overview Strip */}
              {bill && (
                <div className="p-3 bg-[#FAF3E8] border border-[#EADBCA] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-kf-navy block">
                      Bill #{bill.billNo}
                    </span>
                    <span className="text-[11px] text-[#556B82]">
                      Total: Rs. {bill.totalAmount.toLocaleString()} • Paid: Rs. {bill.paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#8DA6BC] uppercase font-bold block">
                      Outstanding Due
                    </span>
                    <span className="font-extrabold text-kf-orange text-sm">
                      Rs. {bill.remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="payment-amount-input" className="text-xs font-bold text-kf-navy">
                    Payment Amount to Record (PKR) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {currentBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAmount(currentBalance.toString());
                          setError(null);
                        }}
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
                    placeholder="Enter exact payment received..."
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
              {hasBillItemsOnRecord && (
                <div className="p-3.5 bg-[#FAF3E8] border border-[#EADBCA] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-kf-navy block">
                        Item-Level Payment Allocation
                      </span>
                      <span className="text-[11px] text-[#556B82]">
                        Bill #{bill?.billNo} — Allocate payment to specific items or leave unallocated
                      </span>
                    </div>
                    {pendingItems.length > 0 && (
                      <label className="flex items-center gap-1.5 text-xs font-bold text-kf-navy cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useItemAllocation}
                          onChange={(e) => setUseItemAllocation(e.target.checked)}
                          className="rounded border-[#EADBCA] text-kf-orange focus:ring-kf-orange cursor-pointer"
                        />
                        <span>Enable Allocation</span>
                      </label>
                    )}
                  </div>

                  {/* When all items on bill are fully cleared */}
                  {pendingItems.length === 0 ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-semibold flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>✓ All items on Bill #{bill?.billNo} are fully paid. No pending item dues.</span>
                    </div>
                  ) : useItemAllocation && (
                    <div className="space-y-2.5 pt-1 border-t border-[#F0E4D4]">
                      {pendingItems.map((item) => {
                        const allocVal = itemAllocations[item.id] || "";
                        const allocNum = parseFloat(allocVal) || 0;
                        const isPartiallyPaid = item.paidAmount > 0;
                        const unitPrice = item.unitPrice;

                        // Quantity calculations
                        const previouslyPaidQty =
                          unitPrice > 0 ? Math.round((item.paidAmount / unitPrice) * 100) / 100 : 0;
                        const unpaidQty =
                          unitPrice > 0 ? Math.round((item.remainingBalance / unitPrice) * 100) / 100 : 0;

                        // After current allocation preview
                        const newlyPaidQty =
                          unitPrice > 0 ? Math.round((allocNum / unitPrice) * 100) / 100 : 0;
                        const remainingUnpaidQtyAfter =
                          unitPrice > 0
                            ? Math.max(0, Math.round(((item.remainingBalance - allocNum) / unitPrice) * 100) / 100)
                            : 0;
                        const remainingBalanceAfter = Math.max(0, item.remainingBalance - allocNum);

                        // Quick buttons: 1 unit, or full remaining
                        const oneUnitAmt = unitPrice;
                        const showOneUnitBtn = unpaidQty > 1 && oneUnitAmt <= item.remainingBalance;

                        return (
                          <div
                            key={item.id}
                            className="p-3 bg-white rounded-xl border border-[#F0E4D4] flex flex-col gap-2 text-xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-kf-navy text-sm">{item.name}</span>
                                <span className="text-[11px] font-bold text-[#556B82] bg-[#FAF3E8] px-2 py-0.5 rounded-md border border-[#EADBCA]">
                                  {formatItemQuantityDisplay(item.quantity, item.unit)}
                                </span>
                                <span className="text-[11px] text-[#556B82]">
                                  @ Rs. {item.unitPrice.toLocaleString()}/{item.unit}
                                </span>
                                {isPartiallyPaid && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    Partially Paid ({previouslyPaidQty} {item.unit} / Rs. {item.paidAmount.toLocaleString()})
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-[#8DA6BC] uppercase font-bold block">
                                  Item Due
                                </span>
                                <span className="font-extrabold text-kf-orange text-sm">
                                  Rs. {item.remainingBalance.toLocaleString()} ({unpaidQty} {item.unit} unpaid)
                                </span>
                              </div>
                            </div>

                            {/* Allocation Input Row */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F0E4D4]/60">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-kf-navy">Allocate:</span>
                                <div className="relative w-32">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8DA6BC]">
                                    Rs.
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={item.remainingBalance}
                                    step="any"
                                    placeholder="0"
                                    value={allocVal}
                                    onChange={(e) => handleItemAllocationChange(item.id, e.target.value)}
                                    className="w-full h-8 pl-8 pr-2 bg-[#FCF8F2] border border-[#EADBCA] rounded-lg text-xs font-bold text-kf-navy focus:bg-white focus:border-kf-orange focus:outline-none"
                                  />
                                </div>
                              </div>

                              {/* Quick Helper Buttons */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {showOneUnitBtn && (
                                  <button
                                    type="button"
                                    onClick={() => handleAllocateSpecific(item.id, oneUnitAmt)}
                                    className="px-2 py-1 text-[10px] bg-[#FAF3E8] hover:bg-[#F0E4D4] text-kf-navy font-bold rounded-md border border-[#EADBCA] cursor-pointer"
                                  >
                                    1 {item.unit} (Rs. {oneUnitAmt.toLocaleString()})
                                  </button>
                                )}
                                {numAmount > 0 && numAmount <= item.remainingBalance && allocNum !== numAmount && (
                                  <button
                                    type="button"
                                    onClick={() => handleAllocateSpecific(item.id, numAmount)}
                                    className="px-2 py-1 text-[10px] bg-[#FFF2E5] hover:bg-[#FFE5CC] text-kf-orange font-bold rounded-md border border-[#FFD9B3] cursor-pointer"
                                  >
                                    Match Rs. {numAmount.toLocaleString()}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleAllocateSpecific(item.id, item.remainingBalance)}
                                  className="px-2 py-1 text-[10px] bg-white hover:bg-[#FAF3E8] text-[#556B82] font-bold rounded-md border border-[#EADBCA] cursor-pointer"
                                >
                                  Full Due (Rs. {item.remainingBalance.toLocaleString()})
                                </button>
                              </div>
                            </div>

                            {/* Real-time Equivalent Quantity Indicator */}
                            {allocNum > 0 && (
                              <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-[11px] text-green-900 flex items-center justify-between">
                                <span>
                                  ✓ Paying for: <strong>{newlyPaidQty} {item.unit}</strong> (Rs. {allocNum.toLocaleString()})
                                </span>
                                <span>
                                  Remaining unpaid: <strong>{remainingUnpaidQtyAfter} {item.unit}</strong> (Rs. {remainingBalanceAfter.toLocaleString()})
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Allocation Reconciliation Summary Bar */}
                      <div className="p-2.5 bg-white rounded-xl border border-[#F0E4D4] space-y-1 text-xs">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-[#556B82]">Payment Amount:</span>
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
                        {unallocatedAmount > 0 && (
                          <div className="flex items-center justify-between font-semibold border-t border-[#F0E4D4] pt-1">
                            <span className="text-[#556B82]">General Bill Payment (Unallocated):</span>
                            <span className="font-extrabold text-kf-orange">
                              Rs. {unallocatedAmount.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Live Payment Impact Breakdown Card */}
              {numAmount > 0 && !isOverBalance && (
                <div className="p-3.5 bg-[#FAF3E8] border border-[#EADBCA] rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-kf-navy">
                    <span>Payment Impact Summary:</span>
                    <span className="text-green-700 text-sm font-black">
                      - Rs. {numAmount.toLocaleString()} ({paymentMethod})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#EADBCA]/60">
                    <div>
                      <span className="text-[#556B82] block">Current Outstanding:</span>
                      <span className="font-bold text-kf-navy">
                        Rs. {currentBalance.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#556B82] block">New Outstanding Balance:</span>
                      <span className="font-bold text-green-700">
                        Rs. {Math.max(0, currentBalance - numAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {bill && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#EADBCA]/60">
                      <div>
                        <span className="text-[#556B82] block">Bill #{bill.billNo} Current Due:</span>
                        <span className="font-bold text-kf-navy">
                          Rs. {bill.remainingBalance.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#556B82] block">Bill #{bill.billNo} Remaining Due:</span>
                        <span className="font-bold text-green-700">
                          Rs. {Math.max(0, bill.remainingBalance - numAmount).toLocaleString()}
                        </span>
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
                  placeholder="e.g. Cash received at counter"
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
                  disabled={isSubmitting || isOverBalance || currentBalance <= 0 || allocationExceedsPayment || numAmount <= 0}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#FF6A00] to-[#FF7E1F] hover:from-[#E85E00] hover:to-[#FF6A00] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF6A00]/25 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? "Saving Payment..." : `Save Payment (Rs. ${numAmount.toLocaleString()})`}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
