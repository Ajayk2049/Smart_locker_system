import React from "react";
import { Users, Phone, CheckCircle2, XCircle, Clock, ShieldCheck, Mail } from "lucide-react";

export interface SlotRequestItem {
  _id: string;
  userId?: {
    _id: string;
    name?: string;
    phone?: string;
    email?: string;
  };
  deviceId?: {
    _id: string;
    deviceId: string;
    name: string;
    allowedSlots: number;
    coOwners?: any[];
  };
  deviceStringId: string;
  deviceName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  currentSlots: number;
  desiredSlots: number;
  plan: "monthly" | "yearly";
  priceAtRequest: number;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
}

interface SlotRequestsTableProps {
  requests: SlotRequestItem[];
  isLoading: boolean;
  onApprove: (item: SlotRequestItem) => void;
  onReject: (item: SlotRequestItem) => void;
  onRevoke: (item: SlotRequestItem) => void;
}

export function SlotRequestsTable({
  requests,
  isLoading,
  onApprove,
  onReject,
  onRevoke,
}: SlotRequestsTableProps) {
  return (
    <div className="w-full bg-white dark:bg-[#0D141F] rounded-none border-2 border-slate-200 dark:border-slate-800 shadow-none overflow-hidden">
      <div className="overflow-x-auto no-scrollbar w-full">
        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300 table-auto">
          <thead className="bg-slate-50 dark:bg-[#080D14] text-xs uppercase tracking-wider font-mono font-black text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3.5 px-5 min-w-[180px] w-[20%]">Customer</th>
              <th className="py-3.5 px-4 min-w-[150px] w-[18%]">Contact (Call to Confirm)</th>
              <th className="py-3.5 px-4 min-w-[150px] w-[18%]">Locker Device</th>
              <th className="py-3.5 px-4 min-w-[120px] w-[14%]">Plan & Price</th>
              <th className="py-3.5 px-4 min-w-[110px] w-[12%]">Status</th>
              <th className="py-3.5 px-5 min-w-[200px] w-[18%] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-base text-[#00F5A0] font-mono font-bold">
                  Loading slot upgrade requests...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-none bg-slate-100 dark:bg-[#080D14] border-2 border-slate-300 dark:border-slate-800 flex items-center justify-center text-[#00F5A0]">
                      <Users className="w-7 h-7 stroke-[2]" />
                    </div>
                    <div className="font-black text-base text-slate-900 dark:text-slate-100">
                      No slot upgrade requests
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md">
                      When customers apply to unlock extra co-owner slots in the mobile app, their requests will appear here.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              requests.map((req) => {
                const isPending = req.status === "pending";

                return (
                  <tr
                    key={req._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#080D14]/60 transition-colors"
                  >
                    {/* Customer */}
                    <td className="py-4 px-5 align-top">
                      <div className="font-black text-slate-900 dark:text-slate-100 text-base">
                        {req.customerName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {new Date(req.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-4 align-top font-mono text-sm">
                      <a
                        href={`tel:+91${req.customerPhone}`}
                        title="Click to call customer"
                        className="font-bold text-[#00F5A0] hover:underline flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>+91 {req.customerPhone}</span>
                      </a>
                      {req.customerEmail && (
                        <div className="text-xs text-slate-400 truncate max-w-[190px] mt-0.5 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{req.customerEmail}</span>
                        </div>
                      )}
                    </td>

                    {/* Device */}
                    <td className="py-4 px-4 align-middle">
                      <span className="h-8 px-2.5 inline-flex items-center justify-center font-mono text-xs font-black bg-[#00F5A0]/20 dark:bg-[#00F5A0]/15 text-black dark:text-[#00F5A0] border border-[#00F5A0]/60 dark:border-[#00F5A0]/40 rounded-none whitespace-nowrap">
                        {req.deviceStringId}
                      </span>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {req.deviceName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Current: {req.currentSlots} slots ➔ Unlocking to 5 slots
                      </div>
                    </td>

                    {/* Plan & Price */}
                    <td className="py-4 px-4 align-middle">
                      <span className="h-7 px-2.5 inline-flex items-center text-xs font-black uppercase tracking-wider rounded-none bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/40 font-mono">
                        {req.plan} plan
                      </span>
                      <div className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">
                        ₹{req.priceAtRequest}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 align-middle">
                      {req.status === "pending" && (
                        <span className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-none text-xs font-black font-mono tracking-wider uppercase whitespace-nowrap bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/50">
                          <Clock className="w-3.5 h-3.5 stroke-[2.5]" /> PENDING
                        </span>
                      )}
                      {req.status === "approved" && (
                        <span className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-none text-xs font-black font-mono tracking-wider uppercase whitespace-nowrap bg-[#00F5A0]/20 text-black dark:text-[#00F5A0] border border-[#00F5A0]/60">
                          <CheckCircle2 className="w-4 h-4 stroke-[3]" /> 5 SLOTS UNLOCKED
                        </span>
                      )}
                      {req.status === "rejected" && (
                        <span className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-none text-xs font-black font-mono tracking-wider uppercase whitespace-nowrap bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/40">
                          <XCircle className="w-3.5 h-3.5 stroke-[2.5]" /> REJECTED
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 align-middle text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onApprove(req)}
                            title="Unlock all 3 extra slots to 5 total"
                            className="h-10 px-4 inline-flex items-center justify-center gap-1.5 rounded-none font-mono text-xs font-black uppercase tracking-wider bg-[#00F5A0] hover:bg-[#00DE90] text-black border border-[#00F5A0] transition-colors shadow-none cursor-pointer whitespace-nowrap"
                          >
                            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                            <span>Approve 5 Slots</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(req)}
                            title="Decline this request"
                            className="h-10 px-3 inline-flex items-center justify-center rounded-none font-mono text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </div>
                      ) : req.status === "approved" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onRevoke(req)}
                            title="Revoke extra slots and take locker back to 2 slots only"
                            className="h-9 px-3 inline-flex items-center justify-center gap-1.5 rounded-none font-mono text-xs font-bold uppercase tracking-wider bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/40 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Revoke to 2 Slots</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 font-mono">
                          Closed
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
