"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useDashboard } from "../context/DashboardContext";

export default function SettingsPage() {
  const {
    customersWithBalances,
    bills,
    transactions,
    expenses,
    adjustments,
    products,
    resetDemoData,
  } = useDashboard();

  const [resetSuccess, setResetSuccess] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all data back to the default demo store state?")) {
      resetDemoData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  // 1. Export Full JSON Backup
  const handleExportJSON = () => {
    const backupData = {
      version: "1.0",
      shopName: "Khyber General Store",
      exportedAt: new Date().toISOString(),
      customers: customersWithBalances,
      bills,
      transactions,
      expenses,
      adjustments,
      products,
    };

    const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `khataflow_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.removeChild(downloadAnchor);

    setExportNotice("Full JSON backup downloaded successfully!");
    setTimeout(() => setExportNotice(null), 3500);
  };

  // 2. Export Customers & Khata CSV
  const handleExportCustomersCSV = () => {
    const headers = ["Customer ID", "Name", "Phone", "Address", "Opening Balance", "Total Credit", "Total Paid", "Current Due Balance"];
    const rows = customersWithBalances.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${c.address.replace(/"/g, '""')}"`,
      c.openingBalance,
      c.totalCredit,
      c.totalPaid,
      c.currentBalance,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `khataflow_customers_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice("Customer balances CSV downloaded successfully!");
    setTimeout(() => setExportNotice(null), 3500);
  };

  // 3. Export Transactions CSV
  const handleExportTransactionsCSV = () => {
    const headers = ["Transaction ID", "Date", "Customer Name", "Type", "Amount (PKR)", "Payment Method", "Receipt No", "Description"];
    const rows = transactions.map((t) => [
      t.id,
      t.date,
      `"${t.customerName.replace(/"/g, '""')}"`,
      t.type.toUpperCase(),
      t.amount,
      t.paymentMethod || "-",
      t.receiptNo || "-",
      `"${t.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `khataflow_transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice("Transactions ledger CSV downloaded successfully!");
    setTimeout(() => setExportNotice(null), 3500);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#EADBCA] shadow-xs">
        <h2 className="text-base sm:text-lg font-extrabold text-kf-navy tracking-tight">
          Shop Settings &amp; Data Controls
        </h2>
        <p className="text-xs text-[#556B82]">
          Manage shop identification, regional settings, data backup exports, and demo controls
        </p>
      </div>

      {/* Notices */}
      {resetSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Demo dataset successfully reset to initial verified Peshawar store state!</span>
        </div>
      )}

      {exportNotice && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <span>✓ {exportNotice}</span>
        </div>
      )}

      {/* Data Backup & Export Section */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EADBCA] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0E4D4]">
          <div>
            <h3 className="text-sm font-extrabold text-kf-navy">Data Backup &amp; Portability</h3>
            <p className="text-xs text-[#556B82]">
              Download your shop ledgers and transactions in standard JSON or CSV spreadsheet formats
            </p>
          </div>
          <span className="w-8 h-8 rounded-xl bg-orange-50 text-kf-orange flex items-center justify-center font-bold text-sm">
            💾
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* JSON Full Backup */}
          <div className="p-4 rounded-xl border border-[#EADBCA] bg-[#FCF8F2] flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-kf-navy block mb-0.5">Full System Backup</span>
              <span className="text-[11px] text-[#556B82]">All customers, bills, transactions, and expenses (JSON)</span>
            </div>
            <button
              type="button"
              onClick={handleExportJSON}
              className="w-full py-2 px-3 bg-white hover:bg-[#FAF3E8] border border-[#EADBCA] text-kf-navy text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              Export JSON Backup
            </button>
          </div>

          {/* Customers CSV */}
          <div className="p-4 rounded-xl border border-[#EADBCA] bg-[#FCF8F2] flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-kf-navy block mb-0.5">Customers &amp; Balances</span>
              <span className="text-[11px] text-[#556B82]">Customer list, contact numbers, and balances (CSV)</span>
            </div>
            <button
              type="button"
              onClick={handleExportCustomersCSV}
              className="w-full py-2 px-3 bg-white hover:bg-[#FAF3E8] border border-[#EADBCA] text-kf-navy text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              Export Customers CSV
            </button>
          </div>

          {/* Transactions CSV */}
          <div className="p-4 rounded-xl border border-[#EADBCA] bg-[#FCF8F2] flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-kf-navy block mb-0.5">Transactions Ledger</span>
              <span className="text-[11px] text-[#556B82]">Chronological credit, payment, and adjustment log (CSV)</span>
            </div>
            <button
              type="button"
              onClick={handleExportTransactionsCSV}
              className="w-full py-2 px-3 bg-white hover:bg-[#FAF3E8] border border-[#EADBCA] text-kf-navy text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              Export Records CSV
            </button>
          </div>
        </div>
      </div>

      {/* Shop Profile Form (Display Only) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EADBCA] shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-kf-navy pb-3 border-b border-[#F0E4D4]">
          Shop Profile &amp; Location
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#556B82] mb-1">Shop Name</label>
            <input
              type="text"
              readOnly
              value="Khyber General Store"
              className="w-full h-11 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy cursor-default"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#556B82] mb-1">Owner Name</label>
            <input
              type="text"
              readOnly
              value="Haji Abdul Rehman"
              className="w-full h-11 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy cursor-default"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#556B82] mb-1">Shop Address</label>
            <input
              type="text"
              readOnly
              value="Shop #12, Saddar Road, Peshawar Cantonment"
              className="w-full h-11 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy cursor-default"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#556B82] mb-1">Contact Phone</label>
            <input
              type="text"
              readOnly
              value="0300-9876543"
              className="w-full h-11 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy cursor-default"
            />
          </div>
        </div>
      </div>

      {/* Regional & Financial Settings */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EADBCA] shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-kf-navy pb-3 border-b border-[#F0E4D4]">
          Currency &amp; Financial Display
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#556B82] mb-1">Standard Currency</label>
            <div className="h-11 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy flex items-center">
              PKR (Pakistani Rupee — Rs.)
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#556B82] mb-1">Primary Region</label>
            <div className="h-11 px-3 bg-[#FCF8F2] border border-[#EADBCA] rounded-xl text-xs font-bold text-kf-navy flex items-center">
              Peshawar, Khyber Pakhtunkhwa (PK)
            </div>
          </div>
        </div>
      </div>

      {/* Demo Controls & Data Reset */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EADBCA] shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-kf-navy pb-3 border-b border-[#F0E4D4]">
          Storage Persistence &amp; Reset
        </h3>

        <p className="text-xs text-[#556B82] leading-relaxed">
          KhataFlow stores your live transactions in versioned browser local storage so your data remains preserved across reloads and refreshes. Clicking the button below will clear saved changes and re-initialize the original demo store dataset.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>Reset Demo Data</span>
          </button>

          <Link
            href="/"
            className="px-5 py-2.5 bg-[#F5ECE1] hover:bg-[#EADBCA] text-kf-navy text-xs font-bold rounded-xl transition-colors no-underline flex items-center gap-2"
          >
            <span>← Return to Public Landing Page</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
