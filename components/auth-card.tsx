"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { LogIn, UserPlus, LogOut, Mail, Lock, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

export function AuthCard() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          return "Invalid email or password. Please verify and try again.";
        case "auth/email-already-in-use":
          return "This email is already registered. Please sign in instead.";
        case "auth/weak-password":
          return "Password should be at least 6 characters long.";
        case "auth/invalid-email":
          return "Please enter a valid email address.";
        case "auth/popup-closed-by-user":
          return "Google Sign-in was cancelled before completion.";
        case "auth/unauthorized-domain":
          return "This domain is not authorized. Please check your Firebase authorized domains list.";
        default:
          return (error as { message?: string }).message || "Authentication failed.";
      }
    }
    return String(error);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password);
        setSuccessMessage("Account created and signed in successfully!");
      } else {
        await signInWithEmail(email, password);
        setSuccessMessage("Signed in successfully!");
      }
      setEmail("");
      setPassword("");
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
    } catch (err) {
      setErrorMessage(cleanErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-slate-500 text-sm">Checking authentication status...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-lg overflow-hidden border border-amber-200">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
            ) : (
              (user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 truncate">
                {user.displayName || "Authenticated User"}
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                <ShieldCheck className="w-3 h-3" /> Active
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-400">UID:</span>
            <span className="font-mono text-slate-800 truncate max-w-[200px]">{user.uid}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Provider:</span>
            <span className="capitalize font-medium text-slate-800">
              {user.providerData[0]?.providerId === "google.com" ? "Google" : "Email / Password"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Project:</span>
            <span className="font-mono text-slate-800">call-crm-66927</span>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-sm transition-all active:scale-[0.99]"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {mode === "signin" ? "Sign In to Call CRM" : "Create an Account"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Authenticate with Google or email/password
          </p>
        </div>
        <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setErrorMessage(null);
            }}
            className={`px-3 py-1.5 rounded-md transition-all ${
              mode === "signin"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMessage(null);
            }}
            className={`px-3 py-1.5 rounded-md transition-all ${
              mode === "signup"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign Up
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Google Sign In Button */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-700 shadow-2xs transition-all active:scale-[0.99] disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
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
        Continue with Google
      </button>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-400 font-medium">Or continue with email</span>
        </div>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleEmailAuth} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Email address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-900"
            />
          </div>
          {mode === "signup" && (
            <p className="text-[11px] text-slate-400 mt-1">Must be at least 6 characters</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-black font-semibold rounded-xl text-sm shadow-xs transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-black" />
          ) : mode === "signin" ? (
            <>
              <LogIn className="w-4 h-4" /> Sign In
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" /> Create Account
            </>
          )}
        </button>
      </form>
    </div>
  );
}
