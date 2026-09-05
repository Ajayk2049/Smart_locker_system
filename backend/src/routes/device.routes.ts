import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getDevices,
  createDevice,
  unlockDevice,
  testUnlockDevice,
  getDeviceLogs,
  addCoOwner,
  removeCoOwner,
  getDeviceSlots,
  getDeviceCommand,
  receiveTelemetry,
  receiveHeartbeat,
  createInviteCode,
  cancelInviteCode,
  joinDevice,
} from "../controllers/device.controller.js";

export default async function deviceRoutes(fastify: FastifyInstance) {
  // 1. Public diagnostic endpoint for hardware team bench testing
  fastify.post("/test/unlock", {
    handler: testUnlockDevice,
  });

  // 2. Public IoT Hardware endpoints (ESP32 REST/HTTP communication)
  fastify.get("/device/command", {
    handler: getDeviceCommand,
  });

  fastify.post("/device/telemetry", {
    handler: receiveTelemetry,
  });

  fastify.post("/device/heartbeat", {
    handler: receiveHeartbeat,
  });

  // 2. Protected user endpoints (require valid JWT)
  fastify.register(async (authScope) => {
    authScope.addHook("onRequest", authMiddleware);

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
