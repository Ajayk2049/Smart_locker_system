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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#101522] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Accept Order & Switch to Preparing
              </h3>
              <p className="text-xs text-slate-500">
                Assign hardware to customer {data.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              ESP32 Locker Device ID
            </label>
            <input
              type="text"
              value={deviceIdInput}
              onChange={(e) => onDeviceIdChange(e.target.value)}
              placeholder="e.g. BOX_001"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
            />
            <span className="text-[11px] text-slate-400">
              Order will move to <strong>PREPARING</strong> while hub technicians calibrate and box the unit.
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Preparation Notes (Optional)
            </label>
            <input
              type="text"
              value={notesInput}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="e.g. Firmware flashed, battery tested"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Accept & Move to Preparing</span>
          </button>
        </div>
      </div>
    </div>
  );
}
