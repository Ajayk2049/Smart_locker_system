import { FastifyRequest, FastifyReply } from "fastify";
import mongoose from "mongoose";
import { Device } from "../models/Device.model.js";
import { Log } from "../models/Log.model.js";
import { User } from "../models/User.model.js";

function isAuthorizedUser(device: any, userId: string): boolean {
  const isOwner = device.ownerId?.toString() === userId || device.ownerId?._id?.toString() === userId;
  const isCoOwner = device.coOwners?.some((cId: any) => {
    const idStr = cId?.toString() === "[object Object]" ? cId?._id?.toString() : cId?.toString();
    return idStr === userId;
  });
  return Boolean(isOwner || isCoOwner);
}

// 1. Add Co-Owner manually by email
export async function addCoOwner(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const user = request.user as { id: string };
  const { email } = request.body as { email?: string };

  if (!email) {
    return reply.status(400).send({ error: "email is required" });
  }

  const device = await Device.findById(id);
  if (!device) {
    return reply.status(404).send({ error: "Device not found" });
  }

  if (device.ownerId.toString() !== user.id) {
    return reply.status(403).send({ error: "Only the primary owner can add co-owners" });
  }

  const maxAllowed = device.allowedSlots || 2;
  const currentOccupied = 1 + (device.coOwners ? device.coOwners.length : 0);

  if (currentOccupied >= maxAllowed) {
    return reply.status(403).send({
      error: `Device slot limit reached (${currentOccupied}/${maxAllowed}). Contact admin to unlock additional slots.`,
      allowedSlots: maxAllowed,
      occupiedSlots: currentOccupied,
      totalCapacity: 5,
    });
  }

  const cleanEmail = email.toLowerCase().trim();
  const targetUser = await User.findOne({ email: cleanEmail });
  if (!targetUser) {
    return reply.status(404).send({ error: `User with email '${email}' was not found. They must sign up first.` });
  }

  if (targetUser._id.toString() === user.id) {
    return reply.status(400).send({ error: "You are already the primary owner of this device" });
  }

  if (device.coOwners.some((cId) => cId.toString() === targetUser._id.toString())) {
    return reply.status(409).send({ error: "This user is already an authorized co-owner" });
  }

  device.coOwners.push(targetUser._id as mongoose.Types.ObjectId);
  await device.save();

  await Log.create({
    deviceId: device._id,
    action: "co_owner_added",
    metadata: { addedBy: user.id, coOwnerId: targetUser._id, coOwnerEmail: targetUser.email },
  });

  return reply.send({
    success: true,
    message: `Co-owner ${targetUser.email} added successfully (Slot ${currentOccupied + 1}/${maxAllowed})`,
    coOwners: device.coOwners,
    allowedSlots: maxAllowed,
  });
}

// 2. Remove Co-Owner
export async function removeCoOwner(request: FastifyRequest, reply: FastifyReply) {
  const { id, userId } = request.params as { id: string; userId: string };
  const user = request.user as { id: string };

  const device = await Device.findById(id);
  if (!device) {
    return reply.status(404).send({ error: "Device not found" });
  }

  if (device.ownerId.toString() !== user.id) {
    return reply.status(403).send({ error: "Only the primary owner can remove co-owners" });
  }

  device.coOwners = device.coOwners.filter((cId) => cId.toString() !== userId);
  await device.save();

  await Log.create({
    deviceId: device._id,
    action: "co_owner_removed",
    metadata: { removedBy: user.id, removedUserId: userId },
  });

  return reply.send({
    success: true,
    message: "Co-owner removed successfully",
    coOwners: device.coOwners,
  });
}

