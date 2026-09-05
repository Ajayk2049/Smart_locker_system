"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Box,
  Search,
  Check,
  XCircle,
  Clock,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  AlertCircle,
  CheckCircle2,
  X,
  Package,
  Truck,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";

export type LockerRequestStatus =
  | "pending"
  | "preparing"
  | "dispatched"
  | "delivered"
  | "approved"
  | "rejected";

interface LockerRequestItem {
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

interface DashboardViewProps {
  adminUser?: any;
  onLogout?: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export function DashboardView({
  adminUser,
  onLogout,
  theme = "light",
  onToggleTheme,
}: DashboardViewProps) {
  // Requests state
  const [requests, setRequests] = useState<LockerRequestItem[]>([]);
  const [requestFilter, setRequestFilter] = useState<"all" | "pending" | "preparing" | "dispatched" | "delivered" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 Modal: Accept & Prepare (Assign device ID)
  const [prepareModalData, setPrepareModalData] = useState<{
    requestId: string;
    customerName: string;
    units: number;
    suggestedDeviceId: string;
  } | null>(null);
  const [assignDeviceIdInput, setAssignDeviceIdInput] = useState("");
  const [prepareNotesInput, setPrepareNotesInput] = useState("");

  // Step 2 Modal: Dispatch order
  const [dispatchModalData, setDispatchModalData] = useState<{
    requestId: string;
    customerName: string;
    deviceId: string;
  } | null>(null);
  const [dispatchNotesInput, setDispatchNotesInput] = useState("");

  // Step 3 Modal: Deliver & Verify Live (Call confirmation)
  const [deliverModalData, setDeliverModalData] = useState<{
    requestId: string;
    customerName: string;
    phone: string;
    deviceId: string;
  } | null>(null);
  const [callVerificationInput, setCallVerificationInput] = useState(
    "Verified with customer over phone: Locker delivered, mounted at door, powered ON, and live."
  );

  // Reject Modal
  const [rejectModalData, setRejectModalData] = useState<{
    requestId: string;
    customerName: string;
  } | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  // Feedback notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4300/api";

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 3500);
    }
  };

  // Fetch Locker Requests
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/admin/requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err: any) {
      console.error("Error loading locker requests:", err);
      showNotification("Could not sync latest locker requests", true);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Transition 1: Pending -> Preparing (Accept & Assign Hardware)
  const handleConfirmPrepare = async () => {
    if (!prepareModalData) return;
    const deviceId = assignDeviceIdInput.trim().toUpperCase() || prepareModalData.suggestedDeviceId;
    if (!deviceId) {
      showNotification("Please provide a Device ID", true);
      return;
    }

    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${apiUrl}/admin/requests/${prepareModalData.requestId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "preparing",
          deviceId,
          notes: prepareNotesInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept request");

      showNotification(`Order accepted! Locker ${deviceId} is now in PREPARATION.`);
      setPrepareModalData(null);
      await loadRequests();
    } catch (err: any) {
      showNotification(err.message || "Failed to accept request", true);
    }
  };

  // Transition 2: Preparing -> Dispatched
  const handleConfirmDispatch = async () => {
    if (!dispatchModalData) return;
    const token = localStorage.getItem("admin_token");

    try {
      const res = await fetch(`${apiUrl}/admin/requests/${dispatchModalData.requestId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "dispatched",
          notes: dispatchNotesInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch order");

      showNotification(`Locker ${dispatchModalData.deviceId} marked as DISPATCHED.`);
      setDispatchModalData(null);
      await loadRequests();
    } catch (err: any) {
      showNotification(err.message || "Failed to dispatch order", true);
    }
  };

  // Transition 3: Dispatched -> Delivered (Post-call verification)
  const handleConfirmDelivered = async () => {
    if (!deliverModalData) return;
    const token = localStorage.getItem("admin_token");

    try {
      const res = await fetch(`${apiUrl}/admin/requests/${deliverModalData.requestId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "delivered",
          verificationNotes: callVerificationInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm delivery");

      showNotification(`Locker ${deliverModalData.deviceId} verified live & marked as DELIVERED!`);
      setDeliverModalData(null);
      await loadRequests();
    } catch (err: any) {
      showNotification(err.message || "Failed to confirm delivery", true);
    }
  };

  // Reject Request
  const handleConfirmReject = async () => {
    if (!rejectModalData) return;
    const token = localStorage.getItem("admin_token");

    try {
      const res = await fetch(`${apiUrl}/admin/requests/${rejectModalData.requestId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "rejected",
          rejectionReason: rejectionReasonInput.trim() || "Address outside delivery radius",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject request");

      showNotification(`Order rejected for ${rejectModalData.customerName}`);
      setRejectModalData(null);
      await loadRequests();
    } catch (err: any) {
      showNotification(err.message || "Failed to reject request", true);
    }
  };

  // Filter and Search Requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        r.address.toLowerCase().includes(q) ||
        r.pincode.includes(q) ||
        (r.assignedDeviceIds && r.assignedDeviceIds.some((d) => d.toLowerCase().includes(q)));

      // Handle legacy approved as preparing
      const normStatus = r.status === "approved" ? "preparing" : r.status;
      const matchesFilter = requestFilter === "all" ? true : normStatus === requestFilter;
      return matchesSearch && matchesFilter;
    });
  }, [requests, searchQuery, requestFilter]);

  // Counts for tabs
  const pendingCount = useMemo(() => requests.filter((r) => r.status === "pending").length, [requests]);
  const preparingCount = useMemo(
    () => requests.filter((r) => r.status === "preparing" || r.status === "approved").length,
    [requests]
  );
  const dispatchedCount = useMemo(() => requests.filter((r) => r.status === "dispatched").length, [requests]);
  const deliveredCount = useMemo(() => requests.filter((r) => r.status === "delivered").length, [requests]);
  const rejectedCount = useMemo(() => requests.filter((r) => r.status === "rejected").length, [requests]);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col">
      {/* Top Header */}
      <header className="w-full bg-white dark:bg-[#101522] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <Box className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-100">
                Secure Box Admin
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Customer Locker Provisioning & Deployment
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadRequests}
              disabled={isLoading}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Refresh table"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-500" : ""}`} />
            </button>

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 pl-3 ml-1 border-l border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                {adminUser?.name || "Admin"}
              </span>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer ml-1"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">
        {/* Controls: Lifecycle Filter Tabs & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status filter tabs */}
          <div className="inline-flex flex-wrap p-1 bg-white dark:bg-[#101522] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setRequestFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                requestFilter === "all"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              All ({requests.length})
            </button>
            <button
              onClick={() => setRequestFilter("pending")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                requestFilter === "pending"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-amber-600 dark:text-amber-400 hover:text-amber-700"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setRequestFilter("preparing")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                requestFilter === "preparing"
                  ? "bg-blue-600 text-white font-bold"
                  : "text-blue-600 dark:text-blue-400 hover:text-blue-700"
              }`}
            >
              Preparing ({preparingCount})
            </button>
            <button
              onClick={() => setRequestFilter("dispatched")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                requestFilter === "dispatched"
                  ? "bg-purple-600 text-white font-bold"
                  : "text-purple-600 dark:text-purple-400 hover:text-purple-700"
              }`}
            >
              Dispatched ({dispatchedCount})
            </button>
            <button
              onClick={() => setRequestFilter("delivered")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                requestFilter === "delivered"
                  ? "bg-emerald-600 text-white font-bold"
                  : "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
              }`}
            >
              Delivered & Live ({deliveredCount})
            </button>
            <button
              onClick={() => setRequestFilter("rejected")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                requestFilter === "rejected"
                  ? "bg-rose-600 text-white font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, phone, address, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-[#101522] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Clean Lifecycle Table */}
        <div className="bg-white dark:bg-[#101522] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Delivery Address</th>
                  <th className="py-3.5 px-4 text-center">Units</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Locker</th>
                  <th className="py-3.5 px-4 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No locker orders found.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => {
                    const normStatus = req.status === "approved" ? "preparing" : req.status;
                    const primaryDeviceId = req.assignedDeviceIds?.[0] || "BOX_001";

                    return (
                      <tr
                        key={req._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        {/* Customer */}
                        <td className="py-4 px-4 align-top">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {req.name}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(req.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
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
                          {/* STAGE 1: PENDING */}
                          {normStatus === "pending" && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setRejectModalData({
                                    requestId: req._id,
                                    customerName: req.name,
                                  });
                                  setRejectionReasonInput("");
                                }}
                                className="px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Reject
                              </button>

                              <button
                                onClick={() => {
                                  setPrepareModalData({
                                    requestId: req._id,
                                    customerName: req.name,
                                    units: req.units,
                                    suggestedDeviceId: "BOX_001",
                                  });
                                  setAssignDeviceIdInput("BOX_001");
                                  setPrepareNotesInput("");
                                }}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Accept & Prepare</span>
                              </button>
                            </div>
                          )}

                          {/* STAGE 2: PREPARING -> DISPATCH */}
                          {normStatus === "preparing" && (
                            <button
                              onClick={() => {
                                setDispatchModalData({
                                  requestId: req._id,
                                  customerName: req.name,
                                  deviceId: primaryDeviceId,
                                });
                                setDispatchNotesInput("");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ml-auto"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Dispatch Order</span>
                            </button>
                          )}

                          {/* STAGE 3: DISPATCHED -> VERIFY & DELIVER */}
                          {normStatus === "dispatched" && (
                            <button
                              onClick={() => {
                                setDeliverModalData({
                                  requestId: req._id,
                                  customerName: req.name,
                                  phone: req.phone,
                                  deviceId: primaryDeviceId,
                                });
                                setCallVerificationInput(
                                  `Verified with ${req.name} over call: Hardware received, installed, and online.`
                                );
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ml-auto"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              <span>Verify Call & Mark Live</span>
                            </button>
                          )}

                          {/* STAGE 4: DELIVERED & LIVE */}
                          {normStatus === "delivered" && (
                            <div className="text-right">
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" /> Live & Active
                              </span>
                              {req.verificationNotes && (
                                <p className="text-[10px] text-slate-400 italic max-w-[200px] truncate ml-auto mt-0.5" title={req.verificationNotes}>
                                  {req.verificationNotes}
                                </p>
                              )}
                            </div>
                          )}

                          {/* STAGE 5: REJECTED */}
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
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: ACCEPT & PREPARE (Assign hardware ID)                           */}
      {/* ========================================================================= */}
      {prepareModalData && (
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
                    Assign hardware to customer {prepareModalData.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPrepareModalData(null)}
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
                  value={assignDeviceIdInput}
                  onChange={(e) => setAssignDeviceIdInput(e.target.value)}
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
                  value={prepareNotesInput}
                  onChange={(e) => setPrepareNotesInput(e.target.value)}
                  placeholder="e.g. Firmware flashed, battery tested"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPrepareModalData(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPrepare}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Accept & Move to Preparing</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DISPATCH ORDER (Hand over to logistics)                         */}
      {/* ========================================================================= */}
      {dispatchModalData && (
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
                    Out for delivery to {dispatchModalData.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDispatchModalData(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              Locker <strong>{dispatchModalData.deviceId}</strong> is packaged and handed over to the courier/installation engineer.
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Dispatch / Courier Note (Optional)
              </label>
              <input
                type="text"
                value={dispatchNotesInput}
                onChange={(e) => setDispatchNotesInput(e.target.value)}
                placeholder="e.g. Dispatched via Express Hub Team (Delivery Slot: Today 4-6 PM)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDispatchModalData(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Truck className="w-4 h-4" />
                <span>Confirm Dispatched</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VERIFY OVER CALL & MARK DELIVERED                               */}
      {/* ========================================================================= */}
      {deliverModalData && (
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
                    Confirm live state with {deliverModalData.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeliverModalData(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
              <div className="flex justify-between font-mono font-bold">
                <span>Customer Phone:</span>
                <span>+91 {deliverModalData.phone}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span>Hardware Unit:</span>
                <span className="font-bold">{deliverModalData.deviceId}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Call Verification Details
              </label>
              <textarea
                rows={3}
                value={callVerificationInput}
                onChange={(e) => setCallVerificationInput(e.target.value)}
                placeholder="Details of the verification call (e.g. confirmed installed on porch and device is online)."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeliverModalData(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelivered}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Delivered & Live</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REJECT ORDER                                                    */}
      {/* ========================================================================= */}
      {rejectModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#101522] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Reject Order
                  </h3>
                  <p className="text-xs text-slate-500">
                    For customer: {rejectModalData.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalData(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-1 pt-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Reason for Rejection
              </label>
              <textarea
                rows={3}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Delivery address outside current Bengaluru pilot zone."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalData(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-xl flex items-center gap-2.5 border border-slate-700 dark:border-slate-300 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="w-4 h-4 text-white shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
    </div>
  );
}
