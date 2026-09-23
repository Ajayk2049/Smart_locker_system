import React from "react";
import { User, KeyRound, Loader2, ArrowRight } from "lucide-react";
import { ShippingLabelHeader } from "./ShippingLabelHeader";

interface LoginFormProps {
  identifier: string;
  onIdentifierChange: (val: string) => void;
  password: string;
  onPasswordChange: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToRegister: () => void;
}

export function LoginForm({
  identifier,
  onIdentifierChange,
  onPasswordChange,
  password,
  loading,
  onSubmit,
  onSwitchToRegister,
}: LoginFormProps) {
  return (
    <div className="bg-[#FAF9F5] border-2 border-[#3D2310]/35 p-4 sm:p-5 text-[#3D2310] w-[94%] md:w-[90%] h-[94%] flex flex-col justify-between mx-auto my-auto overflow-hidden no-scrollbar shadow-none">
      <ShippingLabelHeader
        title="Owner Login"
        subtitle="Manage your Secure Box"
      />

      {/* Auth Tab Switcher */}
      <div className="flex border border-[#3D2310]/30 bg-zinc-100 font-mono text-[10px] uppercase font-black tracking-wider mt-1 mb-1">
        <button
          type="button"
          className="flex-1 py-1 bg-[#3D2310] text-[#FAF9F5] cursor-default text-center"
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="flex-1 py-1 text-[#3D2310] hover:bg-zinc-200 cursor-pointer text-center transition-colors"
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={onSubmit} className="flex-1 flex flex-col justify-center py-2 space-y-3">
        {/* Identifier */}
        <div className="space-y-1 text-left">
          <label className="font-mono text-[9px] font-black uppercase text-zinc-500 tracking-wider">
            Mobile Number or Email
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              required
              disabled={loading}
              value={identifier}
              onChange={(e) => onIdentifierChange(e.target.value)}
              placeholder="e.g. 9876543210 or name@domain.com"
              className="w-full bg-white border-2 border-[#3D2310]/30 pl-9 pr-3 py-2 text-xs text-[#3D2310] placeholder-zinc-400 focus:outline-none focus:border-[#3D2310] focus:ring-1 focus:ring-[#3D2310] font-mono"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1 text-left">
          <label className="font-mono text-[9px] font-black uppercase text-zinc-500 tracking-wider">
            Security Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border-2 border-[#3D2310]/30 pl-9 pr-3 py-2 text-xs text-[#3D2310] placeholder-zinc-400 focus:outline-none focus:border-[#3D2310] focus:ring-1 focus:ring-[#3D2310] font-mono tracking-widest"
            />
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#3D2310] hover:bg-[#2B1810] text-[#FAF9F5] text-xs font-mono font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Sign In to Locker</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Switch to Register */}
      <div className="pt-2 border-t-2 border-dashed border-[#3D2310]/30 text-center">
        <p className="text-xs text-zinc-600">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-black text-[#3D2310] underline underline-offset-2 hover:text-[#2B1810] ml-1 cursor-pointer"
          >
            Sign Up / Create Account
          </button>
        </p>
      </div>
    </div>
  );
}
