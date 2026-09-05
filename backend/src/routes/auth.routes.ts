import { FastifyInstance } from "fastify";
import { sendOtp, checkPhone, registerWithOtp, login, getMe } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export default async function authRoutes(fastify: FastifyInstance) {
  // 1a. Check Phone Number
  fastify.post("/check-phone", {
    handler: checkPhone,
  });

  // 1b. Smart Pre-Check & Send OTP
  fastify.post("/send-otp", {
    handler: sendOtp,
  });

  // 2. Register Account with OTP (+ optional Join Code)
  fastify.post("/register-with-otp", {
    handler: registerWithOtp,
  });

  // Also support /register as an alias to registerWithOtp
  fastify.post("/register", {
    handler: registerWithOtp,
  });

  // 3. Login (via Mobile Number OR Email + Password)
  fastify.post("/login", {
    handler: login,
  });

  // 4. Current user session / profile
  fastify.get("/me", {
    preHandler: [authMiddleware],
    handler: getMe,
  });
}
