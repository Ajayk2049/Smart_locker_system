import fp from "fastify-plugin";
import helmet from "@fastify/helmet";
import { FastifyInstance } from "fastify";

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(helmet, {
    // Enable HSTS (Strict-Transport-Security) for 1 year including subdomains
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    // Prevent clickjacking via frame embedding
    frameguard: {
      action: "deny",
    },
    // Protect against MIME-type sniffing
    noSniff: true,
    // Protect against XSS
    xssFilter: true,
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // Allows cross-origin asset loading for APIs
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });
});
