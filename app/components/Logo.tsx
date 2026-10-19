"use client";

import React from "react";

/**
 * KhataFlow Logo component
 * Renders the brand logo with the orange shop-roof icon and navy text
 */
export default function Logo({
  size = "default",
  showTagline = true,
}: {
  size?: "small" | "default" | "large";
  showTagline?: boolean;
}) {
  const sizeClasses = {
    small: { icon: "w-7 h-7", text: "text-lg", tagline: "text-[9px]" },
    default: { icon: "w-9 h-9", text: "text-xl", tagline: "text-[10px]" },
    large: { icon: "w-12 h-12", text: "text-2xl", tagline: "text-xs" },
  };

  const s = sizeClasses[size];

  return (
    <a
      href="#"
      className="flex items-center gap-2 group no-underline"
      aria-label="KhataFlow home"
    >
      {/* Logo Icon — Stylized shop awning with khata ledger */}
      <div className={`${s.icon} relative flex-shrink-0`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
          aria-hidden="true"
        >
          {/* Orange rounded container */}
          <rect x="2" y="2" width="44" height="44" rx="10" fill="#FF6A00" />
          
          {/* Shop awning stripes */}
          <path d="M6 12C6 10 8 8 11 8H37C40 8 42 10 42 12L44 20C44 22 41 24 39 24C37 24 35 22 34 20C33 22 31 24 29 24C27 24 25 22 24 20C23 22 21 24 19 24C17 24 15 22 14 20C13 22 11 24 9 24C7 24 4 22 4 20L6 12Z" fill="#FFFFFF" fillOpacity="0.95" />
          <path d="M10 9L8 20" stroke="#FF6A00" strokeWidth="2" strokeLinecap="round" />
          <path d="M19 9L19 20" stroke="#FF6A00" strokeWidth="2" strokeLinecap="round" />
          <path d="M29 9L29 20" stroke="#FF6A00" strokeWidth="2" strokeLinecap="round" />
          <path d="M38 9L40 20" stroke="#FF6A00" strokeWidth="2" strokeLinecap="round" />
          
          {/* Khata Ledger Book */}
          <rect x="10" y="22" width="22" height="18" rx="2" fill="#FFFFFF" />
          <line x1="14" y1="26" x2="28" y2="26" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="14" y1="30" x2="28" y2="30" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="14" y1="34" x2="24" y2="34" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Rs Badge */}
          <circle cx="34" cy="31" r="7" fill="#FF6A00" stroke="#FFFFFF" strokeWidth="1.5" />
          <text x="34" y="34" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Rs</text>
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col leading-none">
        <span
          className={`${s.text} font-bold tracking-tight text-kf-navy group-hover:text-kf-orange transition-colors`}
          style={{ transitionDuration: "250ms" }}
        >
          Khata<span className="text-kf-orange">Flow</span>
        </span>
        {showTagline && (
          <span
            className={`${s.tagline} font-semibold text-kf-muted tracking-wide mt-0.5 flex items-center gap-1`}
          >
            Khata <span className="text-kf-orange">•</span> Sales{" "}
            <span className="text-kf-navy">•</span> Growth
          </span>
        )}
      </div>
    </a>
  );
}
