"use client";

import React, { useState } from "react";
import { UserProfile, SyncedCallLog } from "@/types/rbac";
import { provisionAgentAccount } from "@/lib/admin-provisioning";
import { useAuth } from "@/lib/auth-context";
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  PhoneCall,
  Search,
} from "lucide-react";

interface AgentsOverviewProps {
  agents: UserProfile[];
  callLogs: SyncedCallLog[];
  onSelectAgentForLogs: (agentUid: string) => void;
}

export function AgentsOverview({
  agents,
  callLogs,
  onSelectAgentForLogs,
}: AgentsOverviewProps) {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSuccess, setCreatedSuccess] = useState<{
    email: string;
    pass: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await provisionAgentAccount({
        displayName: name,
        email,
        password,
        phone,
        role: "agent",
        approvedBy: user?.email || "superadmin",
      });

      setCreatedSuccess({ email, pass: password, name });
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email address is already registered.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Failed to create agent account.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!createdSuccess) return;
    const text = `Call CRM Agent Login Credentials:\nEmail: ${createdSuccess.email}\nPassword: ${createdSuccess.pass}\nLogin at: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Compute stats per agent
  const getAgentCallCount = (uid: string) => {
    return callLogs.filter((log) => log.ownerUid === uid).length;
  };

  const getAgentLastCallTime = (uid: string) => {
    const agentCalls = callLogs.filter((log) => log.ownerUid === uid);
    if (agentCalls.length === 0) return null;
    const latest = Math.max(...agentCalls.map((c) => c.timestamp));
    return new Date(latest).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredAgents = agents.filter(
    (a) =>
      (a.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.phone || "").includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-[#1a1c1c] flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Team Agents & Sync Status
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Superadmin dashboard: manage team agents, monitor device syncs, and inspect call records person-wise.
            </p>
          </div>

          <button
            onClick={() => {
              setShowCreateModal(true);
              setCreatedSuccess(null);
              setError(null);
              generatePassword();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#febd1c] hover:bg-amber-400 text-black font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-black" />
            <span>Create New Agent</span>
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Registered Agents
            </span>
            <div className="text-2xl font-black text-[#1a1c1c] mt-1">
              {agents.length}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Synced Calls
            </span>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {callLogs.length}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active Today
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {
                agents.filter((a) => {
                  const today = new Date().toDateString();
                  const lastCall = callLogs.find(
                    (c) => c.ownerUid === a.uid && new Date(c.timestamp).toDateString() === today
                  );
                  return Boolean(lastCall);
                }).length
              }
            </div>
          </div>
        </div>
      </div>

      {/* Agents Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name, email, phone..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a1c1c]/10"
          />
        </div>
      </div>

      {/* Agents Cards Grid */}
      {filteredAgents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium">No agents found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map((agent) => {
            const callCount = getAgentCallCount(agent.uid);
            const lastCallStr = getAgentLastCallTime(agent.uid);

            return (
              <div
                key={agent.uid}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 shadow-xs flex flex-col justify-between transition-all"
              >
                <div>
                  {/* Card Header: Avatar & Name */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#febd1c] text-black font-bold flex items-center justify-center text-base border border-amber-300 shrink-0">
                        {(agent.displayName?.[0] || agent.email?.[0] || "A").toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          {agent.displayName || "Agent"}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {agent.email}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        agent.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {agent.role.toUpperCase()}
                    </span>
                  </div>

                  {/* Card Body: Phone & Sync Stats */}
                  <div className="py-3 space-y-2 text-xs text-slate-600">
                    {agent.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                          <Phone className="w-3 h-3" /> Phone:
                        </span>
                        <a
                          href={`tel:${agent.phone}`}
                          className="font-mono text-blue-600 hover:underline"
                        >
                          {agent.phone}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <PhoneCall className="w-3 h-3" /> Synced Calls:
                      </span>
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                        {callCount} calls
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3" /> Latest Call:
                      </span>
                      <span className="text-slate-700 font-medium text-[11px]">
                        {lastCallStr || "No calls synced yet"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action: View Person's Call Logs */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onSelectAgentForLogs(agent.uid)}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>View Person Logs ({callCount})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Agent */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Create Team Agent
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createdSuccess ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Agent Successfully Created!
                  </div>
                  <p>
                    Share these credentials with <strong>{createdSuccess.name}</strong> so they can log into the Mobile App and Web Portal.
                  </p>
                  <div className="mt-2 p-3 bg-white border border-emerald-200 rounded-lg space-y-1 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400">Email:</span> {createdSuccess.email}
                    </div>
                    <div>
                      <span className="text-slate-400">Password:</span> {createdSuccess.pass}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyCredentials}
                    className="flex-1 py-2.5 bg-[#febd1c] hover:bg-amber-400 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy Credentials
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setCreatedSuccess(null);
                      setShowCreateModal(false);
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateAgent} className="space-y-4 text-xs">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Agent Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Agent Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent@company.com"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Password *</label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Generate Strong
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                      className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#febd1c] hover:bg-amber-400 text-black font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating..." : "Save & Create Agent"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
