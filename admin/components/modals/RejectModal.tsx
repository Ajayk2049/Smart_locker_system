import React from "react";
import { XCircle, X } from "lucide-react";

interface RejectModalProps {
  data: {
    requestId: string;
    customerName: string;
  };
  reasonInput: string;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function RejectModal({
  data,
  reasonInput,
  onReasonChange,
  onClose,
  onConfirm,
}: RejectModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-[#0D141F] rounded-none border-2 border-slate-300 dark:border-slate-800 shadow-2xl p-6 sm:p-7 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center justify-center font-bold">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Reject Order
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                For customer: {data.customerName}
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

        <div className="flex flex-col gap-1.5 pt-1">
          <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Reason for Rejection
          </label>
          <textarea
            rows={3}
            value={reasonInput}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="e.g. Delivery address outside current Bengaluru pilot zone."
            className="w-full p-3 rounded-none bg-slate-50 dark:bg-[#080D14] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-rose-500 resize-none"
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
            className="px-5 py-2.5 rounded-none bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-none transition-all cursor-pointer flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            <span>Confirm Rejection</span>
          </button>
        </div>
      </div>
    </div>
  );
}
