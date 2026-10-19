"use client";

import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext";

export default function DigitalKhataPage() {
  const {
    customersWithBalances,
    getCustomerLedger,
    getCustomerBill,
    openModal,
  } = useDashboard();

  const [selectedCustomerId, setSelectedCustomerId] = useState(
    customersWithBalances[0]?.id || ""
  );
  const [ledgerSearch, setLedgerSearch] = useState("");

  const activeCustomer =
    customersWithBalances.find((c) => c.id === selectedCustomerId) ||
    customersWithBalances[0];

  const fullLedger = activeCustomer ? getCustomerLedger(activeCustomer.id) : [];
  const customerBill = activeCustomer ? getCustomerBill(activeCustomer.id) : undefined;

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
          <div className="flex flex-wrap items-center gap-4 bg-[#FCF8F2] border border-[#F0E4D4] p-3.5 rounded-xl">
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
            <div className="flex flex-wrap items-center gap-2">
              {customerBill && (
                <button
                  type="button"
                  onClick={() => openModal("item-adjust", activeCustomer.id)}
                  className="px-3 py-2 bg-[#FAF3E8] hover:bg-[#F0E4D4] text-[#8C4B00] border border-[#EADBCA] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  ⚖️ Adjust Item
                </button>
              )}
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
                ↓ Receive Payment
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Customer Details Bar */}
      {activeCustomer && (
        <div className="bg-white rounded-2xl p-5 border border-[#EADBCA] shadow-xs space-y-4">
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

          {/* Original Bill Item Records (Source of Truth) */}
          {customerBill && (
            <div className="p-4 bg-[#FAF3E8] rounded-2xl border border-[#EADBCA] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-kf-orange" />
                    <h4 className="text-xs font-extrabold text-kf-navy uppercase tracking-wider">
                      Original Bill #{customerBill.billNo} — Verified Item Records
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#556B82] mt-0.5">
                    Original bill records are protected. Item adjustments and payment allocations reconcile line-by-line.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openModal("item-adjust", activeCustomer.id)}
                  className="self-start sm:self-auto px-3 py-1.5 bg-[#FFF2E5] hover:bg-[#FFE5CC] text-kf-orange text-xs font-bold rounded-lg border border-[#FFD9B3] transition-colors cursor-pointer"
                >
                  ⚖️ Adjust Item against Bill
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {customerBill.items.map((it) => (
                  <div
                    key={it.id}
                    className="p-3 bg-white rounded-xl border border-[#F0E4D4] shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-kf-navy text-xs">{it.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          it.remainingBalance === 0
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-[#FFF4EB] text-kf-orange border border-[#FFD9B3]"
                        }`}
                      >
                        {it.remainingBalance === 0 ? "Paid" : "Unpaid"}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#556B82]">
                      Original:{" "}
                      <strong>
                        {it.quantity} {it.unit}
                      </strong>{" "}
                      @ Rs. {it.unitPrice.toLocaleString()}/{it.unit}
                    </div>

                    <div className="pt-1 border-t border-[#F0E4D4] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-[#8DA6BC] block">Total</span>
                        <span className="font-bold text-kf-navy">
                          Rs. {it.lineTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#8DA6BC] block">Remaining Due</span>
                        <span
                          className={`font-extrabold ${
                            it.remainingBalance === 0 ? "text-green-600" : "text-kf-orange"
                          }`}
                        >
                          Rs. {it.remainingBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search within ledger */}
          <div className="pt-2 flex items-center justify-between gap-3">
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
          <div className="overflow-x-auto">
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
                {/* Initial opening balance row */}
                <tr className="bg-[#FAF6F0] font-semibold text-[#556B82]">
                  <td className="py-3 px-3 whitespace-nowrap">{activeCustomer.createdAt}</td>
                  <td className="py-3 px-3">
                    <span className="italic">Opening Balance Account Initialized</span>
                  </td>
                  <td className="py-3 px-3 text-[#8DA6BC]">—</td>
                  <td className="py-3 px-3 text-right font-bold text-kf-navy tabular-nums">
                    {activeCustomer.openingBalance > 0
                      ? `Rs. ${activeCustomer.openingBalance.toLocaleString()}`
                      : "Rs. 0"}
                  </td>
                  <td className="py-3 px-3 text-right text-[#8DA6BC]">—</td>
                  <td className="py-3 px-3 text-right font-extrabold text-kf-navy tabular-nums">
                    Rs. {activeCustomer.openingBalance.toLocaleString()}
                  </td>
                </tr>

                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[#556B82]">
                      No transactions recorded yet. Use buttons above to give credit or record payment.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#FCF8F2] transition-colors">
                      <td className="py-3 px-3 font-semibold text-kf-navy whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-kf-navy">{tx.description}</div>
                        {tx.paymentMethod && (
                          <span className="text-[10px] text-[#556B82] font-normal">
                            Mode: {tx.paymentMethod}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#8DA6BC]">
                        {tx.receiptNo || "—"}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-kf-orange tabular-nums">
                        {tx.type === "credit" ? `+Rs. ${tx.amount.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-green-600 tabular-nums">
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
