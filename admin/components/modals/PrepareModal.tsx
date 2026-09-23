import React from "react";
import { Package, X, Check } from "lucide-react";

interface PrepareModalProps {
  data: {
    requestId: string;
    customerName: string;
    units: number;
    suggestedDeviceId: string;
  };
  deviceIdInput: string;
  onDeviceIdChange: (value: string) => void;
  notesInput: string;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function PrepareModal({
  data,
  deviceIdInput,
  onDeviceIdChange,
  notesInput,
  onNotesChange,
  onClose,
  onConfirm,
}: PrepareModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-[#0D141F] rounded-none border-2 border-slate-300 dark:border-slate-800 shadow-2xl p-6 sm:p-7 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#00F5A0]/20 dark:bg-[#00F5A0]/15 text-black dark:text-[#00F5A0] border border-[#00F5A0]/50 dark:border-[#00F5A0]/30 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Accept Order & Prepare Locker
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Assign locker to {data.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Locker Device ID
            </label>
            <input
              type="text"
              value={deviceIdInput}
              onChange={(e) => onDeviceIdChange(e.target.value)}
              placeholder="e.g. BOX_001"
              className="w-full px-3.5 py-2.5 rounded-none bg-slate-50 dark:bg-[#080D14] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono font-black text-sm focus:outline-none focus:border-[#00F5A0] focus:ring-1 focus:ring-[#00F5A0]"
            />
            <span className="text-xs text-slate-400">
              Order will move to <strong className="text-[#00F5A0]">PREPARING</strong> while hub technicians calibrate and box the unit.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Preparation Notes (Optional)
            </label>
            <input
              type="text"
              value={notesInput}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="e.g. Firmware flashed, battery tested"
              className="w-full px-3.5 py-2.5 rounded-none bg-slate-50 dark:bg-[#080D14] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-[#00F5A0] focus:ring-1 focus:ring-[#00F5A0]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-none text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-none bg-[#00F5A0] hover:bg-[#00DE90] text-black font-black text-sm shadow-none transition-all cursor-pointer flex items-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Accept & Move to Preparing</span>
          </button>
        </div>
      </div>
    </div>
  );
}
