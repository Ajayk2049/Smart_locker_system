import { FastifyInstance } from "fastify";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import {
  getAllDevices,
  getAllUsers,
  getSystemStats,
  updateDeviceSlots,
  createDeviceForUser,
  deleteDevice,
  createCustomer,
  getSystemLogs,
  getDeviceLogsForAdmin,
} from "../controllers/admin.controller.js";
import {
  getAllRequests,
  updateRequestStatus,
} from "../controllers/adminRequests.controller.js";
import {
  getSlotPricing,
  updateSlotPricing,
  getAllSlotRequests,
  approveSlotRequest,
  rejectSlotRequest,
  revokeSlotRequest,
} from "../controllers/pricing.controller.js";

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", adminMiddleware);

  fastify.get("/admin/devices", {
    handler: getAllDevices,
  });

  fastify.post("/admin/devices", {
    handler: createDeviceForUser,
  });

  fastify.delete("/admin/devices/:id", {
    handler: deleteDevice,
  });

  fastify.patch("/admin/devices/:id/slots", {
    handler: updateDeviceSlots,
  });

  fastify.get("/admin/users", {
    handler: getAllUsers,
  });

  fastify.post("/admin/users", {
    handler: createCustomer,
  });

  fastify.get("/admin/stats", {
    handler: getSystemStats,
  });

  // Order / Locker Delivery Requests
  fastify.get("/admin/requests", {
    handler: getAllRequests,
  });

  fastify.patch("/admin/requests/:id/status", {
    handler: updateRequestStatus,
  });

  // System & Device Logs
  fastify.get("/admin/logs", {
    handler: getSystemLogs,
  });

  fastify.get("/admin/devices/:id/logs", {
    handler: getDeviceLogsForAdmin,
  });

  // Slot Pricing (Admin view & edit)
  fastify.get("/admin/pricing/slots", {
    handler: getSlotPricing,
  });

  fastify.patch("/admin/pricing/slots", {
    handler: updateSlotPricing,
  });

  // Slot Upgrade Applications (Admin review, customer contact, approve all 3 slots, revoke back to 2 slots)
  fastify.get("/admin/slot-requests", {
    handler: getAllSlotRequests,
  });

  fastify.patch("/admin/slot-requests/:id/approve", {
    handler: approveSlotRequest,
  });

  fastify.patch("/admin/slot-requests/:id/reject", {
    handler: rejectSlotRequest,
  });

  fastify.patch("/admin/slot-requests/:id/revoke", {
    handler: revokeSlotRequest,
  });
}

