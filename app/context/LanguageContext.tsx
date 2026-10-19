"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ur";

export interface Translations {
  nav: {
    home: string;
    features: string;
    about: string;
  };
  hero: {
    headlineLine1: string;
    headlineLine2: string;
    headlineLine3: string;
    headlineHighlight1: string;
    headlineHighlight2: string;
    subtitle: string;
    getStarted: string;
    learnMore: string;
    location: string;
    badge1: string;
    badge2: string;
    badge3: string;
  };
  login: {
    title: string;
    subtitle: string;
    shopOwner: string;
    superAdmin: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    rememberMe: string;
    forgotPassword: string;
    loginButton: string;
    noAccount: string;
    contactAdmin: string;
    demoNotification: (role: string, email: string) => string;
    contactNotification: string;
    forgotNotification: string;
  };
  features: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    cards: Array<{
      title: string;
      description: string;
    }>;
  };
  about: {
    badge: string;
    titleStart: string;
    titleHighlight: string;
    titleEnd: string;
    p1: string;
    p2: string;
    p3: string;
    startFree: string;
    viewFeatures: string;
    highlights: Array<{
      stat: string;
      label: string;
    }>;
  };
  footer: {
    tagline1: string;
    tagline2: string;
    productTitle: string;
    supportTitle: string;
    builtWithTitle: string;
    links: {
      features: string;
      about: string;
      pricing: string;
      helpCenter: string;
      contactUs: string;
      privacyPolicy: string;
    };
    copyright: string;
    techBar: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: "Home",
      features: "Features",
      about: "About",
    },
    hero: {
      headlineLine1: "Turn scattered",
      headlineLine2: "business records into",
      headlineLine3: "one simple ",
      headlineHighlight1: "digital",
      headlineHighlight2: "workspace.",
      subtitle:
        "Customers ka khata, udhaar, payments, expenses aur reports — sab kuch ek jagah.",
      getStarted: "Get Started",
      learnMore: "Learn More",
      location: "Peshawar, Khyber Pakhtunkhwa",
      badge1: "Made for small shops",
      badge2: "Easy to use",
      badge3: "Secure",
    },
    login: {
      title: "Welcome Back",
      subtitle: "Login to your account",
      shopOwner: "Shop Owner",
      superAdmin: "Super Admin",
      emailLabel: "Email Address",
      emailPlaceholder: "you@shop.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      loginButton: "Login",
      noAccount: "Don't have an account?",
      contactAdmin: "Contact your admin",
      demoNotification: (role, email) =>
        `Demo: Logged in as ${role === "shop-owner" ? "Shop Owner" : "Super Admin"} (${email || "you@shop.com"})`,
      contactNotification:
        "Please contact your system admin to set up a new shop account.",
      forgotNotification:
        "Password reset feature will be available in Phase 1B.",
    },
    features: {
      badge: "Key Features",
      title: "Everything your shop needs, ",
      titleHighlight: "in one place",
      subtitle:
        "KhataFlow brings all your daily business operations together — simple tools designed for shopkeepers who want to grow.",
      cards: [
        {
          title: "Customer Management",
          description:
            "Manage all your customers, their contact details, and search quickly when you need them.",
        },
        {
          title: "Digital Khata (Ledger)",
          description:
            "Keep track of udhaar and payments. See each customer's complete transaction history at a glance.",
        },
        {
          title: "Payments & Credit",
          description:
            "Record credit entries and received payments easily. Track outstanding balances in real time.",
        },
        {
          title: "Expense Tracking",
          description:
            "Log and categorize all your business expenses. Know exactly where your money goes each month.",
        },
        {
          title: "Reports & Analytics",
          description:
            "Get clear financial reports — total sales, expenses, outstanding amounts, and business growth trends.",
        },
        {
          title: "Shop Dashboard",
          description:
            "One dashboard to see everything — customers, khata, payments, expenses, and today's activity summary.",
        },
      ],
    },
    about: {
      badge: "About KhataFlow",
      titleStart: "Built for shopkeepers, ",
      titleHighlight: "by people who understand",
      titleEnd: " local business",
      p1: "KhataFlow was born from a simple observation — most small shopkeepers in Peshawar still manage their businesses with handwritten registers, scattered notes, and memory. This works until it doesn't.",
      p2: "We're building KhataFlow to give every dukandaar a simple digital workspace that replaces the chaos of paper khatas with organized, searchable, and secure digital records.",
      p3: "No complicated software. No expensive subscriptions. Just the tools a shopkeeper actually needs — customers, khata, payments, expenses, and clear reports.",
      startFree: "Start Free",
      viewFeatures: "View Features →",
      highlights: [
        { stat: "100%", label: "Free for Small Shops" },
        { stat: "Mobile", label: "First Design" },
        { stat: "Bilingual", label: "English & Urdu" },
        { stat: "Secure", label: "Data Protection" },
      ],
    },
    footer: {
      tagline1: "Simple. Secure. Powerful.",
      tagline2: "The digital workspace for small shopkeepers.",
      productTitle: "Product",
      supportTitle: "Support",
      builtWithTitle: "Built With",
      links: {
        features: "Features",
        about: "About",
        pricing: "Pricing",
        helpCenter: "Help Center",
        contactUs: "Contact Us",
        privacyPolicy: "Privacy Policy",
      },
      copyright: "© 2026 KhataFlow • Simple. Secure. Powerful.",
      techBar:
        "Built with Next.js • Supabase • PostgreSQL • Tailwind CSS • React Query • Vercel",
    },
  },
  ur: {
    nav: {
      home: "ہوم",
      features: "خصوصیات",
      about: "ہمارے بارے میں",
    },
    hero: {
      headlineLine1: "بکھرے کاروباری ریکارڈز کو",
      headlineLine2: "ایک آسان اور محفوظ",
      headlineLine3: "",
      headlineHighlight1: "ڈیجیٹل ورک اسپیس",
      headlineHighlight2: "میں بدلیں۔",
      subtitle:
        "گاہکوں کا کھاتہ، ادھار، ادائیگیاں، اخراجات اور رپورٹس — اب سب کچھ ایک ہی جگہ پر۔",
      getStarted: "شروع کریں",
      learnMore: "مزید جانیں",
      location: "پشاور، خیبر پختونخوا",
      badge1: "چھوٹی دکانوں کے لیے",
      badge2: "استعمال میں آسان",
      badge3: "مکمل محفوظ",
    },
    login: {
      title: "خوش آمدید",
      subtitle: "اپنے اکاؤنٹ میں لاگ ان کریں",
      shopOwner: "دکاندار",
      superAdmin: "سپر ایڈمن",
      emailLabel: "ای میل ایڈریس",
      emailPlaceholder: "you@shop.com",
      passwordLabel: "پاس ورڈ",
      passwordPlaceholder: "اپنا پاس ورڈ درج کریں",
      rememberMe: "مجھے یاد رکھیں",
      forgotPassword: "پاس ورڈ بھول گئے؟",
      loginButton: "لاگ ان کریں",
      noAccount: "اکاؤنٹ موجود نہیں ہے؟",
      contactAdmin: "ایڈمن سے رابطہ کریں",
      demoNotification: (role, email) =>
        `ڈیمو: بطور ${role === "shop-owner" ? "دکاندار" : "سپر ایڈمن"} لاگ ان ہوگئے (${email || "you@shop.com"})`,
      contactNotification:
        "نئی دکان کا اکاؤنٹ بنانے کے لیے براہ کرم اپنے سسٹم ایڈمن سے رابطہ کریں۔",
      forgotNotification: "پاس ورڈ ری سیٹ کی سہولت فیز 1B میں دستیاب ہوگی۔",
    },
    features: {
      badge: "اہم خصوصیات",
      title: "آپ کی دکان کی تمام ضروریات، ",
      titleHighlight: "ایک ہی جگہ",
      subtitle:
        "کھاتہ فلو آپ کے روزمرہ کے کاروباری معاملات کو یکجا کرتا ہے — ترقی کے خواہشمند دکانداروں کے لیے سادہ اور مفید ٹولز۔",
      cards: [
        {
          title: "کسٹمر مینجمنٹ",
          description:
            "اپنے تمام گاہکوں اور ان کے رابطوں کا باآسانی انتظام کریں اور بوقتِ ضرورت فوری تلاش کریں۔",
        },
        {
          title: "ڈیجیٹل کھاتہ (لیجر)",
          description:
            "ادھار اور وصولیوں کا شفاف ریکارڈ رکھیں۔ ہر گاہک کے لین دین کی مکمل ہسٹری ایک نظر میں دیکھیں۔",
        },
        {
          title: "ادائیگیاں اور ادھار",
          description:
            "ادھار کا اندراج اور وصول شدہ رقم باآسانی درج کریں۔ مجموعی واجب الادا رقم پر فوری نظر رکھیں۔",
        },
        {
          title: "اخراجات کی نگرانی",
          description:
            "دکان کے تمام اخراجات درج اور زمرہ بند کریں۔ جانیے کہ ہر ماہ آپ کی رقم کہاں خرچ ہو رہی ہے۔",
        },
        {
          title: "رپورٹس اور تجزیات",
          description:
            "جامع مالیاتی رپورٹس حاصل کریں — کل فروخت، اخراجات، بقایا جات اور کاروباری ترقی کے واضح اعدادوشمار۔",
        },
        {
          title: "شاپ ڈیش بورڈ",
          description:
            "سب کچھ دیکھنے کے لیے ایک مرکزی ڈیش بورڈ — گاہک، کھاتہ، ادائیگیاں، اخراجات اور روزانہ کا خلاصہ۔",
        },
      ],
    },
    about: {
      badge: "کھاتہ فلو کا تعارف",
      titleStart: "دکانداروں کے لیے، ",
      titleHighlight: "مقامی کاروبار کو سمجھنے والوں کی طرف سے",
      titleEnd: " تیار کردہ",
      p1: "کھاتہ فلو کا آغاز ایک مشاہدے سے ہوا — پشاور میں زیادہ تر چھوٹے دکاندار اب بھی کاغذی رجسٹروں اور یادداشت کے سہارے اپنا کاروبار چلاتے ہیں۔ یہ طریقہ تب تک چلتا ہے جب تک کوئی بڑا نقصان نہ ہو جائے۔",
      p2: "ہم ہر دکاندار کو ایک ایسا سادہ ڈیجیٹل ورک اسپیس فراہم کر رہے ہیں جو پرانے کاغذی کھاتوں کی الجھنوں کو محفوظ، منظم اور باآسانی تلاش کے قابل ڈیجیٹل ریکارڈ سے بدل دیتا ہے۔",
      p3: "کوئی پیچیدہ سافٹ ویئر نہیں، نہ کوئی مہنگی فیس۔ صرف وہی ضروری ٹولز جو ہر دکاندار کی ضرورت ہیں — کسٹمرز، کھاتہ، ادائیگیاں، اخراجات اور واضح رپورٹس۔",
      startFree: "مفت شروع کریں",
      viewFeatures: "خصوصیات دیکھیں ←",
      highlights: [
        { stat: "100%", label: "چھوٹی دکانوں کے لیے مفت" },
        { stat: "موبائل", label: "موبائل فرسٹ ڈیزائن" },
        { stat: "دو لسانی", label: "اردو اور انگریزی" },
        { stat: "محفوظ", label: "ڈیٹا کی مکمل حفاظت" },
      ],
    },
    footer: {
      tagline1: "سادہ۔ محفوظ۔ بااثر۔",
      tagline2: "چھوٹے دکانداروں کے لیے جدید ڈیجیٹل ورک اسپیس۔",
      productTitle: "پروڈکٹ",
      supportTitle: "معاونت",
      builtWithTitle: "ٹیکنالوجی اسٹیک",
      links: {
        features: "خصوصیات",
        about: "ہمارے بارے میں",
        pricing: "قیمتیں",
        helpCenter: "ہیلپ سینٹر",
        contactUs: "ہم سے رابطہ کریں",
        privacyPolicy: "رازداری کی پالیسی",
      },
      copyright: "© 2026 کھاتہ فلو • سادہ۔ محفوظ۔ بااثر۔",
      techBar:
        "Built with Next.js • Supabase • PostgreSQL • Tailwind CSS • React Query • Vercel",
    },
  },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
  isRtl: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLang;
      document.documentElement.dir = newLang === "ur" ? "rtl" : "ltr";
    }
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
    }
  }, [lang]);

  const value: LanguageContextType = {
    lang,
    setLang,
    t: translations[lang],
    isRtl: lang === "ur",
  };

  return (
    <LanguageContext.Provider value={value}>
      <div dir={lang === "ur" ? "rtl" : "ltr"} className={lang === "ur" ? "font-urdu" : ""}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
