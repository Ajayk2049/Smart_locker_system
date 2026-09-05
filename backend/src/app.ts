import Fastify from "fastify";
import mongoose from "mongoose";
import { config } from "./config.js";
import { checkDeviceWatchdog } from "./controllers/device.controller.js";
import { wsService } from "./services/websocket.service.js";
import { User } from "./models/User.model.js";

import jwtPlugin from "./plugins/jwt.plugin.js";
import corsPlugin from "./plugins/cors.plugin.js";
import websocketPlugin from "./plugins/websocket.plugin.js";

import authRoutes from "./routes/auth.routes.js";
import deviceRoutes from "./routes/device.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const fastify = Fastify({
  logger: true,
});

async function bootstrap() {
  await fastify.register(corsPlugin);
  await fastify.register(jwtPlugin);
  await fastify.register(websocketPlugin);

  // Health checks
  fastify.get("/health", async () => ({ status: "ok", service: "smart-locker-backend" }));
  fastify.get("/api/health", async () => ({ status: "ok", service: "smart-locker-backend" }));

  // Routes
  await fastify.register(authRoutes, { prefix: "/api/auth" });
  await fastify.register(deviceRoutes, { prefix: "/api" });
  await fastify.register(adminRoutes, { prefix: "/api" });

  fastify.get("/ws", { websocket: true }, (socket, request) => {
    const clientId = Math.random().toString(36).substring(7);
    const user = request.user as { id: string } | undefined;
    wsService.addClient(clientId, socket, user?.id || "anonymous");

    socket.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "JOIN_ROOM" && data.deviceId) {
          wsService.joinRoom(clientId, data.deviceId);
        }
      } catch (error) {
        console.error("WS message parse error:", error);
      }
    });

    socket.on("close", () => {
      wsService.removeClient(clientId);
    });
  });

  await mongoose.connect(config.mongodbUri);
  console.log("✅ MongoDB connected");

  // Sync MongoDB indexes (drop legacy non-sparse email index if present)
  await User.collection.dropIndex("email_1").catch(() => {});
  await User.syncIndexes().catch(() => {});

  // Start periodic watchdog timer for IoT device connectivity (runs every 10s)
  setInterval(checkDeviceWatchdog, 10 * 1000);
  console.log("⏱️ IoT Device Watchdog initialized (10s interval)");

  await fastify.listen({ port: config.port, host: "0.0.0.0" });
  console.log(`🚀 Server running on port ${config.port}`);
}

bootstrap().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
