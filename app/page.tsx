"use client";

import { LanguageProvider } from "./context/LanguageContext";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import AboutSection from "./components/AboutSection";
import Footer from "./components/Footer";

/**
 * KhataFlow Landing Page — Phase 1A
 * Public-facing homepage with hero, features, about, and footer
 */
export default function HomePage() {
  return (
    <LanguageProvider>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AboutSection />
      </main>
      <Footer />
    </LanguageProvider>
  );
}
