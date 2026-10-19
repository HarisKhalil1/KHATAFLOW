"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useDashboard } from "../context/DashboardContext";

export default function SettingsPage() {
  const { resetDemoData } = useDashboard();
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = () => {
    resetDemoData();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#EADBCA] shadow-xs">
        <h2 className="text-base sm:text-lg font-extrabold text-kf-navy tracking-tight">
          Shop Settings & Demo Preferences
        </h2>
        <p className="text-xs text-[#556B82]">
          Manage shop identification, localization, and frontend demo states
        </p>
      </div>

      {resetSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Demo dataset successfully reset to initial Peshawar store state!</span>
        </div>
      )}

      {/* Shop Profile Form (Display Only) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EADBCA] shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-kf-navy pb-3 border-b border-[#F0E4D4]">
          Shop Profile & Location
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
          Currency & Financial Display
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
          Phase 1B Demo Controls
        </h3>

        <p className="text-xs text-[#556B82] leading-relaxed">
          KhataFlow Phase 1B operates completely in frontend memory. All customers, payments, credits,
          and expenses you add are processed live and consistently synchronized across all screens.
          Reloading the page or clicking the button below will restore the original demo dataset.
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
