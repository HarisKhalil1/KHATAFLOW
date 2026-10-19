"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useDashboard } from "../context/DashboardContext";

export default function ItemAdjustmentModal() {
  const {
    customersWithBalances,
    selectedCustomerIdForModal,
    closeModal,
    getCustomerBill,
    validateItemAdjustment,
    adjustBillItem,
  } = useDashboard();

  const [customerId, setCustomerId] = useState(
    () => selectedCustomerIdForModal || customersWithBalances[0]?.id || ""
  );
  const [enteredItemName, setEnteredItemName] = useState("");
  const [correctedQuantity, setCorrectedQuantity] = useState("1");
  const [correctedUnitPrice, setCorrectedUnitPrice] = useState<string>("");
  const [reason, setReason] = useState("Billing rate / quantity correction");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCustomer = customersWithBalances.find((c) => c.id === customerId);
  const bill = getCustomerBill(customerId);

  const numCorrectedQty = parseFloat(correctedQuantity) || 0;

  // Real-time validation against original bill items
  const validation = useMemo(() => {
    if (!enteredItemName.trim()) {
      return { isValid: false };
    }
    return validateItemAdjustment(customerId, enteredItemName, numCorrectedQty);
  }, [customerId, enteredItemName, numCorrectedQty, validateItemAdjustment]);

  const matchedItem = validation.matchedItem;

  // Prefill quantity and unit price when an item is selected
  useEffect(() => {
    if (matchedItem) {
      if (correctedUnitPrice === "") {
        setCorrectedUnitPrice(matchedItem.unitPrice.toString());
      }
    }
  }, [matchedItem, correctedUnitPrice]);

  const numCorrectedPrice =
    correctedUnitPrice !== "" && !isNaN(parseFloat(correctedUnitPrice)) && parseFloat(correctedUnitPrice) > 0
      ? parseFloat(correctedUnitPrice)
      : matchedItem?.unitPrice || 0;

  // Original item metrics
  const originalQty = matchedItem?.quantity || 0;
  const originalUnitPrice = matchedItem?.unitPrice || 0;
  const originalLineTotal = Math.round(originalQty * originalUnitPrice * 100) / 100;
  const originalPaidAmount = matchedItem?.paidAmount || 0;
  const originalItemRemaining = matchedItem?.remainingBalance || 0;

  // Corrected metrics
  const correctedLineTotal = Math.round(numCorrectedQty * numCorrectedPrice * 100) / 100;
  const differenceAmount = Math.round((correctedLineTotal - originalLineTotal) * 100) / 100;

  const isPriceModified = matchedItem ? Math.abs(numCorrectedPrice - matchedItem.unitPrice) > 0.001 : false;
  const isQtyModified = matchedItem ? Math.abs(numCorrectedQty - matchedItem.quantity) > 0.001 : false;

  // Customer & Bill projected balances
  const currentCustomerBalance = selectedCustomer?.currentBalance || 0;
  const projectedCustomerBalance = Math.max(0, currentCustomerBalance + differenceAmount);

  const currentBillTotal = bill?.totalAmount || 0;
  const projectedBillTotal = Math.max(0, currentBillTotal + differenceAmount);
  const currentBillRemaining = bill?.remainingBalance || 0;
  const projectedBillRemaining = Math.max(0, currentBillRemaining + differenceAmount);

  const handleSelectItem = (item: typeof matchedItem) => {
    if (!item) return;
    setEnteredItemName(item.name);
    setCorrectedQuantity(item.quantity.toString());
    setCorrectedUnitPrice(item.unitPrice.toString());
    setErrorMsg(null);
  };

  const handleResetToOriginal = () => {
    if (matchedItem) {
      setCorrectedQuantity(matchedItem.quantity.toString());
      setCorrectedUnitPrice(matchedItem.unitPrice.toString());
      setErrorMsg(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!bill) {
      setErrorMsg("This customer has no original itemized bill on record.");
      return;
    }

    if (!matchedItem) {
      setErrorMsg(validation.errorMessage || "Please select an item from the customer's bill.");
      return;
    }

    if (numCorrectedQty <= 0) {
      setErrorMsg("Quantity must be greater than zero.");
      return;
    }

    if (numCorrectedPrice <= 0) {
      setErrorMsg("Unit price must be greater than zero.");
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("Please specify a reason for this item adjustment.");
      return;
    }

    if (!isPriceModified && !isQtyModified) {
      setErrorMsg("No change detected in quantity or unit rate. Please adjust either value.");
      return;
    }

    setIsSubmitting(true);
    const result = adjustBillItem({
      customerId,
      billId: bill.id,
      itemId: matchedItem.id,
      enteredItemName: matchedItem.name,
      correctedQuantity: numCorrectedQty,
      correctedUnitPrice: numCorrectedPrice,
      reason,
      date,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || "Adjustment failed.");
    } else {
      const diffFormatted =
        differenceAmount < 0
          ? `-Rs. ${Math.abs(differenceAmount).toLocaleString()}`
          : `+Rs. ${differenceAmount.toLocaleString()}`;

      setSuccessMsg(
        `Item "${matchedItem.name}" on Bill #${bill.billNo} updated successfully! Total correction: ${diffFormatted}. Bill & Ledger balance recalculated.`
      );
      setTimeout(() => {
        closeModal();
      }, 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-adjust-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-[#EADBCA] relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0E4D4] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-kf-orange flex items-center justify-center font-bold">
              ⚖️
            </div>
            <div>
              <h2 id="item-adjust-title" className="text-lg font-extrabold text-kf-navy">
                Adjust Item &amp; Price Correction
              </h2>
              <p className="text-xs text-[#556B82]">
                Universal adjustment: edit quantity &amp; unit price with live ledger recalculation
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

        {/* Global Error */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Selector */}
          <div>
            <label htmlFor="adjust-customer-select" className="block text-xs font-bold text-kf-navy mb-1.5">
              Select Customer <span className="text-red-500">*</span>
            </label>
            <select
              id="adjust-customer-select"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setEnteredItemName("");
                setCorrectedUnitPrice("");
                setErrorMsg(null);
              }}
              required
              className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-semibold text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
            >
              {customersWithBalances.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — Rs. {c.currentBalance.toLocaleString()} {c.currentBalance === 0 ? "(Cleared)" : "owed"}
                </option>
              ))}
            </select>
          </div>

          {/* Original Bill Items Box */}
          {bill ? (
            <div className="p-3.5 bg-[#FAF3E8] border border-[#EADBCA] rounded-2xl">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-extrabold text-kf-navy">
                  Original Source Bill: #{bill.billNo}
                </span>
                <span className="text-[11px] text-[#556B82] font-semibold">{bill.date}</span>
              </div>
              <div className="text-[11px] text-[#556B82] mb-2">
                Select an item from the customer&apos;s original bill to adjust:
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {bill.items.map((item) => {
                  const isSelected = matchedItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-orange-50/70 border-kf-orange text-kf-navy"
                          : "bg-white border-[#F0E4D4] hover:border-[#FF6A00]/40"
                      }`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <div>
                        <span className="font-bold text-kf-navy">{item.name}</span>
                        <span className="text-[11px] text-[#8DA6BC] ml-1.5">
                          ({item.quantity} {item.unit} @ Rs. {item.unitPrice.toLocaleString()}/{item.unit})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-kf-orange">
                          Rs. {item.lineTotal.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectItem(item);
                          }}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                            isSelected
                              ? "bg-kf-orange text-white"
                              : "bg-[#FFF2E5] hover:bg-[#FFE5CC] text-kf-orange"
                          }`}
                        >
                          {isSelected ? "Selected ✓" : "Select"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
              No itemized bill recorded for this customer.
            </div>
          )}

          {/* SECTION 2: ORIGINAL BILL DETAILS CARD */}
          {matchedItem && bill && (
            <div className="p-3.5 bg-white border border-[#EADBCA] rounded-2xl shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between font-extrabold text-kf-navy pb-1.5 border-b border-[#F0E4D4]">
                <span className="flex items-center gap-1.5">
                  <span>📋</span> Original Bill Record Details
                </span>
                <span className="text-[11px] font-bold text-[#556B82]">
                  Bill #{bill.billNo} ({bill.date})
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-0.5">
                <div>
                  <span className="text-[#8DA6BC] block">Item Name:</span>
                  <span className="font-bold text-kf-navy">{matchedItem.name}</span>
                </div>
                <div>
                  <span className="text-[#8DA6BC] block">Original Quantity:</span>
                  <span className="font-bold text-kf-navy">
                    {originalQty} {matchedItem.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[#8DA6BC] block">Original Unit Price:</span>
                  <span className="font-bold text-kf-navy">
                    Rs. {originalUnitPrice.toLocaleString()} / {matchedItem.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[#8DA6BC] block">Original Line Total:</span>
                  <span className="font-bold text-kf-navy">
                    Rs. {originalLineTotal.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[#8DA6BC] block">Previously Paid:</span>
                  <span className="font-bold text-green-700">
                    Rs. {originalPaidAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[#8DA6BC] block">Current Outstanding:</span>
                  <span className="font-extrabold text-kf-orange">
                    Rs. {originalItemRemaining.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: QUANTITY AND UNIT PRICE EDITING */}
          {matchedItem && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="adjust-qty-input" className="block text-xs font-bold text-kf-navy mb-1.5">
                  Corrected Quantity <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="adjust-qty-input"
                    type="number"
                    step="any"
                    min="0.01"
                    value={correctedQuantity}
                    onChange={(e) => {
                      setCorrectedQuantity(e.target.value);
                      setErrorMsg(null);
                    }}
                    required
                    className={`w-full h-11 px-3 bg-[#FCF7F0] border rounded-xl text-xs font-bold text-kf-navy focus:bg-white outline-none transition-all ${
                      isQtyModified
                        ? "border-amber-400 bg-amber-50/40 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        : "border-[#EADBCA] focus:border-kf-orange focus:ring-1 focus:ring-kf-orange"
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8DA6BC]">
                    {matchedItem.unit}
                  </span>
                </div>
                <span className="text-[10px] text-[#556B82] block mt-1">
                  Original: {originalQty} {matchedItem.unit}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="adjust-price-input" className="text-xs font-bold text-kf-navy">
                    Corrected Unit Price <span className="text-red-500">*</span>
                  </label>
                  {(isPriceModified || isQtyModified) && (
                    <button
                      type="button"
                      onClick={handleResetToOriginal}
                      className="text-[10px] text-kf-orange hover:underline font-bold cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="adjust-price-input"
                    type="number"
                    step="any"
                    min="0.01"
                    value={correctedUnitPrice}
                    onChange={(e) => {
                      setCorrectedUnitPrice(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder={matchedItem.unitPrice.toString()}
                    required
                    className={`w-full h-11 px-3 bg-[#FCF7F0] border rounded-xl text-xs font-bold text-kf-navy focus:bg-white outline-none transition-all ${
                      isPriceModified
                        ? "border-amber-400 bg-amber-50/40 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        : "border-[#EADBCA] focus:border-kf-orange focus:ring-1 focus:ring-kf-orange"
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8DA6BC]">
                    /{matchedItem.unit}
                  </span>
                </div>
                <span className="text-[10px] text-[#556B82] block mt-1">
                  Original: Rs. {originalUnitPrice.toLocaleString()}/{matchedItem.unit}
                </span>
              </div>
            </div>
          )}

          {/* SECTION 4: LIVE REACTIVE COMPARISON & FINANCIAL IMPACT */}
          {matchedItem && (
            <div className="p-3.5 bg-[#FAF3E8] border border-[#EADBCA] rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-kf-navy">
                <span>Adjustment Calculation:</span>
                <span
                  className={`text-sm font-black ${
                    differenceAmount < 0
                      ? "text-green-700"
                      : differenceAmount > 0
                      ? "text-kf-orange"
                      : "text-kf-navy"
                  }`}
                >
                  {differenceAmount < 0
                    ? `-Rs. ${Math.abs(differenceAmount).toLocaleString()}`
                    : differenceAmount > 0
                    ? `+Rs. ${differenceAmount.toLocaleString()}`
                    : "No Change (Rs. 0)"}
                </span>
              </div>

              {/* Line total comparison */}
              <div className="p-2 bg-white rounded-xl border border-[#F0E4D4] text-[11px] space-y-1">
                <div className="flex items-center justify-between text-[#556B82]">
                  <span>Original Line Total:</span>
                  <span className="font-bold text-kf-navy">
                    {originalQty} {matchedItem.unit} × Rs. {originalUnitPrice.toLocaleString()} = Rs. {originalLineTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#556B82]">
                  <span>Corrected Line Total:</span>
                  <span className="font-bold text-kf-navy">
                    {numCorrectedQty} {matchedItem.unit} × Rs. {numCorrectedPrice.toLocaleString()} = Rs. {correctedLineTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between font-bold pt-1 border-t border-[#F0E4D4]">
                  <span className="text-[#556B82]">Correction Difference:</span>
                  <span
                    className={
                      differenceAmount < 0
                        ? "text-green-700"
                        : differenceAmount > 0
                        ? "text-kf-orange"
                        : "text-[#556B82]"
                    }
                  >
                    {differenceAmount < 0
                      ? `−Rs. ${Math.abs(differenceAmount).toLocaleString()} (Bill reduces)`
                      : differenceAmount > 0
                      ? `+Rs. ${differenceAmount.toLocaleString()} (Bill increases)`
                      : "Rs. 0"}
                  </span>
                </div>
              </div>

              {/* Bill & Ledger Balance impact */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-[#556B82] block">Bill #{bill?.billNo} Outstanding:</span>
                  <span className="font-bold text-kf-navy">
                    Rs. {currentBillRemaining.toLocaleString()} →{" "}
                    <strong className="text-kf-orange">
                      Rs. {projectedBillRemaining.toLocaleString()}
                    </strong>
                  </span>
                </div>
                <div>
                  <span className="text-[#556B82] block">Customer Total Outstanding:</span>
                  <span className="font-bold text-kf-navy">
                    Rs. {currentCustomerBalance.toLocaleString()} →{" "}
                    <strong className="text-green-700">
                      Rs. {projectedCustomerBalance.toLocaleString()}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label htmlFor="adjust-reason-input" className="block text-xs font-bold text-kf-navy mb-1.5">
              Reason for Adjustment <span className="text-red-500">*</span>
            </label>
            <input
              id="adjust-reason-input"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Employee entered wrong price, rate correction, damaged stock"
              required
              className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-semibold text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="adjust-date-input" className="block text-xs font-bold text-kf-navy mb-1.5">
              Adjustment Date <span className="text-red-500">*</span>
            </label>
            <input
              id="adjust-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-semibold text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
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
              disabled={isSubmitting || !matchedItem || !bill || (!isPriceModified && !isQtyModified)}
              className="px-5 py-2.5 bg-gradient-to-r from-[#FF6A00] to-[#FF7E1F] hover:from-[#E85E00] hover:to-[#FF6A00] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF6A00]/25 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? "Applying..." : "Apply Adjustment & Recalculate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
