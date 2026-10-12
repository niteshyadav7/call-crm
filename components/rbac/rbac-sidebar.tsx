"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Users,
  Shield,
  UserCheck,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Flame,
  Clock,
} from "lucide-react";

export type RbacTab = "approvals" | "roles" | "profile";

interface RbacSidebarProps {
  currentTab: RbacTab;
  onSelectTab: (tab: RbacTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  pendingCount?: number;
}

export function RbacSidebar({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  pendingCount = 0,
}: RbacSidebarProps) {
  const { user, profile, isSuperAdmin, logout } = useAuth();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const navItems = [
    {
      id: "approvals" as RbacTab,
      label: "User Approvals",
      icon: Users,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      id: "roles" as RbacTab,
      label: "Roles & Permissions",
      icon: Shield,
    },
    {
      id: "profile" as RbacTab,
      label: "My Account & Status",
      icon: UserCheck,
    },
  ];

  const handleNavClick = (tab: RbacTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#2d3132] text-slate-300 transition-all duration-300 ease-in-out flex flex-col justify-between border-r border-white/10 ${
          collapsed ? "w-20" : "w-64"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-[#febd1c] text-black font-black flex items-center justify-center shrink-0 shadow-md">
                <Flame className="w-5 h-5 fill-black text-black" />
              </div>
              {!collapsed && (
                <div className="truncate">
                  <span className="font-bold text-white text-base tracking-tight block">
                    Call CRM
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
                    RBAC Portal
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* User Mini-Profile Badge - matching Screenshot 2 */}
          <div className="p-3 border-b border-white/10">
            <div
              className={`flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-[#febd1c] text-black font-bold flex items-center justify-center shrink-0 text-sm overflow-hidden border border-amber-300">
                {user?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (user?.displayName?.[0] || user?.email?.[0] || "U").toUpperCase()
                )}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.displayName || user?.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate uppercase">
                    {profile?.role || "Agent"} • {user?.uid.substring(0, 7)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Items with golden yellow pill on active */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs transition-all ${
                    isActive
                      ? "bg-[#febd1c] text-black font-bold shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white font-medium"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-black" : "text-slate-400"
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!collapsed && (
                    <div className="flex items-center gap-1.5">
                      {item.badge !== null && item.badge !== undefined && (
                        <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-bold text-[10px]">
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-black" />}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Role Badge & Sign Out Button */}
        <div className="p-3 border-t border-white/10 space-y-2">
          {!collapsed && (
            <div className="px-3 py-1.5 bg-white/5 rounded-lg text-[11px] text-slate-400 flex items-center justify-between">
              <span>Status:</span>
              <span
                className={`font-semibold uppercase ${
                  profile?.status === "approved" || isSuperAdmin
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {profile?.status || "Pending"}
              </span>
            </div>
          )}

          <button
            onClick={() => setShowSignOutConfirm(true)}
            title={collapsed ? "Sign Out" : undefined}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-[#1a1c1c] text-base">Sign Out Confirmation</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to sign out of your Call CRM session?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSignOutConfirm(false);
                  logout();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
