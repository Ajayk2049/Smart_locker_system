import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest } from "fastify";

/**
 * Recursively strips MongoDB query operators (keys starting with '$' or containing '.')
 * to prevent NoSQL injection via JSON payloads, query params, or route params.
 */
function sanitizeMongoPayload(target: any): any {
  if (!target || typeof target !== "object") return target;

  if (Array.isArray(target)) {
    return target.map(sanitizeMongoPayload);
  }

  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(target)) {
    // Drop prohibited Mongo operator keys
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    cleanObj[key] = typeof value === "object" ? sanitizeMongoPayload(value) : value;
  }
  return cleanObj;
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.addHook("preValidation", async (request: FastifyRequest) => {
    if (request.body && typeof request.body === "object") {
      request.body = sanitizeMongoPayload(request.body);
    }
    if (request.query && typeof request.query === "object") {
      request.query = sanitizeMongoPayload(request.query) as any;
    }
    if (request.params && typeof request.params === "object") {
      request.params = sanitizeMongoPayload(request.params) as any;
    }
  });
});
