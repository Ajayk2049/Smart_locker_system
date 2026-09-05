"use client";

import React from "react";

interface HeroProps {
  onExploreFeatures?: () => void;
  onHowItWorks?: () => void;
  onOrderNow?: () => void;
}

export function Hero({ onExploreFeatures, onHowItWorks, onOrderNow }: HeroProps) {
  return (
    <div className="w-full max-w-2xl font-merriweather text-[#3D2310] text-center md:text-left flex flex-col items-center md:items-start">
      <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.02] mb-6">
        Smart. <br />
        <span className="text-[#533923]">Secure.</span> <br />
        <span className="text-[#533923]">Delivered.</span>
      </h1>

      <p className="text-base sm:text-lg md:text-xl text-[#533923]/85 font-semibold max-w-lg leading-relaxed mb-10 text-center md:text-left font-sans">
        Personal wall-mounted smart delivery locker for your home. Receive parcels safely anytime.
      </p>

      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 font-sans">
        <button
          type="button"
          onClick={onExploreFeatures}
          className="w-44 sm:w-48 py-4 rounded-2xl border-2 border-[#3D2310] text-[#3D2310] bg-transparent font-extrabold text-base transition-all duration-200 hover:bg-[#dab786] hover:border-[#dab786] cursor-pointer"
        >
          Explore Features
        </button>
        <button
          type="button"
          onClick={onHowItWorks}
          className="w-44 sm:w-48 py-4 rounded-2xl border-2 border-[#3D2310] text-[#3D2310] bg-transparent font-extrabold text-base transition-all duration-200 hover:bg-[#dab786] hover:border-[#dab786] cursor-pointer"
        >
          How it works
        </button>
        <button
          type="button"
          onClick={onOrderNow}
          className="w-44 sm:w-48 py-4 rounded-2xl bg-[#3D2310] text-[#FAF9F5] font-extrabold text-base transition-all duration-200 hover:bg-[#261508] cursor-pointer shadow-md"
        >
          Order Locker
        </button>
      </div>
    </div>
  );
}
