import React, { useState } from "react";
import { Tag, X, Check, ArrowRight, ShieldCheck } from "lucide-react";

export interface SlotPricingData {
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  extraSlotsCount?: number;
  totalCapacity?: number;
  savingsPercent?: number;
}

interface PricingModalProps {
  currentPricing: SlotPricingData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (monthly: number, yearly: number) => Promise<void>;
}

export function PricingModal({
  currentPricing,
  isOpen,
  onClose,
  onSave,
}: PricingModalProps) {
  const [monthlyInput, setMonthlyInput] = useState(String(currentPricing.monthlyPrice || 149));
  const [yearlyInput, setYearlyInput] = useState(String(currentPricing.yearlyPrice || 999));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const mPrice = parseFloat(monthlyInput) || 0;
  const yPrice = parseFloat(yearlyInput) || 0;
  const fullYearValue = mPrice * 12;
  const calculatedSavings =
    fullYearValue > yPrice && fullYearValue > 0
      ? Math.round(((fullYearValue - yPrice) / fullYearValue) * 100)
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mPrice <= 0 || yPrice <= 0) {
      setError("Please enter valid prices greater than 0");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onSave(mPrice, yPrice);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update pricing");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-[#0D141F] rounded-none border-2 border-slate-300 dark:border-slate-800 shadow-2xl p-6 sm:p-7 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#00F5A0]/20 dark:bg-[#00F5A0]/15 text-black dark:text-[#00F5A0] border border-[#00F5A0]/50 dark:border-[#00F5A0]/30 flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Slot Upgrade Pricing
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Configure prices for unlocking all 3 extra slots (Up to 5 total)
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/30">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Monthly Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={monthlyInput}
                  onChange={(e) => setMonthlyInput(e.target.value)}
                  className="w-full h-11 pl-8 pr-3 rounded-none bg-slate-50 dark:bg-[#080D14] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold text-base focus:outline-none focus:border-[#00F5A0]"
                  required
                />
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Billed every month</span>
            </div>

            {/* Yearly */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Annual Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={yearlyInput}
                  onChange={(e) => setYearlyInput(e.target.value)}
                  className="w-full h-11 pl-8 pr-3 rounded-none bg-slate-50 dark:bg-[#080D14] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold text-base focus:outline-none focus:border-[#00F5A0]"
                  required
                />
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Billed every year</span>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-4 bg-slate-50 dark:bg-[#080D14] border border-slate-200 dark:border-slate-800 rounded-none flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Mobile App Display Preview
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">
                ₹{mPrice}/mo &nbsp;•&nbsp; ₹{yPrice}/yr
              </div>
            </div>
            {calculatedSavings > 0 && (
              <span className="h-7 px-2.5 inline-flex items-center text-xs font-black uppercase tracking-wider bg-[#00F5A0]/20 text-black dark:text-[#00F5A0] border border-[#00F5A0]/50 font-mono">
                SAVE {calculatedSavings}%
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-4 h-4 text-[#00F5A0] shrink-0" />
            <span>Policy: Unlocking applies to all 3 extra slots at once (5 total capacity).</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-xs font-black uppercase tracking-wider rounded-none text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-10 px-5 text-xs font-black uppercase tracking-wider rounded-none bg-[#00F5A0] hover:bg-[#00DE90] text-black transition-colors cursor-pointer flex items-center gap-2"
            >
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Update Prices</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
