import { FastifyRequest, FastifyReply } from "fastify";
import { User } from "../models/User.model.js";

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = request.body as { email: string; password: string };

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return reply.status(409).send({ error: "Email already registered" });
  }

  const user = await User.create({ email, password });
  const token = request.server.jwt.sign({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  return reply.status(201).send({
    user: { id: user._id, email: user.email, role: user.role },
    token,
  });
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = request.body as { email: string; password: string };

  const user = await User.findOne({ email });
  if (!user || user.password !== password) {
    return reply.status(401).send({ error: "Invalid credentials" });
  }

  const token = request.server.jwt.sign({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  return reply.send({
    user: { id: user._id, email: user.email, role: user.role },
    token,
  });
}
