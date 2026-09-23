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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-[#0D141F] rounded-none border-2 border-slate-300 dark:border-slate-800 shadow-2xl p-6 sm:p-7 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#00F5A0]/20 dark:bg-[#00F5A0]/15 text-black dark:text-[#00F5A0] border border-[#00F5A0]/50 dark:border-[#00F5A0]/30 flex items-center justify-center font-bold">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Verify Installation & Mark Delivered
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Confirm live state with {data.customerName}
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

        <div className="p-3.5 rounded-none bg-slate-50 dark:bg-[#080D14] border border-slate-300 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 space-y-1.5 font-mono">
          <div className="flex justify-between font-bold">
            <span className="text-slate-500">Customer Phone:</span>
            <span className="text-slate-900 dark:text-slate-100">+91 {data.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Hardware Unit:</span>
            <span className="font-black text-[#00F5A0]">{data.deviceId}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Call Verification Details
          </label>
          <textarea
            rows={3}
            value={verificationInput}
            onChange={(e) => onVerificationChange(e.target.value)}
            placeholder="Details of the verification call (e.g. confirmed installed on porch and device is online)."
            className="w-full p-3 rounded-none bg-slate-50 dark:bg-[#080D14] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-[#00F5A0] focus:ring-1 focus:ring-[#00F5A0] resize-none"
          />
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
            <CheckCircle2 className="w-4 h-4 stroke-[3]" />
            <span>Confirm Delivered & Live</span>
          </button>
        </div>
      </div>
    </div>
  );
}
