"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { Database, Plus, Trash2, Phone, User, Clock, AlertTriangle, ExternalLink } from "lucide-react";

interface LeadRecord {
  id: string;
  name: string;
  phone: string;
  notes: string;
  status: string;
  createdBy: string;
  createdAt?: Timestamp | null;
}

export function FirestoreCard() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched: LeadRecord[] = [];
          snapshot.forEach((docSnap) => {
            fetched.push({ id: docSnap.id, ...(docSnap.data() as Omit<LeadRecord, "id">) });
          });
          setLeads(fetched);
          setFirestoreError(null);
        },
        (error) => {
          console.error("Firestore listener error:", error);
          if (error.code === "permission-denied" || error.code === "unavailable" || error.message.includes("API")) {
            setFirestoreError(
              "Firestore database needs to be enabled in Firebase Console. Click below to create your Firestore database."
            );
          } else {
            setFirestoreError(error.message);
          }
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setIsSubmitting(true);
    setFirestoreError(null);

    try {
      await addDoc(collection(db, "leads"), {
        name,
        phone,
        notes,
        status: "new",
        createdBy: user?.email || user?.uid || "anonymous",
        createdAt: serverTimestamp(),
      });
      setName("");
      setPhone("");
      setNotes("");
    } catch (err) {
      console.error("Error adding lead:", err);
      setFirestoreError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await deleteDoc(doc(db, "leads", id));
    } catch (err) {
      console.error("Error deleting lead:", err);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Firestore Database</h3>
            <p className="text-xs text-slate-500">Real-time sync on &apos;leads&apos; collection</p>
          </div>
        </div>
        <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">
          {leads.length} {leads.length === 1 ? "record" : "records"}
        </span>
      </div>

      {firestoreError && (
        <div className="my-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">Firestore Action Required:</p>
              <p className="mt-0.5">{firestoreError}</p>
            </div>
          </div>
          <a
            href="https://console.firebase.google.com/project/call-crm-66927/firestore"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg text-xs transition-colors"
          >
            Open Firebase Console Firestore <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Add Lead Form */}
      <form onSubmit={handleAddLead} className="mt-4 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Add New Lead</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contact Name"
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
            />
          </div>
          <div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number (+1 234...)"
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
            />
          </div>
        </div>
        <div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Call Notes / Deal Details..."
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          {isSubmitting ? "Saving to Firestore..." : "Add Lead Record"}
        </button>
      </form>

      {/* Records List */}
      <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {leads.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-6 italic">
            No leads recorded yet. Add one above to test Firestore real-time storage.
          </p>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all text-xs"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" /> {lead.name}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {lead.phone}
                  </span>
                </div>
                {lead.notes && <p className="text-slate-600 truncate">{lead.notes}</p>}
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>By: {lead.createdBy}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteLead(lead.id)}
                className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors"
                title="Delete record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
