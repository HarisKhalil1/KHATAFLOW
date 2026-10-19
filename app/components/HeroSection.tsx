"use client";

import React from "react";
import Image from "next/image";
import LoginCard from "./LoginCard";
import { useLanguage } from "../context/LanguageContext";

/**
 * Hero section — Phase 1A Visual Match
 * Three-column desktop layout matching reference:
 *   Left (~38%): Bold headline, supporting copy, CTAs, location & trust badges
 *   Center (~28%): 3D isometric shop illustration with natural authentic backdrop
 *   Right (~34%): Rounded white login card
 */
export default function HeroSection() {
  const { lang, t } = useLanguage();

  return (
    <section
      id="hero"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #FFFDF9 0%, #FCF3E5 40%, #F8E7D1 100%)",
        paddingTop: "clamp(2rem, 3.5vw, 3.5rem)",
        paddingBottom: "clamp(2.5rem, 4.5vw, 4.5rem)",
      }}
    >
      {/* Warm ambient glow & soft atmospheric lighting matching the original reference */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden select-none"
        aria-hidden="true"
      >
        {/* Soft radial golden/peach glow centered behind the shop */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-[35%] -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 185, 120, 0.32) 0%, rgba(255, 235, 205, 0.12) 50%, transparent 70%)",
          }}
        />

        {/* Expanded light orange warm glow under and around the calculator & RS register */}
        <div
          className="absolute top-[62%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[660px] h-[450px] rounded-[50%] opacity-90"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255, 175, 105, 0.34) 0%, rgba(255, 205, 150, 0.18) 45%, transparent 72%)",
          }}
        />

        {/* Diagonal soft light ray */}
        <div
          className="absolute -top-32 -left-32 w-[900px] h-[600px] rotate-[-25deg] opacity-25"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)",
          }}
        />
      </div>

      <div className="kf-container relative z-10">
        {/* Main Hero Layout — 3 columns on desktop, stacked on mobile/tablet */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr_1fr] xl:grid-cols-[1.15fr_0.95fr_1fr] gap-8 lg:gap-6 xl:gap-8 items-center lg:min-h-[480px]">
          
          {/* LEFT COLUMN — Headline, Description, CTAs, Location Badge */}
          <div className="order-1 md:order-1 flex flex-col justify-center">
            {/* Main Headline */}
            {lang === "en" ? (
              <h1 className="font-extrabold lg:font-black tracking-tight text-kf-navy mb-4 text-3xl sm:text-4xl lg:text-[38px] xl:text-[44px] leading-[1.14]">
                Turn scattered<br className="hidden sm:inline" />{" "}
                <span className="whitespace-nowrap">business records into</span><br className="hidden sm:inline" />{" "}
                one simple{" "}
                <span className="text-kf-orange">
                  digital<br className="hidden sm:inline" />{" "}
                  workspace.
                </span>
              </h1>
            ) : (
              <h1 className="font-extrabold lg:font-black tracking-tight text-kf-navy mb-4 text-3xl sm:text-4xl lg:text-[36px] xl:text-[42px] leading-[1.3]">
                {t.hero.headlineLine1}<br className="hidden sm:inline" />{" "}
                <span className="whitespace-nowrap">{t.hero.headlineLine2}</span><br className="hidden sm:inline" />{" "}
                <span className="text-kf-orange">
                  {t.hero.headlineHighlight1}{" "}
                </span>
                <span>{t.hero.headlineHighlight2}</span>
              </h1>
            )}

            {/* Subheading / Supporting Text */}
            <p className="text-sm sm:text-base text-[#556B82] leading-relaxed mb-6 max-w-md">
              {t.hero.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <a
                href="#hero"
                className="inline-flex items-center gap-2 px-6 py-3 bg-kf-orange hover:bg-kf-orange-hover text-white font-bold text-sm rounded-full transition-all no-underline shadow-[0_4px_16px_rgba(255,106,0,0.32)] hover:shadow-[0_6px_22px_rgba(255,106,0,0.42)] group cursor-pointer"
              >
                <span>{t.hero.getStarted}</span>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`${lang === "ur" ? "rotate-180 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"} transition-transform`}
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-[#FAF5ED] text-kf-navy font-semibold text-sm rounded-full border border-[#D9C4AB] shadow-xs transition-all no-underline cursor-pointer"
              >
                {t.hero.learnMore}
              </a>
            </div>

            {/* Trust & Location Badges */}
            <div className="space-y-1.5 text-xs text-[#556B82] select-none pt-1">
              <div className="flex items-center gap-1.5 font-semibold text-kf-navy/90">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF6A00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{t.hero.location}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[#6F8599] text-[11px] sm:text-xs">
                <span>• {t.hero.badge1}</span>
                <span>• {t.hero.badge2}</span>
                <span>• {t.hero.badge3}</span>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN — 3D Isometric Shop Illustration */}
          <div className="order-2 md:order-3 md:col-span-2 lg:order-2 lg:col-span-1 flex items-center justify-center self-center py-2 lg:py-0">
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[290px] xl:max-w-[340px] 2xl:max-w-[370px] transition-transform hover:scale-[1.02] duration-300">
              <Image
                src="/shop-illustration-transparent.png"
                alt="KhataFlow 3D Shop — miniature storefront with orange awning, digital calculator, and open khata ledger with Rs"
                width={800}
                height={800}
                className="w-full h-auto object-contain"
                priority
                unoptimized
              />
            </div>
          </div>

          {/* RIGHT COLUMN — Login Card */}
          <div className="order-3 md:order-2 lg:order-3 flex justify-center md:justify-end lg:justify-end">
            <LoginCard />
          </div>
        </div>
      </div>
    </section>
  );
}
