"use client";

import React, { useState } from "react";
import Logo from "./Logo";
import { useLanguage } from "../context/LanguageContext";

/**
 * Main navigation bar for the public landing page
 * Matches the reference: Logo left, links center, language switcher right
 */
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const navLinks = [
    { label: t.nav.home, href: "#" },
    { label: t.nav.features, href: "#features" },
    { label: t.nav.about, href: "#about" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FFFBF3]/85 backdrop-blur-md border-b border-[#F0E4D4]/60 transition-colors">
      <nav
        className="kf-container flex items-center justify-between h-16 md:h-[72px]"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Logo size="default" showTagline={true} />

        {/* Desktop Navigation Links */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-sm font-semibold text-kf-navy/85 hover:text-kf-orange transition-colors no-underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right side: Language Switcher */}
        <div className="hidden md:flex items-center gap-2">
          <div
            className="flex items-center bg-white/80 rounded-full p-0.5 border border-[#EADBCA] shadow-xs"
            role="radiogroup"
            aria-label="Language selection"
          >
            <button
              id="lang-en-btn"
              role="radio"
              aria-checked={lang === "en"}
              onClick={() => setLang("en")}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                lang === "en"
                  ? "bg-kf-orange text-white shadow-xs"
                  : "text-kf-navy/80 hover:text-kf-navy"
              }`}
            >
              EN
            </button>
            <button
              id="lang-ur-btn"
              role="radio"
              aria-checked={lang === "ur"}
              onClick={() => setLang("ur")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                lang === "ur"
                  ? "bg-kf-orange text-white shadow-xs"
                  : "text-kf-navy/80 hover:text-kf-navy"
              }`}
            >
              اردو
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-kf-navy hover:bg-kf-cream transition-colors cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12h18" />
              <path d="M3 6h18" />
              <path d="M3 18h18" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden bg-white border-t border-kf-border-light animate-in slide-in-from-top-2"
        >
          <div className="kf-container py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-kf-navy hover:text-kf-orange hover:bg-kf-cream rounded-lg transition-colors no-underline"
              >
                {link.label}
              </a>
            ))}

            {/* Mobile language switcher */}
            <div className="pt-3 px-4 border-t border-kf-border-light mt-3">
              <p className="text-xs text-kf-muted mb-2 font-medium">
                {lang === "ur" ? "زبان" : "Language"}
              </p>
              <div
                className="flex items-center gap-2"
                role="radiogroup"
                aria-label="Language selection"
              >
                <button
                  role="radio"
                  aria-checked={lang === "en"}
                  onClick={() => {
                    setLang("en");
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    lang === "en"
                      ? "bg-kf-orange text-white"
                      : "bg-kf-cream text-kf-navy border border-kf-border"
                  }`}
                >
                  EN
                </button>
                <button
                  role="radio"
                  aria-checked={lang === "ur"}
                  onClick={() => {
                    setLang("ur");
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    lang === "ur"
                      ? "bg-kf-orange text-white"
                      : "bg-kf-cream text-kf-navy border border-kf-border"
                  }`}
                >
                  اردو
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
