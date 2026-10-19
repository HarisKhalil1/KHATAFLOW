"use client";

import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    label: string;
    positive?: boolean;
    neutral?: boolean;
  };
  accentColor?: "orange" | "green" | "blue" | "navy" | "red";
  onClick?: () => void;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = "orange",
  onClick,
}: StatCardProps) {
  const colorMap = {
    orange: {
      bg: "bg-[#FFF4EB]",
      text: "text-kf-orange",
      border: "hover:border-[#FFB280]/60",
    },
    green: {
      bg: "bg-[#ECFDF5]",
      text: "text-green-600",
      border: "hover:border-green-300",
    },
    blue: {
      bg: "bg-[#EFF6FF]",
      text: "text-blue-600",
      border: "hover:border-blue-300",
    },
    navy: {
      bg: "bg-[#F0F5FA]",
      text: "text-kf-navy",
      border: "hover:border-[#B0C5D8]",
    },
    red: {
      bg: "bg-[#FEF2F2]",
      text: "text-red-600",
      border: "hover:border-red-300",
    },
  };

  const scheme = colorMap[accentColor];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-[#EADBCA] shadow-xs transition-all ${
        scheme.border
      } ${onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-bold text-[#556B82] uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-10 h-10 rounded-xl ${scheme.bg} ${scheme.text} flex items-center justify-center font-bold`}>
          {icon}
        </div>
      </div>

      <div className="text-2xl sm:text-[26px] font-extrabold text-kf-navy tracking-tight tabular-nums mb-1">
        {value}
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        {subtitle && <span className="text-[#6F8599] text-[11px] font-medium">{subtitle}</span>}
        {trend && (
          <span
            className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full ${
              trend.neutral
                ? "bg-gray-100 text-gray-600"
                : trend.positive
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-kf-orange"
            }`}
          >
            {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}
