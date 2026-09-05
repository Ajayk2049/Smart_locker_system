import React from "react";

interface ProfileBoxBgProps {
  children?: React.ReactNode;
}

export function ProfileBoxBg({ children }: ProfileBoxBgProps) {
  return (
    <div
      className="relative flex flex-col p-4 sm:p-6 drop-shadow-2xl bg-center bg-no-repeat font-sans text-[#3D2310] w-[92vw] md:w-[62vh] h-[84vh] max-w-[560px] max-h-[760px] min-w-[280px] md:min-w-[390px] min-h-[550px] justify-center items-center select-none"
      style={{
        backgroundImage: "url('/boxbg.png')",
        backgroundSize: "100% 100%",
        backgroundPosition: "center"
      }}
    >
      {/* Cardboard Packaging Ink Stamp: "THIS WAY UP" & "FRAGILE" in rustic cardboard ink */}
      <div className="absolute top-2.5 left-5 hidden sm:flex items-center gap-2 opacity-25 pointer-events-none text-[#231206] font-mono text-[9px] uppercase tracking-widest font-black">
        <span>⬆⬆ THIS WAY UP</span>
        <span>•</span>
        <span>FRAGILE</span>
      </div>

      {/* Cardboard Packaging Recyclable & Barcode Stamp bottom-left */}
      <div className="absolute bottom-2.5 left-5 hidden sm:flex items-center gap-2 opacity-25 pointer-events-none text-[#231206] font-mono text-[9px] uppercase tracking-widest font-bold">
        <span>♻ 20 PAP</span>
        <span>•</span>
        <span>KEEP DRY</span>
      </div>

      {/* Realistic clear brown packing tape accent over top-right box edge */}
      <div
        className="absolute -top-1.5 right-10 w-24 h-5 bg-amber-600/25 border-y border-amber-800/30 backdrop-blur-[0.5px] rotate-[8deg] pointer-events-none shadow-xs rounded-[1px] hidden sm:block z-0"
        title="Packaging Tape"
      />

      {/* Content Sticker */}
      <div className="w-full h-full relative z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
