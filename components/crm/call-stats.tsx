"use client";

import React from "react";
import { PhoneCall, CheckCircle2, Clock, TrendingUp } from "lucide-react";

interface CallStatsProps {
  totalCalls: number;
  connectedCount: number;
  pendingCallbacks: number;
  closedWonCount: number;
}

export function CallStats({
  totalCalls,
  connectedCount,
  pendingCallbacks,
  closedWonCount,
}: CallStatsProps) {
  const stats = [
    {
      label: "Total Calls Logged",
      value: totalCalls,
      icon: PhoneCall,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      change: "+18% this month",
    },
    {
      label: "Connected & Handled",
      value: connectedCount,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      change: "Avg duration: 04:12",
    },
    {
      label: "Pending Callbacks",
      value: pendingCallbacks,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      change: "Requires follow-up",
    },
    {
      label: "Closed Deals / Won",
      value: closedWonCount,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
      change: "High conversion",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{stat.label}</span>
              <div
                className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} border ${stat.border} flex items-center justify-center`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#1a1c1c] tracking-tight">
                {stat.value}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">{stat.change}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
