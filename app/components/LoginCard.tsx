"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import { useShopRegistry, ShopCategory } from "../context/ShopRegistryContext";

type UserRole = "shop-owner" | "super-admin";
type AuthMode = "login" | "register";
type RegSubMode = "new" | "claim";

const CATEGORIES: ShopCategory[] = [
  "General Store",
  "Grocery / Kiryana",
  "Pharmacy / Medical",
  "Wholesale & Distribution",
  "Electronics & Mobile",
  "Bakery & Sweets",
  "Other",
];

export default function LoginCard() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const { registerShopByOwner, login } = useShopRegistry();

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [selectedRole, setSelectedRole] = useState<UserRole>("shop-owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Registration Form State
  const [regSubMode, setRegSubMode] = useState<RegSubMode>("new");
  const [regForm, setRegForm] = useState({
    name: "",
    category: "General Store" as ShopCategory,
    city: "Peshawar",
    address: "",
    ownerName: "",
    ownerPhone: "",
    username: "",
    password: "",
    confirmPassword: "",
    claimShopId: "",
    claimCode: "",
  });
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const res = login(email, password, selectedRole);
    if (!res.success) {
      setNotification(res.error || "Invalid username/email or password.");
      return;
    }

    if (selectedRole === "super-admin") {
      setNotification("Super Admin authentication verified! Opening console...");
      setTimeout(() => {
        router.push("/superadmin");
      }, 400);
    } else {
      setNotification("Authentication verified! Loading your shop dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 400);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    setRegSuccess(null);

    const res = registerShopByOwner({
      mode: regSubMode,
      name: regForm.name,
      category: regForm.category,
      city: regForm.city,
      address: regForm.address,
      ownerName: regForm.ownerName,
      ownerPhone: regForm.ownerPhone,
      username: regForm.username,
      password: regForm.password,
      confirmPassword: regForm.confirmPassword,
      claimShopId: regForm.claimShopId,
      claimCode: regForm.claimCode,
    });

    if (res.success && res.shop) {
      setRegSuccess(`✓ ${res.message} Opening your dashboard...`);
      setNotification(null);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } else {
      setNotification(res.message);
    }
  };

  return (
    <div
      className="w-full max-w-[390px] lg:max-w-[365px] xl:max-w-[390px] 2xl:max-w-[400px] bg-white rounded-3xl p-6 sm:p-7 xl:p-8 relative"
      style={{
        boxShadow:
          "0 18px 45px rgba(15, 40, 62, 0.08), 0 2px 8px rgba(15, 40, 62, 0.04)",
        border: "1px solid #EFE5D8",
      }}
    >
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl sm:text-[22px] font-extrabold text-kf-navy tracking-tight mb-1">
          {authMode === "login"
            ? selectedRole === "super-admin"
              ? "Super Admin Console"
              : t.login.title
            : "Register Shop Account"}
        </h2>
        <p className="text-xs font-medium text-[#7B90A2]">
          {authMode === "login"
            ? selectedRole === "super-admin"
              ? "Sign in to platform governance & shop directory"
              : t.login.subtitle
            : "Register a new shop or claim an admin-created shop"}
        </p>
      </div>

      {/* Role Selection Tabs (Only in Login Mode) */}
      {authMode === "login" && (
        <div
          className="flex bg-[#F5ECE1] rounded-xl p-1 mb-4 border border-[#EADBCA] h-10 sm:h-11 items-center"
          role="radiogroup"
          aria-label="Login role selection"
        >
          <button
            type="button"
            role="radio"
            aria-checked={selectedRole === "shop-owner"}
            onClick={() => {
              setSelectedRole("shop-owner");
              setNotification(null);
            }}
            className={`flex-1 h-full flex items-center justify-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedRole === "shop-owner"
                ? "bg-kf-orange text-white shadow-xs"
                : "text-[#556B82] hover:text-kf-navy"
            }`}
          >
            {t.login.shopOwner}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={selectedRole === "super-admin"}
            onClick={() => {
              setSelectedRole("super-admin");
              setNotification(null);
            }}
            className={`flex-1 h-full flex items-center justify-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedRole === "super-admin"
                ? "bg-kf-orange text-white shadow-xs"
                : "text-[#556B82] hover:text-kf-navy"
            }`}
          >
            {t.login.superAdmin}
          </button>
        </div>
      )}

      {/* Inline Notification Banner */}
      {notification && (
        <div
          role="status"
          className="mb-4 p-2.5 bg-kf-orange-50 border border-kf-orange/20 rounded-xl text-xs text-kf-navy flex items-start gap-2 animate-in fade-in duration-200"
        >
          <svg
            className="w-4 h-4 text-kf-orange flex-shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="leading-snug">{notification}</span>
        </div>
      )}

      {/* Registration Success Banner */}
      {regSuccess && (
        <div
          role="status"
          className="mb-4 p-2.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-900 font-bold flex items-start gap-2 animate-in fade-in duration-200"
        >
          <span>✓</span>
          <span className="leading-snug">{regSuccess}</span>
        </div>
      )}

      {/* VIEW 1: NORMAL LOGIN FORM (Strictly Username/Email + Password only) */}
      {authMode === "login" ? (
        <form onSubmit={handleLoginSubmit} className="space-y-3.5" noValidate>
          {/* Username or Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-bold text-kf-navy mb-1.5"
            >
              {selectedRole === "super-admin"
                ? "Admin Username / Email"
                : "Username or Email"}
            </label>
            <div className="relative flex items-center">
              <div
                className={`absolute ${lang === "ur" ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 pointer-events-none text-[#8FA2B4] flex items-center`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <input
                id="login-email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  selectedRole === "super-admin"
                    ? "admin@khataflow.pk"
                    : "e.g. khyber@khataflow.pk or phone"
                }
                autoComplete="username"
                dir="ltr"
                style={{
                  paddingLeft: lang === "ur" ? "14px" : "42px",
                  paddingRight: lang === "ur" ? "42px" : "14px",
                  textAlign: lang === "ur" ? "right" : "left",
                }}
                className="w-full h-10 sm:h-11 text-xs sm:text-sm bg-[#FAF6F0]/70 border border-[#E5DACD] rounded-xl text-kf-navy placeholder:text-[#9FB1C1] focus:outline-none focus:bg-white focus:border-kf-orange focus:ring-2 focus:ring-kf-orange/20 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-bold text-kf-navy mb-1.5"
            >
              {t.login.passwordLabel}
            </label>
            <div className="relative flex items-center">
              <div
                className={`absolute ${lang === "ur" ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 pointer-events-none text-[#8FA2B4] flex items-center`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.login.passwordPlaceholder}
                autoComplete="current-password"
                style={{
                  paddingLeft: lang === "ur" ? "42px" : "42px",
                  paddingRight: lang === "ur" ? "42px" : "42px",
                }}
                className="w-full h-10 sm:h-11 text-xs sm:text-sm bg-[#FAF6F0]/70 border border-[#E5DACD] rounded-xl text-kf-navy placeholder:text-[#9FB1C1] focus:outline-none focus:bg-white focus:border-kf-orange focus:ring-2 focus:ring-kf-orange/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute ${lang === "ur" ? "left-3.5" : "right-3.5"} top-1/2 -translate-y-1/2 text-[#8FA2B4] hover:text-kf-navy cursor-pointer transition-colors p-1`}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" x2="23" y1="1" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-4 h-4 border border-[#D5C6B4] rounded bg-white peer-checked:bg-kf-orange peer-checked:border-kf-orange transition-colors flex items-center justify-center flex-shrink-0">
                {rememberMe && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-[#556B82] group-hover:text-kf-navy transition-colors whitespace-nowrap">
                {t.login.rememberMe}
              </span>
            </label>
            <button
              type="button"
              className="text-xs text-[#556B82] hover:text-kf-orange transition-colors cursor-pointer whitespace-nowrap"
              onClick={() => {
                setNotification("Password reset email service is not configured in local environment. Contact admin.");
                setTimeout(() => setNotification(null), 4000);
              }}
            >
              {t.login.forgotPassword}
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full h-10 sm:h-11 bg-gradient-to-r from-[#FF6A00] to-[#FF7708] hover:from-[#E85E00] hover:to-[#FF6A00] text-white font-bold text-sm rounded-xl shadow-[0_4px_16px_rgba(255,106,0,0.32)] flex items-center justify-center gap-2 cursor-pointer transition-all group mt-2"
          >
            <span>
              {selectedRole === "super-admin" ? "Open Super Admin Console" : t.login.loginButton}
            </span>
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
          </button>
        </form>
      ) : (
        /* VIEW 2: SHOP OWNER REGISTRATION (Separated: New Shop vs Claim Existing) */
        <form onSubmit={handleRegisterSubmit} className="space-y-2.5" noValidate>
          {/* Submode Switcher: New Shop vs Claim Existing Shop */}
          <div className="flex bg-[#F5ECE1] rounded-xl p-1 mb-2 border border-[#EADBCA] h-9 items-center">
            <button
              type="button"
              onClick={() => {
                setRegSubMode("new");
                setNotification(null);
              }}
              className={`flex-1 h-full flex items-center justify-center text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                regSubMode === "new"
                  ? "bg-kf-orange text-white shadow-xs"
                  : "text-[#556B82] hover:text-kf-navy"
              }`}
            >
              New Shop
            </button>
            <button
              type="button"
              onClick={() => {
                setRegSubMode("claim");
                setNotification(null);
              }}
              className={`flex-1 h-full flex items-center justify-center text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                regSubMode === "claim"
                  ? "bg-kf-orange text-white shadow-xs"
                  : "text-[#556B82] hover:text-kf-navy"
              }`}
            >
              Claim Existing Shop
            </button>
          </div>

          <div className="max-h-[340px] sm:max-h-[360px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
            {regSubMode === "claim" ? (
              /* CLAIM FIELDS */
              <>
                <div className="p-2.5 bg-[#FFF7EE] border border-[#FFD9B3] rounded-xl text-[11px] text-kf-navy space-y-0.5">
                  <div className="font-bold text-kf-orange">Claim Verification Notice:</div>
                  <div className="text-[#556B82] text-[10.5px]">
                    Enter the exact Shop ID and secret Claim Code provided by your Super Admin. Public Shop ID alone cannot claim a shop.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-kf-navy mb-0.5">
                      Shop ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.claimShopId}
                      onChange={(e) => setRegForm({ ...regForm, claimShopId: e.target.value })}
                      placeholder="SHOP-PK-004"
                      className="w-full h-9 px-2.5 bg-[#FAF6F0]/70 border border-[#E5DACD] rounded-xl text-xs font-mono font-bold text-kf-navy uppercase placeholder:text-[#9FB1C1] focus:bg-white focus:border-kf-orange outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-kf-navy mb-0.5">
                      Claim Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.claimCode}
                      onChange={(e) => setRegForm({ ...regForm, claimCode: e.target.value })}
                      placeholder="CLAIM-XXXXXX"
                      className="w-full h-9 px-2.5 bg-[#FAF6F0]/70 border border-[#E5DACD] rounded-xl text-xs font-mono font-bold text-kf-navy uppercase placeholder:text-[#9FB1C1] focus:bg-white focus:border-kf-orange outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* NEW SHOP FIELDS */
              <>
                <div>
                  <label className="block text-[11px] font-bold text-kf-navy mb-0.5">
                    Shop Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder="e.g. Madina Super Store"
                    className="w-full h-9 px-2.5 bg-[#FAF6F0]/70 border border-[#E5DACD] rounded-xl text-xs font-bold text-kf-navy placeholder:text-[#9FB1C1] focus:bg-white focus:border-kf-orange outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-kf-navy mb-0.5">
                      Category
                    </label>
                    <select
                      value={regForm.category}
                      onChange={(e) =>
                        setRegForm({ ...regForm, category: e.target.value as ShopCategory })
                      }
                      className="w-full h-9 px-2 bg-[#FAF6F0]/70 border border-[#E5DACD] rounded-xl text-xs font-bold text-kf-navy outline-none focus:border-kf-orange focus:bg-white cursor-pointer"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-kf-navy mb-0.5">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.city}
                      onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                      placeholder="Peshawar"
                      className="w-full h-9 px-2.5 bg-[#FAF6F0]/70 border border-[#E5DACD] rounded-xl text-xs font-medium text-kf-navy placeholder:text-[#9FB1C1] focus:bg-white focus:border-kf-orange outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-kf-navy mb-0.5">
                    Shop Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={regForm.address}
                    onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                    placeholder="Shop #4, Main Bazar"
                    className="w-full h-9 px-2.5 bg-[#FAF6F0]/70 border border-[#E5DACD] rounded-xl text-xs font-medium text-kf-navy placeholder:text-[#9FB1C1] focus:bg-white focus:border-kf-orange outline-none transition-all"
                  />
                </div>
              </>
            )}

            {/* COMMON OWNER & CREDENTIAL FIELDS */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F0E4D4]">
              <div>
                <label className="block text-[11px] font-bold text-kf-navy mb-0.5">
                  Owner Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={regForm.ownerName}
                  onChange={(e) => setRegForm({ ...regForm, ownerName: e.target.value })}
                  placeholder="Farhan Ali"
                  className="w-full h-9 px-2.5 bg-[#FAF6F0]/70 border border-[#E5DACD] rounded-xl text-xs font-medium text-kf-navy placeholder:text-[#9FB1C1] focus:bg-white focus:border-kf-orange outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-kf-navy mb-0.5">
                  Owner Phone *
                </label>
                <input
                  type="text"
                  required
                  value={regForm.ownerPhone}
                  onChange={(e) => setRegForm({ ...regForm, ownerPhone: e.target.value })}
                  placeholder="0300-1234567"
                  className="w-full h-9 px-2.5 bg-[#FAF6F0]/70 border border-[#E5DACD] rounded-xl text-xs font-medium text-kf-navy placeholder:text-[#9FB1C1] focus:bg-white focus:border-kf-orange outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-kf-navy mb-0.5">
                Username or Login Email *
              </label>
              <input
                type="text"
                required
                value={regForm.username}
                onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                placeholder="farhan@khataflow.pk or farhan_khan"
                autoComplete="username"
                className="w-full h-9 px-2.5 bg-[#FAF6F0]/70 border border-[#E5DACD] rounded-xl text-xs font-medium text-kf-navy placeholder:text-[#9FB1C1] focus:bg-white focus:border-kf-orange outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-kf-navy mb-0.5">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  placeholder="Min. 6 chars"
                  autoComplete="new-password"
                  className="w-full h-9 px-2.5 bg-[#FAF6F0]/70 border border-[#E5DACD] rounded-xl text-xs font-medium text-kf-navy placeholder:text-[#9FB1C1] focus:bg-white focus:border-kf-orange outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-kf-navy mb-0.5">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={regForm.confirmPassword}
                  onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className="w-full h-9 px-2.5 bg-[#FAF6F0]/70 border border-[#E5DACD] rounded-xl text-xs font-medium text-kf-navy placeholder:text-[#9FB1C1] focus:bg-white focus:border-kf-orange outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-10 sm:h-11 bg-gradient-to-r from-[#FF6A00] to-[#FF7708] hover:from-[#E85E00] hover:to-[#FF6A00] text-white font-bold text-xs sm:text-sm rounded-xl shadow-[0_4px_16px_rgba(255,106,0,0.32)] flex items-center justify-center gap-2 cursor-pointer transition-all mt-1"
          >
            <span>
              {regSubMode === "claim"
                ? "Verify Claim & Activate Account"
                : "Create Shop & Account"}
            </span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </form>
      )}

      {/* Account Help / Toggle Mode */}
      <div className="mt-4 pt-2 border-t border-[#F0E4D4] text-center text-xs text-[#7B90A2]">
        {authMode === "login" ? (
          <p>
            New Shop Owner?{" "}
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setNotification(null);
                setRegSuccess(null);
              }}
              className="text-[#FF6A00] hover:underline font-bold cursor-pointer transition-colors"
            >
              Register Shop Account
            </button>
          </p>
        ) : (
          <p>
            Already have a registered shop?{" "}
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setNotification(null);
                setRegSuccess(null);
              }}
              className="text-[#0284C7] hover:underline font-bold cursor-pointer transition-colors"
            >
              Return to Login
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
