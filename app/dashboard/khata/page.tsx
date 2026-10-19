"use client";

import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext";

export default function DigitalKhataPage() {
  const { customersWithBalances, getCustomerLedger, openModal } = useDashboard();
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    customersWithBalances[0]?.id || ""
  );
  const [ledgerSearch, setLedgerSearch] = useState("");

  const activeCustomer =
    customersWithBalances.find((c) => c.id === selectedCustomerId) ||
    customersWithBalances[0];

  const fullLedger = activeCustomer ? getCustomerLedger(activeCustomer.id) : [];

  // Filter ledger transactions by search query
  const filteredLedger = fullLedger.filter((item) => {
    if (!ledgerSearch.trim()) return true;
    const q = ledgerSearch.toLowerCase();
    return (
      item.description.toLowerCase().includes(q) ||
      (item.receiptNo && item.receiptNo.toLowerCase().includes(q)) ||
      item.date.includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Customer Selector & Quick Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-[#EADBCA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <label htmlFor="khata-customer-select" className="block text-xs font-bold text-[#556B82] uppercase tracking-wider mb-1.5">
            Select Khata Account
          </label>
          <select
            id="khata-customer-select"
            value={activeCustomer?.id || ""}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all cursor-pointer"
          >
            {customersWithBalances.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — Rs. {c.currentBalance.toLocaleString()} {c.currentBalance === 0 ? "(Cleared)" : "owed"}
              </option>
            ))}
          </select>
        </div>

        {/* Customer Balance Callout */}
        {activeCustomer && (
          <div className="flex items-center gap-4 bg-[#FCF8F2] border border-[#F0E4D4] p-3.5 rounded-xl">
            <div>
              <span className="text-[10px] font-bold text-[#8DA6BC] uppercase tracking-wider block">
                Current Outstanding Udhaar
              </span>
              <span
                className={`text-xl font-extrabold tabular-nums ${
                  activeCustomer.currentBalance === 0 ? "text-green-600" : "text-kf-orange"
                }`}
              >
                Rs. {activeCustomer.currentBalance.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openModal("credit", activeCustomer.id)}
                className="px-3 py-2 bg-[#FFF2E5] hover:bg-[#FFE5CC] text-kf-orange text-xs font-bold rounded-lg border border-[#FFD9B3] transition-colors cursor-pointer"
              >
                + Give Credit
              </button>
              <button
                type="button"
                disabled={activeCustomer.currentBalance <= 0}
                onClick={() => openModal("payment", activeCustomer.id)}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Receive Payment
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Customer Details Bar */}
      {activeCustomer && (
        <div className="bg-white rounded-2xl p-5 border border-[#EADBCA] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0E4D4]">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#0F283E] to-[#1E4B72] text-white flex items-center justify-center font-bold text-sm">
                {activeCustomer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-kf-navy">{activeCustomer.name}</h3>
                <div className="text-xs text-[#556B82] flex items-center gap-2">
                  <span>📞 {activeCustomer.phone}</span>
                  <span>•</span>
                  <span>📍 {activeCustomer.address}</span>
                </div>
              </div>
            </div>

            {/* Quick Ledger Stats */}
            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-[10px] text-[#8DA6BC] block">Opening Balance</span>
                <span className="font-bold text-kf-navy">
                  Rs. {activeCustomer.openingBalance.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-kf-orange block">Total Credit</span>
                <span className="font-bold text-kf-orange">
                  +Rs. {activeCustomer.totalCredit.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-green-600 block">Total Paid</span>
                <span className="font-bold text-green-700">
                  -Rs. {activeCustomer.totalPaid.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Search within ledger */}
          <div className="pt-4 flex items-center justify-between gap-3">
            <div className="relative max-w-xs flex-1">
              <input
                type="text"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                placeholder="Search ledger entries..."
                className="w-full h-9 pl-8 pr-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-lg text-xs font-medium text-kf-navy focus:bg-white focus:outline-none focus:border-kf-orange"
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8DA6BC]">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <span className="text-xs text-[#556B82] font-semibold">
              Showing {filteredLedger.length} of {fullLedger.length} records
            </span>
          </div>

          {/* Ledger Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EADBCA] bg-[#FAF3E8] text-[#556B82] uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Ref / Receipt #</th>
                  <th className="py-3 px-3 text-right">Credit (Udhaar)</th>
                  <th className="py-3 px-3 text-right">Payment Received</th>
                  <th className="py-3 px-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E4D4]">
                {/* Initial Opening Balance Row */}
                <tr className="bg-[#FFFDF9] font-medium text-[#556B82]">
                  <td className="py-3 px-3">{activeCustomer.createdAt}</td>
                  <td className="py-3 px-3 font-semibold text-kf-navy">
                    Initial Opening Balance
                  </td>
                  <td className="py-3 px-3 text-[#8DA6BC]">—</td>
                  <td className="py-3 px-3 text-right text-kf-orange font-bold">
                    {activeCustomer.openingBalance > 0
                      ? `Rs. ${activeCustomer.openingBalance.toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="py-3 px-3 text-right text-[#8DA6BC]">—</td>
                  <td className="py-3 px-3 text-right font-extrabold text-kf-navy">
                    Rs. {activeCustomer.openingBalance.toLocaleString()}
                  </td>
                </tr>

                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#556B82]">
                      No transactions recorded for this customer yet.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#FCF8F2] transition-colors">
                      <td className="py-3 px-3 font-medium text-kf-navy">{tx.date}</td>
                      <td className="py-3 px-3 font-semibold text-kf-navy">
                        {tx.description}
                      </td>
                      <td className="py-3 px-3 text-[#8DA6BC]">
                        {tx.receiptNo || (tx.paymentMethod ? `via ${tx.paymentMethod}` : "—")}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-kf-orange">
                        {tx.type === "credit" ? `+Rs. ${tx.amount.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-green-600">
                        {tx.type === "payment" ? `-Rs. ${tx.amount.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-kf-navy tabular-nums">
                        Rs. {tx.runningBalance.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
