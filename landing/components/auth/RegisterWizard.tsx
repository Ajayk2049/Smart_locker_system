import React from "react";
import {
  User,
  Phone,
  Mail,
  Home,
  MapPin,
  KeyRound,
  Package,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import { ShippingLabelHeader } from "./ShippingLabelHeader";

interface RegisterWizardProps {
  step: number;
  onSetStep: (step: number) => void;
  name: string;
  onNameChange: (val: string) => void;
  email: string;
  onEmailChange: (val: string) => void;
  phone: string;
  onPhoneChange: (val: string) => void;
  otp: string;
  onOtpChange: (val: string) => void;
  password: string;
  onPasswordChange: (val: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (val: string) => void;
  address: string;
  onAddressChange: (val: string) => void;
  pincode: string;
  onPincodeChange: (val: string) => void;
  units: number;
  onUnitsChange: (val: number) => void;
  otpCooldown: number;
  loading: boolean;
  onSendOtp: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToLogin: () => void;
}

export function RegisterWizard({
  step,
  onSetStep,
  name,
  onNameChange,
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  otp,
  onOtpChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  address,
  onAddressChange,
  pincode,
  onPincodeChange,
  units,
  onUnitsChange,
  otpCooldown,
  loading,
  onSendOtp,
  onSubmit,
  onSwitchToLogin,
}: RegisterWizardProps) {
  const stepTitles: Record<number, { title: string; sub: string }> = {
    1: { title: "Step 1: Recipient", sub: "Your contact details" },
    2: { title: "Step 2: Verification", sub: "Verify Indian mobile number" },
    3: { title: "Step 3: Security", sub: "Set password for mobile app" },
    4: { title: "Step 4: Destination", sub: "Doorstep installation address" },
    5: { title: "Step 5: Units Order", sub: "Hardware order quantity" },
  };

  return (
    <div className="bg-[#FAF9F5] border-2 border-[#3D2310]/35 p-4 sm:p-5 text-[#3D2310] w-[94%] md:w-[90%] h-[94%] flex flex-col justify-between mx-auto my-auto overflow-hidden no-scrollbar shadow-none">
      <ShippingLabelHeader
        title={stepTitles[step]?.title || "Order Locker"}
        subtitle={stepTitles[step]?.sub || "Step-wise configuration"}
      />

      <form onSubmit={onSubmit} className="flex-1 flex flex-col justify-center py-2 space-y-3">
        {/* Step 1: Name & Optional Email */}
        {step === 1 && (
          <div className="space-y-3 text-left">
            <div className="space-y-1">
              <label className="font-mono text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                Full Name (Primary Owner)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-white border-2 border-[#3D2310]/30 pl-9 pr-3 py-2 text-xs text-[#3D2310] placeholder-zinc-400 focus:outline-none focus:border-[#3D2310] font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  disabled={loading}
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white border-2 border-[#3D2310]/30 pl-9 pr-3 py-2 text-xs text-[#3D2310] placeholder-zinc-400 focus:outline-none focus:border-[#3D2310] font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Phone & OTP */}
        {step === 2 && (
          <div className="space-y-3 text-left">
            <div className="space-y-1">
              <label className="font-mono text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                10-Digit Mobile Number
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    disabled={loading}
                    value={phone}
                    onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="w-full bg-white border-2 border-[#3D2310]/30 pl-9 pr-3 py-2 text-xs text-[#3D2310] placeholder-zinc-400 focus:outline-none focus:border-[#3D2310] font-mono"
                  />
                </div>
                <button
                  type="button"
                  disabled={loading || otpCooldown > 0 || phone.length !== 10}
                  onClick={onSendOtp}
                  className="px-3 py-2 bg-[#3D2310] text-[#FAF9F5] hover:bg-[#2B1810] text-[10px] font-mono font-bold uppercase shrink-0 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {otpCooldown > 0 ? `${otpCooldown}s` : "Get OTP"}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                SMS Verification Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  disabled={loading}
                  value={otp}
                  onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit code"
                  className="w-full bg-white border-2 border-[#3D2310]/30 pl-9 pr-3 py-2 text-xs text-[#3D2310] placeholder-zinc-400 focus:outline-none focus:border-[#3D2310] font-mono tracking-widest"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Password */}
        {step === 3 && (
          <div className="space-y-3 text-left">
            <div className="space-y-1">
              <label className="font-mono text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                Create Master Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-white border-2 border-[#3D2310]/30 pl-9 pr-3 py-2 text-xs text-[#3D2310] placeholder-zinc-400 focus:outline-none focus:border-[#3D2310] font-mono tracking-widest"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                Confirm Master Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-white border-2 border-[#3D2310]/30 pl-9 pr-3 py-2 text-xs text-[#3D2310] placeholder-zinc-400 focus:outline-none focus:border-[#3D2310] font-mono tracking-widest"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Address & Pincode */}
        {step === 4 && (
          <div className="space-y-3 text-left">
            <div className="space-y-1">
              <label className="font-mono text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                Doorstep / Flat Address
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <textarea
                  rows={2}
                  required
                  disabled={loading}
                  value={address}
                  onChange={(e) => onAddressChange(e.target.value)}
                  placeholder="Flat / Villa No., Apartment, Street, Landmark"
                  className="w-full bg-white border-2 border-[#3D2310]/30 pl-9 pr-3 py-2 text-xs text-[#3D2310] placeholder-zinc-400 focus:outline-none focus:border-[#3D2310] font-sans resize-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                Postal PIN Code (Bengaluru)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  disabled={loading}
                  value={pincode}
                  onChange={(e) => onPincodeChange(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 560001"
                  className="w-full bg-white border-2 border-[#3D2310]/30 pl-9 pr-3 py-2 text-xs text-[#3D2310] placeholder-zinc-400 focus:outline-none focus:border-[#3D2310] font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Units & Confirmation */}
        {step === 5 && (
          <div className="space-y-3 text-left">
            <div className="space-y-1">
              <label className="font-mono text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                Number of Lockers to Deploy
              </label>
              <div className="flex items-center justify-between bg-white border-2 border-[#3D2310]/30 p-2.5">
                <span className="text-xs font-bold text-[#3D2310] font-mono flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#3D2310]" />
                  Secure Box Standard Units
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUnitsChange(Math.max(1, units - 1))}
                    className="w-7 h-7 rounded border border-[#3D2310]/30 flex items-center justify-center text-[#3D2310] hover:bg-zinc-100 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-black text-sm w-6 text-center">{units}</span>
                  <button
                    type="button"
                    onClick={() => onUnitsChange(Math.min(5, units + 1))}
                    className="w-7 h-7 rounded border border-[#3D2310]/30 flex items-center justify-center text-[#3D2310] hover:bg-zinc-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-600/20 text-[11px] text-[#3D2310] font-mono space-y-0.5">
              <div>• Free doorstep installation & hardware setup</div>
              <div>• 2 user slots included per box (Primary + Co-owner)</div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="pt-2 flex items-center justify-between gap-2">
          {step > 1 ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => onSetStep(step - 1)}
              className="px-3 py-2 bg-transparent border-2 border-[#3D2310]/30 text-[#3D2310] hover:bg-zinc-100 text-xs font-mono font-bold uppercase flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                if (step === 1 && !name.trim()) return;
                if (step === 2 && (!phone || phone.length !== 10 || !otp)) return;
                if (step === 3 && (!password || password !== confirmPassword)) return;
                if (step === 4 && (!address.trim() || pincode.length !== 6)) return;
                onSetStep(step + 1);
              }}
              className="px-4 py-2 bg-[#3D2310] hover:bg-[#2B1810] text-[#FAF9F5] text-xs font-mono font-bold uppercase flex items-center gap-1 ml-auto cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono font-black uppercase flex items-center gap-1.5 ml-auto shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirm Order</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Switch to Login */}
      <div className="pt-2 border-t-2 border-dashed border-[#3D2310]/30 text-center">
        <p className="text-[11px] text-zinc-600">
          Already registered?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold text-[#3D2310] hover:underline underline-offset-2 ml-1 cursor-pointer"
          >
            Sign in to existing account
          </button>
        </p>
      </div>
    </div>
  );
}
