import Fastify from "fastify";
import mongoose from "mongoose";
import { config } from "./config.js";
import { checkDeviceWatchdog } from "./controllers/deviceIot.controller.js";
import { wsService } from "./services/websocket.service.js";
import { User } from "./models/User.model.js";
import { loggerConfig, loggerStream, isSilentTerminalPath, logFilePath, pruneLogsOlderThan24Hours } from "./logger.js";

import jwtPlugin from "./plugins/jwt.plugin.js";
import corsPlugin from "./plugins/cors.plugin.js";
import helmetPlugin from "./plugins/helmet.plugin.js";
import websocketPlugin from "./plugins/websocket.plugin.js";
import rateLimitPlugin from "./plugins/rateLimit.plugin.js";
import mongoSanitizePlugin from "./plugins/mongoSanitize.plugin.js";

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

function redactSensitiveData(data: any): any {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(redactSensitiveData);

  const sensitiveKeys = new Set([
    "password",
    "otp",
    "token",
    "refreshtoken",
    "devicekey",
    "secret",
    "authorization",
    "admin_initial_password",
  ]);

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (sensitiveKeys.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (val && typeof val === "object") {
      sanitized[key] = redactSensitiveData(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

fastify.addHook("onError", async (request, reply, error) => {
  request.log.error(
    {
      err: error,
      url: request.url,
      method: request.method,
      body: redactSensitiveData(request.body),
    },
    `❌ Error handling ${request.method} ${request.url}: ${error.message}`
  );
});

async function bootstrap() {
  await fastify.register(corsPlugin);
  await fastify.register(helmetPlugin);
  await fastify.register(rateLimitPlugin);
  await fastify.register(mongoSanitizePlugin);
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

  // Virtual ESP32 Hardware Simulator GUI (Protected: disabled in production unless admin authenticated)
  fastify.get("/simulator", async (request, reply) => {
    if (process.env.NODE_ENV === "production") {
      const token = (request.query as { token?: string })?.token;
      if (!token) {
        return reply.status(403).send({ error: "Simulator is disabled in production environments" });
      }
      try {
        const decoded: any = fastify.jwt.verify(token);
        if (decoded?.role !== "admin") {
          return reply.status(403).send({ error: "Unauthorized access to hardware simulator" });
        }
      } catch {
        return reply.status(401).send({ error: "Invalid admin token" });
      }
    }
    reply.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    reply.header("Pragma", "no-cache");
    reply.header("Expires", "0");
    return reply.type("text/html").send(simulatorHtml);
  });

  // Routes
  await fastify.register(authRoutes, { prefix: "/api/auth" });
  await fastify.register(deviceRoutes, { prefix: "/api" });
  await fastify.register(adminRoutes, { prefix: "/api" });

  fastify.get("/ws", { websocket: true }, async (socket, request) => {
    const query = request.query as { token?: string } | undefined;
    const authHeader = request.headers.authorization;
    const token = query?.token || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);

    if (!token) {
      socket.close(4401, "Authentication token required");
      return;
    }

    let decodedUser: { id: string; role?: string };
    try {
      decodedUser = fastify.jwt.verify(token) as { id: string; role?: string };
    } catch {
      socket.close(4401, "Invalid or expired token");
      return;
    }

    const clientId = Math.random().toString(36).substring(7);
    wsService.addClient(clientId, socket, decodedUser.id, decodedUser.role || "user");

    socket.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "JOIN_ROOM" && data.deviceId) {
          await wsService.joinRoom(clientId, data.deviceId);
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
