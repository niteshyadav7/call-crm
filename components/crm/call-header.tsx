"use client";

import React from "react";
import { PanelLeft, Bell, Plus, ShieldCheck, Clock, Download } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface CallHeaderProps {
  onToggleSidebar: () => void;
  sectionTitle: string;
  onOpenLogModal: () => void;
}

export function CallHeader({
  onToggleSidebar,
  sectionTitle,
  onOpenLogModal,
}: CallHeaderProps) {
  const { isApproved, canCreateCRM } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between transition-all">
      {/* Left: Sidebar Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Toggle Sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Call CRM</span>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-[#1a1c1c] capitalize">{sectionTitle}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isApproved
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {isApproved ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5" /> Approved Agent
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5" /> Awaiting Super Admin Approval
            </>
          )}
        </div>

        {/* Log New Call Trigger Button */}
        <button
          onClick={onOpenLogModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#f50057] hover:bg-[#d8004c] text-white font-semibold text-xs shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log New Call</span>
        </button>

        {/* Install CRM App button */}
        <button
          onClick={() => alert("Call CRM Web App is ready for offline caching")}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-semibold text-xs shadow-xs transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
