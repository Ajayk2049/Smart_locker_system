import React from "react";
import { Truck, X } from "lucide-react";

interface DispatchModalProps {
  data: {
    requestId: string;
    customerName: string;
    deviceId: string;
  };
  notesInput: string;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function DispatchModal({
  data,
  notesInput,
  onNotesChange,
  onClose,
  onConfirm,
}: DispatchModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#101522] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Dispatch Locker Order
              </h3>
              <p className="text-xs text-slate-500">
                Out for delivery to {data.customerName}
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

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          Locker <strong>{data.deviceId}</strong> is packaged and handed over to the courier/installation engineer.
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Dispatch / Courier Note (Optional)
          </label>
          <input
            type="text"
            value={notesInput}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="e.g. Dispatched via Express Hub Team (Delivery Slot: Today 4-6 PM)"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-purple-500"
          />
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
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Truck className="w-4 h-4" />
            <span>Confirm Dispatched</span>
          </button>
        </div>
      </div>
    </div>
  );
}
