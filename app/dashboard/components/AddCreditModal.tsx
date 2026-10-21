"use client";

import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext";
import WhatsAppShareModal from "./WhatsAppShareModal";
import { generateBillReceiptText } from "../utils/whatsapp";

interface PurchaseRow {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

const COMMON_UNITS = [
  { value: "kg", label: "kg (Kilogram)" },
  { value: "pieces", label: "pieces (Pcs)" },
  { value: "liters", label: "liters (L)" },
  { value: "bags", label: "bags (Bori)" },
  { value: "cartons", label: "cartons (Peti)" },
  { value: "packs", label: "packs" },
  { value: "dozens", label: "dozens (Darjan)" },
  { value: "g", label: "g (Grams)" },
];

export default function AddCreditModal() {
  const {
    products,
    selectedCustomerIdForModal,
    closeModal,
    customersWithBalances,
    addCredit,
  } = useDashboard();

  const [customerId, setCustomerId] = useState(
    () => selectedCustomerIdForModal || customersWithBalances[0]?.id || ""
  );
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [creditRecorded, setCreditRecorded] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const [savedBillData, setSavedBillData] = useState<{
    billNo: string;
    totalAmount: number;
    items: Array<{ name: string; quantity: number; unit: string; unitPrice: number; lineTotal: number }>;
  } | null>(null);

  // Simplified Items state: start with 1 clean item row
  const [items, setItems] = useState<PurchaseRow[]>([
    {
      id: "row-1",
      name: "",
      quantity: "1",
      unit: "kg",
      unitPrice: "",
    },
  ]);

  const selectedCustomer = customersWithBalances.find((c) => c.id === customerId);
  const currentBalance = selectedCustomer?.currentBalance || 0;

  // Calculate grand total from items
  const grandTotal = items.reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 0;
    const r = parseFloat(item.unitPrice) || 0;
    return sum + Math.round(q * r * 100) / 100;
  }, 0);

  const newBalance = currentBalance + grandTotal;

  const handleAddItem = () => {
    const newId = `row-${Date.now()}-${items.length + 1}`;
    setItems((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        quantity: "1",
        unit: "kg",
        unitPrice: "",
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemChange = (id: string, field: keyof PurchaseRow, value: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };

        // Auto-fill unit & default price if matching product found
        if (field === "name") {
          const matched = products.find(
            (p) => p.name.toLowerCase() === value.trim().toLowerCase()
          );
          if (matched) {
            updated.unit = matched.defaultUnit || updated.unit;
            if (!it.unitPrice || it.unitPrice === "" || it.unitPrice === "0") {
              updated.unitPrice = matched.defaultRate.toString();
            }
          }
        }
        return updated;
      })
    );
    setError(null);
  };

  const handleSelectProduct = (rowId: string, prodName: string) => {
    const matched = products.find((p) => p.name === prodName);
    if (matched) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === rowId
            ? {
                ...it,
                name: matched.name,
                unit: matched.defaultUnit || it.unit,
                unitPrice: matched.defaultRate.toString(),
              }
            : it
        )
      );
    } else {
      handleItemChange(rowId, "name", prodName);
    }
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

    if (items.length === 0) {
      setError("Please add at least one item.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.name.trim()) {
        setError(`Item #${i + 1} is missing a name.`);
        return;
      }
      const q = parseFloat(it.quantity);
      if (isNaN(q) || q <= 0) {
        setError(`Please enter a valid quantity for "${it.name}".`);
        return;
      }
      const p = parseFloat(it.unitPrice);
      if (isNaN(p) || p <= 0) {
        setError(`Please enter a valid price for "${it.name}".`);
        return;
      }
    }

    if (grandTotal <= 0) {
      setError("Total credit amount must be greater than zero.");
      return;
    }

    setIsSubmitting(true);
    const result = addCredit({
      customerId,
      items: items.map((it) => ({
        name: it.name.trim(),
        quantity: parseFloat(it.quantity),
        unit: it.unit.trim(),
        unitPrice: parseFloat(it.unitPrice),
      })),
      date,
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to save credit.");
    } else {
      setCreditRecorded(true);
      setSuccessMsg(
        `✓ Udhaar of Rs. ${grandTotal.toLocaleString()} saved for ${selectedCustomer?.name}!`
      );
      setSavedBillData({
        billNo: result.transaction?.receiptNo || "NEW",
        totalAmount: grandTotal,
        items: items.map((it) => {
          const q = parseFloat(it.quantity) || 0;
          const r = parseFloat(it.unitPrice) || 0;
          return {
            name: it.name.trim(),
            quantity: q,
            unit: it.unit,
            unitPrice: r,
            lineTotal: Math.round(q * r * 100) / 100,
          };
        }),
      });

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
      aria-labelledby="give-credit-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-2xl border border-[#EADBCA] relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F0E4D4] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF3E6] text-kf-orange flex items-center justify-center text-lg font-extrabold shadow-xs">
              📝
            </div>
            <div>
              <h2 id="give-credit-title" className="text-base sm:text-lg font-extrabold text-kf-navy">
                Give Credit (Udhaar Dain)
              </h2>
              <p className="text-xs text-[#556B82]">
                Record items taken by customer on credit
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
              💬 WhatsApp Bill
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

        {creditRecorded ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <div>
              <h3 className="text-base font-extrabold text-kf-navy">Udhaar Saved!</h3>
              <p className="text-xs text-[#556B82] mt-0.5">
                Rs. {grandTotal.toLocaleString()} recorded for {selectedCustomer?.name}
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowWhatsApp(true)}
                className="py-2.5 px-4 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>💬 Send WhatsApp Bill</span>
              </button>
              <button
                id="btn-credit-done"
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
              <label htmlFor="credit-customer-select" className="block text-xs font-bold text-kf-navy mb-1.5">
                1. Select Customer <span className="text-red-500">*</span>
              </label>
              <select
                id="credit-customer-select"
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setError(null);
                }}
                required
                className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-2xl text-xs font-bold text-kf-navy outline-none focus:bg-white focus:border-kf-orange transition-all cursor-pointer"
              >
                <option value="" disabled>Choose Customer...</option>
                {customersWithBalances.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — Current Udhaar: Rs. {c.currentBalance.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Purchased Items */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-kf-navy">
                  2. Items Taken on Credit <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-[#7B90A2]">
                  {items.length} item{items.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3">
                {items.map((row, index) => {
                  const q = parseFloat(row.quantity) || 0;
                  const p = parseFloat(row.unitPrice) || 0;
                  const lineTotal = Math.round(q * p * 100) / 100;

                  return (
                    <div
                      key={row.id}
                      className="p-3 bg-[#FAF5EE] border border-[#EADBCA] rounded-2xl space-y-2.5 transition-all"
                    >
                      {/* Item Name Row */}
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-kf-navy text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => handleItemChange(row.id, "name", e.target.value)}
                            placeholder="Type item name (e.g. Rice, Cooking Oil, Tea)"
                            list={`catalog-list-${row.id}`}
                            required
                            className="w-full h-9 px-3 bg-white border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy placeholder:text-[#9FB1C1] outline-none focus:border-kf-orange"
                          />
                          <datalist id={`catalog-list-${row.id}`}>
                            {products.map((p) => (
                              <option key={p.name} value={p.name}>
                                Rs. {p.defaultRate}/{p.defaultUnit}
                              </option>
                            ))}
                          </datalist>
                        </div>

                        {/* Existing Items Quick Select Dropdown */}
                        {products.length > 0 && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleSelectProduct(row.id, e.target.value);
                            }}
                            defaultValue=""
                            className="h-9 px-2 bg-white border border-[#EADBCA] rounded-xl text-[11px] font-semibold text-[#556B82] outline-none cursor-pointer max-w-[120px]"
                            title="Pick from saved items"
                          >
                            <option value="">📋 Saved Items...</option>
                            {products.map((p) => (
                              <option key={p.name} value={p.name}>
                                {p.name} (Rs.{p.defaultRate})
                              </option>
                            ))}
                          </select>
                        )}

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(row.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove this item"
                            aria-label={`Remove item ${index + 1}`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Quantity, Unit, Price, and Line Total Grid */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Quantity with decimal/fractional support */}
                        <div className="col-span-4">
                          <label className="block text-[10px] font-bold text-[#7B90A2] mb-0.5">
                            Quantity
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            value={row.quantity}
                            onChange={(e) => handleItemChange(row.id, "quantity", e.target.value)}
                            placeholder="1"
                            required
                            className="w-full h-8 px-2 bg-white border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none focus:border-kf-orange"
                          />
                        </div>

                        {/* Unit */}
                        <div className="col-span-3">
                          <label className="block text-[10px] font-bold text-[#7B90A2] mb-0.5">
                            Unit
                          </label>
                          <select
                            value={row.unit}
                            onChange={(e) => handleItemChange(row.id, "unit", e.target.value)}
                            className="w-full h-8 px-1.5 bg-white border border-[#EADBCA] rounded-xl text-[11px] font-bold text-kf-navy outline-none cursor-pointer"
                          >
                            {COMMON_UNITS.map((u) => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Price per Unit */}
                        <div className="col-span-3">
                          <label className="block text-[10px] font-bold text-[#7B90A2] mb-0.5">
                            Price (Rs.)
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            value={row.unitPrice}
                            onChange={(e) => handleItemChange(row.id, "unitPrice", e.target.value)}
                            placeholder="200"
                            required
                            className="w-full h-8 px-2 bg-white border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none focus:border-kf-orange"
                          />
                        </div>

                        {/* Calculated Subtotal */}
                        <div className="col-span-2 text-right">
                          <span className="block text-[10px] font-bold text-[#7B90A2] mb-0.5">
                            Subtotal
                          </span>
                          <span className="text-xs font-extrabold text-kf-navy block truncate">
                            Rs. {lineTotal > 0 ? lineTotal.toLocaleString() : "0"}
                          </span>
                        </div>
                      </div>

                      {/* Quick Fraction Chips (0.25, 0.5, 1, 2) */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-[#7B90A2]">Quick Qty:</span>
                        {[
                          { label: "¼ (0.25)", val: "0.25" },
                          { label: "½ (0.5)", val: "0.5" },
                          { label: "1", val: "1" },
                          { label: "1.5", val: "1.5" },
                          { label: "2", val: "2" },
                          { label: "5", val: "5" },
                        ].map((chip) => (
                          <button
                            key={chip.val}
                            type="button"
                            onClick={() => handleItemChange(row.id, "quantity", chip.val)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                              row.quantity === chip.val
                                ? "bg-kf-orange text-white"
                                : "bg-white text-[#556B82] border border-[#EADBCA] hover:bg-[#F0E4D4]"
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Add Another Item Button */}
                <button
                  id="btn-add-another-item"
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2.5 px-3 border border-dashed border-[#FFB27A] hover:border-kf-orange bg-[#FFF8F2] hover:bg-[#FFF3E6] text-kf-orange rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>+ Add Another Item (Aur Saman Shamil Karain)</span>
                </button>
              </div>
            </div>

            {/* Step 3: Total Calculation & Balance Review */}
            <div className="p-3.5 bg-gradient-to-r from-[#FFF5EA] to-[#FFF9F3] border border-[#FFDEC0] rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-[#A04500] uppercase tracking-wider block">
                    Total Udhaar Amount:
                  </span>
                  <span className="text-2xl font-black text-[#D94F00]">
                    Rs. {grandTotal.toLocaleString()}
                  </span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-[#556B82] block">
                    Current Udhaar: <strong>Rs. {currentBalance.toLocaleString()}</strong>
                  </span>
                  <span className="text-kf-navy font-bold block">
                    New Balance: <strong>Rs. {newBalance.toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Optional Details (Collapsed by default) */}
            <div className="border border-[#EADBCA] rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="w-full py-2 px-3.5 flex items-center justify-between text-xs font-bold text-[#7B90A2] hover:text-kf-navy hover:bg-[#FAF4EC] transition-colors cursor-pointer"
              >
                <span>⚙️ Date & Notes (Optional)</span>
                <span>{showAdvancedOptions ? "▲" : "▼"}</span>
              </button>
              {showAdvancedOptions && (
                <div className="p-3 bg-[#FCF9F5] border-t border-[#EADBCA] space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-kf-navy mb-1">
                      Transaction Date (Default: Today)
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
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Sent with son, promised to pay Friday"
                      className="w-full h-9 px-2.5 bg-white border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              id="btn-save-credit"
              type="submit"
              disabled={isSubmitting || grandTotal <= 0}
              className={`w-full h-12 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                isSubmitting || grandTotal <= 0
                  ? "bg-gray-400 cursor-not-allowed opacity-70"
                  : "bg-gradient-to-r from-[#FF6A00] to-[#FF7708] hover:from-[#E85E00] hover:to-[#FF6A00] shadow-[0_4px_16px_rgba(255,106,0,0.32)] active:scale-[0.99]"
              }`}
            >
              <span>💾 Save Udhaar</span>
              {grandTotal > 0 && <span>(Rs. {grandTotal.toLocaleString()})</span>}
            </button>
          </form>
        )}

        {/* WhatsApp Share Modal Integration */}
        {selectedCustomer && savedBillData && (
          <WhatsAppShareModal
            isOpen={showWhatsApp}
            onClose={() => {
              setShowWhatsApp(false);
              closeModal();
            }}
            customerPhone={selectedCustomer.phone}
            customerName={selectedCustomer.name}
            title="Send Purchase Bill on WhatsApp"
            initialMessageEn={generateBillReceiptText({
              customerName: selectedCustomer.name,
              totalAmount: savedBillData.totalAmount,
              remainingBalance: newBalance,
              billNo: savedBillData.billNo,
              date,
              paidAmount: 0,
              items: savedBillData.items,
              lang: "en",
            })}
            initialMessageUr={generateBillReceiptText({
              customerName: selectedCustomer.name,
              totalAmount: savedBillData.totalAmount,
              remainingBalance: newBalance,
              billNo: savedBillData.billNo,
              date,
              paidAmount: 0,
              items: savedBillData.items,
              lang: "ur",
            })}
          />
        )}
      </div>
    </div>
  );
}
