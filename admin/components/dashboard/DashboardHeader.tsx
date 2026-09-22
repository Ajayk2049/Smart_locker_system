import React from "react";
import { Box, Search, RefreshCw, Sun, Moon, LogOut } from "lucide-react";
import { LockerRequestStatus } from "./RequestsTable";

interface DashboardHeaderProps {
  adminUser?: any;
  theme: "light" | "dark";
  onToggleTheme?: () => void;
  onLogout?: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  requestFilter: "all" | LockerRequestStatus;
  onRequestFilterChange: (filter: "all" | LockerRequestStatus) => void;
  filterCounts: {
    all: number;
    pending: number;
    preparing: number;
    dispatched: number;
    delivered: number;
    rejected: number;
  };
}

export function DashboardHeader({
  adminUser,
  theme,
  onToggleTheme,
  onLogout,
  onRefresh,
  isLoading,
  searchQuery,
  onSearchChange,
  requestFilter,
  onRequestFilterChange,
  filterCounts,
}: DashboardHeaderProps) {
  return (
    <>
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black shadow-xs">
              <Box className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-slate-900 dark:text-slate-100 tracking-tight">
                  Secure Box
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-mono">
                  Orders Console
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh order pipeline"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-600" : ""}`} />
            </button>

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>
            )}

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            <div className="text-right hidden sm:block font-mono">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {adminUser?.email || "Platform Admin"}
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Log out of Admin Portal"
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Subheader Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {(
            [
              { id: "all", label: "All Orders", count: filterCounts.all },
              { id: "pending", label: "Pending", count: filterCounts.pending },
              { id: "preparing", label: "Preparing", count: filterCounts.preparing },
              { id: "dispatched", label: "Dispatched", count: filterCounts.dispatched },
              { id: "delivered", label: "Delivered & Live", count: filterCounts.delivered },
              { id: "rejected", label: "Rejected", count: filterCounts.rejected },
            ] as const
          ).map((tab) => {
            const active = requestFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onRequestFilterChange(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  active
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "bg-white dark:bg-[#101522] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    active
                      ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, phone, PIN, device..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#101522] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
          />
        </div>
      </div>
    </>
  );
}
