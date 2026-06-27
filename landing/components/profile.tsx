import React, { useState, useEffect } from "react";
import { User, LogOut, CheckCircle } from "lucide-react";

export function Profile() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStyle, setAnimationStyle] = useState<string>("slide-right");

  const ANIMATION_STYLES = [
    "slide-right",
    "slide-left",
    "slide-up",
    "slide-down",
    "zoom-in",
    "zoom-out",
    "rotate-left",
    "rotate-right"
  ];

  const getStickerAnimationClasses = (style: string, active: boolean) => {
    if (active) {
      return "opacity-100 translate-x-0 translate-y-0 scale-100 rotate-[0.5deg]";
    }
    switch (style) {
      case "slide-left":
        return "opacity-0 -translate-x-12 scale-95 rotate-[-2deg] pointer-events-none";
      case "slide-up":
        return "opacity-0 -translate-y-12 scale-95 rotate-[2deg] pointer-events-none";
      case "slide-down":
        return "opacity-0 translate-y-12 scale-95 rotate-[-2deg] pointer-events-none";
      case "zoom-in":
        return "opacity-0 scale-90 rotate-[0deg] pointer-events-none";
      case "zoom-out":
        return "opacity-0 scale-105 rotate-[1deg] pointer-events-none";
      case "rotate-left":
        return "opacity-0 scale-95 -rotate-6 pointer-events-none";
      case "rotate-right":
        return "opacity-0 scale-95 rotate-6 pointer-events-none";
      case "slide-right":
      default:
        return "opacity-0 translate-x-12 scale-95 rotate-[2deg] pointer-events-none";
    }
  };

  const toggleRegisterState = (val: boolean) => {
    if (isAnimating) return;
    const nextStyle = ANIMATION_STYLES[Math.floor(Math.random() * ANIMATION_STYLES.length)];
    setAnimationStyle(nextStyle);
    setIsAnimating(true);
    setTimeout(() => {
      setIsRegister(val);
      const enterStyle = ANIMATION_STYLES[Math.floor(Math.random() * ANIMATION_STYLES.length)];
      setAnimationStyle(enterStyle);
      setIsAnimating(false);
    }, 300);
  };

  // Register Fields
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regOtp, setRegOtp] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regUnits, setRegUnits] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Login Fields
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    const status = localStorage.getItem("smartbox_logged_in");
    if (status === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginIdentifier.trim()) {
      localStorage.setItem("smartbox_logged_in", "true");
      localStorage.setItem("smartbox_user", loginIdentifier);
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("smartbox_logged_in");
    localStorage.removeItem("smartbox_user");
    setIsLoggedIn(false);
    setLoginIdentifier("");
    setLoginPassword("");
    setRegEmail("");
    setRegPhone("");
    setRegOtp("");
    setRegPassword("");
    setRegConfirmPassword("");
    setRegAddress("");
    setRegUnits("");
    setOtpSent(false);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regEmail.trim()) {
      localStorage.setItem("smartbox_logged_in", "true");
      localStorage.setItem("smartbox_user", regEmail);
      setIsLoggedIn(true);
    }
  };

  const storedUser = typeof window !== "undefined" ? localStorage.getItem("smartbox_user") || "User" : "User";

  if (isLoggedIn) {
    return (
      <div className="flex-1 flex items-center justify-center w-full h-full font-sans">
        {/* Access Pass Sticker: takes 85% width and 85% height of parent */}
        <div className="bg-[#F0FDF4] border-2 border-green-300 p-5 shadow-xl rotate-[-1deg] text-[#3D2310] w-[85%] h-[85%] flex flex-col justify-between rounded-xl mx-auto my-auto">
          <div className="border-b border-green-200 pb-2 mb-2 flex justify-between items-center">
            <span className="text-[1.1vh] font-bold text-green-800 tracking-wider">MEMBER ACCESS PASS</span>
            <span className="text-[1vh] font-bold bg-green-200 text-green-800 px-1.5 py-0.5 rounded">PASSED</span>
          </div>

          <div className="flex-1 flex flex-col justify-around py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#3D2310]">{storedUser}</h4>
                <p className="text-[1.1vh] text-green-700 font-mono flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> smartbox_owner_active
                </p>
              </div>
            </div>

            <div className="bg-white/80 p-2.5 rounded border border-green-100 space-y-1">
              <div className="text-[9px] text-zinc-500 font-mono">LOCKER TELEMETRY</div>
              <div className="text-[1.1vh] flex justify-between">
                <span>Locker Status:</span>
                <span className="font-bold text-green-700">Online & Secured</span>
              </div>
              <div className="text-[1.1vh] flex justify-between">
                <span>Power Level:</span>
                <span className="font-bold text-green-700">89% (Optimal)</span>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>

            <div className="mt-3 pt-2 border-t border-green-200 flex flex-col items-center">
              <div className="h-4 w-full bg-[linear-gradient(to_right,#000_1px,transparent_1px,#000_3px,transparent_3px,#000_6px,transparent_6px)]" />
              <span className="text-[8px] font-mono text-zinc-500 mt-1">LOCKER-UID-PASS-449-OK</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center w-full h-full font-sans">
      {/* Sticker: takes 85% width and 90% height of parent BoxBg */}
      <div className={`bg-white border-2 border-zinc-300 p-5 shadow-xl text-[#3D2310] w-[85%] h-[90%] flex flex-col justify-between rounded-xl mx-auto my-auto transition-all duration-300 ease-in-out transform ${
        getStickerAnimationClasses(animationStyle, !isAnimating)
      }`}>

        {/* Title inside the sticker */}
        <div className="border-b border-zinc-200 pb-2 mb-2">
          <h2 className="text-[2.2vh] font-black text-[#3D2310] font-merriweather text-center">
            {isRegister ? "Register Account" : "Identity Login"}
          </h2>
        </div>

        <div className="flex-1 flex flex-col justify-center py-2">
          {isRegister ? (
            <form onSubmit={handleRegister} className="space-y-2">
              {/* Email Address */}
              <input
                type="email"
                required
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-white/70 focus:outline-none focus:border-[#d9ab7f] focus:ring-1 focus:ring-[#d9ab7f]"
              />

              {/* Phone Number + Get OTP */}
              <div className="flex gap-2.5 w-full">
                <input
                  type="tel"
                  required
                  placeholder="Phone Number"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-[65%] p-2 border border-zinc-300 rounded-lg text-xs bg-white/70 focus:outline-none focus:border-[#d9ab7f] focus:ring-1 focus:ring-[#d9ab7f]"
                />
                <button
                  type="button"
                  onClick={() => setOtpSent(true)}
                  className="w-[35%] py-2 bg-[#3D2310] text-[#FDFBF7] font-bold text-[10px] rounded-lg hover:bg-[#261508] transition-colors cursor-pointer text-center"
                >
                  {otpSent ? "Resend" : "Get OTP"}
                </button>
              </div>

              {/* Enter OTP */}
              <input
                type="text"
                required
                placeholder="Enter OTP"
                value={regOtp}
                onChange={(e) => setRegOtp(e.target.value)}
                className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-white/70 focus:outline-none focus:border-[#d9ab7f] focus:ring-1 focus:ring-[#d9ab7f]"
              />

              {/* Password */}
              <input
                type="password"
                required
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-white/70 focus:outline-none focus:border-[#d9ab7f] focus:ring-1 focus:ring-[#d9ab7f]"
              />

              {/* Confirm Password */}
              <input
                type="password"
                required
                placeholder="Confirm Password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-white/70 focus:outline-none focus:border-[#d9ab7f] focus:ring-1 focus:ring-[#d9ab7f]"
              />

              {/* Address (labeled 'adress' as per image spec) */}
              <input
                type="text"
                required
                placeholder="Adress"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-white/70 focus:outline-none focus:border-[#d9ab7f] focus:ring-1 focus:ring-[#d9ab7f]"
              />

              {/* Number of units to order */}
              <input
                type="number"
                required
                placeholder="Number of units to order"
                value={regUnits}
                onChange={(e) => setRegUnits(e.target.value)}
                className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-white/70 focus:outline-none focus:border-[#d9ab7f] focus:ring-1 focus:ring-[#d9ab7f]"
              />

              <button
                type="submit"
                className="w-full py-2.5 bg-[#3D2310] text-[#FDFBF7] font-bold text-xs rounded-lg hover:bg-[#261508] transition-colors mt-2 cursor-pointer shadow-md shadow-[#3D2310]/10"
              >
                Register and Place order
              </button>
              <p className="text-[2.1vh] text-center text-zinc-500 mt-2">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => toggleRegisterState(false)}
                  className="text-[#3D2310] font-black underline cursor-pointer"
                >
                  Log In
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Email or Phone Number"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full p-2.5 border border-zinc-300 rounded-lg text-xs bg-white/70 focus:outline-none focus:border-[#d9ab7f] focus:ring-1 focus:ring-[#d9ab7f]"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-2.5 border border-zinc-300 rounded-lg text-xs bg-white/70 focus:outline-none focus:border-[#d9ab7f] focus:ring-1 focus:ring-[#d9ab7f]"
              />
              <button
                type="submit"
                className="w-full py-3 bg-[#3D2310] text-[#FDFBF7] font-bold text-xs rounded-lg hover:bg-[#261508] transition-colors mt-2 cursor-pointer shadow-md shadow-[#3D2310]/10"
              >
                Verify Identity
              </button>
              <p className="text-[3.1vh] text-center text-zinc-500 mt-4">
                Need access?{" "}
                <button
                  type="button"
                  onClick={() => toggleRegisterState(true)}
                  className="text-[#3D2310] font-black underline cursor-pointer"
                >
                  Register
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
