"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "../context/DashboardContext";
import CustomerDetailsModal from "../components/CustomerDetailsModal";

type RecordFilterType = "all" | "payment" | "credit" | "adjustment" | "expense";

interface UnifiedRecord {
  id: string;
  date: string;
  recordType: "payment" | "credit" | "adjustment" | "expense";
  party: string;
  customerId?: string;
  description: string;
  amount: number;
  paymentMethod?: string;
  receiptNo?: string;
  category?: string;
}

export default function AllRecordsPage() {
  const { transactions, expenses } = useDashboard();

  const [filterType, setFilterType] = useState<RecordFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerIdForDetails, setSelectedCustomerForDetails] = useState<string | null>(null);

  // Combine transactions and expenses into one unified chronological stream
  const allRecords = useMemo<UnifiedRecord[]>(() => {
    const txRecords: UnifiedRecord[] = transactions.map((tx) => ({
      id: tx.id,
      date: tx.date,
      recordType: tx.type,
      party: tx.customerName,
      customerId: tx.customerId,
      description: tx.description,
      amount: tx.amount,
      paymentMethod: tx.paymentMethod,
      receiptNo: tx.receiptNo,
    }));

    const expenseRecords: UnifiedRecord[] = expenses.map((exp) => ({
      id: exp.id,
      date: exp.date,
      recordType: "expense",
      party: exp.category,
      description: exp.description,
      amount: exp.amount,
      paymentMethod: exp.paymentMethod,
      receiptNo: `EXP-${exp.id.slice(-4)}`,
      category: exp.category,
    }));

    const combined = [...txRecords, ...expenseRecords];
    // Sort chronological descending
    return combined.sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, expenses]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      if (filterType !== "all" && rec.recordType !== filterType) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      return (
        rec.party.toLowerCase().includes(q) ||
        rec.description.toLowerCase().includes(q) ||
        (rec.receiptNo && rec.receiptNo.toLowerCase().includes(q)) ||
        (rec.paymentMethod && rec.paymentMethod.toLowerCase().includes(q)) ||
        rec.date.includes(q) ||
        rec.amount.toString().includes(q)
      );
    });
  }, [allRecords, filterType, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalCredit = 0;
    let totalPayments = 0;
    let totalAdjustments = 0;
    let totalExpenses = 0;

    allRecords.forEach((r) => {
      if (r.recordType === "credit") totalCredit += r.amount;
      if (r.recordType === "payment") totalPayments += r.amount;
      if (r.recordType === "adjustment") totalAdjustments += r.amount;
      if (r.recordType === "expense") totalExpenses += r.amount;
    });

    const netCashflow = totalPayments - totalExpenses;

    return {
      totalCredit,
      totalPayments,
      totalAdjustments,
      totalExpenses,
      netCashflow,
      countAll: allRecords.length,
      countPayments: allRecords.filter((r) => r.recordType === "payment").length,
      countCredits: allRecords.filter((r) => r.recordType === "credit").length,
      countAdjustments: allRecords.filter((r) => r.recordType === "adjustment").length,
      countExpenses: allRecords.filter((r) => r.recordType === "expense").length,
    };
  }, [allRecords]);

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = ["Date", "Type", "Party / Customer", "Description", "Receipt #", "Payment Method", "Amount (PKR)"];
    const rows = filteredRecords.map((r) => [
      r.date,
      r.recordType.toUpperCase(),
      `"${r.party.replace(/"/g, '""')}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      r.receiptNo || "-",
      r.paymentMethod || "-",
      r.amount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `khataflow_records_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EADBCA] shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-kf-navy tracking-tight">
            All Records &amp; Shop Journal
          </h2>
          <p className="text-xs text-[#556B82]">
            Complete chronological ledger of all customer credits, payments, item adjustments, and shop expenses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-[#FAF3E8] hover:bg-[#F0E4D4] text-kf-navy border border-[#EADBCA] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white hover:bg-[#F5ECE1] text-[#556B82] hover:text-kf-navy border border-[#EADBCA] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect width="12" height="8" x="6" y="14" />
            </svg>
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Payments Received */}
        <div className="bg-white p-4 rounded-2xl border border-[#EADBCA] shadow-xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-green-700">Cash In (Payments)</span>
            <span className="w-6 h-6 rounded-lg bg-green-50 text-green-700 flex items-center justify-center font-bold text-xs">
              ↓
            </span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-green-700 tabular-nums">
            Rs. {stats.totalPayments.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#556B82] mt-0.5">
            {stats.countPayments} incoming collections
          </div>
        </div>

        {/* Udhaar Given */}
        <div className="bg-white p-4 rounded-2xl border border-[#EADBCA] shadow-xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-kf-orange">Udhaar Given</span>
            <span className="w-6 h-6 rounded-lg bg-orange-50 text-kf-orange flex items-center justify-center font-bold text-xs">
              ↑
            </span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-kf-orange tabular-nums">
            Rs. {stats.totalCredit.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#556B82] mt-0.5">
            {stats.countCredits} credit sales logged
          </div>
        </div>

        {/* Item Adjustments */}
        <div className="bg-white p-4 rounded-2xl border border-[#EADBCA] shadow-xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-amber-700">Item Adjustments</span>
            <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              ⚖️
            </span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-amber-700 tabular-nums">
            Rs. {stats.totalAdjustments.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#556B82] mt-0.5">
            {stats.countAdjustments} bill &amp; return corrections
          </div>
        </div>

        {/* Shop Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-[#EADBCA] shadow-xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-purple-700">Shop Expenses</span>
            <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
              💸
            </span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-purple-700 tabular-nums">
            Rs. {stats.totalExpenses.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#556B82] mt-0.5">
            {stats.countExpenses} expense entries
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Input */}
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
            placeholder="Search records by customer, description, receipt, method..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:outline-none focus:border-kf-orange focus:ring-1 focus:ring-kf-orange shadow-xs transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F5ECE1] p-1 rounded-xl border border-[#EADBCA]">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === "all" ? "bg-white text-kf-navy shadow-xs" : "text-[#556B82] hover:text-kf-navy"
            }`}
          >
            All ({stats.countAll})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("payment")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === "payment" ? "bg-white text-green-700 shadow-xs" : "text-[#556B82] hover:text-kf-navy"
            }`}
          >
            Payments ({stats.countPayments})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("credit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === "credit" ? "bg-white text-kf-orange shadow-xs" : "text-[#556B82] hover:text-kf-navy"
            }`}
          >
            Udhaar ({stats.countCredits})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("adjustment")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === "adjustment" ? "bg-white text-amber-700 shadow-xs" : "text-[#556B82] hover:text-kf-navy"
            }`}
          >
            Adjustments ({stats.countAdjustments})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("expense")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === "expense" ? "bg-white text-purple-700 shadow-xs" : "text-[#556B82] hover:text-kf-navy"
            }`}
          >
            Expenses ({stats.countExpenses})
          </button>
        </div>
      </div>

      {/* Records Table Card */}
      <div className="bg-white rounded-2xl border border-[#EADBCA] shadow-xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-14 px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FCF8F2] border border-[#EADBCA] flex items-center justify-center text-xl mx-auto mb-3">
              🔍
            </div>
            <h3 className="text-sm font-bold text-kf-navy mb-1">No records match your filter</h3>
            <p className="text-xs text-[#556B82] max-w-sm mx-auto mb-4">
              Try adjusting your search keyword or switching between transaction types.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterType("all");
              }}
              className="px-4 py-2 bg-[#FAF3E8] hover:bg-[#F0E4D4] text-xs font-bold text-kf-navy rounded-xl border border-[#EADBCA] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF3E8] border-b border-[#F0E4D4] text-[11px] font-bold text-[#556B82] uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Party / Customer</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Receipt / Ref</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E4D4] text-xs">
                {filteredRecords.map((r) => {
                  const isPayment = r.recordType === "payment";
                  const isCredit = r.recordType === "credit";
                  const isAdjustment = r.recordType === "adjustment";
                  const isExpense = r.recordType === "expense";

                  return (
                    <tr key={r.id} className="hover:bg-[#FCF8F2] transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-semibold text-[#556B82] whitespace-nowrap">
                        {r.date}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1 ${
                            isPayment
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : isCredit
                              ? "bg-orange-50 text-kf-orange border border-orange-200"
                              : isAdjustment
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {isPayment && "↓ Payment"}
                          {isCredit && "↑ Udhaar Given"}
                          {isAdjustment && "⚖️ Adjustment"}
                          {isExpense && "💸 Expense"}
                        </span>
                      </td>

                      {/* Party / Customer */}
                      <td className="py-3.5 px-4 font-bold text-kf-navy whitespace-nowrap">
                        {r.customerId ? (
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerForDetails(r.customerId || null)}
                            className="hover:text-kf-orange hover:underline text-left cursor-pointer"
                          >
                            {r.party}
                          </button>
                        ) : (
                          <span>{r.party}</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-[#556B82] max-w-xs truncate font-medium">
                        {r.description}
                      </td>

                      {/* Receipt */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#8DA6BC] whitespace-nowrap">
                        {r.receiptNo || "—"}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 text-[#556B82] whitespace-nowrap">
                        {r.paymentMethod ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF3E8] border border-[#EADBCA] text-[10px] font-bold text-kf-navy">
                            {r.paymentMethod}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-black tabular-nums text-sm ${
                            isPayment
                              ? "text-green-700"
                              : isCredit
                              ? "text-kf-orange"
                              : isAdjustment
                              ? "text-amber-800"
                              : "text-purple-700"
                          }`}
                        >
                          {isPayment ? "+" : isExpense ? "-" : ""} Rs. {r.amount.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Details Modal when a customer is clicked */}
      <CustomerDetailsModal
        customerId={selectedCustomerIdForDetails}
        onClose={() => setSelectedCustomerForDetails(null)}
      />
    </div>
  );
}
