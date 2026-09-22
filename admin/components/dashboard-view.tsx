"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { RequestsTable, LockerRequestItem, LockerRequestStatus } from "./dashboard/RequestsTable";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { PrepareModal } from "./modals/PrepareModal";
import { DispatchModal } from "./modals/DispatchModal";
import { DeliveredModal } from "./modals/DeliveredModal";
import { RejectModal } from "./modals/RejectModal";

export type { LockerRequestStatus, LockerRequestItem };

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
  const [requests, setRequests] = useState<LockerRequestItem[]>([]);
  const [requestFilter, setRequestFilter] = useState<"all" | LockerRequestStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Modal states & inputs
  const [prepareModalData, setPrepareModalData] = useState<{
    requestId: string;
    customerName: string;
    units: number;
    suggestedDeviceId: string;
  } | null>(null);
  const [assignDeviceIdInput, setAssignDeviceIdInput] = useState("");
  const [prepareNotesInput, setPrepareNotesInput] = useState("");

  const [dispatchModalData, setDispatchModalData] = useState<{
    requestId: string;
    customerName: string;
    deviceId: string;
  } | null>(null);
  const [dispatchNotesInput, setDispatchNotesInput] = useState("");

  const [deliverModalData, setDeliverModalData] = useState<{
    requestId: string;
    customerName: string;
    phone: string;
    deviceId: string;
  } | null>(null);
  const [callVerificationInput, setCallVerificationInput] = useState(
    "Verified with customer over phone: Locker delivered, mounted at door, powered ON, and live."
  );

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

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/admin/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        if (onLogout) onLogout();
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err: any) {
      console.error("Error loading locker requests:", err);
      showNotification(err.message || "Could not sync latest locker requests", true);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, onLogout]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Transition handlers
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
          rejectionReason: rejectionReasonInput.trim() || "Declined by operator",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject request");

      showNotification(`Order for ${rejectModalData.customerName} has been rejected.`);
      setRejectModalData(null);
      await loadRequests();
    } catch (err: any) {
      showNotification(err.message || "Failed to reject request", true);
    }
  };

  // Filter calculations
  const filterCounts = useMemo(() => {
    const counts = { all: requests.length, pending: 0, preparing: 0, dispatched: 0, delivered: 0, rejected: 0 };
    requests.forEach((r) => {
      const s = r.status === "approved" ? "preparing" : r.status;
      if (counts[s as keyof typeof counts] !== undefined) counts[s as keyof typeof counts]++;
    });
    return counts;
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const normStatus = r.status === "approved" ? "preparing" : r.status;
      if (requestFilter !== "all" && normStatus !== requestFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const name = (r.name || "").toLowerCase();
      const phone = (r.phone || "").toLowerCase();
      const email = (r.email || "").toLowerCase();
      const address = (r.address || "").toLowerCase();
      const pincode = (r.pincode || "").toLowerCase();
      const devices = (r.assignedDeviceIds || []).join(" ").toLowerCase();

      return (
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        address.includes(q) ||
        pincode.includes(q) ||
        devices.includes(q)
      );
    });
  }, [requests, requestFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <DashboardHeader
        adminUser={adminUser}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
        onRefresh={loadRequests}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        requestFilter={requestFilter}
        onRequestFilterChange={setRequestFilter}
        filterCounts={filterCounts}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <RequestsTable
          requests={filteredRequests}
          isLoading={isLoading}
          onOpenPrepare={(req) => {
            setPrepareModalData({
              requestId: req._id,
              customerName: req.name,
              units: req.units,
              suggestedDeviceId: "BOX_001",
            });
            setAssignDeviceIdInput("BOX_001");
            setPrepareNotesInput("");
          }}
          onOpenDispatch={(req) => {
            setDispatchModalData({
              requestId: req._id,
              customerName: req.name,
              deviceId: req.assignedDeviceIds?.[0] || "BOX_001",
            });
            setDispatchNotesInput("");
          }}
          onOpenDeliver={(req) => {
            setDeliverModalData({
              requestId: req._id,
              customerName: req.name,
              phone: req.phone,
              deviceId: req.assignedDeviceIds?.[0] || "BOX_001",
            });
          }}
          onOpenReject={(req) => {
            setRejectModalData({
              requestId: req._id,
              customerName: req.name,
            });
            setRejectionReasonInput("");
          }}
        />
      </main>

      {/* Standalone Modals */}
      {prepareModalData && (
        <PrepareModal
          data={prepareModalData}
          deviceIdInput={assignDeviceIdInput}
          onDeviceIdChange={setAssignDeviceIdInput}
          notesInput={prepareNotesInput}
          onNotesChange={setPrepareNotesInput}
          onClose={() => setPrepareModalData(null)}
          onConfirm={handleConfirmPrepare}
        />
      )}

      {dispatchModalData && (
        <DispatchModal
          data={dispatchModalData}
          notesInput={dispatchNotesInput}
          onNotesChange={setDispatchNotesInput}
          onClose={() => setDispatchModalData(null)}
          onConfirm={handleConfirmDispatch}
        />
      )}

      {deliverModalData && (
        <DeliveredModal
          data={deliverModalData}
          verificationInput={callVerificationInput}
          onVerificationChange={setCallVerificationInput}
          onClose={() => setDeliverModalData(null)}
          onConfirm={handleConfirmDelivered}
        />
      )}

      {rejectModalData && (
        <RejectModal
          data={rejectModalData}
          reasonInput={rejectionReasonInput}
          onReasonChange={setRejectionReasonInput}
          onClose={() => setRejectModalData(null)}
          onConfirm={handleConfirmReject}
        />
      )}

      {/* Notifications */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-xl flex items-center gap-2.5 border border-slate-700 dark:border-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-white shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
    </div>
  );
}
