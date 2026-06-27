import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getDevices,
  unlockDevice,
  getDeviceLogs,
} from "../controllers/device.controller.js";

export default async function deviceRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", authMiddleware);

  fastify.get("/devices", {
    handler: getDevices,
  });

  fastify.post("/devices/:id/unlock", {
    handler: unlockDevice,
  });

  fastify.get("/devices/:id/logs", {
    handler: getDeviceLogs,
  });
}