// 3. Create Co-Owner Join/Invite Code
export async function createInviteCode(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const user = request.user as { id: string };

  const device = await Device.findById(id);
  if (!device) {
    return reply.status(404).send({ error: "Device not found" });
  }

  if (device.ownerId.toString() !== user.id) {
    return reply.status(403).send({ error: "Only the primary owner can generate invite codes" });
  }

  const maxAllowed = device.allowedSlots || 2;
  const currentOccupied = 1 + (device.coOwners ? device.coOwners.length : 0);

  if (currentOccupied >= maxAllowed) {
    return reply.status(403).send({
      error: `All ${maxAllowed} slots are occupied. Upgrade slots via admin to invite more users.`,
    });
  }

  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const inviteCode = `SBX-${randomSuffix}`;
  const inviteExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  device.inviteCode = inviteCode;
  device.inviteExpiresAt = inviteExpiresAt;
  await device.save();

  return reply.send({
    success: true,
    inviteCode,
    expiresAt: inviteExpiresAt,
    expiresInSeconds: 86400,
    message: `Share code ${inviteCode} with your co-owner. Valid for 24 hours.`,
  });
}

// 4. Cancel Invite Code
export async function cancelInviteCode(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const user = request.user as { id: string };

  const device = await Device.findById(id);
  if (!device) {
    return reply.status(404).send({ error: "Device not found" });
  }

  if (device.ownerId.toString() !== user.id) {
    return reply.status(403).send({ error: "Only the primary owner can revoke invite codes" });
  }

  device.inviteCode = undefined;
  device.inviteExpiresAt = undefined;
  await device.save();

  return reply.send({ success: true, message: "Invite code successfully revoked" });
}

// 5. Join Device via Invite Code
export async function joinDevice(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { id: string };
  const { inviteCode } = request.body as { inviteCode?: string };

  if (!inviteCode) {
    return reply.status(400).send({ error: "inviteCode is required" });
  }

  const cleanCode = inviteCode.trim().toUpperCase();

  const device = await Device.findOne({
    inviteCode: cleanCode,
    inviteExpiresAt: { $gt: new Date() },
  });

  if (!device) {
    return reply.status(404).send({ error: "Invalid or expired invite code. Please ask the owner for a new code." });
  }

  if (device.ownerId.toString() === user.id) {
    return reply.status(400).send({ error: "You are already the primary owner of this device" });
  }

  if (device.coOwners.some((cId) => cId.toString() === user.id)) {
    return reply.status(409).send({ error: "You are already a co-owner of this device" });
  }

  const maxAllowed = device.allowedSlots || 2;
  const currentOccupied = 1 + (device.coOwners ? device.coOwners.length : 0);

  if (currentOccupied >= maxAllowed) {
    return reply.status(403).send({ error: "This device has already reached its user slot capacity" });
  }

  device.coOwners.push(user.id as any);
  device.inviteCode = undefined;
  device.inviteExpiresAt = undefined;
  await device.save();

  await Log.create({
    deviceId: device._id,
    action: "co_owner_added",
    metadata: { coOwnerId: user.id, method: "join_code" },
  });

  return reply.send({
    success: true,
    message: `Successfully joined '${device.name}' as a co-owner!`,
    device: {
      id: device._id,
      deviceId: device.deviceId,
      name: device.name,
      doorState: device.doorState,
      online: device.online,
    },
  });
}

// 6. Get Slot Summary
export async function getDeviceSlots(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const user = request.user as { id: string };

  const device = await Device.findById(id)
    .populate("ownerId", "email")
    .populate("coOwners", "email");

  if (!device) {
    return reply.status(404).send({ error: "Device not found" });
  }

  if (!isAuthorizedUser(device, user.id)) {
    return reply.status(403).send({ error: "Not authorized to view device slots" });
  }

  const allowedSlots = device.allowedSlots || 2;
  const usedSlots = 1 + device.coOwners.length;
  const lockedSlots = 5 - allowedSlots;

  return reply.send({
    deviceId: device.deviceId,
    name: device.name,
    totalCapacity: 5,
    allowedSlots,
    lockedSlots,
    usedSlots,
    availableSlots: Math.max(0, allowedSlots - usedSlots),
    primaryOwner: device.ownerId,
    coOwners: device.coOwners,
  });
}
