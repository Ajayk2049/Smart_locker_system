"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Lock,
  Wifi,
  Users,
  Search,
  Plus,
  Minus,
  Copy,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Phone,
  Mail,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Box,
  Trash2,
  UserPlus,
  Inbox,
  FileText,
  MapPin,
  Package,
  ShieldCheck,
  Check,
  XCircle,
  Activity,
  Smartphone,
  Eye,
} from "lucide-react";

interface CoOwner {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  joinedAt?: string;
}

interface CustomerBox {
  id: string;
  deviceId: string;
  name: string;
  doorState: "locked" | "unlocked" | "closed" | "open";
  online: boolean;
  rssi?: number;
  lastHeartbeat?: string;
  allowedSlots: number;
  totalCapacity: number;
  occupiedSlots: number;
  inviteCode?: string;
  inviteExpiresAt?: string;
  coOwners: CoOwner[];
}

interface CustomerAccount {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: "user" | "admin";
  isPhoneVerified: boolean;
  createdAt: string;
  address?: string;
  pincode?: string;
  units?: number;
  orderStatus?: string;
  boxes: CustomerBox[];
}

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
  status: "pending" | "approved" | "rejected";
  assignedDeviceIds: string[];
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  reviewedAt?: string;
}

interface SystemLogItem {
  _id: string;
  deviceId?: {
    _id: string;
    deviceId: string;
    name: string;
  };
  action: string;
  timestamp: string;
  metadata?: any;
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
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"requests" | "customers" | "devices" | "logs">("requests");

