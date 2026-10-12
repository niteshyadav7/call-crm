"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { SimpleLoginCard } from "@/components/simple-login-card";
import { SuperAdminPanel } from "@/components/superadmin-panel";
import { Shield, LogOut } from "lucide-react";

export default function Home() {
  const { user, profile, loading, logout, isApproved } = useAuth();

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col relative">
      {/* If logged in, show clean top bar */}
      {user && (
        <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1e3a8a] text-white flex items-center justify-center font-bold shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base text-white tracking-tight">Call CRM</span>
                <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {profile?.role || "Agent"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[160px]">
                  {user.displayName || user.email}
                </span>
                <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">
                  {isApproved ? "Approved" : "Pending Approval"}
                </span>
              </div>

              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 text-xs font-medium transition-all"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-400">Loading session...</p>
          </div>
        ) : !user ? (
          /* Simple, clean login card centered on dark background exactly like the user's reference image */
          <div className="w-full flex items-center justify-center">
            <SimpleLoginCard />
          </div>
        ) : (
          /* Logged In: SuperAdmin & CRM management */
          <div className="w-full max-w-6xl py-6">
            <SuperAdminPanel />
          </div>
        )}
      </main>
    </div>
  );
}
