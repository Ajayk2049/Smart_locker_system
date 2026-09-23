import React from "react";
import {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Check,
} from "lucide-react";

export type LockerRequestStatus =
  | "pending"
  | "preparing"
  | "dispatched"
  | "delivered"
  | "approved"
  | "rejected";

export interface LockerRequestItem {
  _id: string;
  userId?: {
    _id: string;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    pincode?: string;
    units?: number;
    orderStatus?: string;
  };
  name: string;
  phone: string;
  email?: string;
  address: string;
  pincode: string;
  units: number;
  status: LockerRequestStatus;
  assignedDeviceIds: string[];
  assignedDevicesInfo?: Array<{
    deviceId: string;
    online: boolean;
    lastHeartbeat?: string | Date;
    doorState?: string;
  }>;
  isDeviceOnline?: boolean;
  lastHeartbeat?: string | Date;
  rejectionReason?: string;
  notes?: string;
  verificationNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
}

interface RequestsTableProps {
  requests: LockerRequestItem[];
  isLoading: boolean;
  onOpenPrepare: (item: LockerRequestItem) => void;
  onOpenDispatch: (item: LockerRequestItem) => void;
  onOpenDeliver: (item: LockerRequestItem) => void;
  onOpenReject: (item: LockerRequestItem) => void;
}

