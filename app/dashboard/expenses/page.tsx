"use client";

import React, { useState } from "react";
import { useDashboard, ExpenseCategory } from "../context/DashboardContext";
import ExpenseBreakdownChart from "../components/ExpenseBreakdownChart";

const CATEGORIES: ("all" | ExpenseCategory)[] = [
  "all",
  "Inventory",
  "Rent",
  "Utilities",
  "Transport",
  "Staff",
  "Other",
];

export default function ExpensesPage() {
  const { expenses, openModal } = useDashboard();
  const [selectedCategory, setSelectedCategory] = useState<"all" | ExpenseCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = e.description.toLowerCase().includes(q) || e.date.includes(q);
    if (!matchesSearch) return false;
    if (selectedCategory !== "all" && e.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#EADBCA] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-kf-navy tracking-tight">
            Shop Operational Expenses
          </h2>
          <p className="text-xs text-[#556B82]">
            Total Logged Expenses:{" "}
            <strong className="text-kf-navy font-extrabold">
              Rs. {totalExpenseAmount.toLocaleString()}
            </strong>{" "}
            ({expenses.length} entries)
          </p>
        </div>

        <button
          type="button"
          onClick={() => openModal("expense")}
          className="px-4 py-2.5 bg-[#FF6A00] hover:bg-[#E85E00] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF6A00]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Record Shop Expense</span>
        </button>
      </div>

      {/* Grid: Breakdown Chart + Expenses Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (1 col): Category Breakdown */}
        <div>
          <ExpenseBreakdownChart />
        </div>

        {/* Right (2 cols): Expenses Table & Filters */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Category Pills */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
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
                placeholder="Search expense description..."
                className="w-full h-11 pl-10 pr-4 bg-white border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:outline-none focus:border-kf-orange focus:ring-1 focus:ring-kf-orange shadow-xs transition-all"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#F5ECE1] p-1 rounded-xl border border-[#EADBCA] overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-white text-kf-navy shadow-xs"
                      : "text-[#556B82] hover:text-kf-navy"
                  }`}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-2xl border border-[#EADBCA] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EADBCA] bg-[#FAF3E8] text-[#556B82] uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E4D4]">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#556B82]">
                        No expenses found matching the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((e) => (
                      <tr key={e.id} className="hover:bg-[#FCF8F2] transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-kf-navy whitespace-nowrap">
                          {e.date}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-kf-navy">{e.description}</div>
                          {e.notes && (
                            <div className="text-[10px] text-[#8DA6BC]">{e.notes}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              e.category === "Inventory"
                                ? "bg-orange-100 text-kf-orange"
                                : e.category === "Rent"
                                ? "bg-slate-100 text-slate-800"
                                : e.category === "Utilities"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {e.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#556B82] whitespace-nowrap">
                          {e.paymentMethod}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-kf-navy tabular-nums whitespace-nowrap">
                          Rs. {e.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
