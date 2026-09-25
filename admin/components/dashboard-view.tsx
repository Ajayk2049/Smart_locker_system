"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { RequestsTable, LockerRequestItem, LockerRequestStatus } from "./dashboard/RequestsTable";
import { SlotRequestsTable, SlotRequestItem } from "./dashboard/SlotRequestsTable";
import { DashboardHeader, MainDashboardTab, PendingSubFilter } from "./dashboard/DashboardHeader";
import { DashboardModals } from "./dashboard/DashboardModals";
import { SlotPricingData } from "./modals/PricingModal";

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
  const [slotRequests, setSlotRequests] = useState<SlotRequestItem[]>([]);
  const [mainTab, setMainTab] = useState<MainDashboardTab>("live");
  const [pendingSubFilter, setPendingSubFilter] = useState<PendingSubFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Pricing Modal state
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [slotPricing, setSlotPricing] = useState<SlotPricingData>({
    monthlyPrice: 149,
    yearlyPrice: 999,
    currency: "INR",
  });

  // Modal states & inputs
  const [prepareModalData, setPrepareModalData] = useState<{ requestId: string; customerName: string; units: number; suggestedDeviceId: string } | null>(null);
  const [assignDeviceIdInput, setAssignDeviceIdInput] = useState("");
  const [prepareNotesInput, setPrepareNotesInput] = useState("");

  const [dispatchModalData, setDispatchModalData] = useState<{ requestId: string; customerName: string; deviceId: string } | null>(null);
  const [dispatchNotesInput, setDispatchNotesInput] = useState("");

  const [deliverModalData, setDeliverModalData] = useState<{ requestId: string; customerName: string; phone: string; deviceId: string } | null>(null);
  const [callVerificationInput, setCallVerificationInput] = useState(
    "Verified with customer over phone: Locker delivered, mounted at door, powered ON, and live."
  );

  const [rejectModalData, setRejectModalData] = useState<{ requestId: string; customerName: string } | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  const [simulatorModalData, setSimulatorModalData] = useState<{ deviceId: string; customerName: string } | null>(null);

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

  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    const token = localStorage.getItem("admin_token");
    if (!token) {
      if (!silent) setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch Delivery Orders
      const res = await fetch(`${apiUrl}/admin/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        if (onLogout) onLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }

      // 2. Fetch Slot Upgrade Requests
      const slotRes = await fetch(`${apiUrl}/admin/slot-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (slotRes.ok) {
        const slotData = await slotRes.json();
        setSlotRequests(slotData.requests || []);
      }

      // 3. Fetch Slot Pricing
      const priceRes = await fetch(`${apiUrl}/admin/pricing/slots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (priceRes.ok) {
        const pData = await priceRes.json();
        setSlotPricing({
          monthlyPrice: pData.monthlyPrice,
          yearlyPrice: pData.yearlyPrice,
          currency: pData.currency || "INR",
        });
      }
    } catch (err: any) {
      console.error("Error loading admin data:", err);
      if (!silent) {
        showNotification(err.message || "Could not sync latest requests", true);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [apiUrl, onLogout]);

  useEffect(() => {
    loadRequests(false);
    const interval = setInterval(() => {
      loadRequests(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [loadRequests]);

  // Save new Slot Pricing
  const handleSavePricing = async (monthly: number, yearly: number) => {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`${apiUrl}/admin/pricing/slots`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ monthlyPrice: monthly, yearlyPrice: yearly }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update pricing");

    setSlotPricing({
      monthlyPrice: monthly,
      yearlyPrice: yearly,
      currency: "INR",
    });
    showNotification("Slot pricing declared and updated for all users!");
  };

  // Approve Slot Request (unlocks all 3 extra slots to 5 total)
  const handleApproveSlotRequest = async (item: SlotRequestItem) => {
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${apiUrl}/admin/slot-requests/${item._id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNotes: "Approved via Admin Dashboard after phone confirmation" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve slot upgrade");

      showNotification(`All 3 extra slots unlocked for ${item.customerName} on ${item.deviceStringId}! (5 slots capacity live)`);
      await loadRequests(true);
    } catch (err: any) {
      showNotification(err.message || "Failed to approve slot upgrade", true);
    }
  };

  // Reject Slot Request
  const handleRejectSlotRequest = async (item: SlotRequestItem) => {
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${apiUrl}/admin/slot-requests/${item._id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNotes: "Declined by operator" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject slot request");

      showNotification(`Slot upgrade request for ${item.customerName} declined.`);
      await loadRequests(true);
    } catch (err: any) {
      showNotification(err.message || "Failed to reject slot request", true);
    }
  };

  // Revoke Slot Request (Takes locker back to 2 slots only)
  const handleRevokeSlotRequest = async (item: SlotRequestItem) => {
    const ok = window.confirm(
      `Are you sure you want to revoke extra slots for ${item.customerName} on locker ${item.deviceStringId}? This will reset the locker capacity back to 2 slots only.`
    );
    if (!ok) return;

    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${apiUrl}/admin/slot-requests/${item._id}/revoke`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNotes: "Revoked back to 2 slots by operator" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke slots");

      showNotification(`Locker ${item.deviceStringId} reset to 2 base slots successfully.`);
      await loadRequests(true);
    } catch (err: any) {
      showNotification(err.message || "Failed to revoke slots", true);
    }
  };


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

  // Filter calculations for 3 tabs
  const filterCounts = useMemo(() => {
    let pendingCount = 0;
    let preparingCount = 0;
    let dispatchedCount = 0;
    let deliveredCount = 0;

    requests.forEach((r) => {
      const s = r.status === "approved" ? "preparing" : r.status;
      if (s === "pending") pendingCount++;
      else if (s === "preparing") preparingCount++;
      else if (s === "dispatched") dispatchedCount++;
      else if (s === "delivered") deliveredCount++;
    });

    const pendingSlotUpgrades = slotRequests.filter((s) => s.status === "pending").length;

    return {
      live: deliveredCount,
      pending: pendingCount + preparingCount + dispatchedCount,
      slotUpgrades: pendingSlotUpgrades,
      all: requests.length,
      pendingBreakdown: {
        pending: pendingCount,
        preparing: preparingCount,
        dispatched: dispatchedCount,
      },
    };
  }, [requests, slotRequests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const normStatus = r.status === "approved" ? "preparing" : r.status;

      // 1. Filter by 3 Main Tabs:
      if (mainTab === "live") {
        if (normStatus !== "delivered") return false;
      } else if (mainTab === "pending") {
        const isPipeline = normStatus === "pending" || normStatus === "preparing" || normStatus === "dispatched";
        if (!isPipeline) return false;
        // Sub-filter inside pending tab:
        if (pendingSubFilter !== "all" && normStatus !== pendingSubFilter) return false;
      }
      // If mainTab === "all", include all

      // 2. Search query filter:
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
  }, [requests, mainTab, pendingSubFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <DashboardHeader
        adminUser={adminUser}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
        onRefresh={() => loadRequests(false)}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        mainTab={mainTab}
        onMainTabChange={setMainTab}
        pendingSubFilter={pendingSubFilter}
        onPendingSubFilterChange={setPendingSubFilter}
        filterCounts={filterCounts}
        onOpenPricing={() => setIsPricingModalOpen(true)}
      />

      <main className="flex-1 w-full px-6 sm:px-8 lg:px-10 pt-2 pb-12 flex flex-col gap-6">
        {mainTab === "slot-upgrades" ? (
          <SlotRequestsTable
            requests={slotRequests}
            isLoading={isLoading}
            onApprove={handleApproveSlotRequest}
            onReject={handleRejectSlotRequest}
            onRevoke={handleRevokeSlotRequest}
          />
        ) : (
          <RequestsTable
            requests={filteredRequests}
            isLoading={isLoading}
            onOpenPrepare={(req) => {
              const usedIds = new Set(requests.flatMap((r) => r.assignedDeviceIds || []));
              let nextNum = 1;
              while (usedIds.has(`BOX_${String(nextNum).padStart(3, "0")}`)) {
                nextNum++;
              }
              const nextSuggestedId = `BOX_${String(nextNum).padStart(3, "0")}`;
              setPrepareModalData({
                requestId: req._id,
                customerName: req.name,
                units: req.units,
                suggestedDeviceId: nextSuggestedId,
              });
              setAssignDeviceIdInput(nextSuggestedId);
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
            onSimulateDevice={(req, deviceId) => {
              setSimulatorModalData({
                deviceId,
                customerName: req.name,
              });
            }}
          />
        )}
      </main>

      {/* Standalone Modals */}
      <DashboardModals
        pricingModalOpen={isPricingModalOpen}
        pricingData={slotPricing}
        onClosePricing={() => setIsPricingModalOpen(false)}
        onSavePricing={handleSavePricing}
        prepareModalData={prepareModalData}
        assignDeviceIdInput={assignDeviceIdInput}
        onAssignDeviceIdChange={setAssignDeviceIdInput}
        prepareNotesInput={prepareNotesInput}
        onPrepareNotesChange={setPrepareNotesInput}
        onClosePrepare={() => setPrepareModalData(null)}
        onConfirmPrepare={handleConfirmPrepare}
        dispatchModalData={dispatchModalData}
        dispatchNotesInput={dispatchNotesInput}
        onDispatchNotesChange={setDispatchNotesInput}
        onCloseDispatch={() => setDispatchModalData(null)}
        onConfirmDispatch={handleConfirmDispatch}
        deliverModalData={deliverModalData}
        callVerificationInput={callVerificationInput}
        onCallVerificationChange={setCallVerificationInput}
        onCloseDeliver={() => setDeliverModalData(null)}
        onConfirmDeliver={handleConfirmDelivered}
        rejectModalData={rejectModalData}
        rejectionReasonInput={rejectionReasonInput}
        onRejectionReasonChange={setRejectionReasonInput}
        onCloseReject={() => setRejectModalData(null)}
        onConfirmReject={handleConfirmReject}
        simulatorModalData={simulatorModalData}
        onCloseSimulator={() => setSimulatorModalData(null)}
      />

      {/* Notifications */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-none bg-slate-900 text-white dark:bg-[#080D14] dark:text-slate-100 text-sm font-bold shadow-none flex items-center gap-3 border-2 border-[#00F5A0]">
          <CheckCircle2 className="w-5 h-5 text-[#00F5A0] shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-none bg-rose-600 text-white text-sm font-bold shadow-none flex items-center gap-3 border-2 border-rose-400">
          <AlertCircle className="w-5 h-5 text-white shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
    </div>
  );
}
