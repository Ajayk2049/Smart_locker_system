import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import { FastifyInstance } from "fastify";

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(rateLimit, {
    global: true,
    max: 100, // 100 requests per minute by default for general browsing & dashboard syncing
    timeWindow: "1 minute",
    allowList: (req) => {
      // Allow internal health checks and hardware simulator from being rate limited
      return req.url === "/health" || req.url === "/api/health" || req.url === "/simulator";
    },
    errorResponseBuilder: (req, context) => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: `Rate limit exceeded. You can send up to ${context.max} requests per ${context.after}. Please try again later.`,
      retryAfter: context.after,
    }),
  });
});
