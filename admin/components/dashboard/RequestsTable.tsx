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
    <div className="bg-white dark:bg-[#101522] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
          <thead className="bg-slate-50/75 dark:bg-slate-900/50 text-[11px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Order / Customer</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Delivery Address</th>
              <th className="py-3 px-4 text-center">Units</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Assigned Unit</th>
              <th className="py-3 px-4 text-right">Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                  Loading order pipeline...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No orders found matching the filter.
                </td>
              </tr>
            ) : (
              requests.map((req) => {
                const normStatus = req.status === "approved" ? "preparing" : req.status;
                const assignedUnit = req.assignedDeviceIds?.[0] || "BOX_001";

                return (
                  <tr
                    key={req._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    {/* Customer */}
                    <td className="py-4 px-4 align-top">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {req.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
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
                    <td className="py-4 px-4 align-top font-mono text-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        +91 {req.phone}
                      </div>
                      {req.email && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[170px]">
                          {req.email}
                        </div>
                      )}
                    </td>

                    {/* Delivery Address */}
                    <td className="py-4 px-4 align-top max-w-xs">
                      <div className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2">
                        {req.address}
                      </div>
                      <div className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold mt-0.5">
                        PIN: {req.pincode}
                      </div>
                    </td>

                    {/* Units */}
                    <td className="py-4 px-4 align-top text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {req.units}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 align-top">
                      {normStatus === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                          <Clock className="w-3 h-3" /> PENDING
                        </span>
                      )}
                      {normStatus === "preparing" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                          <Package className="w-3 h-3" /> PREPARING
                        </span>
                      )}
                      {normStatus === "dispatched" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">
                          <Truck className="w-3.5 h-3.5" /> DISPATCHED
                        </span>
                      )}
                      {normStatus === "delivered" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> DELIVERED & LIVE
                        </span>
                      )}
                      {normStatus === "rejected" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3 h-3" /> REJECTED
                        </span>
                      )}
                    </td>

                    {/* Assigned Device */}
                    <td className="py-4 px-4 align-top">
                      {req.assignedDeviceIds && req.assignedDeviceIds.length > 0 ? (
                        <span className="font-mono text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-1 rounded border border-emerald-500/30">
                          {req.assignedDeviceIds.join(", ")}
                        </span>
                      ) : normStatus === "rejected" ? (
                        <span className="text-xs text-rose-600 dark:text-rose-400 italic">
                          {req.rejectionReason || "Declined"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">Unassigned</span>
                      )}
                    </td>

                    {/* Lifecycle Actions */}
                    <td className="py-4 px-4 align-top text-right">
                      {normStatus === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onOpenReject(req)}
                            className="px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => onOpenPrepare(req)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Accept & Prepare</span>
                          </button>
                        </div>
                      )}

                      {normStatus === "preparing" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onOpenDispatch(req)}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch Order</span>
                          </button>
                        </div>
                      )}

                      {normStatus === "dispatched" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onOpenDeliver(req)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify Call & Mark Live</span>
                          </button>
                        </div>
                      )}

                      {normStatus === "delivered" && (
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Live & Active
                          </span>
                          {req.verificationNotes && (
                            <p
                              className="text-[10px] text-slate-400 italic max-w-[200px] truncate ml-auto mt-0.5"
                              title={req.verificationNotes}
                            >
                              {req.verificationNotes}
                            </p>
                          )}
                        </div>
                      )}

                      {normStatus === "rejected" && (
                        <span className="text-xs text-slate-400">Closed</span>
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
