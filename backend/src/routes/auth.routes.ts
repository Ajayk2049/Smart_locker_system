import { FastifyInstance } from "fastify";
import { register, login } from "../controllers/auth.controller.js";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/register", {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
        },
      },
    },
    handler: register,
  });

  fastify.post("/login", {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
    },
    handler: login,
  });
}
