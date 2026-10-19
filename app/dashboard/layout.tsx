"use client";

import React, { useState } from "react";
import { LanguageProvider } from "../context/LanguageContext";
import { DashboardProvider, useDashboard } from "./context/DashboardContext";
import Sidebar from "./components/Sidebar";
import TopHeader from "./components/TopHeader";
import MobileNav from "./components/MobileNav";
import DemoNoticeBanner from "./components/DemoNoticeBanner";
import RecordPaymentModal from "./components/RecordPaymentModal";
import AddCreditModal from "./components/AddCreditModal";
import AddCustomerModal from "./components/AddCustomerModal";
import AddExpenseModal from "./components/AddExpenseModal";
import ItemAdjustmentModal from "./components/ItemAdjustmentModal";

function DashboardModals() {
  const { activeModal } = useDashboard();
  return (
    <>
      {activeModal === "payment" && <RecordPaymentModal />}
      {activeModal === "credit" && <AddCreditModal />}
      {activeModal === "customer" && <AddCustomerModal />}
      {activeModal === "expense" && <AddExpenseModal />}
      {activeModal === "item-adjust" && <ItemAdjustmentModal />}
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <LanguageProvider>
      <DashboardProvider>
        <div className="min-h-screen bg-[#FAF3E8] flex text-kf-navy antialiased selection:bg-[#FFE0CC]">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Navigation Drawer */}
        <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
          <TopHeader onOpenMobile={() => setMobileNavOpen(true)} />
          <DemoNoticeBanner />

          <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Global Modals for Live Data Entry */}
        <DashboardModals />
      </div>
    </DashboardProvider>
  </LanguageProvider>
  );
}
