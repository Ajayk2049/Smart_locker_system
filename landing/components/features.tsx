"use client";

import React from "react";
import { Smartphone, Lock, CloudRain, BellRing } from "lucide-react";

export function Features() {
  const featureList = [
    {
      id: "remote",
      icon: Smartphone,
      title: "Remote Access",
      rotate: "rotate-[-1deg]",
    },
    {
      id: "push-lock",
      icon: Lock,
      title: "Push to Lock",
      rotate: "rotate-[1deg]",
    },
    {
      id: "weather",
      icon: CloudRain,
      title: "Weather Proof",
      rotate: "rotate-[1.2deg]",
    },
    {
      id: "alerts",
      icon: BellRing,
      title: "Live Alerts",
      rotate: "rotate-[-1.2deg]",
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between py-2 w-full font-sans text-[#3D2310] select-none">
      {/* Title */}
      <div className="text-center pt-1">
        <h2 className="text-[2.6vh] font-black text-[#3D2310] uppercase tracking-tight">
          Smart Features
        </h2>
      </div>

      {/* Flushed Sticker Cards (No Shadows, Reduced Height, Filled Look) */}
      <div className="grid grid-cols-2 gap-3 my-auto w-full px-1">
        {featureList.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`bg-[#e7cfb8] border border-[#3D2310] py-10.5 px-2 flex flex-col items-center justify-center text-center shadow-none transition-all duration-200 cursor-pointer ${item.rotate} hover:rotate-0 hover:scale-[1.03] hover:border-[#3D2310]/40`}
            >
              <Icon className="w-[6.4vh] h-[6.4vh] max-w-[46px] max-h-[46px] text-[#3D2310] stroke-[2.2] mb-1.5" />
              <span className="font-black text-[1.45vh] sm:text-[1.55vh] leading-tight tracking-tight text-[#3D2310] uppercase">
                {item.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom spacer / subtle label to balance vertical alignment */}
      <div className="text-center pb-1">
        <span className="font-mono text-[9px] font-bold text-[#3D2310]/60 uppercase tracking-widest">
          • SECURE BOX HARDWARE •
        </span>
      </div>
    </div>
  );
}
