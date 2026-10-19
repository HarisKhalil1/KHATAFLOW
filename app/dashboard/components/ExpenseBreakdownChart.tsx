"use client";

import React from "react";
import { useDashboard, ExpenseCategory } from "../context/DashboardContext";

export default function ExpenseBreakdownChart() {
  const { expenses } = useDashboard();

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category
  const categoryTotals: Record<ExpenseCategory, number> = {
    Inventory: 0,
    Rent: 0,
    Utilities: 0,
    Transport: 0,
    Staff: 0,
    Other: 0,
  };

  expenses.forEach((e) => {
    if (categoryTotals[e.category] !== undefined) {
      categoryTotals[e.category] += e.amount;
    } else {
      categoryTotals.Other += e.amount;
    }
  });

  const categories: { name: ExpenseCategory; color: string; amount: number; pct: number }[] = Object.entries(
    categoryTotals
  ).map(([cat, amt]) => ({
    name: cat as ExpenseCategory,
    color:
      cat === "Inventory"
        ? "bg-[#FF6A00]"
        : cat === "Rent"
        ? "bg-[#0F283E]"
        : cat === "Utilities"
        ? "bg-amber-500"
        : cat === "Transport"
        ? "bg-blue-600"
        : cat === "Staff"
        ? "bg-purple-600"
        : "bg-gray-500",
    amount: amt,
    pct: totalExpenseAmount > 0 ? Math.round((amt / totalExpenseAmount) * 100) : 0,
  })).sort((a, b) => b.amount - a.amount);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EADBCA] shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-kf-navy tracking-tight">
            Expense by Category
          </h2>
          <p className="text-xs text-[#556B82]">
            Total: <span className="font-bold text-kf-navy">Rs. {totalExpenseAmount.toLocaleString()}</span>
          </p>
        </div>
        <span className="text-xs font-bold text-kf-orange bg-[#FFF2E5] px-2.5 py-1 rounded-full border border-[#FFD9B3]">
          {expenses.length} Records
        </span>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3.5">
        {categories.map((c) => (
          <div key={c.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-kf-navy flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
                {c.name}
              </span>
              <div className="tabular-nums">
                <span className="font-extrabold text-kf-navy mr-2">
                  Rs. {c.amount.toLocaleString()}
                </span>
                <span className="text-[#8DA6BC] font-semibold text-[11px]">
                  ({c.pct}%)
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-[#F5ECE1] rounded-full overflow-hidden">
              <div
                style={{ width: `${c.pct}%` }}
                className={`h-full ${c.color} rounded-full transition-all duration-300`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
