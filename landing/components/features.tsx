import React from "react";
import { Smartphone, Lock, CloudRain, BellRing } from "lucide-react";

export function Features() {
  return (
    <div className="flex-1 flex flex-col justify-between py-1 w-full">
      <div className="text-center font-merriweather mb-1">
        <h2 className="text-[2.8vh] font-black text-[#3D2310]">Smart Features</h2>
      </div>

      <div className="grid grid-cols-2 gap-[2vh] flex-1 mt-3">
        {/* Card 1: Remote Access */}
        <div className="bg-[#e7cfb8] border border-[#3D2310]/15 rounded-2xl p-4 shadow-lg shadow-[#3D2310]/30 flex flex-col items-center justify-center text-center rotate-[-1deg] hover:rotate-0 hover:scale-103 transition-all duration-200 hover:shadow-xl hover:shadow-[#3D2310]/40 cursor-pointer">
          <Smartphone className="w-[4.5vh] h-[4.5vh] text-[#3D2310] mb-3 stroke-[2]" />
          <span className="font-black text-[1.8vh] tracking-tight text-[#3D2310] uppercase">Remote Access</span>
        </div>

        {/* Card 2: Push to Lock */}
        <div className="bg-[#e7cfb8] border border-[#3D2310]/15 rounded-2xl p-4 shadow-lg shadow-[#3D2310]/30 flex flex-col items-center justify-center text-center rotate-[1deg] hover:rotate-0 hover:scale-103 transition-all duration-200 hover:shadow-xl hover:shadow-[#3D2310]/40 cursor-pointer">
          <Lock className="w-[4.5vh] h-[4.5vh] text-[#3D2310] mb-3 stroke-[2]" />
          <span className="font-black text-[1.8vh] tracking-tight text-[#3D2310] uppercase">Push to Lock</span>
        </div>

        {/* Card 3: Weather Proof */}
        <div className="bg-[#e7cfb8] border border-[#3D2310]/15 rounded-2xl p-4 shadow-lg shadow-[#3D2310]/30 flex flex-col items-center justify-center text-center rotate-[1.5deg] hover:rotate-0 hover:scale-103 transition-all duration-200 hover:shadow-xl hover:shadow-[#3D2310]/40 cursor-pointer">
          <CloudRain className="w-[4.5vh] h-[4.5vh] text-[#3D2310] mb-3 stroke-[2]" />
          <span className="font-black text-[1.8vh] tracking-tight text-[#3D2310] uppercase">Weather Proof</span>
        </div>

        {/* Card 4: Live Alerts */}
        <div className="bg-[#e7cfb8] border border-[#3D2310]/15 rounded-2xl p-4 shadow-lg shadow-[#3D2310]/30 flex flex-col items-center justify-center text-center rotate-[-1.5deg] hover:rotate-0 hover:scale-103 transition-all duration-200 hover:shadow-xl hover:shadow-[#3D2310]/40 cursor-pointer">
          <BellRing className="w-[4.5vh] h-[4.5vh] text-[#3D2310] mb-3 stroke-[2]" />
          <span className="font-black text-[1.8vh] tracking-tight text-[#3D2310] uppercase">Live Alerts</span>
        </div>
      </div>
    </div>
  );
}
