"use client";

import React from "react";
import Logo from "./Logo";
import { useLanguage } from "../context/LanguageContext";

const techStack = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "React Query",
  "Supabase",
  "PostgreSQL",
];

/**
 * Footer component — matches reference mockups:
 * Brand column, quick navigation, support links, and signature bottom dark bar
 */
export default function Footer() {
  const { t } = useLanguage();

  const footerLinks = {
    product: [
      { label: t.footer.links.features, href: "#features" },
      { label: t.footer.links.about, href: "#about" },
      { label: t.footer.links.pricing, href: "#" },
    ],
    support: [
      { label: t.footer.links.helpCenter, href: "#" },
      { label: t.footer.links.contactUs, href: "#" },
      { label: t.footer.links.privacyPolicy, href: "#" },
    ],
  };

  return (
    <footer className="bg-[#FAF2E6] border-t border-[#EADBCA]">
      <div className="kf-container py-12 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size="default" showTagline={true} />
            <p className="mt-4 text-xs sm:text-sm text-[#556B82] leading-relaxed max-w-xs">
              {t.footer.tagline1}
              <br />
              {t.footer.tagline2}
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-kf-navy uppercase tracking-wider mb-3">
              {t.footer.productTitle}
            </h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-xs sm:text-sm text-[#556B82] hover:text-kf-orange transition-colors no-underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-kf-navy uppercase tracking-wider mb-3">
              {t.footer.supportTitle}
            </h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-xs sm:text-sm text-[#556B82] hover:text-kf-orange transition-colors no-underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-kf-navy uppercase tracking-wider mb-3">
              {t.footer.builtWithTitle}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 text-xs bg-white text-[#556B82] rounded-md border border-[#EADBCA] font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Dark Bottom Bar from reference mockups */}
      <div className="bg-[#0D2335] text-white/80 py-4 border-t border-[#163852]">
        <div className="kf-container flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-kf-orange flex items-center justify-center text-white font-bold text-[10px]">
              KH
            </div>
            <span className="font-bold text-white tracking-tight">KhataFlow</span>
            <span className="text-[#9DB2C3] font-normal text-[11px] hidden sm:inline">
              • Khata • Sales • Growth
            </span>
          </div>

          <div className="text-[#8FA7B8] text-[11px] font-medium tracking-wide">
            {t.footer.copyright}
          </div>

          <div className="text-[#6D879B] text-[11px] text-center md:text-right" dir="ltr">
            {t.footer.techBar}
          </div>
        </div>
      </div>
    </footer>
  );
}