  // Requests state
  const [requests, setRequests] = useState<LockerRequestItem[]>([]);
  const [requestFilter, setRequestFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [requestSearch, setRequestSearch] = useState("");

  // Modals for Request actions
  const [approveModalData, setApproveModalData] = useState<{
    requestId: string;
    customerName: string;
    units: number;
    suggestedDeviceId: string;
  } | null>(null);
  const [assignDeviceIdInput, setAssignDeviceIdInput] = useState("");
  const [assignNotesInput, setAssignNotesInput] = useState("");

  const [rejectModalData, setRejectModalData] = useState<{
    requestId: string;
    customerName: string;
  } | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  // Customers & Devices state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "with_boxes" | "no_boxes">("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [rawDevicesList, setRawDevicesList] = useState<any[]>([]);

  // Modals for Customer & Device Assignment
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignBoxData, setAssignBoxData] = useState({ deviceId: "", name: "", targetUserId: "" });
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: "", phone: "", email: "" });

  // Device Logs Modal
  const [viewingDeviceLogs, setViewingDeviceLogs] = useState<{
    boxId: string;
    deviceId: string;
    name: string;
  } | null>(null);
  const [deviceLogsList, setDeviceLogsList] = useState<any[]>([]);
  const [loadingDeviceLogs, setLoadingDeviceLogs] = useState(false);

  // System Logs Tab state
  const [systemLogs, setSystemLogs] = useState<SystemLogItem[]>([]);
  const [logFilterAction, setLogFilterAction] = useState<string>("all");

  // UI feedback
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // 1. Fetch All Locker Requests
  const loadRequests = useCallback(async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${apiUrl}/admin/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  }, [apiUrl]);

  // 2. Fetch Customer Accounts & Devices
  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [usersRes, devicesRes] = await Promise.all([
        fetch(`${apiUrl}/admin/users`, { headers }),
        fetch(`${apiUrl}/admin/devices`, { headers }),
      ]);

      const usersData = await usersRes.json();
      const devicesData = await devicesRes.json();

      const rawUsers = (usersData.users || []).filter((u: any) => u.role !== "admin");
      const rawDevices = devicesData.devices || [];
      setRawDevicesList(rawDevices);

      const mappedCustomers: CustomerAccount[] = rawUsers.map((u: any) => {
        const userBoxes: CustomerBox[] = rawDevices
          .filter((d: any) => {
            const ownerId = d.ownerId?._id || d.ownerId;
            return ownerId?.toString() === u._id?.toString();
          })
          .map((d: any) => ({
            id: d._id,
            deviceId: d.deviceId,
            name: d.name || "Secure Delivery Box",
            doorState: d.doorState === "closed" ? "closed" : "open",
            online: Boolean(d.online),
            rssi: d.rssi ?? -55,
            lastHeartbeat: d.lastHeartbeat ? new Date(d.lastHeartbeat).toLocaleTimeString() : "Never",
            allowedSlots: d.allowedSlots || 2,
            totalCapacity: d.totalCapacity || 5,
            occupiedSlots: d.occupiedSlots || 1 + (d.coOwners?.length || 0),
            inviteCode: d.inviteCode,
            inviteExpiresAt: d.inviteExpiresAt ? "Valid 24h" : undefined,
            coOwners: (d.coOwners || []).map((co: any) => ({
              id: co._id || co,
              name: co.name || "Co-Owner",
              phone: co.phone || "—",
              email: co.email,
              joinedAt: "Active",
            })),
          }));

        return {
          id: u._id,
          name: u.name || "Customer",
          phone: u.phone ? `+91 ${u.phone}` : "No phone added",
          email: u.email || "No email added",
          role: u.role || "user",
          isPhoneVerified: Boolean(u.isPhoneVerified),
          address: u.address,
          pincode: u.pincode,
          units: u.units || 1,
          orderStatus: u.orderStatus || "pending",
          createdAt: u.createdAt
            ? new Date(u.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Recent",
          boxes: userBoxes,
        };
      });

      setCustomers(mappedCustomers);
    } catch (err: any) {
      console.error("Failed to load accounts:", err);
      showNotification("Failed to fetch customer accounts", true);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  // 3. Fetch System Activity Logs
  const loadSystemLogs = useCallback(async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${apiUrl}/admin/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.logs) {
        setSystemLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    }
  }, [apiUrl]);

  // Load everything on mount
  useEffect(() => {
    loadRequests();
    loadAccounts();
    loadSystemLogs();
  }, [loadRequests, loadAccounts, loadSystemLogs]);

  // Pending requests count for badge
  const pendingRequestsCount = useMemo(() => {
    return requests.filter((r) => r.status === "pending").length;
  }, [requests]);

  // ==========================================
  // REQUEST ACTIONS (ACCEPT / REJECT)
  // ==========================================

  const handleOpenApproveModal = (req: LockerRequestItem) => {
    // Generate a default device ID suggestion e.g. BOX_001 or increment
    const existingCount = rawDevicesList.length + 1;
    const padNum = String(existingCount).padStart(3, "0");
    const suggestedId = `BOX_${padNum}`;

    setApproveModalData({
      requestId: req._id,
      customerName: req.name,
      units: req.units || 1,
      suggestedDeviceId: suggestedId,
    });
    setAssignDeviceIdInput(suggestedId);
    setAssignNotesInput("");
  };

  const submitApproveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveModalData || !assignDeviceIdInput.trim()) return;

    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${apiUrl}/admin/requests/${approveModalData.requestId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "approved",
          deviceId: assignDeviceIdInput.trim().toUpperCase(),
          notes: assignNotesInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve request");

      showNotification(data.message || `Request approved for ${approveModalData.customerName}`);
      setApproveModalData(null);
      await Promise.all([loadRequests(), loadAccounts(), loadSystemLogs()]);
    } catch (err: any) {
      showNotification(err.message || "Failed to approve request", true);
    }
  };

  const handleOpenRejectModal = (req: LockerRequestItem) => {
    setRejectModalData({
      requestId: req._id,
      customerName: req.name,
    });
    setRejectionReasonInput("Delivery address is outside current Bangalore service limits");
  };

  const submitRejectRequest = async (e: React.FormEvent) => {
    e.preventDefault();
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
          rejectionReason: rejectionReasonInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject request");

      showNotification(data.message || `Request rejected for ${rejectModalData.customerName}`);
      setRejectModalData(null);
      await Promise.all([loadRequests(), loadAccounts(), loadSystemLogs()]);
    } catch (err: any) {
      showNotification(err.message || "Failed to reject request", true);
    }
  };

  // ==========================================
  // DEVICE LOGS VIEWER (READ-ONLY)
  // ==========================================

  const openDeviceLogs = async (box: { id: string; deviceId: string; name: string }) => {
    setViewingDeviceLogs({
      boxId: box.id,
      deviceId: box.deviceId,
      name: box.name,
    });
    setLoadingDeviceLogs(true);
    const token = localStorage.getItem("admin_token");

    try {
      const res = await fetch(`${apiUrl}/admin/devices/${box.id}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDeviceLogsList(data.logs || []);
    } catch (err) {
      console.error("Failed to load device logs:", err);
      setDeviceLogsList([]);
    } finally {
      setLoadingDeviceLogs(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // Adjust authorized slots
  const adjustSlots = async (customerId: string, boxId: string, delta: number) => {
    const token = localStorage.getItem("admin_token");
    const cust = customers.find((c) => c.id === customerId);
    const box = cust?.boxes.find((b) => b.id === boxId);
    if (!box) return;

    const nextSlots = Math.min(5, Math.max(2, box.allowedSlots + delta));

    try {
      const res = await fetch(`${apiUrl}/admin/devices/${boxId}/slots`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ allowedSlots: nextSlots }),
      });

      if (!res.ok) throw new Error("Failed to update slots");

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? {
                ...c,
                boxes: c.boxes.map((b) => (b.id === boxId ? { ...b, allowedSlots: nextSlots } : b)),
              }
            : c
        )
      );
      showNotification(`Shared user limit updated to ${nextSlots}`);
      loadSystemLogs();
    } catch (e: any) {
      showNotification(e.message || "Failed to update slots", true);
    }
  };

  // Generate join code
  const generateJoinCode = async (customerId: string, boxId: string) => {
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${apiUrl}/devices/${boxId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate invite code");

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? {
                ...c,
                boxes: c.boxes.map((b) =>
                  b.id === boxId
                    ? { ...b, inviteCode: data.inviteCode, inviteExpiresAt: "Valid 24h" }
                    : b
                ),
              }
            : c
        )
      );
      showNotification(`Invite code ${data.inviteCode} created`);
    } catch (e: any) {
      showNotification(e.message || "Failed to generate code", true);
    }
  };

  // Assign locker manually
  const handleAssignBox = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUserId = assignBoxData.targetUserId || selectedCustomerId;
    if (!targetUserId || !assignBoxData.deviceId.trim()) return;

    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${apiUrl}/admin/devices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deviceId: assignBoxData.deviceId.trim().toUpperCase(),
          name: assignBoxData.name.trim() || "Main Porch Locker",
          ownerId: targetUserId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign locker");

      await loadAccounts();
      setIsAssignModalOpen(false);
      setAssignBoxData({ deviceId: "", name: "", targetUserId: "" });
      showNotification(`Locker ${assignBoxData.deviceId.toUpperCase()} assigned successfully`);
      loadSystemLogs();
    } catch (err: any) {
      showNotification(err.message || "Failed to assign locker", true);
    }
  };

  // Add customer manually
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerData.phone && !newCustomerData.email) return;

    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${apiUrl}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCustomerData.name.trim() || "Customer",
          phone: newCustomerData.phone.trim(),
          email: newCustomerData.email.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create customer");

      await loadAccounts();
      setIsAddCustomerModalOpen(false);
      setNewCustomerData({ name: "", phone: "", email: "" });
      showNotification(`Customer account created for ${data.user?.name || "Customer"}`);
    } catch (err: any) {
      showNotification(err.message || "Failed to create customer", true);
    }
  };

  // Delete device
  const handleDeleteDevice = async (boxId: string, deviceId: string) => {
    if (!confirm(`Are you sure you want to remove locker ${deviceId}?`)) return;

    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${apiUrl}/admin/devices/${boxId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to remove locker");

      await loadAccounts();
      showNotification(`Locker ${deviceId} removed`);
      loadSystemLogs();
    } catch (err: any) {
      showNotification(err.message || "Failed to remove locker", true);
    }
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const q = requestSearch.toLowerCase();
      const matchesSearch =
        r.name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        r.address.toLowerCase().includes(q) ||
        r.pincode.includes(q);

      const matchesFilter = requestFilter === "all" ? true : r.status === requestFilter;
      return matchesSearch && matchesFilter;
    });
  }, [requests, requestSearch, requestFilter]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.boxes.some((b) => b.deviceId.toLowerCase().includes(q) || b.name.toLowerCase().includes(q));

      const matchesFilter =
        filterType === "all"
          ? true
          : filterType === "with_boxes"
          ? c.boxes.length > 0
          : c.boxes.length === 0;

      return matchesSearch && matchesFilter;
    });
  }, [customers, searchQuery, filterType]);

  // Filtered system logs
  const filteredSystemLogs = useMemo(() => {
    if (logFilterAction === "all") return systemLogs;
    return systemLogs.filter((l) => l.action.toLowerCase().includes(logFilterAction.toLowerCase()));
  }, [systemLogs, logFilterAction]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#080B12] text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      {/* Top Application Bar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#080B12]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Box className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">
                Secure Box
              </span>
              <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Admin Console
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "requests"
                  ? "bg-white dark:bg-[#0B0F19] text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Locker Requests</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("customers")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "customers"
                  ? "bg-white dark:bg-[#0B0F19] text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customers ({customers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("devices")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "devices"
                  ? "bg-white dark:bg-[#0B0F19] text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Locker Hardware ({rawDevicesList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "logs"
                  ? "bg-white dark:bg-[#0B0F19] text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Activity Logs</span>
            </button>
          </nav>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              loadRequests();
              loadAccounts();
              loadSystemLogs();
            }}
            disabled={isLoading}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh All"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            title={`Switch theme`}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {adminUser?.name || "AIBotInk Admin"}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {adminUser?.email || "Aibotink.web@gmail.com"}
              </span>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Tab selector */}
      <div className="md:hidden flex items-center justify-around border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] p-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-3 py-1.5 rounded-lg ${activeTab === "requests" ? "bg-amber-500/20 text-amber-500" : "text-slate-600"}`}
        >
          Requests ({pendingRequestsCount})
        </button>
        <button
          onClick={() => setActiveTab("customers")}
          className={`px-3 py-1.5 rounded-lg ${activeTab === "customers" ? "bg-amber-500/20 text-amber-500" : "text-slate-600"}`}
        >
          Customers
        </button>
        <button
          onClick={() => setActiveTab("devices")}
          className={`px-3 py-1.5 rounded-lg ${activeTab === "devices" ? "bg-amber-500/20 text-amber-500" : "text-slate-600"}`}
        >
          Hardware
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-3 py-1.5 rounded-lg ${activeTab === "logs" ? "bg-amber-500/20 text-amber-500" : "text-slate-600"}`}
        >
          Logs
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        {/* Toast Notification */}
        {actionSuccess && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="w-4 h-4 text-white" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Security / Privacy Banner (Admin Lock Isolation Notice) */}
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong className="font-bold">Hardware Security Policy:</strong> Admin console provides monitoring, audit logs, and locker assignment. Physical lock/unlock commands are strictly isolated to authenticated customers.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 shrink-0 hidden sm:inline">
            ZERO ADMIN UNLOCK PRIVILEGE
          </span>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: LOCKER DELIVERY REQUESTS (ORDERS)                                  */}
        {/* ========================================================================= */}
        {activeTab === "requests" && (
          <div className="flex flex-col gap-6">
            {/* Header & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                  <span>Locker Delivery Orders</span>
                  {pendingRequestsCount > 0 && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black">
                      {pendingRequestsCount} Pending
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Review customer orders placed through the landing page. Approve to provision and assign lockers, or reject with notes.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  onClick={() => setRequestFilter("all")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    requestFilter === "all"
                      ? "bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  All ({requests.length})
                </button>
                <button
                  onClick={() => setRequestFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    requestFilter === "pending"
                      ? "bg-amber-500 text-slate-950 shadow-xs"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  Pending ({pendingRequestsCount})
                </button>
                <button
                  onClick={() => setRequestFilter("approved")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    requestFilter === "approved"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Approved ({requests.filter((r) => r.status === "approved").length})
                </button>
                <button
                  onClick={() => setRequestFilter("rejected")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    requestFilter === "rejected"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Rejected ({requests.filter((r) => r.status === "rejected").length})
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders by name, phone, address, pincode..."
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors shadow-xs"
              />
            </div>

            {/* Orders List / Cards */}
            {filteredRequests.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
                <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  No orders found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  {requestFilter === "pending"
                    ? "All customer locker requests have been processed!"
                    : "No orders matching your search query."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    {/* Top Row: Customer info & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                            {req.name}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                            {req.units} UNIT{req.units > 1 ? "S" : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-mono font-semibold">
                            <Phone className="w-3.5 h-3.5 text-amber-600" />
                            +91 {req.phone}
                          </span>
                          {req.email && (
                            <span className="flex items-center gap-1 truncate max-w-[180px]">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {req.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Stamp */}
                      {req.status === "pending" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> PENDING REVIEW
                        </span>
                      )}
                      {req.status === "approved" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> APPROVED
                        </span>
                      )}
                      {req.status === "rejected" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> REJECTED
                        </span>
                      )}
                    </div>

                    {/* Middle: Delivery Address & Bengaluru PIN */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between text-slate-500 font-mono text-[10.5px]">
                        <span className="flex items-center gap-1 font-sans font-bold">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" /> DESTINATION
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          BENGALURU - {req.pincode}
                        </span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 font-medium leading-snug">
                        {req.address}
                      </p>
                    </div>

                    {/* Assigned Device or Rejection Reason Note */}
                    {req.status === "approved" && req.assignedDeviceIds?.length > 0 && (
                      <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                        <span className="font-medium">Assigned Hardware:</span>
                        <span className="font-mono font-black tracking-wider bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded text-emerald-900 dark:text-emerald-200">
                          {req.assignedDeviceIds.join(", ")}
                        </span>
                      </div>
                    )}

                    {req.status === "rejected" && (
                      <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300">
                        <span className="font-bold">Rejection Note: </span>
                        <span>{req.rejectionReason || "Outside serviceable radius"}</span>
                      </div>
                    )}

                    {/* Bottom Metadata & Admin Actions */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(req.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {req.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenRejectModal(req)}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleOpenApproveModal(req)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            Approve & Give Device
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CUSTOMERS DIRECTORY                                               */}
        {/* ========================================================================= */}
        {activeTab === "customers" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Customers Directory
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage accounts, view assigned lockers, and adjust multi-user slot capacities.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setNewCustomerData({ name: "", phone: "", email: "" });
                    setIsAddCustomerModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-500" />
                  Add Customer
                </button>

                <button
                  onClick={() => {
                    if (customers.length > 0) {
                      setSelectedCustomerId(customers[0].id);
                      setAssignBoxData({ deviceId: "", name: "", targetUserId: customers[0].id });
                      setIsAssignModalOpen(true);
                    } else {
                      showNotification("Add a customer account first before assigning a locker", true);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Assign Locker
                </button>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, phone, email, or locker ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors shadow-xs"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterType === "all"
                      ? "bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  All ({customers.length})
                </button>
                <button
                  onClick={() => setFilterType("with_boxes")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterType === "with_boxes"
                      ? "bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  With Lockers
                </button>
                <button
                  onClick={() => setFilterType("no_boxes")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterType === "no_boxes"
                      ? "bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  No Locker Yet
                </button>
              </div>
            </div>

            {/* Customers Table / Grid */}
            <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-bold text-amber-700 dark:text-amber-400 text-sm shrink-0">
                        {cust.name[0]?.toUpperCase() || "C"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                            {cust.name}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Joined {cust.createdAt}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="font-mono font-medium">{cust.phone}</span>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{cust.email}</span>
                          {cust.address && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[240px] text-slate-600 dark:text-slate-400">
                                {cust.address} ({cust.pincode || "560xxx"})
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Locker Boxes badge & Actions */}
                    <div className="flex items-center gap-3 self-end md:self-center">
                      <div className="flex items-center gap-2">
                        {cust.boxes.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">No locker assigned</span>
                        ) : (
                          cust.boxes.map((b) => (
                            <div
                              key={b.id}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200"
                            >
                              <Box className="w-3.5 h-3.5 text-amber-600" />
                              <span>{b.deviceId}</span>
                              <span className={`w-2 h-2 rounded-full ${b.online ? "bg-emerald-500" : "bg-slate-400"}`} />
                            </div>
                          ))
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedCustomerId(cust.id)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Manage</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LOCKER HARDWARE INVENTORY (ZERO LOCK CONTROL - AUDIT ONLY)          */}
        {/* ========================================================================= */}
        {activeTab === "devices" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Locker Hardware Inventory
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time status, door state telemetry, and event history for all registered lockers.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedCustomerId(customers[0]?.id || "");
                  setAssignBoxData({ deviceId: "", name: "", targetUserId: customers[0]?.id || "" });
                  setIsAssignModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Register New Locker
              </button>
            </div>

            {rawDevicesList.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800">
                <Box className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  No lockers registered yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rawDevicesList.map((dev) => {
                  const isClosed = dev.doorState === "closed";

                  return (
                    <div
                      key={dev._id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-black text-slate-900 dark:text-slate-100">
                              {dev.deviceId}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                dev.online
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                              }`}
                            >
                              <Wifi className="w-3 h-3" />
                              {dev.online ? "ONLINE" : "OFFLINE"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{dev.name}</p>
                        </div>

                        {/* Door State Telemetry (Read-only badge, zero toggle) */}
                        <div
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black uppercase font-mono flex items-center gap-1.5 ${
                            isClosed
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              : "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          <Lock className="w-3 h-3 stroke-[2.5]" />
                          <span>DOOR: {isClosed ? "CLOSED" : "OPEN"}</span>
                        </div>
                      </div>

                      {/* Owner & Slots */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <span>Primary Owner:</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {dev.ownerId?.name || dev.ownerId?.email || "Assigned"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <span>Allowed Slots:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {dev.allowedSlots || 2} / 5
                          </span>
                        </div>
                      </div>

                      {/* Locker Actions: View Logs (Admin cannot control lock) */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() =>
                            openDeviceLogs({
                              id: dev._id,
                              deviceId: dev.deviceId,
                              name: dev.name,
                            })
                          }
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-500" />
                          <span>View Device Logs</span>
                        </button>

                        <button
                          onClick={() => handleDeleteDevice(dev._id, dev.deviceId)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                          title="Remove locker"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SYSTEM & ACTIVITY AUDIT LOGS                                      */}
        {/* ========================================================================= */}
        {activeTab === "logs" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  System & Activity Logs
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete audit trail of locker events, orders, customer unlocks, and configuration changes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={logFilterAction}
                  onChange={(e) => setLogFilterAction(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Events</option>
                  <option value="order">Order Events</option>
                  <option value="unlock">Customer Unlocks</option>
                  <option value="door">Door Open / Close</option>
                  <option value="delivery">Delivery Success</option>
                  <option value="slot">Slot Limit Changes</option>
                </select>

                <button
                  onClick={loadSystemLogs}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] hover:bg-slate-100 text-slate-600 cursor-pointer"
                  title="Refresh logs"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {filteredSystemLogs.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800">
                <Activity className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  No activity logs recorded yet.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredSystemLogs.map((log) => (
                    <div
                      key={log._id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                          {log.action.includes("order") ? (
                            <Package className="w-4 h-4 text-amber-500" />
                          ) : log.action.includes("unlock") ? (
                            <Lock className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Activity className="w-4 h-4 text-sky-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100 uppercase font-mono">
                              {log.action.replace(/_/g, " ")}
                            </span>
                            {log.deviceId && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
                                {log.deviceId.deviceId}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            {log.metadata
                              ? typeof log.metadata === "string"
                                ? log.metadata
                                : JSON.stringify(log.metadata)
                              : "Standard event logged"}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono self-end sm:self-center shrink-0">
                        {new Date(log.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: APPROVE ORDER & ASSIGN HARDWARE DEVICE                             */}
      {/* ========================================================================= */}
      {approveModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Approve & Assign Locker
                </h3>
                <p className="text-xs text-slate-500">
                  Customer: <span className="font-bold text-slate-700 dark:text-slate-300">{approveModalData.customerName}</span> ({approveModalData.units} Unit{approveModalData.units > 1 ? "s" : ""})
                </p>
              </div>
              <button
                onClick={() => setApproveModalData(null)}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitApproveRequest} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Locker Device ID to Assign
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BOX_001"
                  value={assignDeviceIdInput}
                  onChange={(e) => setAssignDeviceIdInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono uppercase focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500">
                  If this device ID is new, it will be automatically registered and linked to {approveModalData.customerName}.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Dispatch Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled for delivery tomorrow 11 AM"
                  value={assignNotesInput}
                  onChange={(e) => setAssignNotesInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setApproveModalData(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Confirm & Give Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REJECT ORDER REQUEST                                               */}
      {/* ========================================================================= */}
      {rejectModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-rose-600 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Reject Locker Request
                </h3>
                <p className="text-xs text-slate-500">
                  Customer: <span className="font-bold text-slate-700 dark:text-slate-300">{rejectModalData.customerName}</span>
                </p>
              </div>
              <button
                onClick={() => setRejectModalData(null)}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitRejectRequest} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Reason for Rejection
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectModalData(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW DEVICE EVENT LOGS                                            */}
      {/* ========================================================================= */}
      {viewingDeviceLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[85vh] rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  Hardware Event Logs: {viewingDeviceLogs.deviceId}
                </h3>
                <p className="text-xs text-slate-500">{viewingDeviceLogs.name}</p>
              </div>
              <button
                onClick={() => setViewingDeviceLogs(null)}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[55vh]">
              {loadingDeviceLogs ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading events...</div>
              ) : deviceLogsList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No log entries recorded for this locker.
                </div>
              ) : (
                deviceLogsList.map((log: any, idx: number) => (
                  <div
                    key={log._id || idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold uppercase text-slate-800 dark:text-slate-200">
                        {log.action?.replace(/_/g, " ")}
                      </span>
                      {log.metadata?.note && (
                        <span className="text-slate-500 text-[11px]">• {log.metadata.note}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.timestamp || log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingDeviceLogs(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CUSTOMER DETAIL & DEVICE MANAGEMENT DRAWER                        */}
      {/* ========================================================================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg h-full bg-white dark:bg-[#0B0F19] border-l border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col justify-between gap-5 overflow-y-auto">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-bold text-amber-700 dark:text-amber-400 text-sm">
                    {selectedCustomer.name[0]?.toUpperCase() || "C"}
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {selectedCustomer.name}
                    </h2>
                    <span className="text-xs text-slate-500 font-mono">{selectedCustomer.phone}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Customer Details */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-sans font-medium">Email:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-sans font-medium">Order Status:</span>
                  <span className="font-bold uppercase text-amber-600 dark:text-amber-400">{selectedCustomer.orderStatus}</span>
                </div>
                {selectedCustomer.address && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 font-sans font-medium block">Address:</span>
                    <span className="font-sans font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {selectedCustomer.address}, Bengaluru - {selectedCustomer.pincode}
                    </span>
                  </div>
                )}
              </div>

              {/* Assigned Lockers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Assigned Lockers ({selectedCustomer.boxes.length})
                  </h3>
                  <button
                    onClick={() => {
                      setAssignBoxData({ deviceId: "", name: "", targetUserId: selectedCustomer.id });
                      setIsAssignModalOpen(true);
                    }}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign Another Box
                  </button>
                </div>

                {selectedCustomer.boxes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No lockers assigned to this customer.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.boxes.map((box) => (
                      <div
                        key={box.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                              {box.deviceId}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${box.online ? "bg-emerald-500" : "bg-slate-400"}`}
                            />
                          </div>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                            DOOR: {box.doorState.toUpperCase()}
                          </span>
                        </div>

                        {/* Slots controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500">Shared Slots ({box.allowedSlots}/5):</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => adjustSlots(selectedCustomer.id, box.id, -1)}
                              disabled={box.allowedSlots <= 2}
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-30 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono font-bold">{box.allowedSlots}</span>
                            <button
                              onClick={() => adjustSlots(selectedCustomer.id, box.id, 1)}
                              disabled={box.allowedSlots >= 5}
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-30 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* View Logs Button */}
                        <button
                          onClick={() =>
                            openDeviceLogs({
                              id: box.id,
                              deviceId: box.deviceId,
                              name: box.name,
                            })
                          }
                          className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-500" />
                          View Event Logs
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedCustomerId(null)}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN LOCKER MANUALLY                                            */}
      {/* ========================================================================= */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Assign Locker
                </h3>
                <p className="text-xs text-slate-500">Link hardware box to customer account</p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignBox} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Customer
                </label>
                <select
                  value={assignBoxData.targetUserId || selectedCustomerId || ""}
                  onChange={(e) =>
                    setAssignBoxData({ ...assignBoxData, targetUserId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email || c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Locker ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BOX_001"
                  value={assignBoxData.deviceId}
                  onChange={(e) =>
                    setAssignBoxData({ ...assignBoxData, deviceId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Locker Label / Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Front Porch Box"
                  value={assignBoxData.name}
                  onChange={(e) =>
                    setAssignBoxData({ ...assignBoxData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm cursor-pointer"
                >
                  Assign Locker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CUSTOMER MANUALLY                                             */}
      {/* ========================================================================= */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Add Customer
                </h3>
                <p className="text-xs text-slate-500">Create customer account</p>
              </div>
              <button
                onClick={() => setIsAddCustomerModalOpen(false)}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Customer Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Sharma"
                  value={newCustomerData.name}
                  onChange={(e) =>
                    setNewCustomerData({ ...newCustomerData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={newCustomerData.phone}
                  onChange={(e) =>
                    setNewCustomerData({ ...newCustomerData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. vikram@example.com"
                  value={newCustomerData.email}
                  onChange={(e) =>
                    setNewCustomerData({ ...newCustomerData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
