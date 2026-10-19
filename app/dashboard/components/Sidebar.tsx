"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboard } from "../context/DashboardContext";
import { useLanguage } from "../../context/LanguageContext";

interface NavItem {
  name: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
  badge?: string | number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const { openModal } = useDashboard();
  const { lang, t } = useLanguage();

  const navSections: NavSection[] = [
    {
      title: lang === "ur" ? "مین مینو" : "Main Menu",
      items: [
        {
          name: t.dashboard.menu.dashboard,
          href: "/dashboard",
          icon: (active) => (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={active ? "#FF6A00" : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
          ),
        },
        {
          name: t.dashboard.menu.customersAndKhata,
          href: "/dashboard/customers",
          icon: (active) => (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={active ? "#FF6A00" : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
      ],
    },
    {
      title: lang === "ur" ? "کاروباری امور" : "Operations",
      items: [
        {
          name: t.dashboard.menu.allRecords,
          href: "/dashboard/records",
          icon: (active) => (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={active ? "#FF6A00" : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              <path d="M8 7h6" />
              <path d="M8 11h6" />
              <path d="M8 15h4" />
            </svg>
          ),
        },
        {
          name: t.dashboard.menu.payments,
          href: "/dashboard/payments",
          icon: (active) => (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={active ? "#FF6A00" : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          ),
        },
        {
          name: t.dashboard.menu.expenses,
          href: "/dashboard/expenses",
          icon: (active) => (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={active ? "#FF6A00" : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          ),
        },
        {
          name: t.dashboard.menu.reports,
          href: "/dashboard/reports",
          icon: (active) => (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={active ? "#FF6A00" : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          ),
        },
      ],
    },
    {
      title: lang === "ur" ? "ترجیحات" : "Preferences",
      items: [
        {
          name: t.dashboard.menu.settings,
          href: "/dashboard/settings",
          icon: (active) => (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={active ? "#FF6A00" : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0F283E] text-white flex flex-col h-screen sticky top-0 border-r border-[#163B5C] select-none z-30">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-5 border-b border-[#1A3F61]/80 justify-between flex-shrink-0">
        <Link
          href="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 no-underline group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6A00] to-[#FF8C33] flex items-center justify-center shadow-md shadow-[#FF6A00]/20 group-hover:scale-105 transition-transform">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-lg font-extrabold tracking-tight text-white">Khata</span>
              <span className="text-lg font-extrabold tracking-tight text-[#FF6A00]">Flow</span>
            </div>
            <span className="text-[10px] tracking-wider uppercase font-semibold text-[#8DA6BC] mt-1 block">
              Shop Owner Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Action Button */}
      <div className="p-3.5 border-b border-[#1A3F61]/50 flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            openModal("payment");
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full h-10 bg-gradient-to-r from-[#FF6A00] to-[#FF7E1F] hover:from-[#E85E00] hover:to-[#FF6A00] text-white font-bold text-xs rounded-xl shadow-[0_4px_14px_rgba(255,106,0,0.25)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{t.dashboard.actions.recordPayment}</span>
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-3.5 space-y-4 overflow-y-auto" aria-label="Dashboard sidebar navigation">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold tracking-wider uppercase text-[#6B8BA6]">
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/dashboard/customers" && pathname.startsWith("/dashboard/khata"));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all no-underline ${
                    isActive
                      ? "bg-[#183955] text-white font-bold border-l-[3.5px] border-[#FF6A00] pl-2.5 shadow-xs"
                      : "text-[#9BB3C7] hover:bg-[#14324D] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? "text-[#FF6A00]" : "text-[#7B98B0]"}>
                      {item.icon(isActive)}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#FF6A00]/20 text-[#FF8C33] rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Demo Shop Badge & Landing Return */}
      <div className="p-3.5 border-t border-[#1A3F61]/70 bg-[#0B1E2E] flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#163B5C] flex items-center justify-center text-[#FF8C33] text-xs font-bold flex-shrink-0">
            KG
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">Khyber General Store</div>
            <div className="text-[10px] text-[#8DA6BC] flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] flex-shrink-0" />
              <span className="truncate">Saddar, Peshawar</span>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-[11px] font-semibold text-[#8DA6BC] hover:text-white bg-[#142F46] hover:bg-[#1A3D5C] rounded-lg transition-colors no-underline"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Public Website</span>
        </Link>
      </div>
    </aside>
  );
}
