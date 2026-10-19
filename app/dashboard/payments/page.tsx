"use client";

import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext";

export default function PaymentsPage() {
  const { transactions, openModal } = useDashboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const payments = transactions.filter((t) => t.type === "payment");
  const totalPaymentsCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      p.customerName.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.date.includes(q);

    if (!matchesSearch) return false;
    if (methodFilter !== "all" && p.paymentMethod !== methodFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Strip */}
      <div className="bg-white p-5 rounded-2xl border border-[#EADBCA] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-kf-navy tracking-tight">
            Customer Payment Records
          </h2>
          <p className="text-xs text-[#556B82]">
            Total Collected:{" "}
            <strong className="text-green-700 font-extrabold">
              Rs. {totalPaymentsCollected.toLocaleString()}
            </strong>{" "}
            across {payments.length} payments
          </p>
        </div>

        <button
          type="button"
          onClick={() => openModal("payment")}
          className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-md shadow-green-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
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
            placeholder="Search payments by customer name or note..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:outline-none focus:border-kf-orange focus:ring-1 focus:ring-kf-orange shadow-xs transition-all"
          />
        </div>

        {/* Method filter */}
        <div className="flex items-center gap-1.5 bg-[#F5ECE1] p-1 rounded-xl border border-[#EADBCA] overflow-x-auto">
          {(["all", "Cash", "JazzCash", "EasyPaisa", "Bank Transfer"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                methodFilter === m
                  ? "bg-white text-kf-navy shadow-xs"
                  : "text-[#556B82] hover:text-kf-navy"
              }`}
            >
              {m === "all" ? "All Methods" : m}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-[#EADBCA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EADBCA] bg-[#FAF3E8] text-[#556B82] uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Payment Mode</th>
                <th className="py-3.5 px-4">Description / Note</th>
                <th className="py-3.5 px-4 text-right">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E4D4]">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#556B82]">
                    No payment records found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FCF8F2] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-kf-navy whitespace-nowrap">
                      {p.date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-kf-navy">{p.customerName}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                        {p.paymentMethod || "Cash"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#556B82] max-w-xs truncate">
                      {p.description}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-green-600 text-sm tabular-nums whitespace-nowrap">
                      Rs. {p.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
