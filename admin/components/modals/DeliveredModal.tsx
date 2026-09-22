import React from "react";
import { PhoneCall, X, CheckCircle2 } from "lucide-react";

interface DeliveredModalProps {
  data: {
    requestId: string;
    customerName: string;
    phone: string;
    deviceId: string;
  };
  verificationInput: string;
  onVerificationChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeliveredModal({
  data,
  verificationInput,
  onVerificationChange,
  onClose,
  onConfirm,
}: DeliveredModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#101522] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Verify Installation & Mark Delivered
              </h3>
              <p className="text-xs text-slate-500">
                Confirm live state with {data.customerName}
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

        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
          <div className="flex justify-between font-mono font-bold">
            <span>Customer Phone:</span>
            <span>+91 {data.phone}</span>
          </div>
          <div className="flex justify-between font-mono">
            <span>Hardware Unit:</span>
            <span className="font-bold">{data.deviceId}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Call Verification Details
          </label>
          <textarea
            rows={3}
            value={verificationInput}
            onChange={(e) => onVerificationChange(e.target.value)}
            placeholder="Details of the verification call (e.g. confirmed installed on porch and device is online)."
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500 resize-none"
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
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm Delivered & Live</span>
          </button>
        </div>
      </div>
    </div>
  );
}
