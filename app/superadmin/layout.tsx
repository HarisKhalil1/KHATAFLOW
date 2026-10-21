"use client";

import React from "react";
import Link from "next/link";
import { LanguageProvider } from "../context/LanguageContext";
import { useShopRegistry } from "../context/ShopRegistryContext";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useShopRegistry();

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[#FAF3E8] flex flex-col text-kf-navy antialiased selection:bg-[#FFE0CC] overflow-x-clip max-w-full">
        {/* Top Super Admin Platform Navigation Header */}
        <header className="h-16 sm:h-20 bg-[#0F283E] text-white border-b border-[#1A3D5D] sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/superadmin" className="flex items-center gap-2.5 no-underline text-white">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-[#FF8C33] flex items-center justify-center font-black text-sm shadow-sm">
                KF
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight">
                    KhataFlow
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#FF6A00] text-white">
                    Super Admin
                  </span>
                </div>
                <p className="text-[10px] text-[#A3BFD9] hidden sm:block">
                  Multi-Shop Governance &amp; Administrative Console
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-[#FFB280]">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>System Registry Active</span>
            </div>

            <Link
              href="/dashboard"
              className="text-xs font-bold text-[#C5D9EC] hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors no-underline flex items-center gap-1.5"
            >
              <span>🏬 Shop Portal</span>
            </Link>

            <button
              type="button"
              onClick={logout}
              className="text-xs font-bold text-white bg-gradient-to-r from-[#FF6A00] to-[#FF8C33] hover:from-[#E85E00] hover:to-[#FF6A00] px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 border-none"
            >
              <span>Exit Console</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
      </div>
    </LanguageProvider>
  );
}
