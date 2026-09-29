import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import { FastifyInstance } from "fastify";

export default fp(async (fastify: FastifyInstance) => {
  // In development, bypass rate limiting to prevent mobile app & simulator 429 lockouts
  if (process.env.NODE_ENV !== "production") {
    await fastify.register(rateLimit, {
      global: false,
      allowList: () => true,
    });
    return;
  }

  await fastify.register(rateLimit, {
    global: true,
    max: 100, // 100 requests per minute by default for general browsing & dashboard syncing
    timeWindow: "1 minute",
    allowList: (req) => {
      // Allow WebSockets, internal health checks, hardware simulator, and IoT device short-polling / telemetry from rate limit starvation
      const url = req.url || "";
      return (
        url.startsWith("/ws") ||
        url.startsWith("/health") ||
        url.startsWith("/api/health") ||
        url.startsWith("/simulator") ||
        url.startsWith("/api/device/command") ||
        url.startsWith("/api/device/heartbeat") ||
        url.startsWith("/api/device/telemetry")
      );
    },
    errorResponseBuilder: (req, context) => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: `Rate limit exceeded. You can send up to ${context.max} requests per ${context.after}. Please try again later.`,
      retryAfter: context.after,
    }),
  });
});
