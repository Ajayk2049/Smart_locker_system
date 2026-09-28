import fp from "fastify-plugin";
import cors from "@fastify/cors";
import { FastifyInstance } from "fastify";

export default fp(async (fastify: FastifyInstance) => {
  // Explicit origin allowlist (Next.js Admin & Landing web apps, plus localhost/LAN during dev)
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
  ];

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, postman, hardware simulator)
      if (!origin) return cb(null, true);

      // Check allowlist
      if (allowedOrigins.includes(origin) || origin.endsWith(".yourdomain.com")) {
        return cb(null, true);
      }

      // In development mode, allow local network IP addresses
      if (process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
        return cb(null, true);
      }

      cb(new Error("CORS policy does not allow access from this origin"), false);
    },
    credentials: true,
  });
});
