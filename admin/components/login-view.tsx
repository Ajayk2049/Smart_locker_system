"use client";

import React, { useState } from "react";
import { Box, Lock, Mail, ShieldCheck, AlertCircle, ArrowRight, Loader2, Sun, Moon } from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (user: any, token: string) => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export function LoginView({ onLoginSuccess, theme = "light", onToggleTheme }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4300/api";

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Incorrect email or password");
      }

      if (data.user?.role !== "admin") {
        throw new Error("Access Denied: This page is for administrators only.");
      }

      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail("Aibotink.web@gmail.com");
    setPassword("Aibotink@123");
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#080D14] text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 font-sans relative transition-colors duration-200">
      {/* Theme Switch in top-right */}
      {onToggleTheme && (
        <button
          type="button"
          onClick={onToggleTheme}
          className="absolute top-6 right-6 w-10 h-10 rounded-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0D141F] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-none transition-colors"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} theme`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-[#00F5A0]" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      )}

      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-none bg-[#00F5A0] text-black flex items-center justify-center mb-1">
            <Box className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Secure Box Admin
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Sign in to manage customers, lockers, and delivery requests
          </p>
        </div>

        {/* Login Card */}
        <div className="p-8 rounded-none bg-white dark:bg-[#0D141F] border-2 border-slate-300 dark:border-slate-800 shadow-none flex flex-col gap-5">
          {error && (
            <div className="p-3.5 rounded-none bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-none bg-slate-50 dark:bg-[#080D14] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#00F5A0] focus:ring-1 focus:ring-[#00F5A0] transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-none bg-slate-50 dark:bg-[#080D14] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#00F5A0] focus:ring-1 focus:ring-[#00F5A0] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 py-3 px-4 rounded-none font-black text-sm bg-[#00F5A0] hover:bg-[#00DE90] text-black transition-colors flex items-center justify-center gap-2 shadow-none disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </form>

          {/* Quick-fill link */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm">
            <span className="text-slate-400 text-xs">Primary Admin</span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[#00F5A0] hover:underline font-bold text-xs cursor-pointer"
            >
              Autofill Credentials
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
          <ShieldCheck className="w-4 h-4 text-[#00F5A0]" />
          <span>Encrypted JWT Authentication</span>
        </div>
      </div>
    </div>
  );
}
