"use client";

import React, { useState, useMemo } from "react";
import { useDashboard, ProductCatalogItem } from "../context/DashboardContext";
import { useLanguage } from "../../context/LanguageContext";

const PRESET_UNITS = [
  { value: "kg", label: "kg (Kilogram)" },
  { value: "pieces", label: "pieces (Pcs)" },
  { value: "liters", label: "liters (L)" },
  { value: "bags", label: "bags (Bori)" },
  { value: "cartons", label: "cartons (Peti)" },
  { value: "packs", label: "packs" },
  { value: "dozens", label: "dozens (Darjan)" },
  { value: "g", label: "g (Grams)" },
];

export default function ItemsPage() {
  const {
    products,
    addProduct,
    updateProductPrice,
    updateProduct,
    deleteProduct,
    adjustments,
    customersWithBalances,
    adjustBillItem,
    getCustomerBill,
  } = useDashboard();

  const { lang } = useLanguage();

  const [activeTab, setActiveTab] = useState<"items" | "adjustments">("items");
  const [searchQuery, setSearchQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustBillModal, setShowAdjustBillModal] = useState(false);

  // Active item in action
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formUnit, setFormUnit] = useState("kg");
  const [formRate, setFormRate] = useState("");
  const [formCategory, setFormCategory] = useState("General");
  const [quickNewRate, setQuickNewRate] = useState("");

  // Bill adjustment form state
  const [adjCustomerId, setAdjCustomerId] = useState("");
  const [adjItemName, setAdjItemName] = useState("");
  const [adjNewQty, setAdjNewQty] = useState("");
  const [adjNewPrice, setAdjNewPrice] = useState("");
  const [adjReason, setAdjReason] = useState("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchUnit = unitFilter === "all" || p.defaultUnit.toLowerCase() === unitFilter.toLowerCase();
      return matchSearch && matchUnit;
    });
  }, [products, searchQuery, unitFilter]);

  // Selected customer bill items for safe adjustment
  const activeCustomerBill = adjCustomerId ? getCustomerBill(adjCustomerId) : undefined;
  const billItemsForAdjustment = activeCustomerBill?.items || [];
  const selectedBillItem = billItemsForAdjustment.find((i) => i.name === adjItemName);

  // Handle Add Item
  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(formRate);
    if (!formName.trim()) {
      showNotification("error", "Item name is required.");
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      showNotification("error", "Please enter a valid price greater than zero.");
      return;
    }

    const res = addProduct({
      name: formName.trim(),
      defaultUnit: formUnit,
      defaultRate: rate,
      category: formCategory.trim() || "General",
    });

    if (res.success) {
      showNotification("success", `✓ Item "${formName.trim()}" added to your shop at Rs. ${rate.toLocaleString()}/${formUnit}!`);
      setShowAddModal(false);
      setFormName("");
      setFormRate("");
    } else {
      showNotification("error", res.error || "Failed to add item.");
    }
  };

  // Handle Quick Change Price
  const handleSavePriceChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const rate = parseFloat(quickNewRate);
    if (isNaN(rate) || rate <= 0) {
      showNotification("error", "Please enter a valid new price greater than zero.");
      return;
    }

    const res = updateProductPrice(selectedProduct.name, rate, selectedProduct.defaultUnit);
    if (res.success) {
      showNotification(
        "success",
        `✓ Default price for "${selectedProduct.name}" updated to Rs. ${rate.toLocaleString()}/${selectedProduct.defaultUnit}. (Past customer bills remain safely unchanged).`
      );
      setShowPriceModal(false);
      setSelectedProduct(null);
      setQuickNewRate("");
    } else {
      showNotification("error", res.error || "Failed to update price.");
    }
  };

  // Handle Edit Full Item
  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const rate = parseFloat(formRate);
    if (!formName.trim()) {
      showNotification("error", "Item name is required.");
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      showNotification("error", "Please enter a valid price greater than zero.");
      return;
    }

    const res = updateProduct(selectedProduct.name, {
      name: formName.trim(),
      defaultUnit: formUnit,
      defaultRate: rate,
      category: formCategory.trim() || "General",
    });

    if (res.success) {
      showNotification("success", `✓ Item "${formName.trim()}" details updated successfully!`);
      setShowEditModal(false);
      setSelectedProduct(null);
    } else {
      showNotification("error", res.error || "Failed to update item.");
    }
  };

  // Handle Delete Item
  const handleDeleteItem = (productName: string) => {
    if (window.confirm(`Are you sure you want to remove "${productName}" from your shop's item list?`)) {
      deleteProduct(productName);
      showNotification("success", `✓ Item "${productName}" removed from item list.`);
    }
  };

  // Handle Bill Item Adjustment (Safe Correction)
  const handleSaveBillAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjCustomerId) {
      showNotification("error", "Please select a customer.");
      return;
    }
    if (!adjItemName) {
      showNotification("error", "Please select an item from the customer's bill.");
      return;
    }
    const q = parseFloat(adjNewQty);
    const p = parseFloat(adjNewPrice);
    if (isNaN(q) || q <= 0) {
      showNotification("error", "Corrected quantity must be greater than zero.");
      return;
    }
    if (isNaN(p) || p <= 0) {
      showNotification("error", "Price must be greater than zero.");
      return;
    }
    if (!adjReason.trim()) {
      showNotification("error", "Please enter a reason for the adjustment.");
      return;
    }

    const res = adjustBillItem({
      customerId: adjCustomerId,
      billId: activeCustomerBill?.id,
      enteredItemName: adjItemName,
      correctedQuantity: q,
      correctedUnitPrice: p,
      reason: adjReason.trim(),
    });

    if (res.success && res.adjustment) {
      const diffSign = res.adjustment.differenceAmount >= 0 ? "+" : "-";
      showNotification(
        "success",
        `✓ Bill item adjusted (${diffSign}Rs. ${Math.abs(res.adjustment.differenceAmount).toLocaleString()}). Customer ledger and balances updated accurately!`
      );
      setShowAdjustBillModal(false);
      setAdjCustomerId("");
      setAdjItemName("");
      setAdjNewQty("");
      setAdjNewPrice("");
      setAdjReason("");
    } else {
      showNotification("error", res.error || "Failed to adjust item.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-kf-navy tracking-tight">
            Items & Rates (سامان اور ریٹ)
          </h1>
          <p className="text-xs sm:text-sm text-[#556B82] mt-0.5">
            Manage your shop&apos;s items, default selling rates, and safe bill corrections
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-adjust-bill-item"
            type="button"
            onClick={() => setShowAdjustBillModal(true)}
            className="py-2.5 px-3.5 bg-white hover:bg-[#FAF4EC] border border-[#EADBCA] text-kf-navy rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <span>⚖️ Correct Customer Bill</span>
          </button>
          <button
            id="btn-add-new-item"
            type="button"
            onClick={() => {
              setFormName("");
              setFormUnit("kg");
              setFormRate("");
              setFormCategory("General");
              setShowAddModal(true);
            }}
            className="py-2.5 px-4 bg-gradient-to-r from-[#FF6A00] to-[#FF7708] hover:from-[#E85E00] hover:to-[#FF6A00] text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#FF6A00]/20 transition-all cursor-pointer"
          >
            <span>+ Add New Item</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
            feedback.type === "success"
              ? "bg-green-50 border border-green-200 text-green-900"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <span>{feedback.type === "success" ? "✓" : "⚠"}</span>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#F0E4D4] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("items")}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === "items"
              ? "bg-kf-navy text-white shadow-xs"
              : "bg-[#FAF4EC] text-[#556B82] hover:text-kf-navy hover:bg-[#F2E8DC]"
          }`}
        >
          Shop Items ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("adjustments")}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === "adjustments"
              ? "bg-kf-navy text-white shadow-xs"
              : "bg-[#FAF4EC] text-[#556B82] hover:text-kf-navy hover:bg-[#F2E8DC]"
          }`}
        >
          Adjustment History ({adjustments.length})
        </button>
      </div>

      {activeTab === "items" ? (
        /* TAB 1: ITEMS CATALOG */
        <div className="space-y-4">
          {/* Search & Unit Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-[#EADBCA] rounded-2xl shadow-xs">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items by name..."
                className="w-full h-10 pl-9 pr-3 bg-[#FAF5EE] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none focus:bg-white focus:border-kf-orange"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-[11px] font-bold text-[#7B90A2] whitespace-nowrap pl-1">
                Unit:
              </span>
              {["all", "kg", "pieces", "liters", "bags"].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnitFilter(u)}
                  className={`py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all cursor-pointer capitalize whitespace-nowrap ${
                    unitFilter === u
                      ? "bg-kf-orange text-white shadow-xs"
                      : "bg-[#FAF5EE] text-[#556B82] hover:bg-[#F0E6D8]"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Items Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#EADBCA] space-y-3">
              <div className="w-12 h-12 bg-amber-50 text-kf-orange rounded-full flex items-center justify-center mx-auto text-xl">
                📦
              </div>
              <h3 className="text-sm font-extrabold text-kf-navy">No Items Found</h3>
              <p className="text-xs text-[#7B90A2] max-w-sm mx-auto">
                {products.length === 0
                  ? "You haven't added any items yet. Add items so you can quickly pick them when giving credit!"
                  : "No items match your search filter."}
              </p>
              {products.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="py-2 px-4 bg-kf-orange text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>+ Add Your First Item</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map((p) => (
                <div
                  key={p.name}
                  className="p-4 bg-white border border-[#EADBCA] rounded-2xl shadow-xs hover:border-[#FFB27A] transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-kf-navy leading-tight truncate">
                        {p.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-lg bg-[#FAF5EE] border border-[#EADBCA] text-[10px] font-extrabold text-[#556B82] uppercase">
                        {p.defaultUnit}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-lg font-black text-kf-navy">
                        Rs. {p.defaultRate.toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-[#7B90A2]">
                        / {p.defaultUnit}
                      </span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-2 border-t border-[#F5ECE1] flex items-center justify-between gap-1.5">
                    <button
                      data-action="change-price"
                      data-product={p.name}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(p);
                        setQuickNewRate(p.defaultRate.toString());
                        setShowPriceModal(true);
                      }}
                      className="flex-1 py-1.5 px-2 bg-[#FFF3E6] hover:bg-[#FFE6CC] text-[#A34700] rounded-xl text-[11px] font-bold text-center transition-colors cursor-pointer"
                    >
                      Change Price
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(p);
                        setFormName(p.name);
                        setFormUnit(p.defaultUnit);
                        setFormRate(p.defaultRate.toString());
                        setFormCategory(p.category || "General");
                        setShowEditModal(true);
                      }}
                      className="py-1.5 px-2.5 bg-gray-100 hover:bg-gray-200 text-[#556B82] rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                      title="Edit Item"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(p.name)}
                      className="py-1.5 px-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                      title="Remove Item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: ADJUSTMENT HISTORY */
        <div className="space-y-4">
          <div className="p-3.5 bg-white border border-[#EADBCA] rounded-2xl shadow-xs">
            <h3 className="text-xs font-extrabold text-kf-navy uppercase tracking-wider mb-1">
              Bill Item Corrections & Adjustments Audit Trail
            </h3>
            <p className="text-xs text-[#7B90A2]">
              Historical records of all scale corrections, quantity edits, and returns. All adjustments are logged safely without overwriting previous transaction prices.
            </p>
          </div>

          {adjustments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#EADBCA] space-y-2">
              <span className="text-2xl">⚖️</span>
              <h3 className="text-sm font-extrabold text-kf-navy">No Adjustments Recorded</h3>
              <p className="text-xs text-[#7B90A2]">
                When you make a correction to an itemized customer bill, the audit trail will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#EADBCA] rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF5EE] border-b border-[#EADBCA] text-[11px] font-extrabold text-[#556B82]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Item Adjusted</th>
                      <th className="py-3 px-4">Original</th>
                      <th className="py-3 px-4">Corrected</th>
                      <th className="py-3 px-4">Difference</th>
                      <th className="py-3 px-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E4D4]">
                    {adjustments.map((adj) => {
                      const isNegative = adj.differenceAmount < 0;
                      return (
                        <tr key={adj.id} className="hover:bg-[#FCF9F5]">
                          <td className="py-3 px-4 text-[#7B90A2] whitespace-nowrap">
                            {adj.date}
                          </td>
                          <td className="py-3 px-4 font-bold text-kf-navy whitespace-nowrap">
                            {adj.customerName || "Customer"}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-kf-navy">
                            {adj.originalItemName}
                          </td>
                          <td className="py-3 px-4 text-[#556B82] whitespace-nowrap">
                            {adj.originalQuantity} {adj.unit} @ Rs. {adj.originalUnitPrice} (Rs. {adj.originalLineTotal.toLocaleString()})
                          </td>
                          <td className="py-3 px-4 font-bold text-kf-navy whitespace-nowrap">
                            {adj.correctedQuantity} {adj.unit} @ Rs. {adj.correctedUnitPrice} (Rs. {adj.correctedLineTotal.toLocaleString()})
                          </td>
                          <td className="py-3 px-4 font-black whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs ${
                                isNegative
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {isNegative ? "-" : "+"}Rs. {Math.abs(adj.differenceAmount).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#556B82] max-w-xs truncate">
                            {adj.reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD NEW ITEM */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-[#EADBCA] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4D4]">
              <h3 className="text-base font-extrabold text-kf-navy">+ Add New Shop Item</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-[#556B82] hover:bg-[#F5ECE1]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-kf-navy mb-1">
                  Item Name *
                </label>
                <input
                  id="add-item-name-input"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Sugar (Cheeni), Dal Moong, Milk"
                  className="w-full h-10 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none focus:border-kf-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-kf-navy mb-1">
                    Selling Unit *
                  </label>
                  <select
                    id="add-item-unit-select"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full h-10 px-2 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none cursor-pointer"
                  >
                    {PRESET_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-kf-navy mb-1">
                    Default Price (Rs.) *
                  </label>
                  <input
                    id="add-item-rate-input"
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                    placeholder="250"
                    className="w-full h-10 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none focus:border-kf-orange"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#F0E4D4]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#556B82] hover:bg-[#F5ECE1] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-new-item"
                  type="submit"
                  className="px-5 py-2 bg-kf-orange hover:bg-kf-orange-hover text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK CHANGE PRICE */}
      {showPriceModal && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#EADBCA] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4D4]">
              <div>
                <h3 className="text-sm font-extrabold text-kf-navy">Change Default Price</h3>
                <p className="text-xs text-[#7B90A2]">{selectedProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPriceModal(false)}
                className="p-1 rounded-lg text-[#556B82] hover:bg-[#F5ECE1]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePriceChange} className="space-y-3.5">
              <div className="p-3 bg-[#FAF5EE] rounded-2xl text-xs space-y-1">
                <div className="flex justify-between text-[#556B82]">
                  <span>Current Default:</span>
                  <span className="font-bold">Rs. {selectedProduct.defaultRate} / {selectedProduct.defaultUnit}</span>
                </div>
                <div className="text-[11px] text-[#A04500] pt-1">
                  💡 Note: Updates future credit entries only. Historical customer bills remain safe and unchanged.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-kf-navy mb-1">
                  New Default Selling Price (Rs. / {selectedProduct.defaultUnit}) *
                </label>
                <input
                  id="price-change-input"
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={quickNewRate}
                  onChange={(e) => setQuickNewRate(e.target.value)}
                  placeholder="e.g. 220"
                  className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-base font-extrabold text-kf-navy outline-none focus:border-kf-orange"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#F0E4D4]">
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#556B82] hover:bg-[#F5ECE1] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-price-change"
                  type="submit"
                  className="px-5 py-2 bg-kf-orange hover:bg-kf-orange-hover text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Update Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT FULL ITEM */}
      {showEditModal && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-[#EADBCA] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4D4]">
              <h3 className="text-base font-extrabold text-kf-navy">Edit Item Details</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-[#556B82] hover:bg-[#F5ECE1]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-kf-navy mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-10 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none focus:border-kf-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-kf-navy mb-1">
                    Selling Unit *
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full h-10 px-2 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none cursor-pointer"
                  >
                    {PRESET_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-kf-navy mb-1">
                    Default Price (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                    className="w-full h-10 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none focus:border-kf-orange"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#F0E4D4]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#556B82] hover:bg-[#F5ECE1] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-kf-orange hover:bg-kf-orange-hover text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SAFE BILL ITEM ADJUSTMENT */}
      {showAdjustBillModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-[#EADBCA] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4D4]">
              <div>
                <h3 className="text-base font-extrabold text-kf-navy">Correct Customer Bill Item</h3>
                <p className="text-xs text-[#7B90A2]">
                  Fix entry mistakes or returned goods with automatic balance update
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdjustBillModal(false)}
                className="p-1 rounded-lg text-[#556B82] hover:bg-[#F5ECE1]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBillAdjustment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-kf-navy mb-1">
                  1. Select Customer *
                </label>
                <select
                  value={adjCustomerId}
                  onChange={(e) => {
                    setAdjCustomerId(e.target.value);
                    setAdjItemName("");
                  }}
                  required
                  className="w-full h-10 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none cursor-pointer"
                >
                  <option value="">Choose Customer...</option>
                  {customersWithBalances.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Udhaar: Rs. {c.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {adjCustomerId && (
                <div>
                  <label className="block text-xs font-bold text-kf-navy mb-1">
                    2. Select Item on Bill to Correct *
                  </label>
                  {billItemsForAdjustment.length === 0 ? (
                    <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-200 font-semibold">
                      This customer has no itemized bills on file to adjust.
                    </p>
                  ) : (
                    <select
                      value={adjItemName}
                      onChange={(e) => {
                        const itName = e.target.value;
                        setAdjItemName(itName);
                        const it = billItemsForAdjustment.find((i) => i.name === itName);
                        if (it) {
                          setAdjNewQty(it.quantity.toString());
                          setAdjNewPrice(it.unitPrice.toString());
                        }
                      }}
                      required
                      className="w-full h-10 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none cursor-pointer"
                    >
                      <option value="">Choose Item...</option>
                      {billItemsForAdjustment.map((it) => (
                        <option key={it.id} value={it.name}>
                          {it.name} — Current: {it.quantity} {it.unit} @ Rs.{it.unitPrice} (Rs. {it.lineTotal})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {selectedBillItem && (
                <>
                  <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAF5EE] rounded-2xl border border-[#EADBCA]">
                    <div>
                      <span className="text-[10px] font-bold text-[#7B90A2] block">Original Quantity:</span>
                      <span className="text-xs font-extrabold text-kf-navy">
                        {selectedBillItem.quantity} {selectedBillItem.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#7B90A2] block">Original Total:</span>
                      <span className="text-xs font-extrabold text-kf-navy">
                        Rs. {selectedBillItem.lineTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-kf-navy mb-1">
                        Corrected Quantity ({selectedBillItem.unit}) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        required
                        value={adjNewQty}
                        onChange={(e) => setAdjNewQty(e.target.value)}
                        className="w-full h-10 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none focus:border-kf-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-kf-navy mb-1">
                        Unit Price (Rs.) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        required
                        value={adjNewPrice}
                        onChange={(e) => setAdjNewPrice(e.target.value)}
                        className="w-full h-10 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none focus:border-kf-orange"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-kf-navy mb-1">
                      Reason for Adjustment *
                    </label>
                    <input
                      type="text"
                      required
                      value={adjReason}
                      onChange={(e) => setAdjReason(e.target.value)}
                      placeholder="e.g. Returned 0.5kg, weighed incorrectly on scale"
                      className="w-full h-10 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy outline-none focus:border-kf-orange"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#F0E4D4]">
                <button
                  type="button"
                  onClick={() => setShowAdjustBillModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#556B82] hover:bg-[#F5ECE1] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedBillItem}
                  className="px-5 py-2 bg-kf-orange hover:bg-kf-orange-hover disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Save Bill Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
