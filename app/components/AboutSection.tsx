"use client";

import React from "react";
import { useLanguage } from "../context/LanguageContext";

const highlightIcons = [
  (
    <svg key="hl-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  (
    <svg key="hl-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  ),
  (
    <svg key="hl-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  (
    <svg key="hl-3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
];

/**
 * About section — provides context about KhataFlow's mission and purpose
 */
export default function AboutSection() {
  const { t } = useLanguage();

  return (
    <section id="about" className="py-16 sm:py-20 lg:py-24 bg-white border-t border-[#F0E4D4]">
      <div className="kf-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#FFF0DE] text-kf-orange text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-[#F5D8B8]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              {t.about.badge}
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-kf-navy mb-5 leading-tight tracking-tight">
              {t.about.titleStart}
              <span className="text-kf-orange">{t.about.titleHighlight}</span>
              {t.about.titleEnd}
            </h2>

            <div className="space-y-4 text-[#556B82] text-sm sm:text-base leading-relaxed">
              <p>{t.about.p1}</p>
              <p>{t.about.p2}</p>
              <p>{t.about.p3}</p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <a
                href="#hero"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-kf-orange hover:bg-kf-orange-hover text-white font-bold text-sm rounded-full transition-all no-underline shadow-[0_4px_16px_rgba(255,106,0,0.3)] cursor-pointer"
              >
                {t.about.startFree}
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-kf-navy hover:text-kf-orange font-bold text-sm transition-colors no-underline cursor-pointer"
              >
                {t.about.viewFeatures}
              </a>
            </div>
          </div>

          {/* Right — Stats/Highlights Grid */}
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            {t.about.highlights.map((item, index) => (
              <div
                key={index}
                className="bg-[#FCF5EC] rounded-2xl p-5 sm:p-6 border border-[#EADBCA] text-center hover:border-kf-orange/30 hover:shadow-md transition-all"
                style={{ transitionDuration: "250ms" }}
              >
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-kf-orange mx-auto mb-3 shadow-xs">
                  {highlightIcons[index]}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-kf-navy mb-1 tracking-tight">
                  {item.stat}
                </div>
                <div className="text-xs sm:text-sm text-[#556B82] font-semibold">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
