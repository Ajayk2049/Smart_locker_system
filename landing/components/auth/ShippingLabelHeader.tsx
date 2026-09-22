import React from "react";

interface ShippingLabelHeaderProps {
  title: string;
  subtitle?: string;
}

export function ShippingLabelHeader({ title, subtitle }: ShippingLabelHeaderProps) {
  return (
    <div className="border-b-2 border-dashed border-[#3D2310]/30 pb-2 mb-2">
      {/* Top Waybill Meta Bar */}
      <div className="flex items-center justify-between font-mono text-[9px] text-[#3D2310]/80 uppercase tracking-wider pb-1 border-b border-[#3D2310]/15">
        <span className="font-bold flex items-center gap-1">
          <span>⬆⬆</span> SECURE BOX DISPATCH
        </span>
        <span className="bg-[#3D2310] text-[#FAF9F5] px-1.5 py-0.5 font-black text-[8.5px]">
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
}
