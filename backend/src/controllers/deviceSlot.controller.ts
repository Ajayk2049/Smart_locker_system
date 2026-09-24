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

async function findDeviceByIdOrDeviceId(id: string) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const dev = await Device.findById(id);
    if (dev) return dev;
  }
  return await Device.findOne({ deviceId: id.trim().toUpperCase() });
}

// 1. Add Co-Owner manually by email
export async function addCoOwner(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const user = request.user as { id: string };
  const { email } = request.body as { email?: string };

  if (!email) {
    return reply.status(400).send({ error: "email is required" });
  }

  const device = await findDeviceByIdOrDeviceId(id);
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
    metadata: {
      addedBy: user.id,
      coOwnerId: targetUser._id,
      coOwnerEmail: targetUser.email,
      userName: targetUser.name || targetUser.email,
      userRole: "Co-Owner",
    },
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

  const device = await findDeviceByIdOrDeviceId(id);
  if (!device) {
    return reply.status(404).send({ error: "Device not found" });
  }

  if (device.ownerId.toString() !== user.id) {
    return reply.status(403).send({ error: "Only the primary owner can remove co-owners" });
  }

  device.coOwners = device.coOwners.filter((cId) => cId.toString() !== userId);
  await device.save();

  const removedUser = await User.findById(userId);
  await Log.create({
    deviceId: device._id,
    action: "co_owner_removed",
    metadata: {
      removedBy: user.id,
      removedUserId: userId,
      userName: removedUser?.name || removedUser?.email || "Co-Owner",
      userRole: "Co-Owner",
    },
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

  const device = await findDeviceByIdOrDeviceId(id);
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

  // If device already has an active, valid invite code (valid for > 60s), reuse it!
  if (device.inviteCode && device.inviteExpiresAt && device.inviteExpiresAt > new Date(Date.now() + 60 * 1000)) {
    return reply.send({
      success: true,
      inviteCode: device.inviteCode,
      expiresAt: device.inviteExpiresAt,
      expiresInSeconds: Math.floor((device.inviteExpiresAt.getTime() - Date.now()) / 1000),
      message: `Share code ${device.inviteCode} with your co-owner. Valid for 24 hours.`,
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

  const device = await findDeviceByIdOrDeviceId(id);
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
  const rawAlphanumeric = cleanCode.replace(/[^A-Z0-9]/g, "");
  const normalizedWithPrefix = rawAlphanumeric.startsWith("SBX")
    ? `SBX-${rawAlphanumeric.substring(3)}`
    : `SBX-${rawAlphanumeric}`;

  const device = await Device.findOne({
    $or: [
      { inviteCode: cleanCode },
      { inviteCode: normalizedWithPrefix },
      { inviteCode: rawAlphanumeric },
    ],
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

  const userObjectId = new mongoose.Types.ObjectId(user.id);
  device.coOwners.push(userObjectId);
  device.inviteCode = undefined;
  device.inviteExpiresAt = undefined;
  await device.save();

  // Also record on user model
  await User.findByIdAndUpdate(user.id, {
    $addToSet: { assignedDevices: device.deviceId },
  });

  const dbUser = await User.findById(user.id);
  const joinerName = dbUser?.name || dbUser?.email || "Co-Owner";

  await Log.create({
    deviceId: device._id,
    action: "co_owner_added",
    metadata: {
      coOwnerId: user.id,
      userName: joinerName,
      userRole: "Co-Owner",
      method: "join_code",
    },
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

  const query = mongoose.Types.ObjectId.isValid(id)
    ? Device.findById(id)
    : Device.findOne({ deviceId: id.trim().toUpperCase() });

  const device = await query
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
