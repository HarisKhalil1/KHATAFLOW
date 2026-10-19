import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KhataFlow — Khata • Sales • Growth",
  description:
    "Turn scattered business records into one simple digital workspace. KhataFlow helps shopkeepers in Peshawar manage khata, udhaar, payments, expenses, and reports — sab kuch ek jagah.",
  keywords: [
    "KhataFlow",
    "khata",
    "udhaar",
    "shopkeeper",
    "Peshawar",
    "digital ledger",
    "business management",
    "sales",
    "expenses",
    "payments",
  ],
  authors: [{ name: "KhataFlow" }],
  openGraph: {
    title: "KhataFlow — Khata • Sales • Growth",
    description:
      "Turn scattered business records into one simple digital workspace.",
    type: "website",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
