import { FastifyRequest, FastifyReply } from "fastify";
import { Device } from "../models/Device.model.js";
import { User } from "../models/User.model.js";
import { Log } from "../models/Log.model.js";

export async function getAllDevices(request: FastifyRequest, reply: FastifyReply) {
  const devices = await Device.find().populate("ownerId", "email role");
  return reply.send({ devices });
}

export async function getAllUsers(request: FastifyRequest, reply: FastifyReply) {
  const users = await User.find().select("-password");
  return reply.send({ users });
}

export async function getSystemStats(request: FastifyRequest, reply: FastifyReply) {
  const totalDevices = await Device.countDocuments();
  const onlineDevices = await Device.countDocuments({ online: true });
  const totalUsers = await User.countDocuments();
  const totalLogs = await Log.countDocuments();

  return reply.send({
    stats: {
      totalDevices,
      onlineDevices,
      totalUsers,
      totalLogs,
    },
  });
}
