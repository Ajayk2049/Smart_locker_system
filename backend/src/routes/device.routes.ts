import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getDevices,
  createDevice,
  unlockDevice,
  getDeviceLogs,
} from "../controllers/device.controller.js";
import {
  testUnlockDevice,
  getDeviceCommand,
  receiveTelemetry,
  receiveHeartbeat,
} from "../controllers/deviceIot.controller.js";
import {
  addCoOwner,
  removeCoOwner,
  getDeviceSlots,
  createInviteCode,
  cancelInviteCode,
  joinDevice,
} from "../controllers/deviceSlot.controller.js";

export default async function deviceRoutes(fastify: FastifyInstance) {
  // 1. Diagnostic endpoint for hardware bench testing
  fastify.post("/test/unlock", {
    handler: testUnlockDevice,
  });

  // 2. IoT Hardware endpoints (ESP32 REST/HTTP short-polling & telemetry)
  fastify.get("/device/command", {
    handler: getDeviceCommand,
  });

  fastify.post("/device/telemetry", {
    handler: receiveTelemetry,
  });

  fastify.post("/device/heartbeat", {
    handler: receiveHeartbeat,
  });

  // 3. Protected user endpoints (require valid JWT)
  fastify.register(async (authScope) => {
    authScope.addHook("onRequest", authMiddleware);

    // Core device management
    authScope.get("/devices", {
      handler: getDevices,
    });

    authScope.post("/devices", {
      handler: createDevice,
    });

    authScope.post("/devices/:id/unlock", {
      handler: unlockDevice,
    });

    authScope.get("/devices/:id/logs", {
      handler: getDeviceLogs,
    });

    // Multi-user slot & invite management
    authScope.post("/devices/:id/co-owners", {
      handler: addCoOwner,
    });

    authScope.delete("/devices/:id/co-owners/:userId", {
      handler: removeCoOwner,
    });

    authScope.get("/devices/:id/slots", {
      handler: getDeviceSlots,
    });

    // Join Code system
    authScope.post("/devices/:id/invite", {
      handler: createInviteCode,
    });

    authScope.delete("/devices/:id/invite", {
      handler: cancelInviteCode,
    });

    authScope.post("/devices/join", {
      handler: joinDevice,
    });
  });
}
