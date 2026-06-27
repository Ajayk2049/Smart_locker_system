import React from "react";
import { Smartphone, CheckCircle } from "lucide-react";

export function AppPromo() {
  return (
    <div className="space-y-4 pt-2 w-full">
      <div className="text-center mb-4 font-merriweather">
        <span className="text-[1.4vh] font-bold text-[#3D2310]/60 uppercase tracking-widest block">Mobile Application</span>
        <h2 className="text-[2.8vh] font-black text-[#3D2310]">App Integration</h2>
      </div>

      {/* App Screen Sticker */}
      <div className="bg-zinc-900 text-zinc-100 p-4 rounded-xl shadow-lg border border-zinc-700 rotate-[-1deg] transform transition-transform hover:rotate-0 duration-200 font-sans w-full">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
          <div className="flex items-center gap-1">
            <Smartphone className="w-4 h-4 text-green-400" />
            <span className="text-xs font-bold tracking-tight">Companion App</span>
          </div>
          <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-mono">ACTIVE</span>
        </div>

        <div className="space-y-3">
          <div className="bg-zinc-800/80 p-3 rounded-lg border border-zinc-700/50">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-zinc-300">Front Door Locker</span>
              <span className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Locked</span>
            </div>
            <button className="w-full mt-2 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-zinc-950 font-extrabold text-xs transition-colors cursor-pointer">
              One-click Unlock
            </button>
          </div>

          <div className="bg-zinc-800/40 p-2 rounded border border-zinc-800/80 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] text-zinc-400">
              <span>DELIVERY HISTORY</span>
              <span className="font-mono text-zinc-500">TODAY</span>
            </div>
            <div className="text-xs text-zinc-200 flex items-center justify-between">
              <span>FedEx #8843</span>
              <span className="text-green-400">10:42 AM</span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <span className="text-[10px] text-zinc-500 block">Download for iOS & Android</span>
        </div>
      </div>
    </div>
  );
}
