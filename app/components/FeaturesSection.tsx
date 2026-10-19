"use client";

import React from "react";
import { useLanguage } from "../context/LanguageContext";

const featureIcons = [
  (
    <svg key="feat-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  (
    <svg key="feat-1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M8 7h6" />
      <path d="M8 11h4" />
    </svg>
  ),
  (
    <svg key="feat-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  (
    <svg key="feat-3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  (
    <svg key="feat-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
  (
    <svg key="feat-5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  ),
];

/**
 * Features section for the landing page
 * Showcases key KhataFlow product capabilities with warm brand styling
 */
export default function FeaturesSection() {
  const { t } = useLanguage();

  return (
    <section
      id="features"
      className="py-16 sm:py-20 lg:py-24"
      style={{
        background:
          "linear-gradient(180deg, #F8E7D1 0%, #FFFDF9 12%, #FAF2E6 100%)",
      }}
    >
      <div className="kf-container">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 bg-[#FFF0DE] text-kf-orange text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-[#F5D8B8]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {t.features.badge}
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-kf-navy mb-4 tracking-tight">
            {t.features.title}
            <span className="text-kf-orange">{t.features.titleHighlight}</span>
          </h2>
          <p className="text-[#556B82] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {t.features.subtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.cards.map((feature, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-6 sm:p-7 border border-[#EADBCA] transition-all cursor-default shadow-[0_4px_16px_rgba(15,40,62,0.03)] hover:shadow-[0_12px_32px_rgba(255,106,0,0.09)] hover:border-kf-orange/30 hover:-translate-y-1"
              style={{ transitionDuration: "250ms" }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 bg-[#FFF2E0] rounded-xl flex items-center justify-center text-kf-orange mb-4 group-hover:bg-kf-orange group-hover:text-white transition-colors"
                style={{ transitionDuration: "250ms" }}
              >
                {featureIcons[index]}
              </div>

              {/* Content */}
              <h3 className="text-base font-bold text-kf-navy mb-2 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#556B82] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
