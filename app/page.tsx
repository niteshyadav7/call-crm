"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { SimpleLoginCard } from "@/components/simple-login-card";
import { RbacPortal } from "@/components/rbac/rbac-portal";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
        <div className="w-9 h-9 border-3 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading session...</p>
      </div>
    );
  }

  // Not logged in: Show the clean, mobile-first login card on a white/light canvas
  if (!user) {
    return (
      <main className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="w-full flex items-center justify-center">
          <SimpleLoginCard />
        </div>
      </main>
    );
  }

  // Logged in: Render the sidebar-style RBAC system with Creator dashboard colors
  return <RbacPortal />;
}
