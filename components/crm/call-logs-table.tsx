"use client";

import React, { useState, useMemo } from "react";
import { SyncedCallLog, UserProfile } from "@/types/rbac";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
  Filter,
  Copy,
  Check,
  MessageSquare,
  Clock,
  User,
  ExternalLink,
  Calendar,
} from "lucide-react";

interface CallLogsTableProps {
  callLogs: SyncedCallLog[];
  agents?: UserProfile[];
  selectedAgentUid?: string | null;
  onClearAgentFilter?: () => void;
  isSuperAdmin?: boolean;
}

export function CallLogsTable({
  callLogs,
  agents = [],
  selectedAgentUid = null,
  onClearAgentFilter,
  isSuperAdmin = false,
}: CallLogsTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<number | null>(null); // null = all, 1 = incoming, 2 = outgoing, 3 = missed
  const [simFilter, setSimFilter] = useState<number | null>(null); // null = all, 0 = SIM 1, 1 = SIM 2, 2 = WA
  const [agentFilter, setAgentFilter] = useState<string>(selectedAgentUid || "all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync internal agent filter with prop when prop changes
  React.useEffect(() => {
    if (selectedAgentUid) {
      setAgentFilter(selectedAgentUid);
    }
  }, [selectedAgentUid]);

  const copyNumber = (id: string, num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDateTime = (ts: number) => {
    if (!ts) return "-";
    const date = new Date(ts);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getCleanDigits = (number: string) => {
    return number.replace(/[^\d+]/g, "");
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return callLogs.filter((log) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const matchName = (log.contactName || "").toLowerCase().includes(q);
        const matchNumber = (log.number || "").includes(q);
        const matchAgent = (log.ownerName || "").toLowerCase().includes(q);
        if (!matchName && !matchNumber && !matchAgent) return false;
      }

      // Call type filter
      if (typeFilter !== null && log.type !== typeFilter) {
        return false;
      }

      // SIM filter
      if (simFilter !== null && log.simSlot !== simFilter) {
        return false;
      }

      // Agent filter (for Superadmin)
      if (agentFilter !== "all" && log.ownerUid !== agentFilter) {
        return false;
      }

      return true;
    });
  }, [callLogs, search, typeFilter, simFilter, agentFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const incoming = filteredLogs.filter((l) => l.type === 1).length;
    const outgoing = filteredLogs.filter((l) => l.type === 2).length;
    const missed = filteredLogs.filter((l) => l.type === 3).length;
    const totalDuration = filteredLogs.reduce((acc, l) => acc + (l.duration || 0), 0);
    return { total, incoming, outgoing, missed, totalDuration };
  }, [filteredLogs]);

  const selectedAgentObj = agents.find((a) => a.uid === agentFilter);

  return (
    <div className="space-y-5">
      {/* Active Agent Filter Pill (if drilled down) */}
      {agentFilter !== "all" && selectedAgentObj && (
        <div className="flex items-center justify-between p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>
              Showing call logs filtered for:{" "}
              <strong>{selectedAgentObj.displayName || selectedAgentObj.email}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              setAgentFilter("all");
              if (onClearAgentFilter) onClearAgentFilter();
            }}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline cursor-pointer"
          >
            Show All Agents
          </button>
        </div>
      )}

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Calls
          </span>
          <span className="text-xl font-bold text-[#1a1c1c]">{stats.total}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
            <PhoneIncoming className="w-3 h-3" /> Incoming
          </span>
          <span className="text-xl font-bold text-emerald-700">{stats.incoming}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider block flex items-center gap-1">
            <PhoneOutgoing className="w-3 h-3" /> Outgoing
          </span>
          <span className="text-xl font-bold text-amber-700">{stats.outgoing}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider block flex items-center gap-1">
            <PhoneMissed className="w-3 h-3" /> Missed
          </span>
          <span className="text-xl font-bold text-rose-700">{stats.missed}</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Clock className="w-3 h-3" /> Talk Time
          </span>
          <span className="text-xl font-bold text-[#1a1c1c]">
            {formatDuration(stats.totalDuration)}
          </span>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contact name, phone number, agent..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a1c1c]/10"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Agent Select (Superadmin only) */}
            {isSuperAdmin && agents.length > 0 && (
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">All Team Agents ({agents.length})</option>
                {agents.map((a) => (
                  <option key={a.uid} value={a.uid}>
                    {a.displayName || a.email}
                  </option>
                ))}
              </select>
            )}

            {/* Call Type Filter */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setTypeFilter(null)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === null ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter(1)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 1 ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Incoming
              </button>
              <button
                onClick={() => setTypeFilter(2)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 2 ? "bg-amber-500 text-black shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Outgoing
              </button>
              <button
                onClick={() => setTypeFilter(3)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 3 ? "bg-rose-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Missed
              </button>
            </div>

            {/* SIM / Channel Filter */}
            <select
              value={simFilter === null ? "all" : simFilter}
              onChange={(e) =>
                setSimFilter(e.target.value === "all" ? null : Number(e.target.value))
              }
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Channels</option>
              <option value="0">SIM 1</option>
              <option value="1">SIM 2</option>
              <option value="2">WhatsApp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Call Logs Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Contact & Phone</th>
                <th className="py-3 px-4">Click to Call</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">SIM / Line</th>
                <th className="py-3 px-4">Date & Time</th>
                {isSuperAdmin && <th className="py-3 px-4">Agent</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={isSuperAdmin ? 7 : 6}
                    className="py-12 text-center text-slate-400 italic"
                  >
                    No call logs found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const cleanDigits = getCleanDigits(log.number);
                  const isCopied = copiedId === log.id;

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Contact Name & Number */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                            {(log.contactName?.[0] || log.number?.[0] || "?").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {log.contactName || "Unknown Contact"}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {log.number}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Click to Call Action Button */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {/* Direct Phone Dial Link */}
                          <a
                            href={`tel:${cleanDigits}`}
                            title={`Click to call ${log.number} directly`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs shadow-2xs transition-all cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5 fill-current" />
                            <span>Call</span>
                          </a>

                          {/* WhatsApp Chat Link */}
                          <a
                            href={`https://wa.me/${cleanDigits.replace(/^\+/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat on WhatsApp"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>

                          {/* Copy Number */}
                          <button
                            onClick={() => copyNumber(log.id, log.number)}
                            title="Copy number"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Call Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            log.type === 1
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : log.type === 2
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {log.type === 1 && <PhoneIncoming className="w-3 h-3" />}
                          {log.type === 2 && <PhoneOutgoing className="w-3 h-3" />}
                          {log.type === 3 && <PhoneMissed className="w-3 h-3" />}
                          {log.type === 1
                            ? "Incoming"
                            : log.type === 2
                            ? "Outgoing"
                            : "Missed"}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {formatDuration(log.duration)}
                      </td>

                      {/* SIM Slot / Channel */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {log.simSlot === 0
                            ? "SIM 1"
                            : log.simSlot === 1
                            ? "SIM 2"
                            : log.simSlot === 2
                            ? "WhatsApp"
                            : "Unknown"}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        {formatDateTime(log.timestamp)}
                      </td>

                      {/* Agent (for Superadmin) */}
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 text-xs">
                            {log.ownerName || log.ownerEmail || "Unknown Agent"}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
