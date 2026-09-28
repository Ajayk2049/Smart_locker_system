import React, { useState } from "react";
import { KeyRound, X, Copy, Check, ShieldAlert, Cpu } from "lucide-react";

interface ProvisionedKeyModalProps {
  data: {
    customerName: string;
    deviceId: string;
    deviceKey: string;
  };
  onClose: () => void;
}

export function ProvisionedKeyModal({ data, onClose }: ProvisionedKeyModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const copyToClipboard = async (text: string, type: "id" | "key") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "id") {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-[#0D141F] rounded-none border-2 border-[#00F5A0] shadow-2xl p-6 sm:p-7 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#00F5A0]/20 dark:bg-[#00F5A0]/15 text-black dark:text-[#00F5A0] border border-[#00F5A0]/50 dark:border-[#00F5A0]/30 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5 text-[#00F5A0]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Hardware Provisioning Key</span>
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Assigned to {data.customerName}
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

        <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <span>
            Provide this <strong>Device ID</strong> and <strong>Secret Key</strong> to the hardware technician to flash into the ESP32 firmware before assembly.
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {/* Device ID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assigned Device ID (Hardware Serial)
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-[#080D14] border border-slate-300 dark:border-slate-800 font-mono font-black text-base text-slate-900 dark:text-[#00F5A0] select-all">
                {data.deviceId}
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(data.deviceId, "id")}
                className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors"
                title="Copy Device ID"
              >
                {copiedId ? <Check className="w-4 h-4 text-[#00F5A0]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Secret Key */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Device Secret Provisioning Key (X-Device-Key)
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-[#080D14] border border-slate-300 dark:border-slate-800 font-mono font-bold text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                {data.deviceKey}
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(data.deviceKey, "key")}
                className="px-3.5 py-2.5 bg-[#00F5A0] hover:bg-[#00DE90] text-black font-black text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Copy Secret Key"
              >
                {copiedKey ? <Check className="w-4 h-4 text-black stroke-[3]" /> : <Copy className="w-4 h-4 text-black" />}
                <span>{copiedKey ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              Flash into ESP32 C++ firmware: <code className="text-slate-300">const char* DEVICE_KEY = "{data.deviceKey}";</code>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
