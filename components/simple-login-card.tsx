"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export function SimpleLoginCard() {
  const { signInWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cleanErrorMessage = (error: unknown): string => {
    if (typeof error === "object" && error !== null && "code" in error) {
      const code = (error as { code: string }).code;
      switch (code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          return "Invalid email or password.";
        case "auth/user-disabled":
          return "This account has been disabled. Contact your Super Admin.";
        case "auth/too-many-requests":
          return "Too many attempts. Please wait a minute and try again.";
        case "auth/invalid-email":
          return "Please enter a valid email address.";
        default:
          return (error as { message?: string }).message || "Authentication failed.";
      }
    }
    return String(error);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await signInWithEmail(email.trim(), password);
    } catch (err) {
      setErrorMessage(cleanErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-xl border border-slate-200/80 transition-all">
      {/* Title with bold blue accent bar matching reference */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-[26px] font-bold text-[#111827] tracking-tight">
          Call CRM Login
        </h1>
        {/* Bold blue underline accent bar */}
        <div className="w-20 sm:w-24 h-1 bg-[#1e3a8a] mx-auto mt-2.5 rounded-full" />
        <p className="text-xs text-slate-500 mt-3">
          Sign in with the email and password assigned by your Super Admin.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-5 flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Email and Password Form */}
      <form onSubmit={handleEmailSubmit} className="space-y-5 sm:space-y-6">
        {/* Email Address */}
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-0 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full pl-8 pr-3 py-2.5 text-sm border-b border-slate-200 focus:border-[#1e3a8a] outline-none text-slate-900 placeholder-slate-400 bg-transparent transition-colors"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-0 top-1/2 -translate-y-1/2" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full pl-8 pr-9 py-2.5 text-sm border-b border-slate-200 focus:border-[#1e3a8a] outline-none text-slate-900 placeholder-slate-400 bg-transparent transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Sign In button - deep navy blue matching screenshot */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[46px] py-3 bg-[#1e3a8a] hover:bg-[#172554] active:scale-[0.99] text-white font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <p className="mt-7 sm:mt-8 text-center text-[11px] text-slate-400">
        Don&apos;t have an account? Ask your Super Admin to create one for you.
      </p>
    </div>
  );
}
