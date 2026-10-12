"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  UserProfile,
  UserRole,
  UserStatus,
  RoleDefinition,
  Permission,
  SYSTEM_ROLES,
} from "@/types/rbac";
import { RbacSidebar, RbacTab } from "./rbac-sidebar";
import {
  PanelLeft,
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Plus,
  Clock,
  Search,
  Bell,
  Download,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Key,
} from "lucide-react";

const AVAILABLE_PERMISSIONS: { id: Permission; label: string; desc: string }[] = [
  { id: "users:approve", label: "Approve Users", desc: "Approve or reject pending member requests" },
  { id: "users:manage_roles", label: "Assign Roles", desc: "Assign and modify user roles" },
  { id: "roles:manage", label: "Create Roles", desc: "Define custom roles and permissions" },
  { id: "crm:create", label: "Log Calls / Leads", desc: "Create new call records and leads" },
  { id: "crm:edit", label: "Edit Records", desc: "Edit existing customer/call records" },
  { id: "crm:delete", label: "Delete Records", desc: "Delete CRM records" },
  { id: "crm:view_all", label: "View All Data", desc: "View all team call pipelines" },
];

export function RbacPortal() {
  const { user, profile, isSuperAdmin, isApproved, claimSuperadminRole } = useAuth();

  const [currentTab, setCurrentTab] = useState<RbacTab>("approvals");
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [customRoles, setCustomRoles] = useState<RoleDefinition[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Role Creation Modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(["crm:create"]);

  // Real-time listener for users
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            uid: docSnap.id,
            email: d.email || null,
            displayName: d.displayName || null,
            photoURL: d.photoURL || null,
            role: (d.role as UserRole) || "agent",
            status: (d.status as UserStatus) || "pending",
            approvedBy: d.approvedBy || null,
            approvedAt: d.approvedAt || null,
          });
        });
        setUsersList(list);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Users sync error:", err);
    }
  }, []);

  // Real-time listener for custom roles
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, "roles"), (snapshot) => {
        const list: RoleDefinition[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            name: d.name || docSnap.id,
            description: d.description || "",
            permissions: (d.permissions as Permission[]) || [],
            isSystem: false,
            badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
          });
        });
        setCustomRoles(list);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Custom roles sync:", err);
    }
  }, []);

  // Super Admin actions
  const handleApprove = async (targetUid: string) => {
    try {
      await updateDoc(doc(db, "users", targetUid), {
        status: "approved",
        approvedBy: user?.email || "superadmin",
        approvedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (targetUid: string) => {
    try {
      await updateDoc(doc(db, "users", targetUid), {
        status: "rejected",
        approvedBy: user?.email || "superadmin",
        approvedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeRole = async (targetUid: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, "users", targetUid), {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;
    const roleId = newRoleName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    try {
      await setDoc(doc(db, "roles", roleId), {
        name: newRoleName,
        description: newRoleDesc,
        permissions: selectedPermissions,
        createdAt: serverTimestamp(),
      });
      setNewRoleName("");
      setNewRoleDesc("");
      setSelectedPermissions(["crm:create"]);
      setShowRoleModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const pendingUsers = usersList.filter((u) => u.status === "pending");
  const filteredUsers = usersList.filter(
    (u) =>
      (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.displayName || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const allRoles = [...SYSTEM_ROLES, ...customRoles];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col text-slate-800">
      {/* Sidebar with dark charcoal #2d3132 and golden yellow active pill */}
      <RbacSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        pendingCount={pendingUsers.length}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        {/* Sticky Glassmorphic Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsMobileOpen(true);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">RBAC System</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-[#1a1c1c] capitalize">
                {currentTab === "approvals"
                  ? "User Approvals"
                  : currentTab === "roles"
                  ? "Roles & Permissions"
                  : "Profile & Status"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Super Admin / Role Badge */}
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isSuperAdmin
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : isApproved
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {isSuperAdmin ? (
                <>
                  <Shield className="w-3.5 h-3.5" /> Super Admin
                </>
              ) : isApproved ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" /> Approved Member
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" /> Pending Approval
                </>
              )}
            </span>

            {/* Install App button */}
            <button
              onClick={() => alert("Call CRM PWA is available for installation")}
              className="hidden xs:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>App</span>
            </button>

            <button className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
              {pendingUsers.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse ring-2 ring-white" />
              )}
            </button>
          </div>
        </header>

        {/* Page Canvas (Clean Off-White #f8f9fa) */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Status Alert if Pending */}
          {!isApproved && !isSuperAdmin && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-bold text-amber-950">Awaiting Super Admin Approval</p>
                <p className="text-amber-800">
                  Your account status is currently <strong>PENDING</strong>. A Super Admin must approve your account before elevated permissions are granted.
                </p>
              </div>
              <button
                onClick={claimSuperadminRole}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
              >
                Claim Super Admin (Dev)
              </button>
            </div>
          )}

          {/* TAB 1: USER APPROVALS */}
          {currentTab === "approvals" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-[#1a1c1c] flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    User Approvals & Access Control
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Super Admin review queue. Manage roles and approve or reject team access.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by email, name, role..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a1c1c]/10"
                  />
                </div>
              </div>

              {!isSuperAdmin && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    You are viewing in Member Mode. Only Super Admins have permission to approve/reject users or reassign roles.
                  </span>
                </div>
              )}

              {/* Responsive Users Table */}
              <div className="overflow-x-auto -mx-5 sm:mx-0">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-5 sm:px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Super Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                          No users registered yet.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelf = u.uid === user?.uid;
                        return (
                          <tr key={u.uid} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-4 px-5 sm:px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                                  {(u.displayName?.[0] || u.email?.[0] || "U").toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                                    {u.displayName || "User"}
                                    {isSelf && (
                                      <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded font-normal">
                                        You
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              {isSuperAdmin ? (
                                <select
                                  value={u.role}
                                  onChange={(e) =>
                                    handleChangeRole(u.uid, e.target.value as UserRole)
                                  }
                                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-400 cursor-pointer"
                                >
                                  {allRoles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="capitalize font-semibold text-slate-700">
                                  {u.role}
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                  u.status === "approved"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : u.status === "rejected"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                                }`}
                              >
                                {u.status === "approved" && (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                                {u.status === "rejected" && <XCircle className="w-3 h-3" />}
                                {u.status === "pending" && <Clock className="w-3 h-3" />}
                                {u.status.toUpperCase()}
                              </span>
                            </td>

                            <td className="py-4 px-4 text-right">
                              {isSuperAdmin ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  {u.status !== "approved" && (
                                    <button
                                      onClick={() => handleApprove(u.uid)}
                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  {u.status !== "rejected" && (
                                    <button
                                      onClick={() => handleReject(u.uid)}
                                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">View Only</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ROLES & PERMISSIONS */}
          {currentTab === "roles" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-[#1a1c1c] flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    Role Definitions & Permissions
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    System roles and custom privilege sets across the CRM.
                  </p>
                </div>

                {isSuperAdmin && (
                  <button
                    onClick={() => setShowRoleModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#febd1c] hover:bg-amber-400 text-black font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-black" />
                    <span>Create Custom Role</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {allRoles.map((role) => (
                  <div
                    key={role.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-[#1a1c1c] text-sm">{role.name}</h3>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${role.badgeColor}`}
                        >
                          {role.isSystem ? "System" : "Custom"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {role.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 space-y-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                        Assigned Permissions ({role.permissions.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">No permissions</span>
                        ) : (
                          role.permissions.map((p) => (
                            <span
                              key={p}
                              className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-700"
                            >
                              {p}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Create Role Modal */}
              {showRoleModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <Key className="w-5 h-5 text-amber-500" />
                        Create New Role
                      </h3>
                      <button
                        onClick={() => setShowRoleModal(false)}
                        className="text-slate-400 hover:text-slate-700 text-sm p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Role Name
                        </label>
                        <input
                          type="text"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          placeholder="e.g. Lead Auditor, Senior Closer"
                          required
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={newRoleDesc}
                          onChange={(e) => setNewRoleDesc(e.target.value)}
                          placeholder="Responsibilities and duties..."
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-2">
                          Permissions
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {AVAILABLE_PERMISSIONS.map((perm) => {
                            const checked = selectedPermissions.includes(perm.id);
                            return (
                              <label
                                key={perm.id}
                                className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                  checked
                                    ? "bg-amber-50 border-amber-300 text-amber-950 font-medium"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPermissions([...selectedPermissions, perm.id]);
                                    } else {
                                      setSelectedPermissions(
                                        selectedPermissions.filter((p) => p !== perm.id)
                                      );
                                    }
                                  }}
                                  className="mt-0.5 cursor-pointer"
                                />
                                <div>
                                  <p className="font-semibold text-slate-900">{perm.label}</p>
                                  <p className="text-[10px] text-slate-500">{perm.desc}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setShowRoleModal(false)}
                          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-[#febd1c] hover:bg-amber-400 text-black font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          Save Role
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFILE & STATUS */}
          {currentTab === "profile" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto shadow-xs space-y-5">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="w-14 h-14 rounded-full bg-[#febd1c] text-black font-black text-xl flex items-center justify-center border-2 border-amber-300 shadow-sm">
                  {(user?.displayName?.[0] || user?.email?.[0] || "U").toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {user?.displayName || "Agent"}
                  </h3>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-100 text-amber-800">
                    {profile?.role || "Agent"}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-400">UID:</span>
                  <span className="font-mono text-slate-800">{user?.uid}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-400">Approval Status:</span>
                  <span
                    className={`font-semibold uppercase ${
                      profile?.status === "approved" || isSuperAdmin
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {profile?.status || "Pending"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-400">Super Admin Authority:</span>
                  <span className="font-semibold text-slate-800">
                    {isSuperAdmin ? "Yes (Full Permissions)" : "No"}
                  </span>
                </div>
              </div>

              {!isSuperAdmin && (
                <div className="pt-2">
                  <button
                    onClick={claimSuperadminRole}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    Claim Super Admin (Dev Mode)
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
