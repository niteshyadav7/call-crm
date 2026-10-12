"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { DarkLoginCard } from "@/components/dark-login-card";
import { SuperAdminPanel } from "@/components/superadmin-panel";
import { Shield, Sparkles, LogOut, CheckCircle, Clock, Key, Users, Database } from "lucide-react";

export default function Home() {
  const { user, profile, loading, logout, isSuperAdmin, isApproved, claimSuperadminRole } = useAuth();

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#07090e]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-900/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">Call CRM</span>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  RBAC Multi-Role
                </span>
              </div>
            </div>
          </div>

          {/* User Status / Action in Header */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[160px]">
                  {user.displayName || user.email}
                </span>
                <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">
                  {profile?.role || "Agent"} {isApproved ? "• Approved" : "• Pending"}
                </span>
              </div>

              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10 flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs text-slate-400">Loading CRM Session & Permissions...</p>
          </div>
        ) : !user ? (
          /* NOT LOGGED IN: SHOW SCREENSHOT-STYLE DARK LOGIN CARD */
          <div className="flex flex-col lg:flex-row items-center justify-center gap-10 py-4">
            {/* Left Column: Feature Highlights */}
            <div className="w-full lg:w-5/12 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Multi-Role RBAC Governance
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Role-Based Call CRM with{" "}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  Super Admin Power
                </span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Complete security and governance. Super Admins hold exclusive authority to define custom roles,
                review registrations, and approve team members before CRM records can be created.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-[#0e131e]/80 border border-slate-800/80 rounded-2xl flex items-start gap-3">
                  <Key className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Create & Edit Roles</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Granular permission matrices</p>
                  </div>
                </div>

                <div className="p-3.5 bg-[#0e131e]/80 border border-slate-800/80 rounded-2xl flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">User Approval Gate</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">No rogue CRM writes</p>
                  </div>
                </div>

                <div className="p-3.5 bg-[#0e131e]/80 border border-slate-800/80 rounded-2xl flex items-start gap-3">
                  <Database className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Firestore Live Sync</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Real-time pipeline stream</p>
                  </div>
                </div>

                <div className="p-3.5 bg-[#0e131e]/80 border border-slate-800/80 rounded-2xl flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Google & Password</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Dual secure sign-in</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Dark Login Card Matching User's Image */}
            <div className="w-full lg:w-6/12 flex justify-center">
              <DarkLoginCard />
            </div>
          </div>
        ) : (
          /* LOGGED IN: SHOW SUPERADMIN & RBAC COMMAND CENTER */
          <div className="space-y-6">
            {/* If user is not approved, show the pending notice */}
            {!isApproved && !isSuperAdmin && (
              <div className="max-w-2xl mx-auto p-6 bg-[#111622] border border-amber-800/60 rounded-3xl shadow-2xl text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Registration Awaiting Super Admin Approval</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                    You have successfully signed in with <strong className="text-slate-200">{user.email}</strong> as an{" "}
                    <strong className="text-amber-400 uppercase">{profile?.role || "Agent"}</strong>.
                    To ensure CRM integrity, team members cannot create leads or access private pipelines until approved.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={claimSuperadminRole}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-purple-900/40 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Claim Super Admin (Dev Mode Setup)
                  </button>
                  <button
                    onClick={() => logout()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Complete RBAC & SuperAdmin Management Suite */}
            <SuperAdminPanel />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        <p>Call CRM • Firebase Auth & Firestore • Multi-Role RBAC Governance</p>
      </footer>
    </div>
  );
}
