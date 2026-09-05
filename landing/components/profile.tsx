"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  MapPin,
  Package,
  ShieldCheck,
  Plus,
  Minus,
  KeyRound,
  Phone,
  Mail,
  Home,
  Check,
  Clock,
} from "lucide-react";

interface StoredUserData {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  pincode?: string;
  units?: number;
  orderStatus?: "pending" | "approved" | "rejected";
  assignedDevices?: string[];
}

interface ProfileProps {
  mode?: "register" | "login";
}

export function Profile({ mode }: ProfileProps = {}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<StoredUserData | null>(null);

  // Toggle between Sign In (false) and Register / Order (true)
  const [isRegister, setIsRegister] = useState(mode === "register");

  useEffect(() => {
    if (mode === "register") {
      setIsRegister(true);
      setStep(1);
      clearMessages();
    } else if (mode === "login") {
      setIsRegister(false);
      clearMessages();
    }
  }, [mode]);

  // Step-wise registration: 1 to 5
  const [step, setStep] = useState<number>(1);

  // Form Fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regOtp, setRegOtp] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regPincode, setRegPincode] = useState("");
  const [regUnits, setRegUnits] = useState<number>(1);

  // OTP cooldown timer state (60-second rate limit)
  const [otpCooldown, setOtpCooldown] = useState<number>(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Login form fields
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4300/api";

  // Check login state on mount and fetch fresh order status
  useEffect(() => {
    try {
      const loggedIn = localStorage.getItem("smartbox_logged_in") === "true";
      const rawUser = localStorage.getItem("smartbox_user_data");
      const token = localStorage.getItem("smartbox_token");

      if (loggedIn) {
        setIsLoggedIn(true);
        if (rawUser) {
          setCurrentUser(JSON.parse(rawUser));
        } else {
          const simpleName = localStorage.getItem("smartbox_user") || "Customer";
          setCurrentUser({ name: simpleName });
        }

        // Fetch fresh profile with orderStatus and assignedDevices
        if (token) {
          fetch(`${apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.user) {
                const refreshed: StoredUserData = {
                  id: data.user.id,
                  name: data.user.name,
                  phone: data.user.phone,
                  email: data.user.email,
                  address: data.user.address,
                  pincode: data.user.pincode,
                  units: data.user.units || 1,
                  orderStatus: data.user.orderStatus || "pending",
                  assignedDevices: data.user.assignedDevices || [],
                };
                setCurrentUser(refreshed);
                localStorage.setItem("smartbox_user_data", JSON.stringify(refreshed));
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      // ignore
    }
  }, [apiUrl]);

  // Manage 60-second OTP cooldown countdown
  useEffect(() => {
    if (otpCooldown > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setOtpCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, [otpCooldown]);

  // Clear messages
  const clearMessages = () => {
    setErrorMessage(null);
    setInfoMessage(null);
  };

  // --- STEP 1: Name and Email ---
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!regName.trim()) {
      setErrorMessage("Please enter your full name");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setStep(2);
  };

  // --- STEP 2: Mobile Number ---
  const handlePhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 10);
    setRegPhone(digitsOnly);
    clearMessages();
  };

  const handleStep2Next = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    // Indian mobile number rule: 10 digits starting with 6, 7, 8, or 9
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(regPhone)) {
      setErrorMessage("Enter a 10-digit mobile number starting with 6, 7, 8, or 9");
      return;
    }

    setLoading(true);
    try {
      // 1. Check if phone number is already registered
      const checkRes = await fetch(`${apiUrl}/auth/check-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: regPhone }),
      });

      const checkData = await checkRes.json();
      if (checkData.exists) {
        setErrorMessage("This mobile number is already registered. Please sign in instead.");
        setLoading(false);
        return;
      }

      // 2. If available, send OTP immediately
      await triggerSendOtp();
      setStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not verify phone number. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger Send OTP with 60s rate limit
  const triggerSendOtp = async () => {
    if (otpCooldown > 0) return;

    setLoading(true);
    clearMessages();

    try {
      const res = await fetch(`${apiUrl}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: regPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      // Start 60s cooldown timer (once every 1 minute rate limit)
      setOtpCooldown(60);
      setInfoMessage("Verification code sent to +91 " + regPhone);

      if (data.data?.demoOtp) {
        setInfoMessage(`Code sent! (Demo Code: ${data.data.demoOtp})`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 3: OTP Verification ---
  const handleStep3Next = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (regOtp.trim().length !== 6) {
      setErrorMessage("Please enter the 6-digit code received on your phone");
      return;
    }

    setStep(4);
  };

  // --- STEP 4: Password & Confirm Password ---
  const handleStep4Next = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (regPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setStep(5);
  };

  // --- STEP 5: Address, Bangalore Pin Code & Number of Units ---
  const handlePincodeChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 6);
    setRegPincode(digitsOnly);
    clearMessages();
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!regAddress.trim()) {
      setErrorMessage("Please enter your delivery street address or house number");
      return;
    }

    // Must be 6 digits and start with 560 (Bengaluru limit)
    if (!/^560\d{3}$/.test(regPincode)) {
      setErrorMessage("We currently deliver only within Bengaluru (PIN codes starting with 560)");
      return;
    }

    if (regUnits < 1) {
      setErrorMessage("Please select at least 1 unit");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/auth/register-with-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          otp: regOtp.trim(),
          password: regPassword,
          address: regAddress.trim(),
          pincode: regPincode.trim(),
          units: regUnits,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account and place order");
      }

      // Success: Save user profile and log them in
      const userObj: StoredUserData = {
        id: data.user?.id,
        name: data.user?.name || regName.trim(),
        phone: data.user?.phone || regPhone.trim(),
        email: data.user?.email || regEmail.trim(),
        address: regAddress.trim(),
        pincode: regPincode.trim(),
        units: regUnits,
        orderStatus: data.user?.orderStatus || "pending",
        assignedDevices: data.user?.assignedDevices || [],
      };

      localStorage.setItem("smartbox_logged_in", "true");
      localStorage.setItem("smartbox_user", userObj.name || "Customer");
      localStorage.setItem("smartbox_user_data", JSON.stringify(userObj));
      if (data.token) {
        localStorage.setItem("smartbox_token", data.token);
      }

      setCurrentUser(userObj);
      setIsLoggedIn(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- SIGN IN HANDLER ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage("Please enter your phone or email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Incorrect phone/email or password");
      }

      const userObj: StoredUserData = {
        id: data.user?.id,
        name: data.user?.name || "Customer",
        phone: data.user?.phone,
        email: data.user?.email,
        address: data.user?.address,
        pincode: data.user?.pincode,
        units: data.user?.units || 1,
        orderStatus: data.user?.orderStatus || "pending",
        assignedDevices: data.user?.assignedDevices || [],
      };

      localStorage.setItem("smartbox_logged_in", "true");
      localStorage.setItem("smartbox_user", userObj.name || "Customer");
      localStorage.setItem("smartbox_user_data", JSON.stringify(userObj));
      if (data.token) {
        localStorage.setItem("smartbox_token", data.token);
      }

      setCurrentUser(userObj);
      setIsLoggedIn(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  // --- LOG OUT ---
  const handleLogout = () => {
    localStorage.removeItem("smartbox_logged_in");
    localStorage.removeItem("smartbox_user");
    localStorage.removeItem("smartbox_user_data");
    localStorage.removeItem("smartbox_token");
    setIsLoggedIn(false);
    setCurrentUser(null);
    setStep(1);
    setLoginIdentifier("");
    setLoginPassword("");
    setRegName("");
    setRegEmail("");
    setRegPhone("");
    setRegOtp("");
    setRegPassword("");
    setRegConfirmPassword("");
    setRegAddress("");
    setRegPincode("");
    setRegUnits(1);
    clearMessages();
  };

  // ==========================================
  // SHARED COMPACT STAMP / BARCODE HEADER
  // ==========================================
  const ShippingLabelHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="border-b-2 border-dashed border-[#3D2310]/30 pb-2 mb-2">
      {/* Top Waybill Meta Bar */}
      <div className="flex items-center justify-between font-mono text-[9px] text-[#3D2310]/80 uppercase tracking-wider pb-1 border-b border-[#3D2310]/15">
        <span className="font-bold flex items-center gap-1">
          <span>⬆⬆</span> SECURE BOX DISPATCH
        </span>
        <span className="bg-[#3D2310] text-[#FAF9F5] px-1.5 py-0.5  font-black text-[8.5px]">
          BLR / 560
        </span>
      </div>

      {/* Barcode Strip & Title in a single compact row */}
      <div className="pt-1.5 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm sm:text-base font-black tracking-tight text-[#3D2310] uppercase leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[10.5px] text-zinc-600 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {/* Compact Barcode */}
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center h-4 w-28 gap-[1px] overflow-hidden opacity-85">
            {[2, 1, 2, 3, 1, 2, 1, 3, 2, 1, 3, 2, 1, 2, 1, 2, 3, 1, 3, 1, 2, 1, 3, 2, 1, 3].map((w, idx) => (
              <div
                key={idx}
                className="bg-[#2B1810] h-full"
                style={{ width: `${w * 1.1}px` }}
              />
            ))}
          </div>
          <span className="font-mono text-[7.5px] tracking-wider text-[#3D2310]/70 font-bold uppercase">
            *SBX-BLR-560*
          </span>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // VIEW 1: LOGGED IN (DELIVERED WAYBILL CARD)
  // ==========================================
  if (isLoggedIn) {
    const initials = (currentUser?.name || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className="flex-1 flex items-center justify-center w-full h-full font-sans p-1 sm:p-2">
        {/* Flat Adhesive Shipping Sticker (ZERO shadow, ZERO scrollbar) */}
        <div className="bg-[#FAF9F5] border-2 border-[#3D2310]/35 p-4 sm:p-5 text-[#3D2310] w-[94%] md:w-[90%] h-[94%] flex flex-col justify-between  mx-auto my-auto overflow-hidden no-scrollbar shadow-none">
          {/* Waybill Header */}
          <ShippingLabelHeader
            title="Delivery Manifest"
            subtitle="Customer Account & Order Details"
          />

          {/* Stamped Status Content */}
          <div className="flex-1 flex flex-col justify-center py-2 space-y-3">
            {/* Customer Badge & Ink Stamp */}
            <div className="flex items-center justify-between gap-3 bg-white p-3  border-2 border-[#3D2310]/20">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-11 h-11  bg-amber-500/15 border border-amber-600/30 flex items-center justify-center text-[#3D2310] font-black text-sm shrink-0 font-mono">
                  {initials || "U"}
                </div>
                <div className="overflow-hidden">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 block font-bold">RECIPIENT</span>
                  <h4 className="font-black text-sm text-[#3D2310] truncate">
                    {currentUser?.name || "Customer"}
                  </h4>
                  <p className="text-xs text-zinc-600 font-mono truncate font-semibold">
                    {currentUser?.phone ? `+91 ${currentUser.phone}` : currentUser?.email || "Verified"}
                  </p>
                </div>
              </div>

              {/* Rubber Stamp: Dynamic based on orderStatus */}
              {currentUser?.orderStatus === "approved" ? (
                <div className="border-2 border-emerald-700 px-2.5 py-1 text-center font-mono rotate-[-3deg] bg-emerald-50 shrink-0">
                  <span className="text-[8px] font-black text-emerald-800 tracking-wider block">STATUS</span>
                  <span className="text-[11px] font-black text-emerald-700">APPROVED</span>
                </div>
              ) : currentUser?.orderStatus === "rejected" ? (
                <div className="border-2 border-rose-700 px-2.5 py-1 text-center font-mono rotate-[-3deg] bg-rose-50 shrink-0">
                  <span className="text-[8px] font-black text-rose-800 tracking-wider block">STATUS</span>
                  <span className="text-[11px] font-black text-rose-700">REJECTED</span>
                </div>
              ) : (
                <div className="border-2 border-amber-700 px-2.5 py-1 text-center font-mono rotate-[-3deg] bg-amber-50 shrink-0">
                  <span className="text-[8px] font-black text-amber-800 tracking-wider block">STATUS</span>
                  <span className="text-[11px] font-black text-amber-700">PENDING</span>
                </div>
              )}
            </div>

            {/* Delivery Destination Box */}
            <div className="bg-white p-3  border-2 border-[#3D2310]/20 text-xs space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-zinc-200">
                <span className="text-zinc-500 flex items-center gap-1.5 font-sans font-bold">
                  <MapPin className="w-4 h-4 text-amber-800" /> DESTINATION:
                </span>
                <span className="font-black text-[#3D2310]">
                  {currentUser?.pincode ? `BENGALURU - ${currentUser.pincode}` : "BENGALURU"}
                </span>
              </div>

              {currentUser?.address && (
                <div className="text-xs text-zinc-700 font-sans pt-0.5 leading-snug">
                  {currentUser.address}
                </div>
              )}

              <div className="flex items-center justify-between font-sans pt-1.5 border-t border-zinc-200 text-xs">
                <span className="text-zinc-500 flex items-center gap-1.5 font-bold">
                  <Package className="w-4 h-4 text-amber-800" /> Lockers Ordered:
                </span>
                <span className="font-black text-[#3D2310] font-mono text-sm">
                  {currentUser?.units || 1} Unit{(currentUser?.units || 1) > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Courier Dispatch Note */}
            {currentUser?.orderStatus === "approved" ? (
              <div className="bg-emerald-50 border border-emerald-600/30 p-2.5 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <div className="text-[11px] text-emerald-950 leading-tight">
                  <span className="font-bold">Order Approved!</span> {currentUser.assignedDevices?.length ? `Assigned Locker: ${currentUser.assignedDevices.join(", ")}.` : "Hardware provisioned."} Our team is dispatching your unit for doorstep installation.
                </div>
              </div>
            ) : currentUser?.orderStatus === "rejected" ? (
              <div className="bg-rose-50 border border-rose-600/30 p-2.5 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <div className="text-[11px] text-rose-950 leading-tight">
                  <span className="font-bold">Delivery Notice:</span> We are currently unable to service this address. Please contact customer support.
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/15 border border-amber-600/30 p-2.5 text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-800 shrink-0" />
                <div className="text-[11px] text-[#3D2310] leading-tight">
                  <span className="font-bold">Under Review:</span> Your order request has reached the Bangalore hub. Once approved, your assigned locker ID will appear here.
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar: Log Out */}
          <div className="pt-2 border-t-2 border-dashed border-[#3D2310]/30">
            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-zinc-200 hover:bg-zinc-300 text-[#3D2310] font-bold text-xs  flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#3D2310]/20 uppercase tracking-wider"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: STEP-WISE REGISTRATION (STEPS 1-5)
  // ==========================================
  if (isRegister) {
    return (
      <div className="flex-1 flex items-center justify-center w-full h-full font-sans p-1 sm:p-2">
        {/* Flat Adhesive Shipping Sticker (ZERO shadow, ZERO scrollbar) */}
        <div className="bg-[#FAF9F5] border-2 border-[#3D2310]/35 p-4 sm:p-5 text-[#3D2310] w-[94%] md:w-[90%] h-[94%] flex flex-col justify-between  mx-auto my-auto overflow-hidden no-scrollbar shadow-none">
          {/* Header */}
          <div>
            <ShippingLabelHeader
              title="Delivery Signup"
              subtitle="Step-by-step order registration"
            />

            {/* Step Indicator Row */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#3D2310]/15">
              <div className="flex items-center gap-1.5">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setStep((s) => Math.max(1, s - 1));
                    }}
                    className="p-1  hover:bg-[#3D2310]/10 text-[#3D2310] cursor-pointer"
                    title="Back to previous step"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="text-[11px] font-black text-[#3D2310] font-mono uppercase">
                  STEP {step} OF 5:{" "}
                  <span className="font-sans font-bold text-zinc-700">
                    {step === 1 && "Your Name & Email"}
                    {step === 2 && "Mobile Number"}
                    {step === 3 && "OTP Verification"}
                    {step === 4 && "Choose Password"}
                    {step === 5 && "Delivery & Units"}
                  </span>
                </span>
              </div>

              {/* Progress bars */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 -sm transition-all duration-300 ${i === step
                      ? "w-4 bg-[#3D2310]"
                      : i < step
                        ? "w-2.5 bg-emerald-600"
                        : "w-1.5 bg-zinc-300"
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="my-1 p-2  bg-rose-50 border border-rose-300 text-rose-800 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="my-1 p-2  bg-amber-50 border border-amber-300 text-[#3D2310] text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-amber-700" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Form Step Bodies (Spacious, large inputs, no crowded feeling) */}
          <div className="flex-1 flex flex-col justify-center py-1">
            {/* STEP 1: Name and Email */}
            {step === 1 && (
              <form onSubmit={handleStep1Next} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-[#3D2310] font-mono flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-800" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full py-3 px-3.5 border-2 border-[#3D2310]/30  text-sm bg-white font-medium text-[#3D2310] focus:outline-none focus:border-[#3D2310] focus:ring-1 focus:ring-[#3D2310] transition-all shadow-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-[#3D2310] font-mono flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-800" /> Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full py-3 px-3.5 border-2 border-[#3D2310]/30  text-sm bg-white font-medium text-[#3D2310] focus:outline-none focus:border-[#3D2310] focus:ring-1 focus:ring-[#3D2310] transition-all shadow-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 bg-[#3D2310] hover:bg-[#261508] text-[#FAF9F5] font-black text-xs  flex items-center justify-center gap-2 transition-colors cursor-pointer uppercase tracking-wider font-mono shadow-none"
                >
                  Next Section <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: Mobile Number (6, 7, 8, 9 only, checks if exists) */}
            {step === 2 && (
              <form onSubmit={handleStep2Next} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-[#3D2310] font-mono flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-800" /> Mobile Number
                  </label>
                  <div className="flex items-center  border-2 border-[#3D2310]/30 bg-white focus-within:border-[#3D2310] focus-within:ring-1 focus-within:ring-[#3D2310] overflow-hidden">
                    <span className="px-3 py-3 text-sm font-black text-zinc-600 bg-zinc-100 border-r border-[#3D2310]/20 font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={regPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full py-3 px-3.5 text-base bg-transparent focus:outline-none font-mono tracking-widest text-[#3D2310] font-bold"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-600 font-medium pt-0.5">
                    10-digit number starting with 6, 7, 8, or 9.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || regPhone.length !== 10}
                  className="w-full mt-2 py-3 bg-[#3D2310] hover:bg-[#261508] text-[#FAF9F5] font-black text-xs  flex items-center justify-center gap-2 transition-colors cursor-pointer uppercase tracking-wider font-mono disabled:opacity-50 shadow-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying Number...
                    </>
                  ) : (
                    <>
                      Verify & Send OTP <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 3: OTP Verification (60s rate-limit cooldown) */}
            {step === 3 && (
              <form onSubmit={handleStep3Next} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-[#3D2310] font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-800" /> 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={regOtp}
                    onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full py-3.5 px-4 border-2 border-[#3D2310]/30  text-center text-xl font-mono tracking-[0.4em] font-black bg-white focus:outline-none focus:border-[#3D2310] focus:ring-1 focus:ring-[#3D2310] transition-all shadow-none"
                  />
                </div>

                {/* Cooldown Timer / Resend Button */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[11px] text-zinc-600">No code received?</span>
                  {otpCooldown > 0 ? (
                    <span className="text-xs text-amber-900 font-bold bg-amber-100 px-2 py-0.5 ">
                      Resend in {otpCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={triggerSendOtp}
                      disabled={loading}
                      className="text-xs font-bold text-amber-800 hover:underline cursor-pointer uppercase"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={regOtp.length !== 6}
                  className="w-full mt-2 py-3 bg-[#3D2310] hover:bg-[#261508] text-[#FAF9F5] font-black text-xs  flex items-center justify-center gap-2 transition-colors cursor-pointer uppercase tracking-wider font-mono disabled:opacity-50 shadow-none"
                >
                  Verify Code <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 4: Password and Confirm Password */}
            {step === 4 && (
              <form onSubmit={handleStep4Next} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-[#3D2310] font-mono flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-800" /> Account Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full py-3 px-3.5 border-2 border-[#3D2310]/30  text-sm bg-white font-medium text-[#3D2310] focus:outline-none focus:border-[#3D2310] focus:ring-1 focus:ring-[#3D2310] transition-all shadow-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-[#3D2310] font-mono">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full py-3 px-3.5 border-2 border-[#3D2310]/30  text-sm bg-white font-medium text-[#3D2310] focus:outline-none focus:border-[#3D2310] focus:ring-1 focus:ring-[#3D2310] transition-all shadow-none"
                  />
                  {regConfirmPassword && (
                    <div className="text-[11px] pt-0.5">
                      {regPassword === regConfirmPassword ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono">
                          <Check className="w-3.5 h-3.5" /> PASSWORDS MATCH
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold font-mono">
                          PASSWORDS DO NOT MATCH
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!regPassword || regPassword !== regConfirmPassword}
                  className="w-full mt-2 py-3 bg-[#3D2310] hover:bg-[#261508] text-[#FAF9F5] font-black text-xs  flex items-center justify-center gap-2 transition-colors cursor-pointer uppercase tracking-wider font-mono disabled:opacity-50 shadow-none"
                >
                  Next Section <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 5: Delivery Address, Bangalore Pin Code & Units Needed */}
            {/* Laid out generously with PIN Code & Units side-by-side to prevent any scrolling */}
            {step === 5 && (
              <form onSubmit={handleFinalSubmit} className="space-y-3">
                {/* Bangalore routing guide banner */}
                <div className="p-2 -md bg-amber-500/15 border border-amber-700/30 text-[11px] text-[#3D2310] flex items-center gap-2 font-sans">
                  <MapPin className="w-4 h-4 text-amber-800 shrink-0" />
                  <div>
                    <span className="font-bold uppercase font-mono text-[9.5px] block">
                      📍 BENGALURU ONLY (PIN 560xxx)
                    </span>
                    Deliveries currently limited to Bengaluru addresses only.
                  </div>
                </div>

                {/* Street Address */}
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-[#3D2310] font-mono flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-amber-800" /> Street / House Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="House/Flat No., Street, Area"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full py-2.5 px-3 border-2 border-[#3D2310]/30  text-sm bg-white font-medium text-[#3D2310] focus:outline-none focus:border-[#3D2310] focus:ring-1 focus:ring-[#3D2310] transition-all shadow-none"
                  />
                </div>

                {/* 2-Column Grid for PIN Code & Quantity (Saves vertical height, makes both big & clean) */}
                <div className="grid grid-cols-2 gap-3">
                  {/* PIN Code Column */}
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-[#3D2310] font-mono block">
                      PIN Code (560xxx)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="560034"
                      value={regPincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      className="w-full py-2.5 px-3 border-2 border-[#3D2310]/30  text-sm font-mono font-bold bg-white text-[#3D2310] focus:outline-none focus:border-[#3D2310] focus:ring-1 focus:ring-[#3D2310] transition-all shadow-none tracking-wider"
                    />
                  </div>

                  {/* Quantity Column */}
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-[#3D2310] font-mono block">
                      Units Needed
                    </label>
                    <div className="flex items-center justify-between border-2 border-[#3D2310]/30 bg-white  p-1 h-[42px]">
                      <button
                        type="button"
                        disabled={regUnits <= 1}
                        onClick={() => setRegUnits((u) => Math.max(1, u - 1))}
                        className="w-8 h-8  bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-700 font-bold flex items-center justify-center disabled:opacity-30 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-black text-base text-[#3D2310] font-mono">
                        {regUnits}
                      </span>
                      <button
                        type="button"
                        disabled={regUnits >= 10}
                        onClick={() => setRegUnits((u) => Math.min(10, u + 1))}
                        className="w-8 h-8  bg-[#3D2310] hover:bg-[#261508] text-[#FAF9F5] font-bold flex items-center justify-center disabled:opacity-30 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !regAddress.trim() || !/^560\d{3}$/.test(regPincode)}
                  className="w-full mt-2 py-3 bg-[#3D2310] hover:bg-[#261508] text-[#FAF9F5] font-black text-xs  flex items-center justify-center gap-2 transition-colors cursor-pointer uppercase tracking-wider font-mono disabled:opacity-50 shadow-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Placing Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Place Order & Register
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Switch to Sign In */}
          <div className="pt-2 border-t-2 border-dashed border-[#3D2310]/30 text-center">
            <p className="text-[11px] text-zinc-600">
              Already placed an order?{" "}
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setIsRegister(false);
                }}
                className="text-[#3D2310] font-black underline hover:text-amber-900 cursor-pointer uppercase font-mono text-[11px]"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: SIGN IN (WAYBILL LOGIN CARD)
  // ==========================================
  return (
    <div className="flex-1 flex items-center justify-center w-full h-full font-sans p-1 sm:p-2">
      {/* Flat Adhesive Shipping Sticker (ZERO shadow, ZERO scrollbar) */}
      <div className="bg-[#FAF9F5] border-2 border-[#3D2310]/35 p-4 sm:p-5 text-[#3D2310] w-[94%] md:w-[90%] h-[94%] flex flex-col justify-between  mx-auto my-auto overflow-hidden no-scrollbar shadow-none">
        {/* Shipping Label Header */}
        <ShippingLabelHeader
          title="Sign In"
          subtitle="Access your delivery waybill & locker order"
        />

        {/* Feedback message */}
        {errorMessage && (
          <div className="my-1.5 p-2  bg-rose-50 border border-rose-300 text-rose-800 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sign In Form with large, spacious inputs */}
        <div className="flex-1 flex flex-col justify-center py-2">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-[#3D2310] font-mono flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-800" /> Mobile Number or Email
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 9876543210 or email"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full py-3.5 px-4 border-2 border-[#3D2310]/30  text-sm bg-white font-medium text-[#3D2310] focus:outline-none focus:border-[#3D2310] focus:ring-1 focus:ring-[#3D2310] transition-all shadow-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-[#3D2310] font-mono flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-800" /> Password
              </label>
              <input
                type="password"
                required
                placeholder="Your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full py-3.5 px-4 border-2 border-[#3D2310]/30  text-sm bg-white font-medium text-[#3D2310] focus:outline-none focus:border-[#3D2310] focus:ring-1 focus:ring-[#3D2310] transition-all shadow-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-[#3D2310] hover:bg-[#261508] text-[#FAF9F5] font-black text-xs  flex items-center justify-center gap-2 transition-colors cursor-pointer uppercase tracking-wider font-mono disabled:opacity-50 shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Switch to Register */}
        <div className="pt-2 border-t-2 border-dashed border-[#3D2310]/30 text-center">
          <p className="text-[11px] text-zinc-600">
            Need a secure delivery box?{" "}
            <button
              type="button"
              onClick={() => {
                clearMessages();
                setStep(1);
                setIsRegister(true);
              }}
              className="text-[#3D2310] font-black underline hover:text-amber-900 cursor-pointer uppercase font-mono text-[11px]"
            >
              Order & Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
