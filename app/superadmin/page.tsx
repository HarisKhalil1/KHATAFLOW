"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  useShopRegistry,
  RegisteredShop,
  ShopCategory,
  ShopStatus,
} from "../context/ShopRegistryContext";

const CATEGORIES: ShopCategory[] = [
  "General Store",
  "Grocery / Kiryana",
  "Pharmacy / Medical",
  "Wholesale & Distribution",
  "Electronics & Mobile",
  "Bakery & Sweets",
  "Other",
];

export default function SuperAdminPage() {
  const {
    shops,
    systemStats,
    createShopByAdmin,
    updateShopByAdmin,
    suspendShop,
    restoreShop,
    verifyShopByAdmin,
  } = useShopRegistry();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ShopStatus>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modals state
  const [selectedShopForDetails, setSelectedShopForDetails] = useState<RegisteredShop | null>(null);
  const [selectedShopForEdit, setSelectedShopForEdit] = useState<RegisteredShop | null>(null);
  const [selectedShopForSuspend, setSelectedShopForSuspend] = useState<RegisteredShop | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states for Create Shop
  const [createForm, setCreateForm] = useState({
    name: "",
    category: "General Store" as ShopCategory,
    city: "Peshawar",
    address: "",
    ownerName: "",
    ownerPhone: "",
  });
  const [createdClaimResult, setCreatedClaimResult] = useState<{
    shop: RegisteredShop;
    claimCode: string;
  } | null>(null);

  // Form states for Edit Shop
  const [editForm, setEditForm] = useState({
    name: "",
    category: "General Store" as ShopCategory,
    city: "",
    address: "",
  });

  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState<number | null>(168); // default 7 days = 168 hours

  const [estimatedExpiryText, setEstimatedExpiryText] = useState("Calculating...");

  useEffect(() => {
    queueMicrotask(() => {
      if (suspendDuration === null) {
        setEstimatedExpiryText("Indefinite");
      } else {
        const d = new Date();
        d.setTime(d.getTime() + suspendDuration * 3600 * 1000);
        setEstimatedExpiryText(d.toLocaleString());
      }
    });
  }, [suspendDuration]);

  // Toast / Feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered Shops
  const filteredShops = useMemo(() => {
    return shops.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q) ||
        s.ownerPhone.includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (selectedCategory !== "all" && s.category !== selectedCategory) return false;
      return true;
    });
  }, [shops, searchQuery, statusFilter, selectedCategory]);

  // Handle Create Shop Submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      showToast("Shop name is required.");
      return;
    }

    const res = createShopByAdmin(createForm);
    if (res.success && res.shop && res.claimCode) {
      setCreatedClaimResult({ shop: res.shop, claimCode: res.claimCode });
      showToast(`Shop "${res.shop.name}" created with ID ${res.shop.id}!`);
      // Reset input form
      setCreateForm({
        name: "",
        category: "General Store",
        city: "Peshawar",
        address: "",
        ownerName: "",
        ownerPhone: "",
      });
    } else {
      showToast(res.error || "Failed to create shop.");
    }
  };

  // Handle Edit Shop Submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopForEdit) return;

    const res = updateShopByAdmin(selectedShopForEdit.id, editForm);
    if (res.success) {
      showToast(`Shop "${editForm.name}" updated successfully.`);
      setSelectedShopForEdit(null);
    } else {
      showToast(res.error || "Failed to update shop.");
    }
  };

  // Handle Suspend Confirmation
  const handleSuspendConfirm = () => {
    if (!selectedShopForSuspend) return;
    if (!suspendReason.trim()) {
      showToast("Please provide a valid suspension reason.");
      return;
    }

    const res = suspendShop(selectedShopForSuspend.id, suspendReason, suspendDuration);
    if (res.success) {
      showToast(
        `Shop "${selectedShopForSuspend.name}" has been suspended. Financial data is safely preserved.`
      );
      setSelectedShopForSuspend(null);
      setSuspendReason("");
    } else {
      showToast(res.error || "Failed to suspend shop.");
    }
  };

  // Handle Restore
  const handleRestore = (shopId: string, shopName: string) => {
    if (window.confirm(`Reactivate shop "${shopName}"? The owner will regain dashboard access immediately.`)) {
      const res = restoreShop(shopId);
      if (res.success) {
        showToast(`Shop "${shopName}" is now active and restored.`);
      }
    }
  };

  // Copy helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Claim code "${code}" copied to clipboard!`);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 bg-[#0F283E] text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#FF6A00]/40 flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom duration-200"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00] flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F283E] via-[#163857] to-[#1F4E79] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-[#FFB280] mb-3 border border-white/15">
            <span className="w-2 h-2 rounded-full bg-[#FF6A00]" />
            Phase 1C • Super Admin Control Center
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight mb-2">
            System Overview &amp; Shop Management
          </h1>
          <p className="text-xs sm:text-sm text-[#C8DCED] leading-relaxed mb-6">
            Authorized system administration. Manage registered business accounts, enforce temporary compliance holds,
            and create shop claim invitations. Customer ledgers, private debts, and owner credentials remain strictly private.
          </p>

          <button
            type="button"
            onClick={() => {
              setCreatedClaimResult(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-[#FF6A00] to-[#FF8C33] hover:from-[#E85E00] hover:to-[#FF6A00] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF6A00]/30 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>+ Register New Shop (Admin)</span>
          </button>
        </div>
      </div>

      {/* System Statistics Cards (Real authorized figures from shop registry) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl p-5 border border-[#EADBCA] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#8DA6BC] uppercase tracking-wider block mb-1">
              Total Registered Shops
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-kf-navy tabular-nums">
              {systemStats.totalShops}
            </span>
            <span className="text-[11px] text-[#556B82] block mt-0.5">Live store tenants</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            🏬
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EADBCA] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider block mb-1">
              Active Shops
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-green-700 tabular-nums">
              {systemStats.activeShops}
            </span>
            <span className="text-[11px] text-[#556B82] block mt-0.5">Operational dashboards</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center text-xl font-bold">
            ✓
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EADBCA] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">
              Suspended Shops
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-red-600 tabular-nums">
              {systemStats.suspendedShops}
            </span>
            <span className="text-[11px] text-[#556B82] block mt-0.5">Access restricted</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xl font-bold">
            ⏸️
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EADBCA] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-kf-orange uppercase tracking-wider block mb-1">
              New Registrations (30d)
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-kf-orange tabular-nums">
              {systemStats.recentlyCreatedCount}
            </span>
            <span className="text-[11px] text-[#556B82] block mt-0.5">Recently onboarded</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-kf-orange flex items-center justify-center text-xl font-bold">
            ✨
          </div>
        </div>
      </div>

      {/* Honest Architecture & Privacy Boundary Notice */}
      <div className="p-4 bg-gradient-to-r from-[#FFFDF9] to-[#FAF3E8] rounded-2xl border border-[#EADBCA] text-xs text-[#556B82] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <span className="text-base leading-none">🛡️</span>
          <div>
            <strong className="text-kf-navy block font-extrabold">
              Strict Super Admin Privacy Boundary:
            </strong>
            <span>
              Per system rules, Super Admin may view and manage only shop administrative metadata and status.
              Owner passwords, customer lists, ledger transactions, udhaar balances, and bills are <strong>never</strong> displayed here or stored in administrator records.
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 text-[11px] font-bold text-kf-orange bg-white px-2.5 py-1 rounded-lg border border-[#EADBCA]">
          Data Isolation Enforced
        </div>
      </div>

      {/* Shop Management Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#EADBCA] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0E4D4]">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-kf-navy tracking-tight">
              Registered Shops Directory
            </h2>
            <p className="text-xs text-[#556B82]">
              Administrative listing of all verified retail shop tenants and accounts
            </p>
          </div>

          {/* Quick Stats Pill */}
          <span className="text-xs font-bold text-kf-navy bg-[#F5ECE1] px-3 py-1.5 rounded-xl border border-[#EADBCA] self-start sm:self-auto">
            Showing {filteredShops.length} of {shops.length} Shops
          </span>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8DA6BC]"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by shop name, ID, city, or owner..."
              className="w-full h-10 pl-10 pr-4 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:bg-white focus:outline-none focus:border-kf-orange focus:ring-1 focus:ring-kf-orange shadow-2xs transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-[#F5ECE1] p-1 rounded-xl border border-[#EADBCA]">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "all" ? "bg-white text-kf-navy shadow-xs" : "text-[#556B82]"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "active" ? "bg-white text-green-700 shadow-xs" : "text-[#556B82]"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("suspended")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "suspended" ? "bg-white text-red-700 shadow-xs" : "text-[#556B82]"
                }`}
              >
                Suspended
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending-verification")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "pending-verification" ? "bg-white text-amber-700 shadow-xs" : "text-[#556B82]"
                }`}
              >
                Pending
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none cursor-pointer focus:border-kf-orange"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shops Table */}
        <div className="overflow-x-auto border border-[#EADBCA] rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF3E8] border-b border-[#EADBCA] text-[11px] font-extrabold text-[#556B82] uppercase tracking-wider">
                <th className="py-3 px-4">Shop ID</th>
                <th className="py-3 px-4">Shop Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">City / Address</th>
                <th className="py-3 px-4">Administrative Status</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E4D4]">
              {filteredShops.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#556B82]">
                    No shops found matching your search or filters.
                  </td>
                </tr>
              ) : (
                filteredShops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-[#FFFDF9] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-kf-navy whitespace-nowrap">
                      {shop.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-kf-navy">
                      <div>{shop.name}</div>
                      <div className="text-[11px] font-normal text-[#6F8599]">
                        Owner: {shop.ownerName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#556B82] whitespace-nowrap">
                      {shop.category}
                    </td>
                    <td className="py-3.5 px-4 text-[#556B82] max-w-[200px] truncate" title={shop.address || shop.city}>
                      {shop.city}
                      {shop.address && <span className="block text-[10px] text-[#8DA6BC] truncate">{shop.address}</span>}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {shop.status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-green-50 text-green-700 border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                          Active
                        </span>
                      ) : shop.status === "suspended" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          Pending Verification
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#556B82] whitespace-nowrap text-[11px]">
                      {new Date(shop.createdAt).toLocaleDateString("en-PK", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      {/* View Details */}
                      <button
                        type="button"
                        onClick={() => setSelectedShopForDetails(shop)}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF3E8] hover:bg-[#F0E4D4] text-kf-navy font-bold text-[11px] transition-colors cursor-pointer border border-[#EADBCA]"
                        title="View administrative details"
                      >
                        Details
                      </button>

                      {/* Edit Info */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedShopForEdit(shop);
                          setEditForm({
                            name: shop.name,
                            category: shop.category,
                            city: shop.city,
                            address: shop.address || "",
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF3E8] text-kf-navy font-bold text-[11px] transition-colors cursor-pointer border border-[#EADBCA]"
                        title="Edit shop administrative information"
                      >
                        Edit
                      </button>

                      {/* Suspend or Reactivate */}
                      {shop.status === "suspended" ? (
                        <button
                          type="button"
                          onClick={() => handleRestore(shop.id, shop.name)}
                          className="px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedShopForSuspend(shop);
                            setSuspendReason("");
                            setSuspendDuration(168);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] transition-colors cursor-pointer border border-red-200"
                        >
                          Suspend
                        </button>
                      )}

                      {/* Verify Action for Pending */}
                      {shop.status === "pending-verification" && (
                        <button
                          type="button"
                          onClick={() => {
                            verifyShopByAdmin(shop.id);
                            showToast(`Shop "${shop.name}" approved and activated!`);
                          }}
                          className="px-2 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: VIEW ADMINISTRATIVE DETAILS                         */}
      {/* ============================================================ */}
      {selectedShopForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EADBCA] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4D4]">
              <div>
                <span className="text-[10px] font-bold text-kf-orange uppercase tracking-wider block">
                  Shop Administrative Record
                </span>
                <h3 className="text-base font-extrabold text-kf-navy">
                  {selectedShopForDetails.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShopForDetails(null)}
                className="w-8 h-8 rounded-full bg-[#FAF3E8] hover:bg-[#F0E4D4] text-kf-navy flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FCF8F2] rounded-xl border border-[#EADBCA]">
                <span className="text-[10px] font-bold text-[#8DA6BC] uppercase block">
                  Unique Shop ID
                </span>
                <span className="font-mono font-bold text-kf-navy text-sm">
                  {selectedShopForDetails.id}
                </span>
              </div>

              <div className="p-3 bg-[#FCF8F2] rounded-xl border border-[#EADBCA]">
                <span className="text-[10px] font-bold text-[#8DA6BC] uppercase block">
                  Status
                </span>
                <span className="font-bold text-kf-navy capitalize">
                  {selectedShopForDetails.status}
                </span>
              </div>

              <div className="p-3 bg-[#FCF8F2] rounded-xl border border-[#EADBCA]">
                <span className="text-[10px] font-bold text-[#8DA6BC] uppercase block">
                  Category
                </span>
                <span className="font-semibold text-kf-navy">
                  {selectedShopForDetails.category}
                </span>
              </div>

              <div className="p-3 bg-[#FCF8F2] rounded-xl border border-[#EADBCA]">
                <span className="text-[10px] font-bold text-[#8DA6BC] uppercase block">
                  Registered On
                </span>
                <span className="font-semibold text-kf-navy">
                  {new Date(selectedShopForDetails.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="col-span-2 p-3 bg-[#FCF8F2] rounded-xl border border-[#EADBCA]">
                <span className="text-[10px] font-bold text-[#8DA6BC] uppercase block">
                  Location &amp; Address
                </span>
                <span className="font-semibold text-kf-navy">
                  {selectedShopForDetails.address || selectedShopForDetails.city}
                </span>
              </div>

              <div className="col-span-2 p-3 bg-[#FCF8F2] rounded-xl border border-[#EADBCA]">
                <span className="text-[10px] font-bold text-[#8DA6BC] uppercase block">
                  Primary Contact
                </span>
                <span className="font-semibold text-kf-navy">
                  {selectedShopForDetails.ownerName} ({selectedShopForDetails.ownerPhone})
                </span>
              </div>

              {/* Suspension Details if Suspended */}
              {selectedShopForDetails.status === "suspended" && (
                <div className="col-span-2 p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-red-800 uppercase block">
                    Suspension Audit Record
                  </span>
                  <div className="text-xs text-red-950">
                    <strong>Reason:</strong> {selectedShopForDetails.suspensionReason}
                  </div>
                  {selectedShopForDetails.suspendedAt && (
                    <div className="text-[11px] text-red-800">
                      <strong>Suspended At:</strong>{" "}
                      {new Date(selectedShopForDetails.suspendedAt).toLocaleString()}
                    </div>
                  )}
                  {selectedShopForDetails.suspensionExpiresAt ? (
                    <div className="text-[11px] text-red-800">
                      <strong>Automatic Expiry:</strong>{" "}
                      {new Date(selectedShopForDetails.suspensionExpiresAt).toLocaleString()}
                    </div>
                  ) : (
                    <div className="text-[11px] text-red-800">
                      <strong>Duration:</strong> Indefinite (Requires manual reactivation)
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 bg-[#FFFDF9] rounded-xl border border-[#EADBCA] text-[11px] text-[#556B82]">
              🔒 <strong>Privacy Assurance:</strong> Financial ledgers, udhaar records, customers, and passwords are not visible to Super Admin.
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedShopForDetails(null)}
                className="px-4 py-2 bg-[#F5ECE1] hover:bg-[#EADBCA] text-kf-navy text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: EDIT SHOP INFORMATION                               */}
      {/* ============================================================ */}
      {selectedShopForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EADBCA] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4D4]">
              <div>
                <span className="text-[10px] font-bold text-kf-orange uppercase tracking-wider block">
                  Permitted Admin Edit
                </span>
                <h3 className="text-base font-extrabold text-kf-navy">
                  Edit Shop Details ({selectedShopForEdit.id})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShopForEdit(null)}
                className="w-8 h-8 rounded-full bg-[#FAF3E8] hover:bg-[#F0E4D4] text-kf-navy flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-kf-navy mb-1">Shop Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-10 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none focus:border-kf-orange focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-kf-navy mb-1">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value as ShopCategory })}
                  className="w-full h-10 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none focus:border-kf-orange focus:bg-white cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-kf-navy mb-1">City</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full h-10 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy outline-none focus:border-kf-orange focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-kf-navy mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full h-10 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy outline-none focus:border-kf-orange focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedShopForEdit(null)}
                  className="px-4 py-2 bg-[#F5ECE1] hover:bg-[#EADBCA] text-kf-navy text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#FF6A00] to-[#FF8C33] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: SUSPEND SHOP (WITH REASON & EXPIRY)                 */}
      {/* ============================================================ */}
      {selectedShopForSuspend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4D4]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600" />
                <h3 className="text-base font-extrabold text-kf-navy">
                  Temporary Shop Suspension
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShopForSuspend(null)}
                className="w-8 h-8 rounded-full bg-[#FAF3E8] hover:bg-[#F0E4D4] text-kf-navy flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
              <div>
                Suspending: <strong>{selectedShopForSuspend.name}</strong> ({selectedShopForSuspend.id})
              </div>
              <div className="text-[11px] text-red-700">
                🔒 <strong>Safety Assurance:</strong> Suspension temporarily halts the shop owner’s dashboard access. All customer debts, ledgers, bills, and payments remain 100% preserved and will NOT be deleted.
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-kf-navy mb-1">
                  Suspension Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Verification document pending, municipal license update required, or administrative inquiry..."
                  className="w-full p-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy outline-none focus:border-red-500 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-kf-navy mb-1">
                  Suspension Duration
                </label>
                <select
                  value={suspendDuration === null ? "indefinite" : suspendDuration.toString()}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSuspendDuration(val === "indefinite" ? null : parseInt(val, 10));
                  }}
                  className="w-full h-10 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="24">24 Hours (1 Day)</option>
                  <option value="168">7 Days (1 Week)</option>
                  <option value="720">30 Days (1 Month)</option>
                  <option value="indefinite">Until Manual Reactivation (Indefinite)</option>
                </select>
              </div>

              {suspendDuration !== null && (
                <div className="text-[11px] text-[#556B82] bg-[#FAF3E8] p-2.5 rounded-xl border border-[#EADBCA]">
                  Estimated automatic expiry:{" "}
                  <strong className="text-kf-navy">
                    {estimatedExpiryText}
                  </strong>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedShopForSuspend(null)}
                className="px-4 py-2 bg-[#F5ECE1] hover:bg-[#EADBCA] text-kf-navy text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSuspendConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: CREATE SHOP & GENERATE CLAIM CODE                   */}
      {/* ============================================================ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EADBCA] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4D4]">
              <div>
                <span className="text-[10px] font-bold text-kf-orange uppercase tracking-wider block">
                  New Retail Store Onboarding
                </span>
                <h3 className="text-base font-extrabold text-kf-navy">
                  Create Shop &amp; Issue Invitation Code
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF3E8] hover:bg-[#F0E4D4] text-kf-navy flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createdClaimResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-xs space-y-2 text-green-950">
                  <div className="font-extrabold text-green-800 text-sm">
                    ✓ Shop Account Successfully Generated!
                  </div>
                  <div>
                    <strong>Shop ID:</strong>{" "}
                    <span className="font-mono font-bold">{createdClaimResult.shop.id}</span>
                  </div>
                  <div>
                    <strong>Shop Name:</strong> {createdClaimResult.shop.name}
                  </div>
                </div>

                <div className="p-4 bg-[#FCF8F2] border-2 border-dashed border-[#FF6A00] rounded-2xl text-center space-y-2">
                  <span className="text-[10px] font-bold text-[#8DA6BC] uppercase tracking-wider block">
                    Single-Use Shop Owner Claim Code
                  </span>
                  <div className="text-xl sm:text-2xl font-mono font-black text-kf-navy tracking-widest select-all">
                    {createdClaimResult.claimCode}
                  </div>
                  <p className="text-[11px] text-[#556B82] max-w-xs mx-auto">
                    The Super Admin does NOT create or view the owner’s password. Provide this claim code to the shop owner so they can set their own credentials.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(createdClaimResult.claimCode)}
                    className="mt-2 px-4 py-2 bg-gradient-to-r from-[#FF6A00] to-[#FF8C33] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>📋 Copy Claim Code</span>
                  </button>
                </div>

                <div className="text-[11px] text-[#556B82] bg-[#FAF3E8] p-3 rounded-xl border border-[#EADBCA]">
                  ⚠️ <strong>Honest Infrastructure Note:</strong> Automated email/SMS gateway is not connected in this local environment. Hand over this invitation code manually or via SMS.
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedClaimResult(null);
                      setIsCreateModalOpen(false);
                    }}
                    className="px-5 py-2.5 bg-[#0F283E] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-kf-navy mb-1">
                    Shop Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Saddar Grocery &amp; Kiryana"
                    className="w-full h-10 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none focus:border-kf-orange focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-kf-navy mb-1">
                      Category
                    </label>
                    <select
                      value={createForm.category}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, category: e.target.value as ShopCategory })
                      }
                      className="w-full h-10 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none focus:border-kf-orange focus:bg-white cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-kf-navy mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                      placeholder="e.g. Peshawar"
                      className="w-full h-10 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy outline-none focus:border-kf-orange focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-kf-navy mb-1">
                    Shop Address
                  </label>
                  <input
                    type="text"
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    placeholder="e.g. Shop #4, Khyber Bazaar"
                    className="w-full h-10 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy outline-none focus:border-kf-orange focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-kf-navy mb-1">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={createForm.ownerName}
                      onChange={(e) => setCreateForm({ ...createForm, ownerName: e.target.value })}
                      placeholder="e.g. Abdul Samad"
                      className="w-full h-10 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy outline-none focus:border-kf-orange focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-kf-navy mb-1">
                      Owner Phone
                    </label>
                    <input
                      type="text"
                      value={createForm.ownerPhone}
                      onChange={(e) => setCreateForm({ ...createForm, ownerPhone: e.target.value })}
                      placeholder="e.g. 0300-1234567"
                      className="w-full h-10 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy outline-none focus:border-kf-orange focus:bg-white"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-[#556B82] bg-[#FFFDF9] p-2.5 rounded-xl border border-[#EADBCA]">
                  🔒 <strong>Security Policy:</strong> You will receive a unique claim invitation code for the owner. You cannot set an owner password.
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-[#F5ECE1] hover:bg-[#EADBCA] text-kf-navy text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-[#FF6A00] to-[#FF8C33] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Generate Shop &amp; Code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
