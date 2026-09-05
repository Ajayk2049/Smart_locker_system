const http = require("http");
const readline = require("readline");

const BASE_HOST = process.env.BACKEND_HOST || "localhost";
const BASE_PORT = process.env.BACKEND_PORT || 4300;
const DEVICE_ID = (process.argv[2] || "BOX_001").trim().toUpperCase();

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { "Content-Type": "application/json" };
    if (payload) headers["Content-Length"] = Buffer.byteLength(payload);

    const req = http.request(
      {
        host: BASE_HOST,
        port: BASE_PORT,
        path,
        method,
        headers,
        timeout: 5000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on("error", (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

function timestamp() {
  const now = new Date();
  return now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
}

function log(tag, msg) {
  console.log(`[${timestamp()}] [${tag}] ${msg}`);
}

let doorState = "closed";
let isSolenoidActive = false;

async function sendTelemetry(state) {
  doorState = state;
  try {
    const res = await request("POST", "/api/device/telemetry", {
      deviceId: DEVICE_ID,
      doorState: state,
    });
    log("SENSOR", `Reed switch -> DOOR ${state.toUpperCase()} (POST /api/device/telemetry acknowledged)`);
  } catch (err) {
    log("ERROR", `Telemetry failed: ${err.message}`);
  }
}

async function sendHeartbeat() {
  try {
    const res = await request("POST", "/api/device/heartbeat", { deviceId: DEVICE_ID });
    if (res.statusCode === 200) {
      log("HEARTBEAT", `Ping acknowledged. Device ${DEVICE_ID} is ONLINE in mobile app.`);
    }
  } catch (err) {
    log("ERROR", `Heartbeat failed: ${err.message}`);
  }
}

async function pollCommand() {
  try {
    const res = await request("GET", `/api/device/command?deviceId=${DEVICE_ID}`);
    if (res.statusCode === 200 && res.data?.action === "unlock") {
      log("CMD", `⚡ UNLOCK COMMAND RECEIVED! (Command ID: ${res.data.commandId})`);
      handleUnlock();
    }
  } catch (err) {
    // suppress poll errors on network hiccups
  }
}

function handleUnlock() {
  isSolenoidActive = true;
  log("RELAY", "⚡ Solenoid energized! Relay pin set to HIGH for 3.0 seconds.");
  log("MECHANICAL", "Spring-loaded latch released. Door popped OPEN.");

  setTimeout(async () => {
    await sendTelemetry("open");
    log("DELIVERY", "🚪 Door is now OPEN! Courier is depositing parcel.");
    log("INSTRUCTION", "👉 Press [c] in this terminal to simulate pushing the door shut & locking it!");
  }, 600);

  // De-energize solenoid after 3.0s
  setTimeout(() => {
    isSolenoidActive = false;
    log("RELAY", "Relay returned to LOW (Solenoid de-energized).");
  }, 3000);
}

async function triggerSelfUnlock() {
  log("TEST", `Simulating mobile app unlock trigger for ${DEVICE_ID}...`);
  try {
    const res = await request("POST", "/api/test/unlock", { deviceId: DEVICE_ID });
    log("TEST", `Unlock command queued (Cmd ID: ${res.data.commandId}). Next poll will pick it up.`);
  } catch (err) {
    log("ERROR", `Failed to queue test unlock: ${err.message}`);
  }
}

async function start() {
  console.log("\n=======================================================");
  console.log(`🤖 SMART LOCKER HARDWARE SIMULATOR (ESP32)`);
  console.log(`   Device ID: ${DEVICE_ID}`);
  console.log(`   Backend:   http://${BASE_HOST}:${BASE_PORT}/api`);
  console.log("=======================================================");
  console.log("Controls:");
  console.log("  [o] -> Open Door");
  console.log("  [c] -> Push Door Shut (Lock)");
  console.log("  [u] -> Trigger Mobile Unlock Command");
  console.log("  [q] -> Quit Simulator");
  console.log("=======================================================\n");

  // Initial Boot Telemetry
  await sendTelemetry("closed");
  await sendHeartbeat();

  // Polling loop (1.5s)
  setInterval(pollCommand, 1500);

  // Heartbeat loop (15s)
  setInterval(sendHeartbeat, 15000);

  // Keyboard input listener
  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on("keypress", (str, key) => {
      if (key.ctrl && key.name === "c") {
        process.exit();
      }
      if (key.name === "q") {
        log("SIM", "Exiting simulator.");
        process.exit(0);
      }
      if (key.name === "o") {
        sendTelemetry("open");
      }
      if (key.name === "c") {
        sendTelemetry("closed");
      }
      if (key.name === "u") {
        triggerSelfUnlock();
      }
    });
  }
}

start().catch(console.error);
