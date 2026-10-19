"use client";

import React from "react";
import { useDashboard } from "../context/DashboardContext";

export default function ActivityChart() {
  const { transactions, expenses } = useDashboard();

  // Aggregate recent daily activity for the last 7 distinct periods/days
  // Group by date
  const dateMap: Record<string, { credit: number; payment: number; expense: number }> = {};

  transactions.forEach((tx) => {
    if (!dateMap[tx.date]) {
      dateMap[tx.date] = { credit: 0, payment: 0, expense: 0 };
    }
    if (tx.type === "credit") {
      dateMap[tx.date].credit += tx.amount;
    } else {
      dateMap[tx.date].payment += tx.amount;
    }
  });

  expenses.forEach((exp) => {
    if (!dateMap[exp.date]) {
      dateMap[exp.date] = { credit: 0, payment: 0, expense: 0 };
    }
    dateMap[exp.date].expense += exp.amount;
  });

  const sortedDates = Object.keys(dateMap).sort().slice(-7);

  // If empty, generate fallback dummy days
  const dataPoints =
    sortedDates.length > 0
      ? sortedDates.map((date) => {
          const parts = date.split("-");
          const label = `${parts[1]}/${parts[2]}`;
          return {
            date,
            label,
            ...dateMap[date],
          };
        })
      : [
          { date: "2026-10-10", label: "10/10", credit: 7500, payment: 5000, expense: 3500 },
          { date: "2026-10-12", label: "10/12", credit: 6200, payment: 3000, expense: 5000 },
          { date: "2026-10-14", label: "10/14", credit: 2000, payment: 6000, expense: 2200 },
          { date: "2026-10-16", label: "10/16", credit: 9000, payment: 9000, expense: 7850 },
          { date: "2026-10-17", label: "10/17", credit: 4500, payment: 1150, expense: 1200 },
        ];

  // Calculate maximum for scaling
  const maxVal = Math.max(
    ...dataPoints.map((d) => Math.max(d.credit, d.payment, d.expense)),
    10000
  );

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EADBCA] shadow-xs">
      {/* Title & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-kf-navy tracking-tight">
            Financial Activity Breakdown
          </h2>
          <p className="text-xs text-[#556B82]">
            Comparison of credit issued, payments received, and shop expenses
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-kf-orange" />
            <span className="text-kf-navy">Credit (Udhaar)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-green-500" />
            <span className="text-kf-navy">Payment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#0F283E]" />
            <span className="text-kf-navy">Expense</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 sm:h-64 flex items-end gap-2 sm:gap-6 pt-6 pb-2 px-2 border-b border-[#F0E4D4]">
        {dataPoints.map((pt, idx) => {
          const creditHeight = Math.max(8, (pt.credit / maxVal) * 100);
          const paymentHeight = Math.max(8, (pt.payment / maxVal) * 100);
          const expenseHeight = Math.max(8, (pt.expense / maxVal) * 100);

          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
              <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-12 bg-kf-navy text-white text-[10px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-10">
                  <div>Credit: Rs. {pt.credit.toLocaleString()}</div>
                  <div>Payment: Rs. {pt.payment.toLocaleString()}</div>
                  <div>Expense: Rs. {pt.expense.toLocaleString()}</div>
                </div>

                {/* Credit Bar */}
                <div
                  style={{ height: `${creditHeight}%` }}
                  className="w-2.5 sm:w-4 bg-kf-orange rounded-t-sm sm:rounded-t-md transition-all group-hover:brightness-110"
                  title={`Credit: Rs. ${pt.credit.toLocaleString()}`}
                />

                {/* Payment Bar */}
                <div
                  style={{ height: `${paymentHeight}%` }}
                  className="w-2.5 sm:w-4 bg-green-500 rounded-t-sm sm:rounded-t-md transition-all group-hover:brightness-110"
                  title={`Payment: Rs. ${pt.payment.toLocaleString()}`}
                />

                {/* Expense Bar */}
                <div
                  style={{ height: `${expenseHeight}%` }}
                  className="w-2.5 sm:w-4 bg-[#0F283E] rounded-t-sm sm:rounded-t-md transition-all group-hover:brightness-125"
                  title={`Expense: Rs. ${pt.expense.toLocaleString()}`}
                />
              </div>

              {/* Date Label */}
              <span className="text-[10px] sm:text-[11px] font-bold text-[#6F8599] mt-2 block text-center truncate">
                {pt.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="pt-3 flex items-center justify-between text-[11px] text-[#6F8599]">
        <span>Y-axis scaled to Rs. {maxVal.toLocaleString()} peak</span>
        <span className="font-semibold text-kf-navy">Peshawar Store Cashflow View</span>
      </div>
    </div>
  );
}
