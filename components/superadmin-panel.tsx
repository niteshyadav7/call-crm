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
  addDoc,
  query,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import {
  UserProfile,
  UserRole,
  UserStatus,
  RoleDefinition,
  Permission,
  SYSTEM_ROLES,
} from "@/types/rbac";
import {
  Shield,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  Key,
  Database,
  Lock,
  Phone,
  Clock,
  Trash2,
  AlertCircle,
  Sparkles,
  Search,
} from "lucide-react";

const AVAILABLE_PERMISSIONS: { id: Permission; label: string; desc: string }[] = [
  { id: "crm:create", label: "Create Leads & Calls", desc: "Allows adding new leads and logging calls" },
  { id: "crm:edit", label: "Edit Leads", desc: "Allows editing existing lead details and status" },
  { id: "crm:delete", label: "Delete Leads", desc: "Allows removing leads from the database" },
  { id: "crm:view_all", label: "View All Leads", desc: "View leads assigned across all team members" },
  { id: "users:approve", label: "Approve Users", desc: "Approve or reject new member registrations" },
  { id: "users:manage_roles", label: "Manage User Roles", desc: "Assign or modify user roles" },
  { id: "roles:manage", label: "Create & Edit Roles", desc: "Full authority over role definitions" },
];

export function SuperAdminPanel() {
  const { user, profile, isSuperAdmin, isApproved, canCreateCRM, claimSuperadminRole } = useAuth();

  const [activeTab, setActiveTab] = useState<"approvals" | "roles" | "crm">("approvals");
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [customRoles, setCustomRoles] = useState<RoleDefinition[]>([]);
  const [leads, setLeads] = useState<{ id: string; name: string; phone: string; notes: string; status: string; createdBy: string }[]>([]);

  // Search filter
  const [userSearch, setUserSearch] = useState("");

  // Create Custom Role state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(["crm:create"]);

  // New Lead state
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadNotes, setLeadNotes] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadFeedback, setLeadFeedback] = useState<string | null>(null);

  // Real-time listener for all users
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
      console.warn("Users listener:", err);
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
            badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
          });
        });
        setCustomRoles(list);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Roles listener:", err);
    }
  }, []);

  // Real-time listener for leads
  useEffect(() => {
    try {
      const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: { id: string; name: string; phone: string; notes: string; status: string; createdBy: string }[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as { name: string; phone: string; notes: string; status: string; createdBy: string }) });
        });
        setLeads(list);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Leads listener:", err);
    }
  }, []);

  // SuperAdmin: Approve user
  const handleApproveUser = async (targetUid: string) => {
    try {
      const targetRef = doc(db, "users", targetUid);
      await updateDoc(targetRef, {
        status: "approved",
        approvedBy: user?.email || user?.uid || "superadmin",
        approvedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to approve user:", err);
    }
  };

  // SuperAdmin: Reject user
  const handleRejectUser = async (targetUid: string) => {
    try {
      const targetRef = doc(db, "users", targetUid);
      await updateDoc(targetRef, {
        status: "rejected",
        approvedBy: user?.email || user?.uid || "superadmin",
        approvedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to reject user:", err);
    }
  };

  // SuperAdmin: Change user role
  const handleChangeRole = async (targetUid: string, newRole: UserRole) => {
    try {
      const targetRef = doc(db, "users", targetUid);
      await updateDoc(targetRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to change user role:", err);
    }
  };

  // SuperAdmin: Create custom role
  const handleCreateRole = async (e: React.FormEvent) => {
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
      console.error("Failed to create role:", err);
    }
  };

  // Lead creation (Gated by Approval and Permissions)
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateCRM) {
      setLeadFeedback("Action Blocked: Only approved users with CRM permissions can create leads.");
      return;
    }
    if (!leadName || !leadPhone) return;

    setIsSubmittingLead(true);
    setLeadFeedback(null);
    try {
      await addDoc(collection(db, "leads"), {
        name: leadName,
        phone: leadPhone,
        notes: leadNotes,
        status: "new",
        createdBy: user?.email || user?.uid || "unknown",
        createdAt: serverTimestamp(),
      });
      setLeadName("");
      setLeadPhone("");
      setLeadNotes("");
      setLeadFeedback("Lead created successfully!");
    } catch (err) {
      setLeadFeedback(`Error creating lead: ${(err as Error).message}`);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await deleteDoc(doc(db, "leads", id));
    } catch (err) {
      console.error(err);
    }
  };

  const allRoles = [...SYSTEM_ROLES, ...customRoles];
  const pendingUsersCount = usersList.filter((u) => u.status === "pending").length;

  const filteredUsers = usersList.filter((u) =>
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.displayName || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Banner / Role Status Card */}
      <div className="bg-[#111622]/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Call CRM Hub</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  RBAC Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged in as <span className="text-slate-200 font-medium">{user?.email || "User"}</span> • Role:{" "}
                <span className="text-amber-400 font-semibold uppercase">{profile?.role || "Agent"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Current status & dev switch button */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
              isApproved
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            }`}
          >
            {isApproved ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            Status: {isApproved ? "Approved" : "Pending Approval"}
          </div>

          {!isSuperAdmin && (
            <button
              onClick={claimSuperadminRole}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" /> Claim Super Admin (Dev Mode)
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("approvals")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "approvals"
              ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          User Approvals & RBAC
          {pendingUsersCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-bold text-[10px]">
              {pendingUsersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("roles")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "roles"
              ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          Roles & Permissions ({allRoles.length})
        </button>

        <button
          onClick={() => setActiveTab("crm")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "crm"
              ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          CRM Pipeline ({leads.length} Leads)
        </button>
      </div>

      {/* TAB 1: USER APPROVALS & RBAC */}
      {activeTab === "approvals" && (
        <div className="bg-[#111622]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Team Approvals & User Permissions
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Super Admins must approve new accounts before they can create leads or access CRM pipelines.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by email or role..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0d121c] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {!isSuperAdmin && (
            <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-2xl text-xs text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">View-Only Mode</p>
                <p className="mt-0.5">
                  Only Super Admins have permission to approve/reject users or assign roles. Claim Super Admin above to test this functionality!
                </p>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4">Super Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                      No users found. Register accounts to see them here.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isCurrentUser = u.uid === user?.uid;
                    return (
                      <tr key={u.uid} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                              {(u.displayName?.[0] || u.email?.[0] || "U").toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                                {u.displayName || "User"}
                                {isCurrentUser && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded font-normal">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {isSuperAdmin ? (
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeRole(u.uid, e.target.value as UserRole)}
                              className="bg-[#0d121c] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                            >
                              {allRoles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="capitalize font-semibold text-slate-300">{u.role}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                              u.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : u.status === "rejected"
                                ? "bg-red-500/10 text-red-400 border-red-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
                            }`}
                          >
                            {u.status === "approved" && <CheckCircle className="w-3 h-3" />}
                            {u.status === "rejected" && <XCircle className="w-3 h-3" />}
                            {u.status === "pending" && <Clock className="w-3 h-3" />}
                            {u.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {isSuperAdmin ? (
                            <div className="flex items-center gap-2">
                              {u.status !== "approved" && (
                                <button
                                  onClick={() => handleApproveUser(u.uid)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" /> Approve
                                </button>
                              )}
                              {u.status !== "rejected" && (
                                <button
                                  onClick={() => handleRejectUser(u.uid)}
                                  className="px-3 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 flex items-center gap-1"
                                >
                                  <XCircle className="w-3 h-3" /> Reject
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Requires Super Admin</span>
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
      {activeTab === "roles" && (
        <div className="bg-[#111622]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-400" />
                Role Management & Power Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure role definitions and control granular permissions across the CRM.
              </p>
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => setShowRoleModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-900/30 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" /> Create New Role
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allRoles.map((roleDef) => (
              <div
                key={roleDef.id}
                className="bg-[#0d121c] border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">{roleDef.name}</h4>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleDef.badgeColor}`}
                    >
                      {roleDef.isSystem ? "System Role" : "Custom Role"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{roleDef.description}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Permissions ({roleDef.permissions.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {roleDef.permissions.length === 0 ? (
                      <span className="text-[11px] text-slate-600 italic">No elevated permissions</span>
                    ) : (
                      roleDef.permissions.map((p) => (
                        <span
                          key={p}
                          className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700/50"
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

          {/* Modal for creating a new role */}
          {showRoleModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-[#111622] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Create Custom Role
                  </h4>
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="text-slate-400 hover:text-white text-sm p-1"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateRole} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Role Name</label>
                    <input
                      type="text"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g. Senior Closer / Lead Auditor"
                      required
                      className="w-full px-3 py-2 bg-[#0d121c] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                    <input
                      type="text"
                      value={newRoleDesc}
                      onChange={(e) => setNewRoleDesc(e.target.value)}
                      placeholder="Description of duties and privileges..."
                      className="w-full px-3 py-2 bg-[#0d121c] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Grant Permissions</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {AVAILABLE_PERMISSIONS.map((perm) => {
                        const checked = selectedPermissions.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                              checked
                                ? "bg-blue-600/10 border-blue-500/40 text-blue-200"
                                : "bg-[#0d121c] border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPermissions([...selectedPermissions, perm.id]);
                                } else {
                                  setSelectedPermissions(selectedPermissions.filter((p) => p !== perm.id));
                                }
                              }}
                              className="mt-0.5"
                            />
                            <div>
                              <p className="font-semibold text-white">{perm.label}</p>
                              <p className="text-[10px] text-slate-400">{perm.desc}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowRoleModal(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md"
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

      {/* TAB 3: CRM PIPELINE & APPROVAL GATING DEMO */}
      {activeTab === "crm" && (
        <div className="bg-[#111622]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              CRM Pipeline & Lead Operations
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Demonstrates permission gating:{" "}
              <span className="text-amber-400 font-semibold">
                Only users approved by a Super Admin with `crm:create` permission can create records.
              </span>
            </p>
          </div>

          {/* If user is not approved, show prominent gate notice */}
          {!canCreateCRM ? (
            <div className="p-5 bg-amber-950/40 border border-amber-800/60 rounded-2xl text-xs text-amber-200 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-300 text-sm">Action Blocked: Super Admin Approval Required</p>
                <p className="text-amber-200/90 leading-relaxed">
                  Your account status is <strong className="uppercase">{profile?.status || "pending"}</strong>.
                  In accordance with CRM multi-role governance, team members cannot create or modify pipeline leads until an active Super Admin approves their registration.
                </p>
                <div className="pt-2">
                  <button
                    onClick={claimSuperadminRole}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-xs transition-colors"
                  >
                    Quick Unlock: Claim Super Admin (Dev Mode)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Lead creation form for approved users */
            <form onSubmit={handleCreateLead} className="p-5 bg-[#0d121c] border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Add CRM Lead (Permitted by Role: {profile?.role})
                </h4>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Authorized
                </span>
              </div>

              {leadFeedback && (
                <p className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 p-2 rounded-lg">
                  {leadFeedback}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Client / Contact Name"
                  required
                  className="px-3 py-2 bg-[#111622] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="tel"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="Phone Number (+1 555-0199)"
                  required
                  className="px-3 py-2 bg-[#111622] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <input
                type="text"
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                placeholder="Call notes, interest level, deal value..."
                className="w-full px-3 py-2 bg-[#111622] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                disabled={isSubmittingLead}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-950/50 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                {isSubmittingLead ? "Saving..." : "Add Lead"}
              </button>
            </form>
          )}

          {/* Leads list */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Live Pipeline Records ({leads.length})
            </h4>

            {leads.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8 italic border border-dashed border-slate-800 rounded-2xl">
                No leads recorded yet. Create one above to test real-time Firestore sync.
              </p>
            ) : (
              leads.map((l) => (
                <div
                  key={l.id}
                  className="p-4 bg-[#0d121c] border border-slate-800 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-all text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{l.name}</span>
                      <span className="text-slate-400 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-500" /> {l.phone}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {l.status}
                      </span>
                    </div>
                    {l.notes && <p className="text-slate-400">{l.notes}</p>}
                    <p className="text-[10px] text-slate-500">Created by: {l.createdBy}</p>
                  </div>

                  {isSuperAdmin && (
                    <button
                      onClick={() => handleDeleteLead(l.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete lead (Super Admin authority)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
