"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ur";

export interface DashboardTranslations {
  menu: {
    dashboard: string;
    customersAndKhata: string;
    allRecords: string;
    payments: string;
    expenses: string;
    reports: string;
    settings: string;
  };
  actions: {
    newEntry: string;
    recordPayment: string;
    giveCredit: string;
    adjustItem: string;
    addCustomer: string;
    logExpense: string;
    exportCsv: string;
    print: string;
    cancel: string;
    save: string;
    apply: string;
    viewLedger: string;
    receive: string;
  };
  kpis: {
    outstandingUdhaar: string;
    cashIn: string;
    monthlySales: string;
    netCashflow: string;
    activeDebtors: string;
    clearedAccounts: string;
    shopExpenses: string;
    itemAdjustments: string;
  };
  common: {
    customer: string;
    amount: string;
    date: string;
    status: string;
    description: string;
    reason: string;
    paymentMethod: string;
    receiptNo: string;
    all: string;
    withUdhaar: string;
    cleared: string;
    searchPlaceholder: string;
    recentTransactions: string;
    topDebtors: string;
    viewAllRecords: string;
    viewAllKhata: string;
    pkr: string;
    peshawar: string;
  };
}

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
  dashboard: DashboardTranslations;
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
            "Record cash received, partial payments, and new credit with timestamps and receipt numbers.",
        },
        {
          title: "Expense Tracker",
          description:
            "Log your daily shop expenses — rent, electricity, transport, supplies — to know your true profit.",
        },
        {
          title: "Business Reports",
          description:
            "Get clear daily, weekly, and monthly summaries of your sales, collections, and outstanding balance.",
        },
        {
          title: "Mobile First & Bilingual",
          description:
            "Works smoothly on any smartphone. Fully accessible in both English and Urdu with simple language.",
        },
      ],
    },
    about: {
      badge: "About KhataFlow",
      titleStart: "Built for local shops in ",
      titleHighlight: "Peshawar",
      titleEnd: ", ready for every small business",
      p1: "KhataFlow was born from a simple observation: thousands of small shops in Pakistan still rely on paper registers and loose notebooks to manage customer credit (udhaar), daily payments, and shop expenses. These traditional methods often lead to lost records, calculation errors, delayed payments, and unnecessary misunderstandings with loyal customers.",
      p2: "We built KhataFlow to change that. Designed from the ground up for shop owners who may not be tech-savvy, KhataFlow provides an intuitive, reliable digital khata system that works on any smartphone, tablet, or computer. With bilingual support in Urdu and English, clear visual indicators, and simple workflows, anyone can start managing their shop like a pro within minutes.",
      p3: "Based in Peshawar, Khyber Pakhtunkhwa, our mission is to empower local merchants with modern digital tools that save time, reduce stress, and help their businesses thrive.",
      startFree: "Start Free",
      viewFeatures: "View Features",
      highlights: [
        { stat: "100%", label: "Free for demo" },
        { stat: "2", label: "Languages (EN / UR)" },
        { stat: "0", label: "Math Errors" },
      ],
    },
    footer: {
      tagline1: "Simple, reliable shop-management SaaS",
      tagline2: "Built for local merchants in Peshawar and across Pakistan.",
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
    dashboard: {
      menu: {
        dashboard: "Dashboard",
        customersAndKhata: "Customers & Khata",
        allRecords: "All Records",
        payments: "Payments",
        expenses: "Expenses",
        reports: "Reports",
        settings: "Settings",
      },
      actions: {
        newEntry: "New Entry",
        recordPayment: "Record Payment",
        giveCredit: "Give Credit",
        adjustItem: "Adjust Item",
        addCustomer: "Add Customer",
        logExpense: "Log Expense",
        exportCsv: "Export CSV",
        print: "Print",
        cancel: "Cancel",
        save: "Save",
        apply: "Apply",
        viewLedger: "Khata Ledger",
        receive: "Receive",
      },
      kpis: {
        outstandingUdhaar: "Total Outstanding Udhaar",
        cashIn: "Cash Received",
        monthlySales: "Monthly Sales Volume",
        netCashflow: "Net Cashflow",
        activeDebtors: "Active Debtors",
        clearedAccounts: "Cleared Accounts",
        shopExpenses: "Shop Expenses",
        itemAdjustments: "Item Adjustments",
      },
      common: {
        customer: "Customer",
        amount: "Amount",
        date: "Date",
        status: "Status",
        description: "Description",
        reason: "Reason",
        paymentMethod: "Payment Method",
        receiptNo: "Receipt No",
        all: "All",
        withUdhaar: "With Udhaar",
        cleared: "Cleared",
        searchPlaceholder: "Search by customer name, phone, or location...",
        recentTransactions: "Recent Transactions",
        topDebtors: "Top Udhaar Balances",
        viewAllRecords: "View All Records",
        viewAllKhata: "View All Khata",
        pkr: "Rs.",
        peshawar: "Peshawar",
      },
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
        `ڈیمو: لاگ ان بطور ${role === "shop-owner" ? "دکاندار" : "سپر ایڈمن"} (${email || "you@shop.com"})`,
      contactNotification:
        "نیا دکان اکاؤنٹ بنانے کے لیے براہ کرم اپنے سسٹم ایڈمن سے رابطہ کریں۔",
      forgotNotification: "پاس ورڈ دوبارہ ترتیب دینے کی سہولت فیز 1B میں دستیاب ہوگی۔",
    },
    features: {
      badge: "اہم خصوصیات",
      title: "آپ کی دکان کی تمام ضروریات، ",
      titleHighlight: "ایک ہی جگہ",
      subtitle:
        "کھاتہ فلو آپ کے روزمرہ کے تمام کاروباری کاموں کو یکجا کرتا ہے — سادہ اور آسان ٹولز جو دکانداروں کی ترقی کے لیے بنائے گئے ہیں۔",
      cards: [
        {
          title: "گاہکوں کا انتظام",
          description:
            "تمام گاہکوں اور ان کے رابطے کی تفصیلات سنبھالیں، اور ضرورت پڑنے پر فوری تلاش کریں۔",
        },
        {
          title: "ڈیجیٹل کھاتہ (لیجر)",
          description:
            "ادھار اور ادائیگیوں کا مکمل حساب رکھیں۔ ہر گاہک کا لین دین ایک نظر میں دیکھیں۔",
        },
        {
          title: "ادائیگیاں اور ادھار",
          description:
            "نقد وصولی، جزوی ادائیگیاں، اور نیا ادھار تاریخ، وقت اور رسید نمبر کے ساتھ درج کریں۔",
        },
        {
          title: "اخراجات کا حساب",
          description:
            "دکان کے روزانہ اخراجات — کرایہ، بجلی، ٹرانسپورٹ، سامان — درج کریں تاکہ اصلی منافع معلوم ہو۔",
        },
        {
          title: "کاروباری رپورٹس",
          description:
            "اپنی روزانہ، ہفتہ وار اور ماہانہ فروخت، وصولیوں اور بقایا جات کے واضح خلاصے حاصل کریں۔",
        },
        {
          title: "موبائل فرینڈلی اور دو لسانی",
          description:
            "کسی بھی اسمارٹ فون پر روانی سے کام کرتا ہے۔ اردو اور انگریزی دونوں زبانوں میں مکمل طور پر دستیاب۔",
        },
      ],
    },
    about: {
      badge: "کھاتہ فلو کے بارے میں",
      titleStart: "پشاور کی مقامی دکانوں کے لیے ",
      titleHighlight: "خصوصی طور پر تیار کردہ",
      titleEnd: "، ہر چھوٹے کاروبار کے لیے موزوں",
      p1: "کھاتہ فلو ایک سادہ مشاہدے سے شروع ہوا: پاکستان میں ہزاروں چھوٹی دکانیں اب بھی گاہکوں کے ادھار، روزانہ ادائیگیوں اور دکان کے اخراجات کے لیے کاغذی کھاتوں اور ڈائریوں پر انحصار کرتی ہیں۔ ان روایتی طریقوں سے اکثر ریکارڈ ضائع ہو جاتے ہیں، حساب میں غلطیاں ہوتی ہیں اور گاہکوں کے ساتھ غلط فہمیاں پیدا ہوتی ہیں۔",
      p2: "ہم نے اسے بدلنے کے لیے کھاتہ فلو بنایا۔ خاص طور پر ان دکانداروں کے لیے تیار کیا گیا جو زیادہ ٹیکنالوجی سے واقف نہیں ہیں۔ کھاتہ فلو ایک ایسا سادہ اور قابل اعتماد ڈیجیٹل کھاتہ سسٹم فراہم کرتا ہے جو کسی بھی موبائل، ٹیبلٹ یا کمپیوٹر پر چلتا ہے۔ اردو اور انگریزی دونوں زبانوں میں معاونت کے ساتھ کوئی بھی چند منٹوں میں اس کا ماہر بن سکتا ہے۔",
      p3: "پشاور، خیبر پختونخوا سے شروع ہونے والا ہمارا مشن مقامی تاجروں کو جدید ڈیجیٹل ٹولز فراہم کرنا ہے جو وقت بچائیں، الجھنیں ختم کریں اور کاروبار کو ترقی دیں۔",
      startFree: "مفت شروع کریں",
      viewFeatures: "خصوصیات دیکھیں",
      highlights: [
        { stat: "100%", label: "ڈیمو کے لیے مفت" },
        { stat: "2", label: "زبانیں (انگریزی / اردو)" },
        { stat: "0", label: "حساب میں غلطی" },
      ],
    },
    footer: {
      tagline1: "سادہ، قابل اعتماد دکان مینجمنٹ ساس",
      tagline2: "پشاور اور پورے پاکستان کے مقامی تاجروں کے لیے تیار کردہ۔",
      productTitle: "پروڈکٹ",
      supportTitle: "مدد اور معاونت",
      builtWithTitle: "ٹیکنالوجی",
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
    dashboard: {
      menu: {
        dashboard: "ڈیش بورڈ",
        customersAndKhata: "گاہک اور کھاتہ",
        allRecords: "تمام ریکارڈز",
        payments: "وصولیاں",
        expenses: "اخراجات",
        reports: "رپورٹس",
        settings: "سیٹنگز",
      },
      actions: {
        newEntry: "نیا اندراج",
        recordPayment: "رقم وصول کریں",
        giveCredit: "ادھار دیں",
        adjustItem: "آئٹم درستگی",
        addCustomer: "نیا گاہک",
        logExpense: "خرچہ درج کریں",
        exportCsv: "ایکسپورٹ CSV",
        print: "پرنٹ",
        cancel: "منسوخ",
        save: "محفوظ کریں",
        apply: "لاگو کریں",
        viewLedger: "کھاتہ لیجر",
        receive: "وصول کریں",
      },
      kpis: {
        outstandingUdhaar: "کل بقایا ادھار",
        cashIn: "وصول شدہ نقد رقم",
        monthlySales: "ماہانہ فروخت",
        netCashflow: "خالص کیش فلو",
        activeDebtors: "ادھار والے گاہک",
        clearedAccounts: "بے باق اکاؤنٹس",
        shopExpenses: "دکان کے اخراجات",
        itemAdjustments: "آئٹم درستگیاں",
      },
      common: {
        customer: "گاہک",
        amount: "رقم",
        date: "تاریخ",
        status: "حالت",
        description: "تفصیل",
        reason: "وجہ",
        paymentMethod: "طریقہ ادائیگی",
        receiptNo: "رسید نمبر",
        all: "تمام",
        withUdhaar: "بقایا ادھار",
        cleared: "بے باق",
        searchPlaceholder: "گاہک کا نام، فون یا پتہ تلاش کریں...",
        recentTransactions: "حالیہ لین دین",
        topDebtors: "زیادہ ادھار والے گاہک",
        viewAllRecords: "تمام ریکارڈز دیکھیں",
        viewAllKhata: "تمام کھاتہ دیکھیں",
        pkr: "روپے",
        peshawar: "پشاور",
      },
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

  // Hydrate language preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("KHATAFLOW_LANG") as Language | null;
      if (saved === "en" || saved === "ur") {
        setLangState(saved);
        document.documentElement.lang = saved;
        document.documentElement.dir = saved === "ur" ? "rtl" : "ltr";
      }
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("KHATAFLOW_LANG", newLang);
      } catch {
        // Ignore storage errors in restricted iframe
      }
      document.documentElement.lang = newLang;
      document.documentElement.dir = newLang === "ur" ? "rtl" : "ltr";
    }
  };

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
