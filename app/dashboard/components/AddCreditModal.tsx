"use client";

import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext";

interface PurchaseRow {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

const COMMON_UNITS = [
  { value: "kg", label: "kg (Kilogram)" },
  { value: "g", label: "g (Grams)" },
  { value: "pieces", label: "pieces (Pcs)" },
  { value: "liters", label: "liters (L)" },
  { value: "bags", label: "bags" },
  { value: "packs", label: "packs" },
  { value: "cartons", label: "cartons" },
  { value: "dozens", label: "dozens" },
];

export default function AddCreditModal() {
  const {
    products,
    addProduct,
    updateProductPrice,
    selectedCustomerIdForModal,
    closeModal,
    customersWithBalances,
    addCredit,
  } = useDashboard();

  const [customerId, setCustomerId] = useState(
    () => selectedCustomerIdForModal || customersWithBalances[0]?.id || ""
  );
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [receiptNo, setReceiptNo] = useState(
    () => `REC-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [catalogFeedback, setCatalogFeedback] = useState<string | null>(null);

  // New Custom Product Modal state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdUnit, setNewProdUnit] = useState("pieces");
  const [newProdRate, setNewProdRate] = useState("");

  // Structured Items state
  const [items, setItems] = useState<PurchaseRow[]>([
    {
      id: "row-1",
      name: "Rice",
      quantity: "1.5",
      unit: "kg",
      unitPrice: "200",
    },
  ]);

  const selectedCustomer = customersWithBalances.find((c) => c.id === customerId);
  const currentBalance = selectedCustomer?.currentBalance || 0;

  // Calculate grand total credit amount from entered items
  const grandTotal = items.reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 0;
    const r = parseFloat(item.unitPrice) || 0;
    return sum + Math.round(q * r * 100) / 100;
  }, 0);

  const handleAddItem = () => {
    const newId = `row-${Date.now()}-${items.length + 1}`;
    setItems((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        quantity: "1",
        unit: "kg",
        unitPrice: "0",
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

        // Auto-fill default unit & rate if user chooses from catalog
        if (field === "name") {
          const matchedCatalog = products.find(
            (p) => p.name.toLowerCase() === value.trim().toLowerCase()
          );
          if (matchedCatalog) {
            updated.unit = matchedCatalog.defaultUnit;
            if (!it.unitPrice || it.unitPrice === "0" || it.unitPrice === "") {
              updated.unitPrice = matchedCatalog.defaultRate.toString();
            }
          }
        }
        return updated;
      })
    );
    setError(null);
  };

  const handleSelectProductDropdown = (rowId: string, val: string) => {
    if (val === "__new__") {
      setShowAddProductModal(true);
      return;
    }
    const matched = products.find((p) => p.name === val);
    if (matched) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === rowId
            ? {
                ...it,
                name: matched.name,
                unit: matched.defaultUnit,
                unitPrice: matched.defaultRate.toString(),
              }
            : it
        )
      );
    } else {
      handleItemChange(rowId, "name", val);
    }
    setError(null);
  };

  const handleQuickQuantity = (rowId: string, qtyValue: string) => {
    handleItemChange(rowId, "quantity", qtyValue);
  };

  const handleUpdateCatalogRate = (rowId: string) => {
    const row = items.find((it) => it.id === rowId);
    if (!row || !row.name.trim()) return;
    const rate = parseFloat(row.unitPrice);
    if (isNaN(rate) || rate <= 0) {
      setError("Please enter a valid rate greater than zero before updating catalog.");
      return;
    }
    const res = updateProductPrice(row.name, rate, row.unit);
    if (res.success) {
      setCatalogFeedback(
        `✓ Catalog default rate for "${row.name}" updated to Rs. ${rate.toLocaleString()}/${row.unit}! (Past customer bills remain unchanged).`
      );
      setTimeout(() => setCatalogFeedback(null), 3500);
    } else {
      addProduct({
        name: row.name.trim(),
        defaultUnit: row.unit,
        defaultRate: rate,
      });
      setCatalogFeedback(
        `✓ "${row.name}" saved to Product Catalog at Rs. ${rate.toLocaleString()}/${row.unit}!`
      );
      setTimeout(() => setCatalogFeedback(null), 3500);
    }
  };

  const handleCreateNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      setError("Product name is required.");
      return;
    }
    const rate = parseFloat(newProdRate);
    if (isNaN(rate) || rate <= 0) {
      setError("Default rate must be greater than zero.");
      return;
    }

    const res = addProduct({
      name: newProdName.trim(),
      defaultUnit: newProdUnit,
      defaultRate: rate,
    });

    if (res.success) {
      setShowAddProductModal(false);
      // Auto-populate the active or last item row with this newly created product
      if (items.length > 0) {
        const targetRow = items[items.length - 1];
        setItems((prev) =>
          prev.map((it) =>
            it.id === targetRow.id
              ? {
                  ...it,
                  name: newProdName.trim(),
                  unit: newProdUnit,
                  unitPrice: rate.toString(),
                }
              : it
          )
        );
      }
      setCatalogFeedback(
        `✓ Product "${newProdName.trim()}" added to catalog at Rs. ${rate.toLocaleString()}/${newProdUnit}!`
      );
      setTimeout(() => setCatalogFeedback(null), 3500);
      setNewProdName("");
      setNewProdRate("");
    }
  };

  // Scenario 1: Rice 1.5kg (Rs. 300), Rice 0.25kg (Rs. 50), Eggs 11pcs (Rs. 330), Chocolate 3 packs (Rs. 150) = Rs. 830
  const handleLoadFullScenario = () => {
    setItems([
      {
        id: `row-${Date.now()}-1`,
        name: "Rice",
        quantity: "1.5",
        unit: "kg",
        unitPrice: "200",
      },
      {
        id: `row-${Date.now()}-2`,
        name: "Rice",
        quantity: "0.25",
        unit: "kg",
        unitPrice: "200",
      },
      {
        id: `row-${Date.now()}-3`,
        name: "Eggs",
        quantity: "11",
        unit: "pieces",
        unitPrice: "30",
      },
      {
        id: `row-${Date.now()}-4`,
        name: "Chocolate",
        quantity: "3",
        unit: "packs",
        unitPrice: "50",
      },
    ]);
    setError(null);
  };

  // Scenario 2: Legacy Rice 2kg, Oil 2kg, Eggs 11pcs
  const handleLoadScenarioExample = () => {
    setItems([
      {
        id: `row-${Date.now()}-1`,
        name: "Rice",
        quantity: "2",
        unit: "kg",
        unitPrice: "2000",
      },
      {
        id: `row-${Date.now()}-2`,
        name: "Dalda oil",
        quantity: "2",
        unit: "kg",
        unitPrice: "3000",
      },
      {
        id: `row-${Date.now()}-3`,
        name: "Eggs",
        quantity: "11",
        unit: "pieces",
        unitPrice: "454.55",
      },
    ]);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    if (items.length === 0) {
      setError("Please add at least one purchased item.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.name.trim()) {
        setError(`Item #${i + 1} is missing a product name.`);
        return;
      }
      const q = parseFloat(it.quantity);
      if (isNaN(q) || q <= 0) {
        setError(`Item "${it.name}" has an invalid quantity. Must be greater than zero.`);
        return;
      }

      // Discrete items rule (e.g. eggs, pieces): require whole number quantities
      if ((it.unit === "pieces" || it.unit === "pcs") && q % 1 !== 0) {
        setError(
          `Item "${it.name}" is measured in pieces and must have a whole-number quantity (e.g. 11 pieces). Fractional pieces are invalid.`
        );
        return;
      }

      const r = parseFloat(it.unitPrice);
      if (isNaN(r) || r <= 0) {
        setError(`Item "${it.name}" has an invalid rate per unit. Must be greater than zero.`);
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
      receiptNo: receiptNo.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to record credit.");
    } else {
      setSuccessMsg(
        `Rs. ${grandTotal.toLocaleString()} credit with ${items.length} item(s) successfully recorded for ${selectedCustomer?.name}!`
      );
      setTimeout(() => {
        closeModal();
      }, 700);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-credit-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-2xl p-5 sm:p-7 shadow-2xl border border-[#EADBCA] relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0E4D4] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-kf-orange flex items-center justify-center font-bold">
              ↑
            </div>
            <div>
              <h2 id="add-credit-title" className="text-lg font-extrabold text-kf-navy">
                Give Credit (Udhaar) — Structured Purchase Entry
              </h2>
              <p className="text-xs text-[#556B82]">
                Record custom items, precise quantities (1.5 kg, ¼ kg, 11 eggs), and historical unit prices
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

        {/* Catalog Update Feedback */}
        {catalogFeedback && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <span>{catalogFeedback}</span>
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

        {/* Inline Add New Product Modal */}
        {showAddProductModal && (
          <div className="mb-4 p-4 bg-[#FFF8F0] border-2 border-kf-orange/40 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-kf-navy uppercase tracking-wider">
                ➕ Add New Product to Catalog
              </span>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="text-xs text-[#556B82] hover:text-kf-navy font-bold cursor-pointer"
              >
                ✕ Cancel
              </button>
            </div>
            <p className="text-[11px] text-[#556B82]">
              Define a new product (e.g. Chocolate). It will be saved for all future transactions with this default price.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#556B82] uppercase mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chocolate, Biscuit"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#EADBCA] rounded-lg text-xs font-bold text-kf-navy focus:border-kf-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#556B82] uppercase mb-1">
                  Default Unit
                </label>
                <select
                  value={newProdUnit}
                  onChange={(e) => setNewProdUnit(e.target.value)}
                  className="w-full h-8 px-2 bg-white border border-[#EADBCA] rounded-lg text-xs font-bold text-kf-navy focus:border-kf-orange focus:outline-none"
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#556B82] uppercase mb-1">
                  Current Market Price (PKR)
                </label>
                <input
                  type="number"
                  placeholder="50"
                  value={newProdRate}
                  onChange={(e) => setNewProdRate(e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#EADBCA] rounded-lg text-xs font-bold text-kf-navy focus:border-kf-orange focus:outline-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateNewProduct}
              className="px-3 py-1.5 bg-kf-orange text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-orange-600 transition-colors"
            >
              Save Product to Catalog & Use
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Selection & Quick Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="credit-customer-select" className="block text-xs font-bold text-kf-navy mb-1.5">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <select
                id="credit-customer-select"
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setError(null);
                }}
                required
                className="w-full h-10 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-semibold text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
              >
                {customersWithBalances.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — Current due: Rs. {c.currentBalance.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end gap-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleLoadFullScenario}
                  className="flex-1 h-9 px-2 bg-[#FFF2E5] hover:bg-[#FFE5CC] text-kf-orange border border-[#FFD9B3] rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>⚡ Preset: Rice (1.5kg + ¼kg), Eggs 11pcs, Choc 3pk</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadScenarioExample}
                  className="h-9 px-2 bg-[#FAF3E8] hover:bg-[#F0E4D4] text-[#556B82] border border-[#EADBCA] rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                  title="Load Rice 2kg, Oil 2kg, Eggs 11pcs"
                >
                  <span>Legacy 15k</span>
                </button>
              </div>
            </div>
          </div>

          {/* Date & Receipt Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="credit-date-input" className="block text-xs font-bold text-kf-navy mb-1.5">
                Transaction Date <span className="text-red-500">*</span>
              </label>
              <input
                id="credit-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full h-10 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-semibold text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="credit-receipt-input" className="block text-xs font-bold text-kf-navy mb-1.5">
                Bill / Receipt Reference (Optional)
              </label>
              <input
                id="credit-receipt-input"
                type="text"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                className="w-full h-10 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-semibold text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
              />
            </div>
          </div>

          {/* STRUCTURED PURCHASED ITEMS SECTION */}
          <div className="p-3.5 sm:p-4 bg-[#FAF3E8] border border-[#EADBCA] rounded-2xl space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#F0E4D4]">
              <div>
                <span className="text-xs font-extrabold text-kf-navy uppercase tracking-wider block">
                  Purchased Items List
                </span>
                <span className="text-[11px] text-[#556B82]">
                  Add multiple products (including same product at different quantities), custom prices, and fractions
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(true)}
                  className="px-2 py-1 bg-white hover:bg-orange-50 text-kf-orange border border-kf-orange/30 rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  + Add New Product
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2.5 py-1 bg-kf-orange hover:bg-orange-600 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <span>+ Add Item</span>
                </button>
              </div>
            </div>

            {/* Datalist for fast auto-complete */}
            <datalist id="products-catalog-list">
              {products.map((prod) => (
                <option key={prod.name} value={prod.name} />
              ))}
            </datalist>

            {/* Item Rows */}
            <div className="space-y-3">
              {items.map((it, idx) => {
                const q = parseFloat(it.quantity) || 0;
                const r = parseFloat(it.unitPrice) || 0;
                const rowTotal = Math.round(q * r * 100) / 100;
                const matchedCatalog = products.find(
                  (p) => p.name.toLowerCase() === it.name.trim().toLowerCase()
                );
                const hasPriceDiff =
                  matchedCatalog &&
                  r > 0 &&
                  Math.abs(r - matchedCatalog.defaultRate) > 0.01;

                const isWeightOrLiquid =
                  it.unit === "kg" || it.unit === "liters" || it.unit === "L" || it.unit === "g";

                return (
                  <div
                    key={it.id}
                    className="p-3 bg-white rounded-xl border border-[#F0E4D4] shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold text-kf-navy">
                          Item #{idx + 1}
                        </span>
                        {matchedCatalog ? (
                          <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.2 rounded border border-green-200 font-semibold">
                            In Catalog (Default: Rs. {matchedCatalog.defaultRate.toLocaleString()}/{matchedCatalog.defaultUnit})
                          </span>
                        ) : it.name.trim() ? (
                          <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-semibold">
                            Custom Product (Will be saved to catalog)
                          </span>
                        ) : null}
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="text-[11px] text-red-600 hover:text-red-800 font-bold cursor-pointer"
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      {/* Product Name Selector & Datalist */}
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-[#556B82] uppercase mb-1">
                          Product Name <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-1">
                          <input
                            type="text"
                            data-testid="item-name-input"
                            list="products-catalog-list"
                            placeholder="Type or pick e.g. Rice, Chocolate, Eggs"
                            value={it.name}
                            onChange={(e) => handleItemChange(it.id, "name", e.target.value)}
                            required
                            className="w-full h-9 px-2.5 bg-[#FCF8F2] border border-[#EADBCA] rounded-lg text-xs font-bold text-kf-navy focus:bg-white focus:border-kf-orange focus:outline-none"
                          />
                          <select
                            data-testid="item-product-select"
                            value={it.name}
                            onChange={(e) => handleSelectProductDropdown(it.id, e.target.value)}
                            className="w-full h-6 px-1.5 bg-[#FAF3E8] border border-[#EADBCA] rounded text-[11px] font-medium text-[#556B82]"
                          >
                            <option value="">-- Or choose from catalog --</option>
                            {products.map((p) => (
                              <option key={p.name} value={p.name}>
                                {p.name} (Rs. {p.defaultRate}/{p.defaultUnit})
                              </option>
                            ))}
                            <option value="__new__">➕ Add New Product...</option>
                          </select>
                        </div>
                      </div>

                      {/* Quantity Input */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-[#556B82] uppercase mb-1">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          data-testid="item-quantity-input"
                          step="any"
                          min="0.001"
                          placeholder="1.5"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(it.id, "quantity", e.target.value)}
                          required
                          className="w-full h-9 px-2 bg-[#FCF8F2] border border-[#EADBCA] rounded-lg text-xs font-bold text-kf-navy focus:bg-white focus:border-kf-orange focus:outline-none"
                        />
                      </div>

                      {/* Unit Selector */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-[#556B82] uppercase mb-1">
                          Unit <span className="text-red-500">*</span>
                        </label>
                        <select
                          data-testid="item-unit-select"
                          value={it.unit}
                          onChange={(e) => handleItemChange(it.id, "unit", e.target.value)}
                          className="w-full h-9 px-1.5 bg-[#FCF8F2] border border-[#EADBCA] rounded-lg text-xs font-bold text-kf-navy focus:bg-white focus:border-kf-orange focus:outline-none"
                        >
                          {COMMON_UNITS.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Transaction Rate (PKR) */}
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-[#556B82] uppercase mb-1">
                          Price per {it.unit} (PKR) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#8DA6BC]">
                            Rs.
                          </span>
                          <input
                            type="number"
                            data-testid="item-rate-input"
                            step="any"
                            min="0.01"
                            placeholder="0"
                            value={it.unitPrice}
                            onChange={(e) => handleItemChange(it.id, "unitPrice", e.target.value)}
                            required
                            className="w-full h-9 pl-7 pr-2 bg-[#FCF8F2] border border-[#EADBCA] rounded-lg text-xs font-bold text-kf-navy focus:bg-white focus:border-kf-orange focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Quantity Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                      <span className="text-[#8DA6BC] font-bold">Quick Qty:</span>
                      {isWeightOrLiquid ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleQuickQuantity(it.id, "0.25")}
                            className="px-1.5 py-0.5 rounded bg-[#FAF3E8] hover:bg-orange-100 font-bold text-[#556B82]"
                          >
                            ¼ {it.unit} (0.25)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickQuantity(it.id, "0.5")}
                            className="px-1.5 py-0.5 rounded bg-[#FAF3E8] hover:bg-orange-100 font-bold text-[#556B82]"
                          >
                            ½ {it.unit} (0.5)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickQuantity(it.id, "0.75")}
                            className="px-1.5 py-0.5 rounded bg-[#FAF3E8] hover:bg-orange-100 font-bold text-[#556B82]"
                          >
                            ¾ {it.unit} (0.75)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickQuantity(it.id, "1")}
                            className="px-1.5 py-0.5 rounded bg-[#FAF3E8] hover:bg-orange-100 font-bold text-[#556B82]"
                          >
                            1 {it.unit}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickQuantity(it.id, "1.5")}
                            className="px-1.5 py-0.5 rounded bg-[#FAF3E8] hover:bg-orange-100 font-bold text-[#556B82]"
                          >
                            1.5 {it.unit}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickQuantity(it.id, "2")}
                            className="px-1.5 py-0.5 rounded bg-[#FAF3E8] hover:bg-orange-100 font-bold text-[#556B82]"
                          >
                            2 {it.unit}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickQuantity(it.id, "5")}
                            className="px-1.5 py-0.5 rounded bg-[#FAF3E8] hover:bg-orange-100 font-bold text-[#556B82]"
                          >
                            5 {it.unit}
                          </button>
                        </>
                      ) : (
                        <>
                          {["1", "2", "3", "5", "10", "11", "12"].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleQuickQuantity(it.id, num)}
                              className="px-2 py-0.5 rounded bg-[#FAF3E8] hover:bg-orange-100 font-bold text-[#556B82]"
                            >
                              {num}
                            </button>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Historical Rate Separation & Catalog Update Helper */}
                    {hasPriceDiff && (
                      <div className="flex items-center justify-between p-1.5 bg-amber-50/70 rounded-lg text-[11px] text-amber-900 border border-amber-200">
                        <span>
                          Current transaction rate (Rs. {r}/{it.unit}) differs from catalog default (Rs. {matchedCatalog?.defaultRate}/{it.unit}).
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCatalogRate(it.id)}
                          className="px-2 py-0.5 bg-amber-200/80 hover:bg-amber-300 rounded font-bold text-amber-950 cursor-pointer"
                        >
                          🔄 Update Catalog Default to Rs. {r}
                        </button>
                      </div>
                    )}

                    {/* Line total summary */}
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#F5ECE1]">
                      <span className="text-[11px] text-[#556B82]">
                        {q} {it.unit} @ Rs. {r.toLocaleString()}/{it.unit}
                      </span>
                      <span className="font-extrabold text-kf-navy tabular-nums">
                        Line Total: Rs. {rowTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculated Grand Total Box */}
            <div className="p-3 bg-white rounded-xl border border-[#EADBCA] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-[#8DA6BC] uppercase font-bold block">
                  Calculated Total Credit
                </span>
                <span className="text-xs text-[#556B82]">
                  {items.length} item(s) on bill
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-kf-orange tabular-nums">
                  Rs. {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Note / Remarks */}
          <div>
            <label htmlFor="credit-notes-input" className="block text-xs font-bold text-kf-navy mb-1.5">
              Note / Optional Remarks
            </label>
            <input
              id="credit-notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sent via driver, counter purchase note"
              className="w-full h-10 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
            />
          </div>

          {/* New Balance Projection */}
          {selectedCustomer && (
            <div className="p-3 bg-[#FFF8F0] border border-[#FFE2C2] rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[#556B82]">Current Balance: </span>
                <span className="font-bold text-kf-navy">Rs. {currentBalance.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[#556B82]">New Balance will be: </span>
                <span className="font-extrabold text-kf-orange text-sm">
                  Rs. {(currentBalance + grandTotal).toLocaleString()}
                </span>
              </div>
            </div>
          )}

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
              disabled={isSubmitting || grandTotal <= 0}
              className="px-5 py-2.5 bg-gradient-to-r from-[#FF6A00] to-[#FF7E1F] hover:from-[#E85E00] hover:to-[#FF6A00] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF6A00]/25 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? "Saving Items..." : `Add Rs. ${grandTotal.toLocaleString()} to Khata`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
