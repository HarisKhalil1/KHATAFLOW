"use client";

import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext";
import CustomerDetailsModal from "../components/CustomerDetailsModal";

export default function CustomersPage() {
  const { customersWithBalances, openModal } = useDashboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "cleared">("all");
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<string | null>(null);

  // Filter customers
  const filteredCustomers = customersWithBalances.filter((c) => {
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

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EADBCA] shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-kf-navy tracking-tight">
            Shop Customers & Accounts
          </h2>
          <p className="text-xs text-[#556B82]">
            Total {customersWithBalances.length} customer ledgers in system
          </p>
        </div>

        <button
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
        <div className="flex items-center gap-1.5 bg-[#F5ECE1] p-1 rounded-xl border border-[#EADBCA]">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-white text-kf-navy shadow-xs"
                : "text-[#556B82] hover:text-kf-navy"
            }`}
          >
            All ({customersWithBalances.length})
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
            With Udhaar ({customersWithBalances.filter((c) => c.currentBalance > 0).length})
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
            Cleared ({customersWithBalances.filter((c) => c.currentBalance === 0).length})
          </button>
        </div>
      </div>

      {/* Customer List / Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#EADBCA] shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF2E5] text-kf-orange flex items-center justify-center mx-auto mb-3 font-bold text-xl">
            ?
          </div>
          <h3 className="text-base font-extrabold text-kf-navy mb-1">No customers found</h3>
          <p className="text-xs text-[#556B82] max-w-sm mx-auto mb-4">
            No customers match &quot;{searchQuery}&quot;. Try a different search term or add a new customer.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="px-4 py-2 bg-[#F5ECE1] text-kf-navy font-bold text-xs rounded-xl hover:bg-[#EADBCA] transition-colors cursor-pointer"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EADBCA] shadow-xs hover:border-kf-orange/40 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Header with Avatar, Name, Phone and Status Badge */}
                <div className="flex items-start justify-between gap-2.5 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0F283E] to-[#1E4B72] text-white flex items-center justify-center font-extrabold text-xs shadow-xs flex-shrink-0">
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

                  <span
                    className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap self-start ${
                      customer.currentBalance === 0
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-[#FFF4EB] text-kf-orange border border-[#FFD9B3]"
                    }`}
                  >
                    {customer.currentBalance === 0 ? "Cleared" : "Active"}
                  </span>
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

                {/* Balance Due Box */}
                <div className="p-3 bg-[#FCF8F2] rounded-xl border border-[#F0E4D4] mb-4 flex items-center justify-between">
                  <span className="text-xs text-[#556B82] font-semibold">Balance Due:</span>
                  <span
                    className={`text-base font-extrabold tabular-nums ${
                      customer.currentBalance === 0 ? "text-green-600" : "text-kf-navy"
                    }`}
                  >
                    Rs. {customer.currentBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F0E4D4]">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForDetails(customer.id)}
                  className="py-1.5 px-2 bg-[#F5ECE1] hover:bg-[#EADBCA] text-kf-navy text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                >
                  Ledger
                </button>
                <button
                  type="button"
                  onClick={() => openModal("credit", customer.id)}
                  className="py-1.5 px-2 bg-[#FFF2E5] hover:bg-[#FFE5CC] text-kf-orange text-[11px] font-bold rounded-lg border border-[#FFD9B3] transition-colors cursor-pointer text-center"
                >
                  + Credit
                </button>
                <button
                  type="button"
                  disabled={customer.currentBalance <= 0}
                  onClick={() => openModal("payment", customer.id)}
                  className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center shadow-2xs"
                >
                  Receive
                </button>
              </div>
            </div>
          ))}
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
