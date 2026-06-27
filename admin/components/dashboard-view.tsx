"use client";

import React, { useState } from "react";
import {
  Server,
  Lock,
  Unlock,
  BatteryCharging,
  Wifi,
  Activity,
  ShieldAlert,
  RefreshCw,
  Terminal,
} from "lucide-react";

interface LockerDevice {
  id: string;
  name: string;
  status: "online" | "offline";
  doorState: "locked" | "unlocked";
  battery: number;
  rssi: number;
  lastDelivery: string;
}

export function DashboardView() {
  const [activeTab, setActiveTab] = useState<"overview" | "devices" | "logs">("overview");
  const [devices, setDevices] = useState<LockerDevice[]>([
    {
      id: "BOX-IOT-8841",
      name: "Front Door Parcel Locker (North)",
      status: "online",
      doorState: "locked",
      battery: 98,
      rssi: -54,
      lastDelivery: "14 mins ago",
    },
    {
      id: "BOX-IOT-8842",
      name: "Garage Wall Delivery Chute",
      status: "online",
      doorState: "locked",
      battery: 89,
      rssi: -62,
      lastDelivery: "3 hours ago",
    },
    {
      id: "BOX-IOT-8849",
      name: "Backyard Garden Gate Locker",
      status: "offline",
      doorState: "locked",
      battery: 14,
      rssi: -88,
      lastDelivery: "2 days ago",
    },
  ]);

  const [logs, setLogs] = useState([
    { time: "23:14:02", unit: "BOX-IOT-8841", event: "MQTT Heartbeat ACK", type: "info" },
    { time: "23:01:45", unit: "BOX-IOT-8841", event: "Solenoid Lock Engaged (Push-to-Lock)", type: "success" },
    { time: "22:58:10", unit: "BOX-IOT-8841", event: "Authorized Courier PIN #4910 Entered", type: "info" },
    { time: "21:12:33", unit: "BOX-IOT-8849", event: "Low Battery Warning (Threshold < 15%)", type: "warning" },
  ]);

  const toggleLock = (id: string) => {
    setDevices(
      devices.map((d) =>
        d.id === id
          ? { ...d, doorState: d.doorState === "locked" ? "unlocked" : "locked" }
          : d
      )
    );
    setLogs([
      {
        time: new Date().toLocaleTimeString("en-GB"),
        unit: id,
        event: `Remote Override: Door state changed via Admin UI`,
        type: "warning",
      },
      ...logs,
    ]);
  };

  return (
    <div className="flex h-screen w-full bg-[#0B0F19] text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 bg-[#070A12] flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-3 pb-8 border-b border-slate-800/80">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black tracking-wider uppercase text-sm">SmartBox IoT</h1>
              <span className="text-[10px] text-amber-500 font-mono tracking-widest">ADMIN BRIDGE</span>
            </div>
          </div>

          <nav className="flex flex-col gap-2 pt-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === "overview"
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Activity className="w-4 h-4" />
              Telemetry Grid
            </button>
            <button
              onClick={() => setActiveTab("devices")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === "devices"
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Lock className="w-4 h-4" />
              Locker Units ({devices.length})
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === "logs"
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Terminal className="w-4 h-4" />
              MQTT Live Sync
            </button>
          </nav>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>MQTT Bridge Connected</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">:4300</span>
        </div>
      </aside>

      {/* Main Dashboard Canvas */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-20 border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 bg-[#0B0F19]/80 backdrop-blur-md z-10">
          <div>
            <h2 className="text-xl font-extrabold capitalize">{activeTab} Control Center</h2>
            <p className="text-xs text-slate-400">Managing residential parcel hardware fleet</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDevices([...devices])}
              className="p-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all"
              title="Poll Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5" />
              WS: ACTIVE
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Lockers</span>
              <span className="text-3xl font-black text-amber-500">2 / 3</span>
            </div>
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Broker Latency</span>
              <span className="text-3xl font-black text-emerald-400">12 ms</span>
            </div>
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Security Events</span>
              <span className="text-3xl font-black text-slate-200">0 Alerts</span>
            </div>
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Firmware Sync</span>
              <span className="text-3xl font-black text-indigo-400">v2.4.19</span>
            </div>
          </div>

          {/* Device Cards Section */}
          {(activeTab === "overview" || activeTab === "devices") && (
            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-bold tracking-tight text-slate-200">Deployed Delivery Hardware</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {devices.map((unit) => (
                  <div
                    key={unit.id}
                    className="p-6 rounded-3xl bg-[#0F1523] border border-slate-800 shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs text-amber-500 font-extrabold">{unit.id}</span>
                        <h4 className="font-extrabold text-base pt-1">{unit.name}</h4>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          unit.status === "online"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {unit.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800/80 font-mono text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <BatteryCharging className="w-4 h-4 text-amber-500" />
                        <span>{unit.battery}% Battery</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-indigo-400" />
                        <span>{unit.rssi} dBm</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-500 font-medium">Delivered {unit.lastDelivery}</span>
                      <button
                        onClick={() => toggleLock(unit.id)}
                        className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md transition-all ${
                          unit.doorState === "locked"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                            : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        }`}
                      >
                        {unit.doorState === "locked" ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            Locked
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            Unlocked
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Audit & MQTT Stream */}
          {(activeTab === "overview" || activeTab === "logs") && (
            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-bold tracking-tight text-slate-200">Real-Time MQTT Broker Logs</h3>
              <div className="p-6 rounded-3xl bg-[#060911] border border-slate-800/80 font-mono text-xs flex flex-col gap-3 shadow-inner max-h-96 overflow-y-auto">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-2 border-b border-slate-900 last:border-0">
                    <span className="text-slate-500">{log.time}</span>
                    <span className="text-amber-500 font-bold w-32">{log.unit}</span>
                    <span
                      className={`flex-1 ${
                        log.type === "warning"
                          ? "text-rose-400"
                          : log.type === "success"
                          ? "text-emerald-400"
                          : "text-slate-300"
                      }`}
                    >
                      {log.event}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
