"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboard } from "../context/DashboardContext";
import { useLanguage } from "../../context/LanguageContext";
import { useShopRegistry } from "../../context/ShopRegistryContext";

interface TopHeaderProps {
  onOpenMobile: () => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Shop Overview",
    subtitle: "Real-time summary of your khata, udhaar, cashflow, and expenses",
  },
  "/dashboard/customers": {
    title: "Customers & Khata",
    subtitle: "Manage customer accounts, khata balances, and itemized source bills",
  },
  "/dashboard/records": {
    title: "All Records & Journal",
    subtitle: "Chronological log of all customer credits, payments, adjustments, and expenses",
  },
  "/dashboard/khata": {
    title: "Digital Khata & Ledger",
    subtitle: "Complete credit and debit running balance ledgers for each customer",
  },
  "/dashboard/payments": {
    title: "Payment Records",
    subtitle: "Log incoming cash, bank, and mobile wallet payments from customers",
  },
  "/dashboard/expenses": {
    title: "Expense Tracker",
    subtitle: "Record inventory restock, shop rent, electricity, and transport costs",
  },
  "/dashboard/reports": {
    title: "Business Reports & Analytics",
    subtitle: "Periodic udhaar balance, cashflow summaries, and expense analytics",
  },
  "/dashboard/settings": {
    title: "Settings & Shop Preferences",
    subtitle: "Manage shop profile and local storage options",
  },
};

const PAGE_TITLES_UR: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "دکان کا جائزہ",
    subtitle: "آپ کے کھاتہ، ادھار، کیش فلو اور اخراجات کا فوری خلاصہ",
  },
  "/dashboard/customers": {
    title: "گاہک اور کھاتہ",
    subtitle: "گاہکوں کے اکاؤنٹس، رابطے اور بقایا ادھار کا مکمل انتظام",
  },
  "/dashboard/records": {
    title: "تمام ریکارڈز اور روزنامچہ",
    subtitle: "ادھار، ادائیگیوں، درستگیوں اور اخراجات کا تاریخی اندراج",
  },
  "/dashboard/khata": {
    title: "ڈیجیٹل کھاتہ اور لیجر",
    subtitle: "ہر گاہک کا کریڈٹ اور ڈیبٹ رننگ بیلنس لیجر",
  },
  "/dashboard/payments": {
    title: "وصولیوں کا ریکارڈ",
    subtitle: "نقد رقم، بینک اور ایزی پیسہ / جاز کیش کی وصولیاں",
  },
  "/dashboard/expenses": {
    title: "دکان کے اخراجات",
    subtitle: "دکان کا کرایہ، بجلی بل، ٹرانسپورٹ اور روزانہ اخراجات",
  },
  "/dashboard/reports": {
    title: "کاروباری رپورٹس اور گوشوارے",
    subtitle: "ادھار، نقد کیش فلو اور منافع کے تفصیلی جائزے",
  },
  "/dashboard/settings": {
    title: "سیٹنگز اور ترتیبات",
    subtitle: "دکان کی معلومات اور محفوظ شدہ ڈیٹا کا انتظام",
  },
};

