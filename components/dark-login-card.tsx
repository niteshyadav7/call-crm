"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types/rbac";
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Shield, UserCheck, Sparkles } from "lucide-react";

interface DarkLoginCardProps {
  onSuccess?: () => void;
}

export function DarkLoginCard({ onSuccess }: DarkLoginCardProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [portalType, setPortalType] = useState<"admin" | "customer" | "agent">("admin");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const cleanErrorMessage = (error: unknown): string => {
    if (typeof error === "object" && error !== null && "code" in error) {
      const code = (error as { code: string }).code;
      switch (code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          return "Invalid email or password. Please verify your credentials.";
        case "auth/email-already-in-use":
          return "This email is already registered. Please sign in instead.";
        case "auth/weak-password":
          return "Password should be at least 6 characters.";
        case "auth/invalid-email":
          return "Please enter a valid email address.";
        case "auth/popup-closed-by-user":
          return "Google Sign-in was cancelled.";
        case "auth/unauthorized-domain":
          return "This domain is not authorized in Firebase Console.";
        default:
          return (error as { message?: string }).message || "Authentication failed.";
      }
    }
    return String(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        const targetRole: UserRole = portalType === "customer" ? "customer" : "agent";
        await signUpWithEmail(email, password, targetRole);
        setSuccessMessage("Account created successfully! Pending superadmin approval if required.");
      } else {
        await signInWithEmail(email, password);
        setSuccessMessage("Signed in successfully!");
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMessage(cleanErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await signInWithGoogle();
      setSuccessMessage("Signed in with Google successfully!");
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMessage(cleanErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHeadingTitle = () => {
    if (portalType === "admin") return isSignUp ? "Admin Registration" : "Admin Login";
    if (portalType === "customer") return isSignUp ? "Customer Sign Up" : "Customer Login";
    return isSignUp ? "Team Registration" : "Team Login";
  };

  return (
    <div className="w-full max-w-[440px] mx-auto">
      {/* Portal Selection Tabs */}
      <div className="flex items-center justify-center p-1 bg-slate-900/80 border border-slate-800 rounded-2xl mb-4 backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            setPortalType("admin");
            setErrorMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
            portalType === "admin"
              ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Admin Portal
        </button>
        <button
          type="button"
          onClick={() => {
            setPortalType("agent");
            setErrorMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
            portalType === "agent"
              ? "bg-slate-800 text-white shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          Team / Agent
        </button>
        <button
          type="button"
          onClick={() => {
            setPortalType("customer");
            setErrorMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
            portalType === "customer"
              ? "bg-slate-800 text-white shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Customer
        </button>
      </div>

      {/* Main Login Card - replicating screenshot layout in dark mode */}
      <div className="bg-[#111622]/95 border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Subtle top glow line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80" />

        {/* Header Title with underline matching screenshot */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight inline-block relative pb-3">
            {getHeadingTitle()}
            {/* Bold accent bar directly under the title */}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-blue-600 rounded-full shadow-sm shadow-blue-500/50" />
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            {isSignUp
              ? "Create your account with multi-role access control"
              : "Enter your credentials to access your workspace"}
          </p>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-red-950/40 border border-red-800/60 text-red-200 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 rounded-xl text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Google Sign In Button - matching screenshot's rounded pill design */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-[#182030] hover:bg-[#202b40] active:scale-[0.99] border border-slate-700/80 rounded-full text-sm font-medium text-slate-200 shadow-md transition-all disabled:opacity-50 group"
        >
          <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>

        {/* OR USE PASSWORD Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-[#111622] px-3 text-slate-500 font-semibold">
              OR USE PASSWORD
            </span>
          </div>
        </div>

        {/* Input Form matching clean underline/border style */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full pl-10 pr-4 py-3 bg-[#0d121c]/80 border-b-2 border-slate-700 focus:border-blue-500 rounded-t-lg text-sm text-slate-100 placeholder-slate-500 focus:bg-[#131a29] focus:outline-none transition-all"
            />
          </div>

          {/* Password input with eye toggle */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full pl-10 pr-11 py-3 bg-[#0d121c]/80 border-b-2 border-slate-700 focus:border-blue-500 rounded-t-lg text-sm text-slate-100 placeholder-slate-500 focus:bg-[#131a29] focus:outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Submit button - deep navy blue / indigo from screenshot */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-4 bg-[#1e3a8a] hover:bg-[#1d4ed8] active:scale-[0.99] text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-950/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : isSignUp ? (
              <>
                <Sparkles className="w-4 h-4" /> Create Account
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Bottom links: switch between Customer and Admin / switch between Sign In and Sign Up */}
        <div className="mt-8 text-center space-y-3 pt-4 border-t border-slate-800/60">
          <div>
            <button
              type="button"
              onClick={() => {
                setPortalType(portalType === "admin" ? "customer" : "admin");
                setErrorMessage(null);
              }}
              className="text-xs font-medium text-slate-400 hover:text-blue-400 transition-colors"
            >
              {portalType === "admin" ? "Go to Customer Login" : "Go to Admin Login"}
            </button>
          </div>

          <div className="text-xs text-slate-500">
            {isSignUp ? "Already registered?" : "New to the platform?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
              }}
              className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4 ml-1"
            >
              {isSignUp ? "Sign In instead" : "Register / Request Access"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
