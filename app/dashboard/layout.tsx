"use client";

import React, { useState } from "react";
import { LanguageProvider } from "../context/LanguageContext";
import { DashboardProvider, useDashboard } from "./context/DashboardContext";
import { useShopRegistry } from "../context/ShopRegistryContext";
import Link from "next/link";
import Sidebar from "./components/Sidebar";
import TopHeader from "./components/TopHeader";
import MobileNav from "./components/MobileNav";
import DemoNoticeBanner from "./components/DemoNoticeBanner";
import RecordPaymentModal from "./components/RecordPaymentModal";
import AddCreditModal from "./components/AddCreditModal";
import AddCustomerModal from "./components/AddCustomerModal";
import AddExpenseModal from "./components/AddExpenseModal";
import ItemAdjustmentModal from "./components/ItemAdjustmentModal";
import DeleteCustomerModal from "./components/DeleteCustomerModal";
import EditCustomerModal from "./components/EditCustomerModal";
import SuspensionLockScreen from "./components/SuspensionLockScreen";

function DashboardModals() {
  const { activeModal } = useDashboard();
  return (
    <>
      {activeModal === "payment" && <RecordPaymentModal />}
      {activeModal === "credit" && <AddCreditModal />}
      {activeModal === "customer" && <AddCustomerModal />}
      {activeModal === "expense" && <AddExpenseModal />}
      {activeModal === "item-adjust" && <ItemAdjustmentModal />}
      {activeModal === "delete-customer" && <DeleteCustomerModal />}
      {activeModal === "edit-customer" && <EditCustomerModal />}
    </>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { activeShop, isShopSuspended, isAuthenticated, isHydrated } = useShopRegistry();

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#FAF3E8] flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-kf-navy font-bold text-sm">
          <div className="w-5 h-5 border-2 border-kf-orange border-t-transparent rounded-full animate-spin" />
          <span>Verifying session authorization...</span>
        </div>
      </div>
    );
  }

  // Route Protection: Unauthenticated direct access is strictly denied
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF3E8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#EADBCA] text-center space-y-5 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-3xl bg-[#FFF2E5] text-kf-orange flex items-center justify-center mx-auto text-3xl font-bold shadow-xs border border-[#FFD9B3]">
            🔒
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-200 uppercase tracking-wider">
              Access Restricted
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-kf-navy mt-3">
              Authentication Required
            </h1>
            <p className="text-xs text-[#556B82] mt-2 leading-relaxed">
              Direct access to the Shop Owner dashboard is protected. Please sign in with your registered username/email and password to access your shop ledger.
            </p>
          </div>
          <div className="p-3 bg-[#FAF6F0] rounded-2xl border border-[#EADBCA] text-left text-xs space-y-1 text-[#556B82]">
            <div className="font-bold text-kf-navy">Security Enforcement:</div>
            <div>• Typing the dashboard URL without login is prohibited.</div>
            <div>• Accounts must authenticate with registered credentials.</div>
          </div>
          <Link
            href="/"
            className="w-full h-11 bg-gradient-to-r from-[#FF6A00] to-[#FF7708] hover:from-[#E85E00] hover:to-[#FF6A00] text-white font-bold text-xs sm:text-sm rounded-xl shadow-[0_4px_16px_rgba(255,106,0,0.32)] flex items-center justify-center gap-2 cursor-pointer transition-all no-underline"
          >
            <span>Proceed to Login Portal</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  // Enforce administrative temporary suspension
  if (activeShop) {
    const suspensionInfo = isShopSuspended(activeShop.id);
    if (suspensionInfo.isSuspended) {
      return (
        <SuspensionLockScreen
          shop={activeShop}
          reason={suspensionInfo.reason}
          expiresAt={suspensionInfo.expiresAt}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF3E8] flex text-kf-navy antialiased selection:bg-[#FFE0CC]">
      {/* Desktop Sidebar - Fixed full viewport height with independent scroll */}
      <div className="hidden lg:flex lg:flex-col shrink-0 sticky top-0 h-screen h-[100dvh] z-30">
        <Sidebar />
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopHeader onOpenMobile={() => setMobileNavOpen(true)} />
        <DemoNoticeBanner />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Modals for Live Data Entry */}
      <DashboardModals />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <DashboardProvider>
        <DashboardContent>{children}</DashboardContent>
      </DashboardProvider>
    </LanguageProvider>
  );
}
