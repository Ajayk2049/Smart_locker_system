export const simulatorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Smart Locker Hardware Simulator (ESP32)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090D16;
      --card: #111726;
      --border: #1E293B;
      --amber: #F59E0B;
      --amber-glow: rgba(245, 158, 11, 0.35);
      --emerald: #10B981;
      --rose: #EF4444;
      --cyan: #06B6D4;
      --text: #F8FAFC;
      --text-muted: #94A3B8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 24px;
    }
    header {
      max-width: 1200px;
      margin: 0 auto 24px auto;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-b: 1px solid var(--border);
      padding-bottom: 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .badge-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: var(--amber);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }
    .brand h1 { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .brand p { font-size: 12px; color: var(--text-muted); }

    .main-grid {
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 24px;
      flex: 1;
    }
    @media (max-width: 860px) {
      .main-grid { grid-template-columns: 1fr; }
    }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    /* Device Selector Strip */
    .device-strip {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #0B0F1C;
      padding: 8px 12px;
      border-radius: 12px;
      border: 1px solid var(--border);
    }
    .device-strip label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    .device-strip input {
      background: transparent;
      border: none;
      color: var(--amber);
      font-family: 'JetBrains Mono', monospace;
      font-weight: 800;
      font-size: 14px;
      width: 120px;
      outline: none;
    }
    .btn-toggle-power {
      margin-left: auto;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--emerald);
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-toggle-power.off {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.3);
      color: var(--rose);
    }

    /* Visual Locker Graphic */
    .locker-stage {
      background: radial-gradient(circle at 50% 30%, #1A2338 0%, #0D1322 100%);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      min-height: 240px;
    }
    .locker-box {
      width: 200px;
      height: 180px;
      background: #1E293B;
      border: 4px solid #334155;
      border-radius: 14px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 15px 35px rgba(0,0,0,0.5);
      overflow: hidden;
      perspective: 800px;
    }
    .locker-interior {
      position: absolute;
      inset: 0;
      background: #0B0F1C;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }
    .locker-door {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #334155 0%, #1E293B 100%);
      border: 2px solid #475569;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transform-origin: left center;
      transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: 2;
    }
    .locker-door.open {
      transform: rotateY(-85deg);
      box-shadow: 10px 0 20px rgba(0,0,0,0.4);
    }
    .door-handle {
      width: 14px;
      height: 38px;
      background: #64748B;
      border-radius: 4px;
      position: absolute;
      right: 12px;
      box-shadow: 1px 1px 3px rgba(0,0,0,0.4);
    }
    .door-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 800;
      color: var(--amber);
      letter-spacing: 0.1em;
    }

    /* LEDs Strip */
    .status-leds {
      display: flex;
      justify-content: space-around;
      width: 100%;
      margin-top: 15px;
      background: #0B0F1C;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid var(--border);
    }
    .led-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .led-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #334155;
      transition: all 0.2s;
    }
    .led-dot.online {
      background: var(--emerald);
      box-shadow: 0 0 10px var(--emerald);
      animation: pulse 2s infinite;
    }
    .led-dot.solenoid-active {
      background: var(--amber);
      box-shadow: 0 0 14px var(--amber);
      animation: flash 0.3s infinite alternate;
    }
    .led-dot.door-open {
      background: var(--cyan);
      box-shadow: 0 0 10px var(--cyan);
    }
    .led-label {
      font-size: 10px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    @keyframes flash {
      from { transform: scale(1); }
      to { transform: scale(1.3); }
    }

    /* Interactive Buttons */
    .btn-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .btn {
      padding: 12px 16px;
      border-radius: 12px;
      font-family: 'Outfit', sans-serif;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.15s;
      border: 1px solid transparent;
    }
    .btn-primary {
      background: var(--amber);
      color: #000;
    }
    .btn-primary:hover { background: #E68A00; }
    .btn-secondary {
      background: #1E293B;
      border-color: #334155;
      color: var(--text);
    }
    .btn-secondary:hover { background: #2A384E; }
    .btn-success {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.3);
      color: var(--emerald);
    }
    .btn-success:hover { background: rgba(16, 185, 129, 0.25); }

    /* Serial Terminal Console */
    .terminal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-b: 1px solid var(--border);
      padding-bottom: 10px;
    }
    .terminal-title {
      font-size: 12px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .terminal-actions button {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 11px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .terminal-actions button:hover { color: var(--text); background: rgba(255,255,255,0.05); }
    .console-logs {
      background: #060911;
      border: 1px solid #1E293B;
      border-radius: 12px;
      padding: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      line-height: 1.6;
      height: 380px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .log-line { display: flex; gap: 8px; }
    .log-time { color: #64748B; shrink: 0; }
    .log-tag { font-weight: 700; shrink: 0; }
    .log-tag.boot { color: var(--cyan); }
    .log-tag.hb { color: #475569; }
    .log-tag.cmd { color: var(--amber); }
    .log-tag.sensor { color: var(--emerald); }
    .log-tag.error { color: var(--rose); }
    .log-msg { color: #E2E8F0; word-break: break-all; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="badge-icon">📦</div>
      <div>
        <h1>Smart Locker ESP32 Simulator</h1>
        <p>Pure REST/HTTP Virtual Hardware Emulator for Mobile & Hub Testing</p>
      </div>
    </div>
    <div class="device-strip">
      <label>Device ID:</label>
      <input id="deviceIdInput" type="text" value="BOX_001" spellcheck="false" />
      <button id="powerBtn" class="btn-toggle-power" onclick="togglePower()">
        <span id="powerDot">●</span>
        <span id="powerText">Powered ON</span>
      </button>
    </div>
  </header>

  <div class="main-grid">
    <!-- Left Column: Visual Hardware -->
    <div class="card">
      <h2 style="font-size: 15px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
        Physical Box State
      </h2>

      <div class="locker-stage">
        <div class="locker-box">
          <div class="locker-interior">📦</div>
          <div id="lockerDoor" class="locker-door">
            <span class="door-label" id="doorDeviceBadge">BOX_001</span>
            <div class="door-handle"></div>
          </div>
        </div>

        <div class="status-leds">
          <div class="led-item">
            <div id="wifiLed" class="led-dot online"></div>
            <span class="led-label">Wi-Fi / PING</span>
          </div>
          <div class="led-item">
            <div id="solenoidLed" class="led-dot"></div>
            <span class="led-label" id="solenoidLabel">SOLENOID (3.0s)</span>
          </div>
          <div class="led-item">
            <div id="doorLed" class="led-dot"></div>
            <span class="led-label" id="doorStateLabel">DOOR CLOSED</span>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">
          Manual Action Triggers:
        </label>
        
        <div class="btn-group">
          <button class="btn btn-secondary" onclick="toggleDoor()">
            <span id="doorBtnIcon">🚪</span>
            <span id="doorBtnText">Pull Door Open</span>
          </button>
          <button class="btn btn-success" onclick="closeAndLock()">
            <span>🔒</span>
            <span>Push-to-Lock Shut</span>
          </button>
        </div>

        <button class="btn btn-primary" onclick="triggerTestUnlock()" style="margin-top: 4px;">
          <span>⚡</span>
          <span>Trigger Mobile Unlock Test (POST /api/test/unlock)</span>
        </button>

        <div style="padding: 10px 14px; background: #0B0F1C; border-radius: 10px; border: 1px solid var(--border); font-size: 11px; color: var(--text-muted); display: flex; align-items: center; justify-content: space-between;">
          <span>Auto-Relock Cycle (12s countdown):</span>
          <input type="checkbox" id="autoDeliveryToggle" style="accent-color: var(--amber); cursor: pointer;" />
        </div>
        <p style="font-size: 10px; color: #64748B; font-style: italic; text-align: center;">
          Default: Door stays OPEN when unlocked. Click "Push-to-Lock Shut" to simulate courier locking it!
        </p>
      </div>
    </div>

    <!-- Right Column: Live Serial Terminal -->
    <div class="card">
      <div class="terminal-header">
        <div class="terminal-title">
          <span>📟</span>
          <span>ESP32 Firmware Serial Console (UART @ 115200)</span>
        </div>
        <div class="terminal-actions">
          <button onclick="clearLogs()">Clear</button>
        </div>
      </div>

      <div id="consoleLogs" class="console-logs"></div>
    </div>
  </div>

  <script>
    let isPowered = true;
    let doorState = "closed"; // "closed" | "open"
    let solenoidActive = false;
    let pollTimer = null;
    let heartbeatTimer = null;

    const API_BASE = window.location.origin + "/api";

    function log(tag, msg, type = "") {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
      const container = document.getElementById("consoleLogs");
      
      const row = document.createElement("div");
      row.className = "log-line";
      row.innerHTML = \`
        <span class="log-time">[\${timeStr}]</span>
        <span class="log-tag \${type}">[\${tag}]</span>
        <span class="log-msg">\${msg}</span>
      \`;
      container.appendChild(row);
      container.scrollTop = container.scrollHeight;
    }

    function getDeviceId() {
      const val = document.getElementById("deviceIdInput").value.trim().toUpperCase() || "BOX_001";
      document.getElementById("doorDeviceBadge").innerText = val;
      return val;
    }

    // 1. Initial boot sync
    async function boot() {
      const id = getDeviceId();
      log("BOOT", \`ESP32 System initialized. Device ID: \${id}\`, "boot");
      log("BOOT", \`Wi-Fi connected to Local Hub. Base URL: \${API_BASE}\`, "boot");
      
      // Initial telemetry sync
      await sendTelemetry(doorState);
      // Start timers
      startLoop();
    }

    function startLoop() {
      stopLoop();
      // Poll command every 1500ms
      pollTimer = setInterval(pollCommand, 1500);
      // Send heartbeat every 15000ms
      heartbeatTimer = setInterval(sendHeartbeat, 15000);
      sendHeartbeat();
    }

    function stopLoop() {
      if (pollTimer) clearInterval(pollTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    }

    // 2. Poll Command from Backend
    async function pollCommand() {
      if (!isPowered) return;
      const id = getDeviceId();
      try {
        const res = await fetch(\`\${API_BASE}/device/command?deviceId=\${id}\`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.action === "unlock") {
          log("CMD", \`⚡ UNLOCK command received from Cloud Backend! (CmdID: \${data.commandId})\`, "cmd");
          handleUnlockCommand();
        }
      } catch (err) {
        log("ERROR", \`Poll failed: \${err.message}\`, "error");
      }
    }

    // 3. Handle Unlock Command
    function handleUnlockCommand() {
      energizeSolenoid();

      // Door springs open when solenoid unlocks
      setTimeout(() => {
        setDoorState("open");
        log("SENSOR", "⚡ Solenoid released mechanical latch! Door popped OPEN.", "sensor");

        const autoDelivery = document.getElementById("autoDeliveryToggle").checked;
        if (autoDelivery) {
          log("SENSOR", "Auto-relock enabled: Door will push shut in 12 seconds...", "sensor");
          setTimeout(() => {
            setDoorState("closed");
            log("SENSOR", "🔒 [AUTO-RELOCK] Door pushed shut! Delivery completed!", "sensor");
          }, 12000);
        } else {
          log("SENSOR", "Door is AJAR / OPEN. When ready, click 'Push-to-Lock Shut' to simulate closing the locker.", "sensor");
        }
      }, 600);
    }

    function energizeSolenoid() {
      solenoidActive = true;
      document.getElementById("solenoidLed").className = "led-dot solenoid-active";
      document.getElementById("solenoidLabel").innerText = "SOLENOID: ENERGIZED (3.0s)";

      // De-energize after 3.0 seconds
      setTimeout(() => {
        solenoidActive = false;
        document.getElementById("solenoidLed").className = "led-dot";
        document.getElementById("solenoidLabel").innerText = "SOLENOID: INACTIVE";
        log("RELAY", "Relay cut off. Solenoid returned to locked catch position.", "hb");
      }, 3000);
    }

    // 4. Door State Management & Telemetry
    async function setDoorState(newState) {
      doorState = newState;
      const doorEl = document.getElementById("lockerDoor");
      const doorLed = document.getElementById("doorLed");
      const label = document.getElementById("doorStateLabel");
      const btnText = document.getElementById("doorBtnText");
      const btnIcon = document.getElementById("doorBtnIcon");

      if (doorState === "open") {
        doorEl.classList.add("open");
        doorLed.className = "led-dot door-open";
        label.innerText = "DOOR OPEN";
        btnText.innerText = "Door is Open";
        btnIcon.innerText = "🚪";
      } else {
        doorEl.classList.remove("open");
        doorLed.className = "led-dot";
        label.innerText = "DOOR CLOSED";
        btnText.innerText = "Pull Door Open";
        btnIcon.innerText = "🚪";
      }

      await sendTelemetry(doorState);
    }

    async function sendTelemetry(state) {
      if (!isPowered) return;
      const id = getDeviceId();
      try {
        const res = await fetch(\`\${API_BASE}/device/telemetry\`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId: id, doorState: state })
        });
        const data = await res.json();
        log("SENSOR", \`POST /device/telemetry -> doorState: \${state} (Acknowledged by Cloud)\`, "sensor");
      } catch (e) {
        log("ERROR", \`Telemetry post error: \${e.message}\`, "error");
      }
    }

    // 5. Periodic Heartbeat
    async function sendHeartbeat() {
      if (!isPowered) return;
      const id = getDeviceId();
      try {
        const res = await fetch(\`\${API_BASE}/device/heartbeat\`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId: id })
        });
        if (res.ok) {
          log("HEARTBEAT", \`POST /device/heartbeat ping acknowledged (Device \${id} is ONLINE)\`, "hb");
        }
      } catch (e) {
        log("ERROR", \`Heartbeat error: \${e.message}\`, "error");
      }
    }

    // Manual User Triggers
    function toggleDoor() {
      if (doorState === "closed") {
        setDoorState("open");
        log("MANUAL", "Manual: Door opened manually.", "sensor");
      } else {
        setDoorState("closed");
        log("MANUAL", "Manual: Door closed manually.", "sensor");
      }
    }

    function closeAndLock() {
      setDoorState("closed");
      log("MANUAL", "Manual Push-to-Lock: Door shut and locked.", "sensor");
    }

    async function triggerTestUnlock() {
      const id = getDeviceId();
      log("USER", \`Enqueuing simulated unlock for \${id} (POST /api/test/unlock)... \`, "cmd");
      try {
        const res = await fetch(\`\${API_BASE}/test/unlock\`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId: id })
        });
        const data = await res.json();
        log("USER", \`Unlock command queued successfully (CmdID: \${data.commandId}). Next poll will pick it up!\`, "cmd");
      } catch (err) {
        log("ERROR", \`Failed to trigger test unlock: \${err.message}\`, "error");
      }
    }

    function togglePower() {
      isPowered = !isPowered;
      const btn = document.getElementById("powerBtn");
      const text = document.getElementById("powerText");
      const dot = document.getElementById("powerDot");
      const wifi = document.getElementById("wifiLed");

      if (isPowered) {
        btn.className = "btn-toggle-power";
        text.innerText = "Powered ON";
        dot.style.color = "var(--emerald)";
        wifi.className = "led-dot online";
        log("POWER", "Locker device powered back ON.", "boot");
        startLoop();
      } else {
        btn.className = "btn-toggle-power off";
        text.innerText = "Powered OFF";
        dot.style.color = "var(--rose)";
        wifi.className = "led-dot";
        log("POWER", "Locker device powered OFF. Network offline.", "error");
        stopLoop();
      }
    }

    function clearLogs() {
      document.getElementById("consoleLogs").innerHTML = "";
    }

    // Start on page load
    window.addEventListener("DOMContentLoaded", () => {
      boot();
    });
  </script>
</body>
</html>
`;