export default function TopHeader({ onOpenMobile }: TopHeaderProps) {
  const pathname = usePathname();
  const { lang, setLang } = useLanguage();
  const { activeShop, logout } = useShopRegistry();
  const {
    notifications,
    unreadNotificationCount,
    markNotificationsAsRead,
    openModal,
    resetDemoData,
  } = useDashboard();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);

  const metaSource = lang === "ur" ? PAGE_TITLES_UR : PAGE_TITLES;
  const currentMeta = metaSource[pathname] || {
    title: lang === "ur" ? "دکان ڈیش بورڈ" : "Shop Dashboard",
    subtitle: lang === "ur" ? "کھاتہ فلو پورٹل" : "KhataFlow Shop Owner Portal",
  };

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) {
        setQuickMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 sm:h-20 bg-white border-b border-[#EADBCA]/80 sticky top-0 z-30 px-3 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open navigation menu"
          className="lg:hidden p-1.5 rounded-xl text-kf-navy hover:bg-[#F5ECE1] transition-colors cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-lg lg:text-xl font-extrabold text-kf-navy tracking-tight truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
              {currentMeta.title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF2E5] text-kf-navy border border-[#FFD9B3]">
              <span className="w-1.5 h-1.5 rounded-full bg-kf-orange flex-shrink-0" />
              <span className="font-extrabold text-kf-navy truncate max-w-[140px]">
                {activeShop?.name || "Khyber General Store"}
              </span>
              <span className="font-mono text-[9px] text-kf-orange font-bold bg-white px-1 py-0.5 rounded border border-[#FFE0CC]">
                {activeShop?.id || "SHOP-PK-001"}
              </span>
            </span>
          </div>
          <p className="text-xs text-[#556B82] hidden md:block truncate mt-0.5">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Quick Action Dropdown (hidden on small mobile to prevent header overflow) */}
        <div className="relative hidden sm:block" ref={quickRef}>
          <button
            id="btn-quick-new-entry"
            type="button"
            onClick={() => setQuickMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FFF4EB] hover:bg-[#FFE8D6] text-kf-orange text-xs font-bold rounded-xl border border-[#FFD9B3] transition-colors cursor-pointer shadow-2xs"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">New Entry</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {quickMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#EADBCA] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-bold text-[#8DA6BC] uppercase tracking-wider border-b border-[#F0E4D4]">
                Quick Create
              </div>
              <button
                id="quick-entry-record-payment"
                type="button"
                onClick={() => {
                  setQuickMenuOpen(false);
                  openModal("payment");
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-kf-navy hover:bg-[#FCF4EB] hover:text-kf-orange flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-bold text-xs">
                  ↓
                </span>
                <div>
                  <div className="font-bold">Record Payment</div>
                  <div className="text-[10px] text-[#556B82]">Receive customer udhaar</div>
                </div>
              </button>
              <button
                id="quick-entry-give-credit"
                type="button"
                onClick={() => {
                  setQuickMenuOpen(false);
                  openModal("credit");
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-kf-navy hover:bg-[#FCF4EB] hover:text-kf-orange flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-orange-50 text-kf-orange flex items-center justify-center font-bold text-xs">
                  ↑
                </span>
                <div>
                  <div className="font-bold">Give Credit (Udhaar)</div>
                  <div className="text-[10px] text-[#556B82]">Add customer purchase</div>
                </div>
              </button>
              <button
                id="quick-entry-add-customer"
                type="button"
                onClick={() => {
                  setQuickMenuOpen(false);
                  openModal("customer");
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-kf-navy hover:bg-[#FCF4EB] hover:text-kf-orange flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  +
                </span>
                <div>
                  <div className="font-bold">Add Customer</div>
                  <div className="text-[10px] text-[#556B82]">New khata account</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickMenuOpen(false);
                  openModal("expense");
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-kf-navy hover:bg-[#FCF4EB] hover:text-kf-orange flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
                  −
                </span>
                <div>
                  <div className="font-bold">Add Expense</div>
                  <div className="text-[10px] text-[#556B82]">Restock, rent, utilities</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((prev) => !prev);
              if (!notifOpen) markNotificationsAsRead();
            }}
            aria-label={`Notifications (${unreadNotificationCount} unread)`}
            className="relative p-2 rounded-xl text-kf-navy hover:bg-[#F5ECE1] transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-kf-orange ring-2 ring-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-xl border border-[#EADBCA] p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F0E4D4]">
                <span className="text-xs font-extrabold text-kf-navy">Notifications</span>
                <span className="text-[10px] font-semibold text-kf-orange bg-[#FFF2E5] px-2 py-0.5 rounded-full">
                  {notifications.length} alerts
                </span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-[#FCF7F0] border border-[#F0E4D4] text-xs hover:bg-[#F8EFE3] transition-colors"
                  >
                    <div className="flex items-center justify-between font-bold text-kf-navy mb-0.5">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-[#8DA6BC] font-normal">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[#556B82] leading-tight">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bilingual Language Switcher Toggle */}
        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "ur" : "en")}
          aria-label={lang === "en" ? "Switch to Urdu" : "Switch to English"}
          title={lang === "en" ? "اردو میں دیکھیں (Switch to Urdu)" : "Switch to English"}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#EADBCA] bg-[#FCF8F2] hover:bg-[#F5ECE1] hover:border-kf-orange/40 text-xs font-extrabold text-kf-navy transition-all cursor-pointer shadow-2xs"
        >
          <span className="text-xs">🌐</span>
          <span className="tabular-nums font-bold">{lang === "en" ? "اردو" : "English"}</span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-label="User profile menu"
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F5ECE1] transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0F283E] to-[#1E4B72] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {(activeShop?.ownerName || "SO").slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-extrabold text-kf-navy leading-none flex items-center gap-1.5">
                <span>{activeShop?.ownerName || "Shop Owner"}</span>
                {(activeShop?.isDemoCreated || activeShop?.id === "SHOP-PK-HARIS") && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[9px] font-extrabold">
                    DEMO
                  </span>
                )}
              </div>
              <div className="text-[10px] text-[#556B82] leading-none mt-1">Shop Owner</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#556B82]">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#EADBCA] p-2 z-50">
              <div className="p-3 border-b border-[#F0E4D4] bg-[#FCF7F0] rounded-xl mb-1">
                <div className="font-extrabold text-xs text-kf-navy flex items-center justify-between">
                  <span>{activeShop?.ownerName || "Shop Owner"}</span>
                  {(activeShop?.isDemoCreated || activeShop?.id === "SHOP-PK-HARIS") && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[9px] font-extrabold">
                      DEMO ACCOUNT
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#556B82]">
                  {activeShop?.name || "KhataFlow Shop"}
                </div>
                <div className="text-[10px] text-kf-orange font-semibold mt-1">
                  {activeShop?.city || "Pakistan"}{activeShop?.id ? ` • ${activeShop.id}` : ""}
                </div>
              </div>

              <Link
                href="/superadmin"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#0F283E] hover:bg-[#FAF3E8] transition-colors no-underline"
              >
                <span>🛡️ Super Admin Console</span>
              </Link>

              <Link
                href="/dashboard/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-kf-navy hover:bg-[#FCF4EB] hover:text-kf-orange transition-colors no-underline"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Shop Settings & Preferences</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Clear local business records for this shop?")) {
                    resetDemoData();
                  }
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-kf-navy hover:bg-[#FCF4EB] hover:text-kf-orange transition-colors cursor-pointer text-left"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Clear Shop Records</span>
              </button>

              <div className="border-t border-[#F0E4D4] my-1" />

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer border-none bg-transparent text-left"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out (Shop Owner)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
