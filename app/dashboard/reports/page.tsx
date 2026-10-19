"use client";

import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext";
import StatCard from "../components/StatCard";

type DateRangeFilter = "this-month" | "last-month" | "last-30" | "all-time";

export default function ReportsPage() {
  const { transactions, expenses, totalOutstandingCredit } = useDashboard();
  const [dateRange, setDateRange] = useState<DateRangeFilter>("this-month");

  // Determine date boundaries
  // Assuming current demo context is October 2026
  const getFilterPredicate = (dateStr: string) => {
    if (dateRange === "this-month") {
      return dateStr.startsWith("2026-10");
    }
    if (dateRange === "last-month") {
      return dateStr.startsWith("2026-09");
    }
    if (dateRange === "last-30") {
      // Any date >= 2026-09-18
      return dateStr >= "2026-09-18";
    }
    return true; // all-time
  };

  const periodTransactions = transactions.filter((t) => getFilterPredicate(t.date));
  const periodExpenses = expenses.filter((e) => getFilterPredicate(e.date));

  const periodCredits = periodTransactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const periodPayments = periodTransactions
    .filter((t) => t.type === "payment")
    .reduce((sum, t) => sum + t.amount, 0);

  const periodExpenseTotal = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Net Cashflow from customer collections minus expenses
  const netCashflow = periodPayments - periodExpenseTotal;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Date Filter Strip */}
      <div className="bg-white p-5 rounded-2xl border border-[#EADBCA] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-kf-navy tracking-tight">
            Financial Performance & Reports
          </h2>
          <p className="text-xs text-[#556B82]">
            Detailed periodic audit of credits, cash receipts, and shop spending
          </p>
        </div>

        {/* Date Selector Pills */}
        <div className="flex items-center gap-1.5 bg-[#F5ECE1] p-1 rounded-xl border border-[#EADBCA] overflow-x-auto">
          {[
            { id: "this-month", label: "This Month (Oct)" },
            { id: "last-month", label: "Last Month (Sep)" },
            { id: "last-30", label: "Last 30 Days" },
            { id: "all-time", label: "All Time" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDateRange(item.id as DateRangeFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                dateRange === item.id
                  ? "bg-white text-kf-orange shadow-xs font-extrabold"
                  : "text-[#556B82] hover:text-kf-navy"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Period Credit Issued"
          value={`Rs. ${periodCredits.toLocaleString()}`}
          subtitle={`${periodTransactions.filter((t) => t.type === "credit").length} udhaar transactions`}
          accentColor="orange"
          trend={{ label: "New Udhaar", positive: false }}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          }
        />

        <StatCard
          title="Period Payments"
          value={`Rs. ${periodPayments.toLocaleString()}`}
          subtitle={`${periodTransactions.filter((t) => t.type === "payment").length} payments collected`}
          accentColor="green"
          trend={{ label: "Cash Inflow", positive: true }}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="17" y1="7" x2="7" y2="17" />
              <polyline points="17 17 7 17 7 7" />
            </svg>
          }
        />

        <StatCard
          title="Period Expenses"
          value={`Rs. ${periodExpenseTotal.toLocaleString()}`}
          subtitle={`${periodExpenses.length} expense items`}
          accentColor="navy"
          trend={{ label: "Operational Outflow", neutral: true }}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <StatCard
          title="Net Period Cashflow"
          value={`Rs. ${netCashflow.toLocaleString()}`}
          subtitle="Payments minus expenses"
          accentColor={netCashflow >= 0 ? "green" : "red"}
          trend={{
            label: netCashflow >= 0 ? "Positive Flow" : "Net Outflow",
            positive: netCashflow >= 0,
          }}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          }
        />
      </div>

      {/* Summary Table: Ledger Activity in Period */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EADBCA] shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#F0E4D4] mb-4">
          <div>
            <h3 className="text-base font-extrabold text-kf-navy tracking-tight">
              Period Transaction Log
            </h3>
            <p className="text-xs text-[#556B82]">
              Showing {periodTransactions.length} customer ledger events
            </p>
          </div>
          <div className="text-xs font-semibold text-[#556B82]">
            Current Uncollected Shop Udhaar:{" "}
            <span className="font-extrabold text-kf-orange">
              Rs. {totalOutstandingCredit.toLocaleString()}
            </span>
          </div>
        </div>

        {periodTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#556B82]">
            No transactions found for this date range. Try selecting &quot;All Time&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EADBCA] bg-[#FAF3E8] text-[#556B82] uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right">Credit (+)</th>
                  <th className="py-3 px-3 text-right">Payment (−)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E4D4]">
                {periodTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FCF8F2] transition-colors">
                    <td className="py-3 px-3 font-semibold text-kf-navy whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-3 px-3 font-bold text-kf-navy">{tx.customerName}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === "credit"
                            ? "bg-orange-50 text-kf-orange border border-orange-200"
                            : "bg-green-50 text-green-700 border border-green-200"
                        }`}
                      >
                        {tx.type === "credit" ? "Credit" : "Payment"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#556B82] max-w-xs truncate">{tx.description}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-kf-orange tabular-nums">
                      {tx.type === "credit" ? `Rs. ${tx.amount.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-green-600 tabular-nums">
                      {tx.type === "payment" ? `Rs. ${tx.amount.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
