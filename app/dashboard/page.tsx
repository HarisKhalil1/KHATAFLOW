"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useDashboard } from "./context/DashboardContext";
import StatCard from "./components/StatCard";
import ActivityChart from "./components/ActivityChart";
import CustomerDetailsModal from "./components/CustomerDetailsModal";

export default function DashboardOverviewPage() {
  const {
    customersWithBalances,
    transactions,
    expenses,
    totalOutstandingCredit,
    totalCustomersCount,
    activeDebtorsCount,
    openModal,
  } = useDashboard();

  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<string | null>(null);

  // Total payments received in current month
  const currentMonth = "2026-10";
  const monthlyPayments = transactions
    .filter((t) => t.type === "payment" && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = expenses
    .filter((e) => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  // Sort top debtor customers (highest currentBalance first)
  const topDebtors = [...customersWithBalances]
    .filter((c) => c.currentBalance > 0)
    .sort((a, b) => b.currentBalance - a.currentBalance)
    .slice(0, 5);

  // Recent transactions (latest 6)
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 6);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F283E] via-[#163B5C] to-[#1F4E79] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
          <svg viewBox="0 0 100 100" fill="white" className="w-full h-full">
            <circle cx="80" cy="20" r="40" />
            <circle cx="20" cy="80" r="30" />
          </svg>
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-[#FFB280] mb-3 border border-white/15">
            <span className="w-2 h-2 rounded-full bg-[#FF6A00]" />
            Khyber General Store • Saddar Road, Peshawar
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight mb-2">
            Welcome back, Haji Abdul Rehman
          </h2>
          <p className="text-xs sm:text-sm text-[#C8DCED] leading-relaxed mb-6">
            You have <strong className="text-white font-bold">{activeDebtorsCount} customers</strong> with
            an outstanding balance totaling{" "}
            <strong className="text-[#FF8C33] font-bold">
              Rs. {totalOutstandingCredit.toLocaleString()}
            </strong>
            . Track khata and payments below.
          </p>

          {/* Quick Actions Strip inside Hero */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => openModal("payment")}
              className="px-4 py-2.5 bg-[#FF6A00] hover:bg-[#E85E00] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF6A00]/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>↓ Record Payment</span>
            </button>
            <button
              type="button"
              onClick={() => openModal("credit")}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md border border-white/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>↑ Give Credit (Udhaar)</span>
            </button>
            <button
              type="button"
              onClick={() => openModal("customer")}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md border border-white/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>+ Add Customer</span>
            </button>
            <button
              type="button"
              onClick={() => openModal("expense")}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md border border-white/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>− Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Customers"
          value={totalCustomersCount.toString()}
          subtitle={`${activeDebtorsCount} with pending khata`}
          accentColor="blue"
          trend={{ label: "Active Shop Accounts", neutral: true }}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />

        <StatCard
          title="Total Udhaar (Credit)"
          value={`Rs. ${totalOutstandingCredit.toLocaleString()}`}
          subtitle="Money owed by customers"
          accentColor="orange"
          trend={{ label: "Receivable", positive: false }}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              <path d="M8 7h6" />
              <path d="M8 11h4" />
            </svg>
          }
        />

        <StatCard
          title="Payments Received"
          value={`Rs. ${monthlyPayments.toLocaleString()}`}
          subtitle="Collected this month (Oct)"
          accentColor="green"
          trend={{ label: "Cash Collected", positive: true }}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          }
        />

        <StatCard
          title="Total Expenses"
          value={`Rs. ${monthlyExpenses.toLocaleString()}`}
          subtitle="Shop costs this month"
          accentColor="navy"
          trend={{ label: "Operating Costs", neutral: true }}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* Financial Activity Chart */}
      <ActivityChart />

      {/* 2-Column Grid: Recent Transactions & Top Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left (2 Cols): Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-[#EADBCA] shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#F0E4D4] mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-kf-navy tracking-tight">
                Recent Transactions
              </h2>
              <p className="text-xs text-[#556B82]">Latest credit and payment events</p>
            </div>
            <Link
              href="/dashboard/khata"
              className="text-xs font-bold text-kf-orange hover:text-[#E85E00] flex items-center gap-1 no-underline"
            >
              <span>View All Khata</span>
              <span>→</span>
            </Link>
          </div>

          <div className="divide-y divide-[#F0E4D4]">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-3.5 flex items-center justify-between gap-3 text-xs hover:bg-[#FCF8F2] -mx-2 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      tx.type === "credit"
                        ? "bg-orange-50 text-kf-orange"
                        : "bg-green-50 text-green-600"
                    }`}
                  >
                    {tx.type === "credit" ? "↑" : "↓"}
                  </div>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerForDetails(tx.customerId)}
                      className="font-bold text-kf-navy hover:text-kf-orange truncate block cursor-pointer text-left"
                    >
                      {tx.customerName}
                    </button>
                    <p className="text-[11px] text-[#556B82] truncate">{tx.description}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div
                    className={`font-extrabold tabular-nums ${
                      tx.type === "credit" ? "text-kf-orange" : "text-green-600"
                    }`}
                  >
                    {tx.type === "credit" ? "+" : "-"} Rs. {tx.amount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-[#8DA6BC] font-medium">{tx.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right (1 Col): Top Debtor Customers */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EADBCA] shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#F0E4D4] mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-kf-navy tracking-tight">
                Pending Udhaar
              </h2>
              <p className="text-xs text-[#556B82]">Highest balance customers</p>
            </div>
            <Link
              href="/dashboard/customers"
              className="text-xs font-bold text-kf-orange hover:text-[#E85E00] flex items-center gap-1 no-underline"
            >
              <span>All</span>
              <span>→</span>
            </Link>
          </div>

          <div className="space-y-3">
            {topDebtors.map((customer) => (
              <div
                key={customer.id}
                className="p-3 rounded-xl border border-[#F0E4D4] bg-[#FCF8F2] flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerForDetails(customer.id)}
                    className="font-bold text-kf-navy hover:text-kf-orange truncate block text-left cursor-pointer"
                  >
                    {customer.name}
                  </button>
                  <p className="text-[10px] text-[#556B82] truncate">{customer.phone}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-extrabold text-kf-navy tabular-nums">
                    Rs. {customer.currentBalance.toLocaleString()}
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal("payment", customer.id)}
                    className="mt-1 text-[10px] font-bold text-kf-orange hover:underline cursor-pointer"
                  >
                    Collect Payment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Details Drawer/Modal */}
      <CustomerDetailsModal
        customerId={selectedCustomerForDetails}
        onClose={() => setSelectedCustomerForDetails(null)}
      />
    </div>
  );
}