export function RequestsTable({
  requests,
  isLoading,
  onOpenPrepare,
  onOpenDispatch,
  onOpenDeliver,
  onOpenReject,
}: RequestsTableProps) {
  return (
    <div className="w-full bg-white dark:bg-[#0D141F] rounded-none border-2 border-slate-200 dark:border-slate-800 shadow-none overflow-hidden">
      <div className="overflow-x-auto no-scrollbar w-full">
        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300 table-auto">
          <thead className="bg-slate-50 dark:bg-[#080D14] text-xs uppercase tracking-wider font-mono font-black text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3.5 px-5 min-w-[180px] w-[18%]">Order / Customer</th>
              <th className="py-3.5 px-4 min-w-[140px] w-[14%]">Contact</th>
              <th className="py-3.5 px-4 min-w-[200px] w-[22%]">Delivery Address</th>
              <th className="py-3.5 px-4 min-w-[70px] w-[6%] text-center">Units</th>
              <th className="py-3.5 px-4 min-w-[130px] w-[12%]">Status</th>
              <th className="py-3.5 px-4 min-w-[110px] w-[10%]">Assigned Unit</th>
              <th className="py-3.5 px-5 min-w-[220px] w-[18%] text-right">Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-20 text-center text-base text-[#00F5A0] font-mono font-bold">
                  Loading order pipeline...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-none bg-slate-100 dark:bg-[#080D14] border-2 border-slate-300 dark:border-slate-800 flex items-center justify-center text-[#00F5A0]">
                      <Package className="w-7 h-7 stroke-[2]" />
                    </div>
                    <div className="font-black text-base text-slate-900 dark:text-slate-100">
                      No orders found matching this filter
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md">
                      Customer order requests placed via web or app will automatically appear here.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              requests.map((req) => {
                const normStatus = req.status === "approved" ? "preparing" : req.status;
                const assignedUnit = req.assignedDeviceIds?.[0] || "BOX_001";

                return (
                  <tr
                    key={req._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#080D14]/60 transition-colors"
                  >
                    {/* Customer */}
                    <td className="py-4 px-5 align-top">
                      <div className="font-black text-slate-900 dark:text-slate-100 text-base">
                        {req.name}
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
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        +91 {req.phone}
                      </div>
                      {req.email && (
                        <div className="text-xs text-slate-400 truncate max-w-[190px] mt-0.5">
                          {req.email}
                        </div>
                      )}
                    </td>

                    {/* Delivery Address */}
                    <td className="py-4 px-4 align-middle text-sm">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                        {req.address}
                      </div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1 font-mono">
                        PIN: {req.pincode}
                      </div>
                    </td>

                    {/* Units */}
                    <td className="py-4 px-4 align-middle text-center">
                      <span className="h-8 min-w-[36px] px-2.5 inline-flex items-center justify-center rounded-none bg-slate-100 dark:bg-[#080D14] border border-slate-300 dark:border-slate-800 font-mono text-xs font-black text-slate-900 dark:text-slate-100">
                        {req.units}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 align-middle">
                      {normStatus === "pending" && (
                        <span className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-none text-xs font-black font-mono tracking-wider uppercase whitespace-nowrap bg-[#00F5A0]/20 dark:bg-[#00F5A0]/15 text-black dark:text-[#00F5A0] border border-[#00F5A0]/60 dark:border-[#00F5A0]/40">
                          <Clock className="w-3.5 h-3.5 stroke-[2.5]" /> PENDING
                        </span>
                      )}
                      {normStatus === "preparing" && (
                        <span className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-none text-xs font-black font-mono tracking-wider uppercase whitespace-nowrap bg-[#00F5A0]/25 dark:bg-[#00F5A0]/15 text-black dark:text-[#00F5A0] border border-[#00F5A0]/70 dark:border-[#00F5A0]/50">
                          <Package className="w-3.5 h-3.5 stroke-[2.5]" /> PREPARING
                        </span>
                      )}
                      {normStatus === "dispatched" && (
                        <span className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-none text-xs font-black font-mono tracking-wider uppercase whitespace-nowrap bg-[#00F5A0]/30 dark:bg-[#00F5A0]/20 text-black dark:text-[#00F5A0] border border-[#00F5A0]/80 dark:border-[#00F5A0]/60">
                          <Truck className="w-4 h-4 stroke-[2.5]" /> DISPATCHED
                        </span>
                      )}
                      {normStatus === "delivered" && (
                        <span className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-none text-xs font-black font-mono tracking-wider uppercase whitespace-nowrap bg-[#00F5A0] text-black border border-[#00F5A0]">
                          <CheckCircle2 className="w-4 h-4 stroke-[3]" /> DELIVERED
                        </span>
                      )}
                      {normStatus === "rejected" && (
                        <span className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-none text-xs font-black font-mono tracking-wider uppercase whitespace-nowrap bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/40">
                          <XCircle className="w-3.5 h-3.5 stroke-[2.5]" /> REJECTED
                        </span>
                      )}
                    </td>

                    {/* Assigned Device */}
                    <td className="py-4 px-4 align-middle">
                      {req.assignedDeviceIds && req.assignedDeviceIds.length > 0 ? (
                        <span className="h-8 px-2.5 inline-flex items-center justify-center font-mono text-xs font-black bg-[#00F5A0]/20 dark:bg-[#00F5A0]/15 text-black dark:text-[#00F5A0] border border-[#00F5A0]/60 dark:border-[#00F5A0]/40 rounded-none whitespace-nowrap">
                          {req.assignedDeviceIds.join(", ")}
                        </span>
                      ) : normStatus === "rejected" ? (
                        <span className="text-xs text-rose-500 italic">
                          {req.rejectionReason || "Declined"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">Unassigned</span>
                      )}
                    </td>

                    {/* Lifecycle Actions */}
                    <td className="py-4 px-5 align-middle text-right">
                      {normStatus === "pending" && (
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => onOpenReject(req)}
                            className="h-10 px-4 rounded-none border border-rose-500/50 text-rose-500 hover:bg-rose-500/10 text-xs font-black uppercase tracking-wider whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => onOpenPrepare(req)}
                            className="h-10 px-5 rounded-none bg-[#00F5A0] hover:bg-[#00DE90] text-black font-black text-xs uppercase tracking-wider whitespace-nowrap shadow-none transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4 stroke-[3] shrink-0" />
                            <span className="whitespace-nowrap">Accept & Prepare</span>
                          </button>
                        </div>
                      )}

                      {normStatus === "preparing" && (
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => onOpenDispatch(req)}
                            className="h-10 px-5 rounded-none bg-[#00F5A0] hover:bg-[#00DE90] text-black font-black text-xs uppercase tracking-wider whitespace-nowrap shadow-none transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                          >
                            <Truck className="w-4 h-4 shrink-0" />
                            <span className="whitespace-nowrap">Dispatch Order</span>
                          </button>
                        </div>
                      )}

                      {normStatus === "dispatched" && (
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => onOpenDeliver(req)}
                            className="h-10 px-5 rounded-none bg-[#00F5A0] hover:bg-[#00DE90] text-black font-black text-xs uppercase tracking-wider whitespace-nowrap shadow-none transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4 stroke-[3] shrink-0" />
                            <span className="whitespace-nowrap">Verify Call & Mark Live</span>
                          </button>
                        </div>
                      )}

                      {normStatus === "delivered" && (
                        <div className="flex items-center justify-end">
                          {req.isDeviceOnline ? (
                            <span className="h-10 px-5 inline-flex items-center justify-center gap-2 text-xs font-mono font-black uppercase tracking-wider whitespace-nowrap text-black bg-[#00F5A0] border border-[#00F5A0]">
                              <span className="w-2.5 h-2.5 rounded-full bg-black animate-pulse" />
                              <span>ONLINE</span>
                            </span>
                          ) : (
                            <span className="h-10 px-5 inline-flex items-center justify-center gap-2 text-xs font-mono font-black uppercase tracking-wider whitespace-nowrap bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/50">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                              <span>OFFLINE</span>
                            </span>
                          )}
                        </div>
                      )}

                      {normStatus === "rejected" && (
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Closed</span>
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
