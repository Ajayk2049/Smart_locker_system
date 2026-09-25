import Fastify from "fastify";
import mongoose from "mongoose";
import { config } from "./config.js";
import { checkDeviceWatchdog } from "./controllers/deviceIot.controller.js";
import { wsService } from "./services/websocket.service.js";
import { User } from "./models/User.model.js";
import { loggerConfig, loggerStream, isSilentTerminalPath, logFilePath, pruneLogsOlderThan24Hours } from "./logger.js";

import jwtPlugin from "./plugins/jwt.plugin.js";
import corsPlugin from "./plugins/cors.plugin.js";
import websocketPlugin from "./plugins/websocket.plugin.js";

import authRoutes from "./routes/auth.routes.js";
import deviceRoutes from "./routes/device.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { simulatorHtml } from "./simulator.html.js";

const fastify = Fastify({
  logger: {
    ...loggerConfig,
    stream: loggerStream,
  },
  disableRequestLogging: true, // We take control of request logging to silence OPTIONS and print clean lines
});

// Custom clean request and error hooks
fastify.addHook("onRequest", async (request) => {
  if (isSilentTerminalPath(request.url, request.method)) return;
  request.log.info(`➡️  ${request.method} ${request.url}`);
});

fastify.addHook("onResponse", async (request, reply) => {
  if (isSilentTerminalPath(request.url, request.method)) return;
  const ms = reply.elapsedTime.toFixed(1);
  const status = reply.statusCode;
  const statusEmoji = status >= 500 ? "💥" : status >= 400 ? "⚠️" : "✅";
  request.log.info(`${statusEmoji} ${request.method} ${request.url} ${status} (${ms}ms)`);
});

fastify.addHook("onError", async (request, reply, error) => {
  request.log.error(
    { err: error, url: request.url, method: request.method, body: request.body },
    `❌ Error handling ${request.method} ${request.url}: ${error.message}`
  );
});

async function bootstrap() {
  await fastify.register(corsPlugin);
  await fastify.register(jwtPlugin);
  await fastify.register(websocketPlugin);

  // Allow empty or blank JSON bodies (e.g. Flutter Dio POST without payload)
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (req, body, done) => {
      if (!body || (typeof body === "string" && body.trim() === "")) {
        return done(null, {});
      }
      try {
        return done(null, JSON.parse(body as string));
      } catch (err: any) {
        err.statusCode = 400;
        return done(err, undefined);
      }
    }
  );

  // Health checks
  fastify.get("/health", async () => ({ status: "ok", service: "smart-locker-backend" }));
  fastify.get("/api/health", async () => ({ status: "ok", service: "smart-locker-backend" }));

  // Virtual ESP32 Hardware Simulator GUI
  fastify.get("/simulator", async (request, reply) => {
    return reply.type("text/html").send(simulatorHtml);
  });

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
        fastify.log.error(error, "WS message parse error");
      }
    });

    socket.on("close", () => {
      wsService.removeClient(clientId);
    });
  });

  await mongoose.connect(config.mongodbUri);
  fastify.log.info("✅ MongoDB connected");

  // Sync MongoDB indexes (drop legacy non-sparse email index if present)
  await User.collection.dropIndex("email_1").catch(() => {});
  await User.syncIndexes().catch(() => {});

  // Start periodic watchdog timer for IoT device connectivity (runs every 10s)
  setInterval(checkDeviceWatchdog, 10 * 1000);
  // Prune logs older than 24 hours on startup and periodically every hour
  pruneLogsOlderThan24Hours().catch(() => {});
  setInterval(() => {
    pruneLogsOlderThan24Hours().catch((err) => {
      fastify.log.error(err, "Failed to prune logs older than 24 hours");
    });
  }, 60 * 60 * 1000);
  fastify.log.info("🧹 24-hour log cleanup worker active (1h cycle)");

  await fastify.listen({ port: config.port, host: "0.0.0.0" });
  fastify.log.info(`🚀 Server running on port ${config.port}`);
  fastify.log.info(`📝 Persistent log file active at: ${logFilePath}`);
}

bootstrap().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
