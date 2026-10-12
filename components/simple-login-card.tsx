"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export function SimpleLoginCard() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [isAdminPortal, setIsAdminPortal] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
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
        case "auth/email-already-in-use":
          return "Email is already registered. Please sign in.";
        case "auth/weak-password":
          return "Password should be at least 6 characters.";
        case "auth/invalid-email":
          return "Please enter a valid email address.";
        case "auth/popup-closed-by-user":
          return "Google Sign-in was cancelled.";
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
      if (isSignUp) {
        await signUpWithEmail(email, password, isAdminPortal ? "agent" : "customer");
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setErrorMessage(cleanErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
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
          {isAdminPortal
            ? isSignUp
              ? "Admin Registration"
              : "Admin Login"
            : isSignUp
            ? "Customer Sign Up"
            : "Customer Login"}
        </h1>
        {/* Bold blue underline accent bar */}
        <div className="w-20 sm:w-24 h-1 bg-[#1e3a8a] mx-auto mt-2.5 rounded-full" />
      </div>

      {errorMessage && (
        <div className="mb-5 flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sign in with Google pill button */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-2.5 min-h-[46px] py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-xs sm:text-sm font-medium text-slate-700 shadow-2xs transition-all active:scale-[0.99] disabled:opacity-50"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

      {/* OR USE PASSWORD divider */}
      <div className="relative my-6 sm:my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-slate-400">
          <span className="bg-white px-3">OR USE PASSWORD</span>
        </div>
      </div>

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
            className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Sign In button - deep navy blue matching screenshot */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[46px] py-3 bg-[#1e3a8a] hover:bg-[#172554] active:scale-[0.99] text-white font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : isSignUp ? (
            "Create Account"
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Footer link: Go to Customer Login / Go to Admin Login */}
      <div className="mt-7 sm:mt-8 text-center space-y-2">
        <button
          type="button"
          onClick={() => {
            setIsAdminPortal(!isAdminPortal);
            setErrorMessage(null);
          }}
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors py-1 block w-full"
        >
          {isAdminPortal ? "Go to Customer Login" : "Go to Admin Login"}
        </button>

        <div className="text-[11px] text-slate-400 pt-1">
          {isSignUp ? "Already registered?" : "Need an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage(null);
            }}
            className="font-semibold text-[#1e3a8a] hover:underline"
          >
            {isSignUp ? "Sign In" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
