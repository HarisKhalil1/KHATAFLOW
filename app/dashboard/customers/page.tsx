"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "../context/DashboardContext";
import CustomerDetailsModal from "../components/CustomerDetailsModal";

export default function CustomersAndKhataPage() {
  const { customersWithBalances, archivedCustomers, openModal, getCustomerBill, restoreCustomer } = useDashboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "cleared" | "archived">("all");
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<string | null>(null);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    const sourceList = statusFilter === "archived" ? archivedCustomers : customersWithBalances;

    return sourceList.filter((c) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        c.name.toLowerCase().includes(query) ||
        c.phone.replace(/[\s-]/g, "").includes(query.replace(/[\s-]/g, "")) ||
        c.address.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (statusFilter === "active") return c.currentBalance > 0;
      if (statusFilter === "cleared") return c.currentBalance === 0;
      return true;
    });
  }, [customersWithBalances, archivedCustomers, searchQuery, statusFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalCustomers = customersWithBalances.length;
    const withUdhaar = customersWithBalances.filter((c) => c.currentBalance > 0);
    const cleared = customersWithBalances.filter((c) => c.currentBalance === 0);
    const totalOutstanding = customersWithBalances.reduce((sum, c) => sum + c.currentBalance, 0);

    return {
      totalCustomers,
      withUdhaarCount: withUdhaar.length,
      clearedCount: cleared.length,
      totalOutstanding,
    };
  }, [customersWithBalances]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EADBCA] shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-kf-navy tracking-tight">
            Customers &amp; Khata Accounts
          </h2>
          <p className="text-xs text-[#556B82]">
            Complete customer ledger directory, outstanding udhaar balances, and itemized billing
          </p>
        </div>

        <button
          id="btn-add-customer-top"
          type="button"
          onClick={() => openModal("customer")}
          className="px-4 py-2.5 bg-gradient-to-r from-[#FF6A00] to-[#FF7E1F] hover:from-[#E85E00] hover:to-[#FF6A00] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF6A00]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#EADBCA] shadow-xs">
          <span className="text-[10px] font-bold text-[#8DA6BC] uppercase tracking-wider block mb-1">
            Total Accounts
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-kf-navy tabular-nums">
            {stats.totalCustomers}
          </span>
          <span className="text-[11px] text-[#556B82] block mt-0.5">Shop customer ledgers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#EADBCA] shadow-xs">
          <span className="text-[10px] font-bold text-kf-orange uppercase tracking-wider block mb-1">
            Total Udhaar Due
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-kf-orange tabular-nums">
            Rs. {stats.totalOutstanding.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#556B82] block mt-0.5">Across all accounts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#EADBCA] shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
            With Pending Udhaar
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-amber-700 tabular-nums">
            {stats.withUdhaarCount}
          </span>
          <span className="text-[11px] text-[#556B82] block mt-0.5">Require follow-up</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#EADBCA] shadow-xs">
          <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider block mb-1">
            Cleared Accounts
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-green-700 tabular-nums">
            {stats.clearedCount}
          </span>
          <span className="text-[11px] text-[#556B82] block mt-0.5">Zero outstanding</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
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
            placeholder="Search by customer name, phone, or location..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:outline-none focus:border-kf-orange focus:ring-1 focus:ring-kf-orange shadow-xs transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#F5ECE1] p-1 rounded-xl border border-[#EADBCA] flex-wrap">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-white text-kf-navy shadow-xs"
                : "text-[#556B82] hover:text-kf-navy"
            }`}
          >
            All ({stats.totalCustomers})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "active"
                ? "bg-white text-kf-orange shadow-xs"
                : "text-[#556B82] hover:text-kf-navy"
            }`}
          >
            With Udhaar ({stats.withUdhaarCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("cleared")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "cleared"
                ? "bg-white text-green-700 shadow-xs"
                : "text-[#556B82] hover:text-kf-navy"
            }`}
          >
            Cleared ({stats.clearedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("archived")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === "archived"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-[#556B82] hover:text-kf-navy"
            }`}
          >
            <span>📦</span>
            <span>Archived ({archivedCustomers.length})</span>
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#EADBCA] shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF2E5] text-kf-orange flex items-center justify-center mx-auto mb-3 font-bold text-xl">
            {statusFilter === "archived" ? "📦" : "?"}
          </div>
          <h3 className="text-base font-extrabold text-kf-navy mb-1">
            {statusFilter === "archived" ? "No archived customers" : "No customers found"}
          </h3>
          <p className="text-xs text-[#556B82] max-w-sm mx-auto mb-4">
            {statusFilter === "archived"
              ? "When customers are safely archived, they appear here preserving their full history."
              : searchQuery
              ? `No customers match "${searchQuery}". Try a different search term or add a new customer.`
              : "No customers registered yet. Click '+ Add New Customer' to add your first customer."}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="px-4 py-2 bg-[#F5ECE1] text-kf-navy font-bold text-xs rounded-xl hover:bg-[#EADBCA] transition-colors cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredCustomers.map((customer) => {
            const hasBill = !!getCustomerBill(customer.id);
            const isArchived = !!customer.isArchived;

            return (
              <div
                key={customer.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-xs transition-all flex flex-col justify-between overflow-hidden ${
                  isArchived
                    ? "border-slate-300 bg-slate-50/20"
                    : "border-[#EADBCA] hover:border-kf-orange/40 hover:shadow-md"
                }`}
              >
                <div>
                  {/* Header with Avatar, Name, Phone, Actions & Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl text-white flex items-center justify-center font-extrabold text-xs shadow-xs flex-shrink-0 ${
                          isArchived
                            ? "bg-slate-500"
                            : "bg-gradient-to-tr from-[#0F283E] to-[#1E4B72]"
                        }`}
                      >
                        {customer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          className="text-sm font-extrabold text-kf-navy truncate"
                          title={customer.name}
                        >
                          {customer.name}
                        </h3>
                        <p className="text-xs font-semibold text-[#556B82] truncate">
                          {customer.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openModal("edit-customer", customer.id)}
                        title="Edit customer details"
                        className="p-1 text-[#8DA6BC] hover:text-kf-navy hover:bg-[#F5ECE1] rounded-lg transition-colors cursor-pointer"
                      >
                        <span className="text-xs">✏️</span>
                      </button>

                      {/* Delete / Archive Button */}
                      <button
                        type="button"
                        onClick={() => openModal("delete-customer", customer.id)}
                        title={isArchived ? "Delete permanently" : "Archive or delete customer"}
                        className="p-1 text-[#8DA6BC] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <span className="text-xs">🗑️</span>
                      </button>

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap ${
                          isArchived
                            ? "bg-slate-100 text-slate-700 border border-slate-300"
                            : customer.currentBalance === 0
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-[#FFF4EB] text-kf-orange border border-[#FFD9B3]"
                        }`}
                      >
                        {isArchived ? "Archived" : customer.currentBalance === 0 ? "Cleared" : "Has Udhaar"}
                      </span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="text-xs text-[#6F8599] mb-3.5 flex items-center gap-1.5 truncate">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FF6A00"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="truncate">{customer.address}</span>
                  </div>

                  {/* If Archived, show archived info banner */}
                  {isArchived && (
                    <div className="p-2 bg-slate-100 border border-slate-200 rounded-xl mb-3 text-[11px] text-slate-700">
                      <span className="font-bold">📦 Preserved in Archive</span>
                      {customer.archiveReason && (
                        <span className="block text-[10px] text-slate-500 mt-0.5 truncate">
                          Reason: {customer.archiveReason}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Balance Due Box */}
                  <div className="p-3 bg-[#FCF8F2] rounded-xl border border-[#F0E4D4] mb-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#8DA6BC] uppercase tracking-wider block">
                        Outstanding Khata
                      </span>
                      <span
                        className={`text-base font-extrabold tabular-nums ${
                          customer.currentBalance === 0 ? "text-green-600" : "text-kf-orange"
                        }`}
                      >
                        Rs. {customer.currentBalance.toLocaleString()}
                      </span>
                    </div>

                    {hasBill && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-[#EADBCA] text-[#556B82] rounded-md">
                        Itemized Bill
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="space-y-2 pt-2 border-t border-[#F0E4D4]">
                  {isArchived ? (
                    /* Archived Customer Actions */
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => restoreCustomer(customer.id)}
                        className="py-2 px-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <span>↺</span>
                        <span>Restore Customer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerForDetails(customer.id)}
                        className="py-2 px-2 bg-[#F5ECE1] hover:bg-[#EADBCA] text-kf-navy text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                      >
                        Khata Ledger
                      </button>
                    </div>
                  ) : (
                    /* Active Customer Actions */
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => openModal("credit", customer.id)}
                          className="py-2 px-2 bg-[#FFF2E5] hover:bg-[#FFE5CC] text-kf-orange text-xs font-bold rounded-xl border border-[#FFD9B3] transition-colors cursor-pointer text-center"
                        >
                          + Give Credit
                        </button>
                        <button
                          type="button"
                          disabled={customer.currentBalance <= 0}
                          onClick={() => openModal("payment", customer.id)}
                          className="py-2 px-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors cursor-pointer text-center shadow-2xs"
                        >
                          ↓ Receive
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerForDetails(customer.id)}
                          className="py-1.5 px-2 bg-[#F5ECE1] hover:bg-[#EADBCA] text-kf-navy text-[11px] font-bold rounded-xl transition-colors cursor-pointer text-center"
                        >
                          Khata Ledger
                        </button>

                        {hasBill ? (
                          <button
                            type="button"
                            onClick={() => openModal("item-adjust", customer.id)}
                            className="py-1.5 px-2 bg-[#FAF3E8] hover:bg-[#F0E4D4] text-[#8C4B00] border border-[#EADBCA] text-[11px] font-bold rounded-xl transition-colors cursor-pointer text-center"
                          >
                            ⚖️ Adjust Item
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerForDetails(customer.id)}
                            className="py-1.5 px-2 bg-white hover:bg-[#FAF3E8] text-[#556B82] border border-[#EADBCA] text-[11px] font-bold rounded-xl transition-colors cursor-pointer text-center"
                          >
                            View Account
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Ledger Drawer Modal */}
      <CustomerDetailsModal
        customerId={selectedCustomerForDetails}
        onClose={() => setSelectedCustomerForDetails(null)}
      />
    </div>
  );
}
