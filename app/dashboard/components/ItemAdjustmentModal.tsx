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
  const [quantity, setQuantity] = useState("1");
  const [customUnitPrice, setCustomUnitPrice] = useState<string>("");
  const [reason, setReason] = useState("Returned damaged item / ledger correction");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCustomer = customersWithBalances.find((c) => c.id === customerId);
  const bill = getCustomerBill(customerId);

  const numQuantity = parseFloat(quantity) || 0;

  // Real-time validation against original bill items
  const validation = useMemo(() => {
    if (!enteredItemName.trim()) {
      return { isValid: false };
    }
    return validateItemAdjustment(customerId, enteredItemName, numQuantity);
  }, [customerId, enteredItemName, numQuantity, validateItemAdjustment]);

  const matchedItem = validation.matchedItem;

  // Auto-fill or sync unit price when matchedItem changes if not already set
  useEffect(() => {
    if (matchedItem && customUnitPrice === "") {
      setCustomUnitPrice(matchedItem.unitPrice.toString());
    }
  }, [matchedItem, customUnitPrice]);

  const effectiveUnitPrice =
    customUnitPrice !== "" && !isNaN(parseFloat(customUnitPrice)) && parseFloat(customUnitPrice) > 0
      ? parseFloat(customUnitPrice)
      : matchedItem?.unitPrice || 0;

  const isPriceModified =
    matchedItem ? Math.abs(effectiveUnitPrice - matchedItem.unitPrice) > 0.001 : false;

  const calculatedAmount = Math.round(numQuantity * effectiveUnitPrice);
  const currentBalance = selectedCustomer?.currentBalance || 0;
  const projectedBalance = Math.max(0, currentBalance - calculatedAmount);

  const handleSelectItem = (name: string, maxQty: number, price: number) => {
    setEnteredItemName(name);
    setQuantity(Math.min(1, maxQty).toString());
    setCustomUnitPrice(price.toString());
    setErrorMsg(null);
  };

  const handleResetPrice = () => {
    if (matchedItem) {
      setCustomUnitPrice(matchedItem.unitPrice.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!bill) {
      setErrorMsg("This customer has no original itemized bill on record.");
      return;
    }

    if (!validation.isValid) {
      setErrorMsg(validation.errorMessage || "Please enter a valid item from the original bill.");
      return;
    }

    if (numQuantity <= 0) {
      setErrorMsg("Please enter a valid quantity greater than zero.");
      return;
    }

    if (effectiveUnitPrice <= 0) {
      setErrorMsg("Unit price must be greater than zero.");
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("Please specify a reason for this ledger item adjustment.");
      return;
    }

    setIsSubmitting(true);
    const result = adjustBillItem({
      customerId,
      enteredItemName,
      quantity: numQuantity,
      unitPrice: effectiveUnitPrice,
      reason,
      date,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || "Adjustment failed.");
    } else {
      const priceNote = isPriceModified
        ? ` @ corrected rate of Rs. ${effectiveUnitPrice.toLocaleString()}/${matchedItem?.unit || "units"}`
        : ` @ Rs. ${effectiveUnitPrice.toLocaleString()}/${matchedItem?.unit || "units"}`;
      setSuccessMsg(
        `Adjustment of ${numQuantity} ${matchedItem?.unit || "units"} ${enteredItemName}${priceNote} applied successfully! Total reduced: Rs. ${calculatedAmount.toLocaleString()}`
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
                Item-Wise Udhaar Adjustment
              </h2>
              <p className="text-xs text-[#556B82]">
                Bill integrity protection: adjust quantities or correct historical unit rates
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
                setCustomUnitPrice("");
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

          {/* Original Bill Summary Box */}
          {bill ? (
            <div className="p-3.5 bg-[#FAF3E8] border border-[#EADBCA] rounded-2xl">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-extrabold text-kf-navy">
                  Original Source Bill: #{bill.billNo}
                </span>
                <span className="text-[11px] text-[#556B82] font-semibold">{bill.date}</span>
              </div>
              <div className="text-[11px] text-[#556B82] mb-2">
                Recorded items on this bill (click &apos;Select&apos; to load item &amp; rate):
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {bill.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#F0E4D4] text-xs hover:border-[#FF6A00]/40 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-kf-navy">{item.name}</span>
                      <span className="text-[11px] text-[#8DA6BC] ml-1.5">
                        ({item.quantity} {item.unit} @ Rs. {item.unitPrice.toLocaleString()}/{item.unit})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-kf-orange">
                        Rs. {item.remainingBalance.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectItem(item.name, item.quantity, item.unitPrice)}
                        className="px-2 py-0.5 bg-[#FFF2E5] hover:bg-[#FFE5CC] text-kf-orange text-[10px] font-bold rounded cursor-pointer"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
              No itemized bill recorded for this customer. Only customers with original itemized bills support item-level validation.
            </div>
          )}

          {/* Item Name Input */}
          <div>
            <label htmlFor="adjust-item-input" className="block text-xs font-bold text-kf-navy mb-1.5">
              Item to Adjust <span className="text-red-500">*</span>
            </label>
            <input
              id="adjust-item-input"
              type="text"
              value={enteredItemName}
              onChange={(e) => {
                setEnteredItemName(e.target.value);
                setCustomUnitPrice("");
                setErrorMsg(null);
              }}
              placeholder="Enter product name from customer's bill..."
              required
              className={`w-full h-11 px-3 bg-[#FCF7F0] border rounded-xl text-xs font-semibold text-kf-navy focus:bg-white outline-none transition-all ${
                enteredItemName && !validation.isValid
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-[#EADBCA] focus:border-kf-orange focus:ring-1 focus:ring-kf-orange"
              }`}
            />

            {/* REAL-TIME WRONG ITEM DETECTION WARNING */}
            {enteredItemName && !validation.isValid && validation.errorMessage && (
              <div className="mt-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none">⚠️</span>
                  <p className="font-semibold">{validation.errorMessage}</p>
                </div>
                {validation.suggestedItems && validation.suggestedItems.length > 0 && (
                  <div className="pt-1 border-t border-red-200/60">
                    <span className="text-[11px] font-bold text-red-800 block mb-1">
                      Did you mean one of {selectedCustomer?.name.split(" ")[0] || "customer"}&apos;s original items?
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {bill?.items.map((it) => (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => handleSelectItem(it.name, it.quantity, it.unitPrice)}
                          className="px-2.5 py-1 bg-white border border-red-300 rounded-lg text-xs font-bold text-kf-navy hover:bg-orange-50 hover:border-kf-orange transition-colors cursor-pointer"
                        >
                          ✓ {it.name} ({it.quantity} {it.unit})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Valid item matched badge */}
            {validation.isValid && matchedItem && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center justify-between">
                <span>
                  ✓ Verified against Bill #{bill?.billNo}: <strong>{matchedItem.name}</strong>
                </span>
                <span className="font-bold">
                  Original Rate: Rs. {matchedItem.unitPrice.toLocaleString()}/{matchedItem.unit}
                </span>
              </div>
            )}
          </div>

          {/* Quantity & Editable Unit Price Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="adjust-qty-input" className="block text-xs font-bold text-kf-navy mb-1.5">
                Adjustment Quantity <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="adjust-qty-input"
                  type="number"
                  step="any"
                  min="0.1"
                  max={matchedItem?.quantity || 100}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setErrorMsg(null);
                  }}
                  required
                  className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8DA6BC]">
                  {matchedItem?.unit || "units"}
                </span>
              </div>
              {matchedItem && (
                <span className="text-[10px] text-[#556B82] block mt-1">
                  Max available: {matchedItem.quantity} {matchedItem.unit}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="adjust-price-input" className="text-xs font-bold text-kf-navy">
                  Unit Rate (PKR) <span className="text-red-500">*</span>
                </label>
                {isPriceModified && (
                  <button
                    type="button"
                    onClick={handleResetPrice}
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
                  min="0.1"
                  value={customUnitPrice}
                  onChange={(e) => {
                    setCustomUnitPrice(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder={matchedItem ? matchedItem.unitPrice.toString() : "Rate"}
                  required
                  className={`w-full h-11 px-3 bg-[#FCF7F0] border rounded-xl text-xs font-bold text-kf-navy focus:bg-white outline-none transition-all ${
                    isPriceModified
                      ? "border-amber-400 bg-amber-50/40 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      : "border-[#EADBCA] focus:border-kf-orange focus:ring-1 focus:ring-kf-orange"
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8DA6BC]">
                  /{matchedItem?.unit || "unit"}
                </span>
              </div>
              {matchedItem && (
                <span
                  className={`text-[10px] block mt-1 ${
                    isPriceModified ? "text-amber-700 font-bold" : "text-[#556B82]"
                  }`}
                >
                  {isPriceModified
                    ? `Rate adjusted (Original: Rs. ${matchedItem.unitPrice.toLocaleString()})`
                    : `Original recorded bill rate`}
                </span>
              )}
            </div>
          </div>

          {/* Financial Impact Breakdown Card */}
          {matchedItem && (
            <div className="p-3.5 bg-[#FAF3E8] border border-[#EADBCA] rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-kf-navy">
                <span>Khata Impact Breakdown:</span>
                <span className="text-kf-orange text-sm font-black">
                  - Rs. {calculatedAmount.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#EADBCA]/60">
                <div>
                  <span className="text-[#556B82] block">Current Udhaar:</span>
                  <span className="font-bold text-kf-navy">
                    Rs. {currentBalance.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[#556B82] block">New Udhaar after Adjustment:</span>
                  <span className="font-bold text-green-700">
                    Rs. {projectedBalance.toLocaleString()}
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
              placeholder="e.g. Returned 1 bag damaged, billing correction"
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
              disabled={isSubmitting || !validation.isValid || !bill}
              className="px-5 py-2.5 bg-gradient-to-r from-[#FF6A00] to-[#FF7E1F] hover:from-[#E85E00] hover:to-[#FF6A00] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF6A00]/25 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? "Applying..." : "Apply Valid Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
