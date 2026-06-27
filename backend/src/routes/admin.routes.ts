import { FastifyInstance } from "fastify";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import {
  getAllDevices,
  getAllUsers,
  getSystemStats,
} from "../controllers/admin.controller.js";

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", adminMiddleware);

  fastify.get("/admin/devices", {
    handler: getAllDevices,
  });

  fastify.get("/admin/users", {
    handler: getAllUsers,
  });

  fastify.get("/admin/stats", {
    handler: getSystemStats,
  });
}
