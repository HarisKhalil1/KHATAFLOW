"use client";

import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext";
import StatCard from "../components/StatCard";

type ReportViewMode = "monthly-profit" | "yearly-profit" | "cashflow-audit";

export default function ReportsPage() {
  const {
    transactions,
    expenses,
    totalOutstandingCredit,
    getMonthlyProfit,
    getYearlyProfit,
  } = useDashboard();

  const [viewMode, setViewMode] = useState<ReportViewMode>("monthly-profit");
  const [selectedMonth, setSelectedMonth] = useState("2026-10");
  const [selectedYear, setSelectedYear] = useState("2026");

  // Get typed financial profit summaries
  const monthlyData = getMonthlyProfit(selectedMonth);
  const prevMonthData = getMonthlyProfit(selectedMonth === "2026-10" ? "2026-09" : "2026-08");
  const yearlyData = getYearlyProfit(selectedYear);

  // Month-over-month differences
  const salesDiff = monthlyData.totalSales - prevMonthData.totalSales;
  const netProfitDiff = monthlyData.netProfit - prevMonthData.netProfit;

  // Filtered transactions for Cashflow Audit tab
  const periodTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));
  const periodExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));

  const periodCredits = periodTransactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const periodPayments = periodTransactions
    .filter((t) => t.type === "payment")
    .reduce((sum, t) => sum + t.amount, 0);

  const periodExpenseTotal = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netCashflow = periodPayments - periodExpenseTotal;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Top Header & View Mode Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-[#EADBCA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-kf-orange" />
            <h2 className="text-base sm:text-lg font-extrabold text-kf-navy tracking-tight">
              Shop Financial Performance & Profit Reports
            </h2>
          </div>
          <p className="text-xs text-[#556B82] mt-0.5">
            Accrual-based Monthly & Yearly Profit (Sales − COGS − Expenses), strictly separating udhaar and cash collections
          </p>
        </div>

        {/* View Mode Pills */}
        <div className="flex items-center gap-1.5 bg-[#F5ECE1] p-1 rounded-xl border border-[#EADBCA] overflow-x-auto">
          <button
            type="button"
            onClick={() => setViewMode("monthly-profit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              viewMode === "monthly-profit"
                ? "bg-white text-kf-orange shadow-xs font-extrabold"
                : "text-[#556B82] hover:text-kf-navy"
            }`}
          >
            📊 Monthly Profit & Loss
          </button>
          <button
            type="button"
            onClick={() => setViewMode("yearly-profit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              viewMode === "yearly-profit"
                ? "bg-white text-kf-orange shadow-xs font-extrabold"
                : "text-[#556B82] hover:text-kf-navy"
            }`}
          >
            📈 Yearly Report (2026)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cashflow-audit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              viewMode === "cashflow-audit"
                ? "bg-white text-kf-orange shadow-xs font-extrabold"
                : "text-[#556B82] hover:text-kf-navy"
            }`}
          >
            📋 Cashflow & Ledger Audit
          </button>
        </div>
      </div>

      {/* Accrual Accounting Rule Notice Banner */}
      <div className="p-4 bg-gradient-to-r from-[#FAF3E8] to-[#FFF9F2] rounded-2xl border border-[#EADBCA] text-xs text-[#556B82] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="text-base leading-none">ℹ️</span>
          <div>
            <strong className="text-kf-navy block font-extrabold">
              Strict Accounting Integrity:
            </strong>
            <span>
              <strong>Gross Profit = Net Sales − COGS</strong> | <strong>Net Profit = Gross Profit − Operating Expenses</strong>.
              Cash collections of old credit and outstanding udhaar are tracked separately on the balance sheet and are not treated as profit.
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 text-[11px] font-bold text-kf-orange bg-white px-2.5 py-1 rounded-lg border border-[#EADBCA]">
          Accrual Principle Verified
        </div>
      </div>

      {/* ============================================================ */}
      {/* VIEW 1: MONTHLY PROFIT & LOSS                                */}
      {/* ============================================================ */}
      {viewMode === "monthly-profit" && (
        <div className="space-y-6">
          {/* Month Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EADBCA]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-kf-navy">Reporting Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-9 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none cursor-pointer focus:border-kf-orange"
              >
                <option value="2026-10">October 2026 (Current Active Month)</option>
                <option value="2026-09">September 2026</option>
                <option value="2026-08">August 2026</option>
              </select>
            </div>

            <div className="text-xs text-[#556B82]">
              Compared to previous month:{" "}
              <span
                className={`font-bold ${
                  salesDiff >= 0 ? "text-green-600" : "text-kf-orange"
                }`}
              >
                {salesDiff >= 0 ? "+" : ""}Rs. {salesDiff.toLocaleString()} Sales
              </span>{" "}
              •{" "}
              <span
                className={`font-bold ${
                  netProfitDiff >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {netProfitDiff >= 0 ? "+" : ""}Rs. {netProfitDiff.toLocaleString()} Net Profit
              </span>
            </div>
          </div>

          {/* 5 Core Monthly Profit Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Monthly Net Sales"
              value={`Rs. ${monthlyData.totalSales.toLocaleString()}`}
              subtitle="Counter cash + credit bills"
              accentColor="blue"
              trend={{
                label: `${salesDiff >= 0 ? "+" : ""}${salesDiff.toLocaleString()} vs prev`,
                positive: salesDiff >= 0,
              }}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="2" x2="12" y2="22" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
            />

            <StatCard
              title="Cost of Goods (COGS)"
              value={`Rs. ${monthlyData.cogs.toLocaleString()}`}
              subtitle="Wholesale item stock cost"
              accentColor="orange"
              trend={{ label: "Direct Stock Cost", neutral: true }}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              }
            />

            <StatCard
              title="Gross Profit"
              value={`Rs. ${monthlyData.grossProfit.toLocaleString()}`}
              subtitle={`Margin: ${Math.round((monthlyData.grossProfit / monthlyData.totalSales) * 100)}% of sales`}
              accentColor="green"
              trend={{ label: "Sales − COGS", positive: true }}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              }
            />

            <StatCard
              title="Operating Expenses"
              value={`Rs. ${monthlyData.operatingExpenses.toLocaleString()}`}
              subtitle="Rent, bills, staff, transport"
              accentColor="navy"
              trend={{ label: "Shop Overhead", neutral: true }}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              }
            />

            <StatCard
              title="Net Profit / Loss"
              value={`Rs. ${monthlyData.netProfit.toLocaleString()}`}
              subtitle="Gross profit minus expenses"
              accentColor={monthlyData.netProfit >= 0 ? "green" : "red"}
              trend={{
                label: monthlyData.netProfit >= 0 ? "Profitable" : "Operating Deficit",
                positive: monthlyData.netProfit >= 0,
              }}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12h8" />
                  {monthlyData.netProfit >= 0 && <path d="M12 8v8" />}
                </svg>
              }
            />
          </div>

          {/* Separate Cashflow & Balance Sheet Items Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-[#EADBCA] shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#8DA6BC] uppercase tracking-wider block">
                  Outstanding Customer Udhaar (Asset)
                </span>
                <span className="text-lg font-extrabold text-kf-orange">
                  Rs. {totalOutstandingCredit.toLocaleString()}
                </span>
                <p className="text-[11px] text-[#556B82] mt-0.5">
                  Money owed to the shop. Not counted as profit until collected and cleared.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 text-kf-orange text-xs font-bold rounded-lg">
                Receivable
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#EADBCA] shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#8DA6BC] uppercase tracking-wider block">
                  Customer Payments Collected in {monthlyData.monthLabel}
                </span>
                <span className="text-lg font-extrabold text-green-700">
                  Rs. {monthlyData.paymentsReceived.toLocaleString()}
                </span>
                <p className="text-[11px] text-[#556B82] mt-0.5">
                  Cash collected against current & older debt. Kept separate from accrual profit.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg">
                Cash Inflow
              </span>
            </div>
          </div>

          {/* Income Statement Table */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EADBCA] shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0E4D4] mb-4">
              <div>
                <h3 className="text-base font-extrabold text-kf-navy tracking-tight">
                  Detailed Income Statement ({monthlyData.monthLabel})
                </h3>
                <p className="text-xs text-[#556B82]">
                  Accrual financial statement reconciling sales revenue with purchase costs and expenses
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-[#FAF3E8] border border-[#EADBCA] rounded-lg text-kf-navy">
                PKR Financial Ledger
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <tbody className="divide-y divide-[#F0E4D4]">
                  {/* Revenue */}
                  <tr className="bg-[#FCF8F2] font-bold text-kf-navy">
                    <td className="py-2.5 px-3">Gross Sales Revenue</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      Rs. {monthlyData.totalSales.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="text-[#556B82]">
                    <td className="py-2 px-3 pl-6">Less: Cost of Goods Sold (COGS)</td>
                    <td className="py-2 px-3 text-right tabular-nums text-red-600">
                      −Rs. {monthlyData.cogs.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-[#FAF3E8] font-extrabold text-kf-navy">
                    <td className="py-2.5 px-3 font-bold">GROSS PROFIT</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-green-700 font-extrabold">
                      Rs. {monthlyData.grossProfit.toLocaleString()}
                    </td>
                  </tr>

                  {/* Operating Overhead */}
                  <tr className="bg-[#FCF8F2] font-bold text-kf-navy">
                    <td className="py-2.5 px-3">Operating Shop Expenses</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-red-600">
                      −Rs. {monthlyData.operatingExpenses.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="text-[#556B82]">
                    <td className="py-2 px-3 pl-6">Shop Rent (Saddar Plaza)</td>
                    <td className="py-2 px-3 text-right tabular-nums">Rs. 25,000</td>
                  </tr>
                  <tr className="text-[#556B82]">
                    <td className="py-2 px-3 pl-6">Utilities & Generator Fuel</td>
                    <td className="py-2 px-3 text-right tabular-nums">Rs. 11,350</td>
                  </tr>
                  <tr className="text-[#556B82]">
                    <td className="py-2 px-3 pl-6">Staff Allowance</td>
                    <td className="py-2 px-3 text-right tabular-nums">Rs. 5,000</td>
                  </tr>
                  <tr className="text-[#556B82]">
                    <td className="py-2 px-3 pl-6">Goods Transport</td>
                    <td className="py-2 px-3 text-right tabular-nums">Rs. 2,200</td>
                  </tr>

                  {/* Final Net Profit */}
                  <tr className="bg-gradient-to-r from-[#FAF3E8] to-[#FFF3E5] font-extrabold text-base">
                    <td className="py-3 px-3 text-kf-navy">NET PROFIT / (LOSS)</td>
                    <td
                      className={`py-3 px-3 text-right tabular-nums font-black ${
                        monthlyData.netProfit >= 0 ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      Rs. {monthlyData.netProfit.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 2: YEARLY REPORT (2026)                                 */}
      {/* ============================================================ */}
      {viewMode === "yearly-profit" && (
        <div className="space-y-6">
          {/* Year Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EADBCA]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-kf-navy">Reporting Fiscal Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-9 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy outline-none cursor-pointer focus:border-kf-orange"
              >
                <option value="2026">2026 (Active Fiscal Year)</option>
              </select>
            </div>

            <div className="text-xs text-[#556B82]">
              Annual Sales: <strong>Rs. {yearlyData.totalSales.toLocaleString()}</strong> • Gross Profit:{" "}
              <strong className="text-green-700">Rs. {yearlyData.grossProfit.toLocaleString()}</strong>
            </div>
          </div>

          {/* 4 Annual Headline Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Annual Sales (2026)"
              value={`Rs. ${yearlyData.totalSales.toLocaleString()}`}
              subtitle="10 months recorded through Oct"
              accentColor="blue"
              trend={{ label: "+14.8% vs 2025 (Rs. 1.35M)", positive: true }}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
            />

            <StatCard
              title="Annual COGS (Wholesale)"
              value={`Rs. ${yearlyData.cogs.toLocaleString()}`}
              subtitle="Stock cost of goods sold"
              accentColor="orange"
              trend={{ label: "Wholesale Outflow", neutral: true }}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                </svg>
              }
            />

            <StatCard
              title="Annual Operating Costs"
              value={`Rs. ${yearlyData.operatingExpenses.toLocaleString()}`}
              subtitle="Rent, staff, utilities"
              accentColor="navy"
              trend={{ label: "Operating Overhead", neutral: true }}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              }
            />

            <StatCard
              title="Annual Net Profit"
              value={`Rs. ${yearlyData.netProfit.toLocaleString()}`}
              subtitle="Sales − COGS − Overhead"
              accentColor={yearlyData.netProfit >= 0 ? "green" : "red"}
              trend={{
                label: yearlyData.netProfit >= 0 ? "Net Gain" : "Net Deficit",
                positive: yearlyData.netProfit >= 0,
              }}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              }
            />
          </div>

          {/* Month-by-Month Chart Visualization */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EADBCA] shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0E4D4] mb-4">
              <div>
                <h3 className="text-base font-extrabold text-kf-navy tracking-tight">
                  2026 Monthly Trend: Sales vs Overhead
                </h3>
                <p className="text-xs text-[#556B82]">
                  Visual progression of gross sales and expenses across all active months
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#0F283E]" /> Net Sales
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#FF6A00]" /> Expenses
                </span>
              </div>
            </div>

            {/* CSS Bar Chart */}
            <div className="grid grid-cols-10 gap-2 h-44 items-end pt-4 pb-2 border-b border-[#F0E4D4]">
              {yearlyData.monthlyBreakdown.slice(0, 10).map((m) => {
                const maxVal = 160000;
                const salesHeight = Math.round((m.totalSales / maxVal) * 100);
                const expHeight = Math.round((m.operatingExpenses / maxVal) * 100);

                return (
                  <div key={m.month} className="flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-36">
                      <div
                        style={{ height: `${salesHeight}%` }}
                        className="w-1/2 bg-[#0F283E] rounded-t-md transition-all group-hover:bg-[#1E4B72]"
                        title={`Sales: Rs. ${m.totalSales.toLocaleString()}`}
                      />
                      <div
                        style={{ height: `${expHeight}%` }}
                        className="w-1/2 bg-[#FF6A00] rounded-t-md transition-all group-hover:bg-[#E85E00]"
                        title={`Expenses: Rs. ${m.operatingExpenses.toLocaleString()}`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#556B82] truncate">
                      {m.monthLabel.split(" ")[0].slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Month-by-Month Reconciled Breakdown Table */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EADBCA] shadow-xs">
            <h3 className="text-base font-extrabold text-kf-navy tracking-tight mb-4">
              2026 Month-by-Month Ledger Reconciliation
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EADBCA] bg-[#FAF3E8] text-[#556B82] uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-3">Month</th>
                    <th className="py-3 px-3 text-right">Net Sales</th>
                    <th className="py-3 px-3 text-right">COGS</th>
                    <th className="py-3 px-3 text-right">Gross Profit</th>
                    <th className="py-3 px-3 text-right">Operating Exp</th>
                    <th className="py-3 px-3 text-right">Net Profit/(Loss)</th>
                    <th className="py-3 px-3 text-right">Cash Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E4D4]">
                  {yearlyData.monthlyBreakdown.slice(0, 10).map((row) => (
                    <tr key={row.month} className="hover:bg-[#FCF8F2] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-kf-navy">{row.monthLabel}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-kf-navy tabular-nums">
                        Rs. {row.totalSales.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#556B82] tabular-nums">
                        Rs. {row.cogs.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-green-700 tabular-nums">
                        Rs. {row.grossProfit.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#556B82] tabular-nums">
                        Rs. {row.operatingExpenses.toLocaleString()}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-extrabold tabular-nums ${
                          row.netProfit >= 0 ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        Rs. {row.netProfit.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-kf-navy tabular-nums">
                        Rs. {row.paymentsReceived.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-[#FAF3E8] font-extrabold text-kf-navy border-t-2 border-[#EADBCA]">
                    <td className="py-3 px-3 font-black">2026 YTD TOTAL</td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      Rs. {yearlyData.totalSales.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      Rs. {yearlyData.cogs.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-green-700">
                      Rs. {yearlyData.grossProfit.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      Rs. {yearlyData.operatingExpenses.toLocaleString()}
                    </td>
                    <td
                      className={`py-3 px-3 text-right tabular-nums ${
                        yearlyData.netProfit >= 0 ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      Rs. {yearlyData.netProfit.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      Rs. {yearlyData.paymentsReceived.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 3: CASHFLOW & LEDGER AUDIT                              */}
      {/* ============================================================ */}
      {viewMode === "cashflow-audit" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              subtitle={`${periodExpenses.length} shop cost items`}
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
              subtitle="Collections minus expenses"
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

          {/* Audit Log Table */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EADBCA] shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0E4D4] mb-4">
              <div>
                <h3 className="text-base font-extrabold text-kf-navy tracking-tight">
                  Period Ledger Event Log ({selectedMonth})
                </h3>
                <p className="text-xs text-[#556B82]">
                  Showing {periodTransactions.length} customer ledger events
                </p>
              </div>
              <div className="text-xs font-semibold text-[#556B82]">
                Outstanding Udhaar:{" "}
                <span className="font-extrabold text-kf-orange">
                  Rs. {totalOutstandingCredit.toLocaleString()}
                </span>
              </div>
            </div>

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
          </div>
        </div>
      )}
    </div>
  );
}
