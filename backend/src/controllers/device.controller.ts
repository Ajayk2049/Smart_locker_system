import { FastifyRequest, FastifyReply } from "fastify";
import mongoose from "mongoose";
import { Device } from "../models/Device.model.js";
import { Log } from "../models/Log.model.js";
import { commandQueueService } from "../services/commandQueue.service.js";
import { wsService } from "../services/websocket.service.js";
import { emailService } from "../services/email.service.js";
import { User } from "../models/User.model.js";

// Helper to verify user access (Primary Owner OR Co-Owner)
function isAuthorizedUser(device: any, userId: string): boolean {
  const isOwner = device.ownerId?.toString() === userId || device.ownerId?._id?.toString() === userId;
  const isCoOwner = device.coOwners?.some((cId: any) => {
    const idStr = cId?.toString() === "[object Object]" ? cId?._id?.toString() : cId?.toString();
    return idStr === userId;
  });
  return Boolean(isOwner || isCoOwner);
}

// 1. Get all devices belonging to or shared with the logged-in user
export async function getDevices(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { id: string };
  const devices = await Device.find({
    $or: [{ ownerId: user.id }, { coOwners: user.id }],
  })
    .populate("ownerId", "email")
    .populate("coOwners", "email");

  return reply.send({ devices });
}

// 2. Register or pair a new device for the logged-in user (Sets up Slot 1)
export async function createDevice(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { id: string };
  const { deviceId, name } = request.body as { deviceId?: string; name?: string };

  if (!deviceId || !name) {
    return reply.status(400).send({ error: "deviceId and name are required" });
  }

  const cleanDeviceId = deviceId.trim().toUpperCase();

  // Check if deviceId is already registered
  const existingDevice = await Device.findOne({ deviceId: cleanDeviceId });
  if (existingDevice) {
    if (existingDevice.ownerId.toString() === user.id) {
      return reply.send({ device: existingDevice, message: "Device already registered to your account" });
    }
    return reply.status(409).send({ error: "Device ID is already claimed by another user" });
  }

  const newDevice = await Device.create({
    deviceId: cleanDeviceId,
    name: name.trim(),
    ownerId: user.id,
    coOwners: [],
    allowedSlots: 2, // 2 slots default: Slot 1 (Owner) + Slot 2 (Co-owner)
    doorState: "closed",
    online: false,
    lastHeartbeat: null,
  });

  return reply.status(201).send({ device: newDevice, message: "Device successfully paired" });
}

// 3. User authenticated unlock command (Primary Owner OR Co-Owner only - Admins restricted)
export async function unlockDevice(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const user = request.user as { id: string; role?: string };

  // STRICT RULE: Admins are not allowed to operate customer locker locks
  if (user.role === "admin") {
    return reply.status(403).send({
      error: "Access Denied: Administrators are strictly prohibited from unlocking customer lockers.",
    });
  }

  const device = await Device.findById(id);
  if (!device) {
    return reply.status(404).send({ error: "Device not found" });
  }

  if (!isAuthorizedUser(device, user.id)) {
    return reply.status(403).send({ error: "Not authorized to control this device" });
  }

  // Queue unlock command for the device over REST/HTTP
  const queued = commandQueueService.enqueueCommand(device.deviceId, "unlock", { triggeredBy: user.id });

  await Log.create({
    deviceId: device._id,
    action: "unlock",
    metadata: { triggeredBy: user.id, commandId: queued.commandId },
  });

  return reply.send({ success: true, message: "Unlock command queued for device", commandId: queued.commandId });
}

// 4. Hardware bench test unlock endpoint (No auth required)
export async function testUnlockDevice(request: FastifyRequest, reply: FastifyReply) {
  const body = (request.body as { deviceId?: string }) || {};
  const targetDeviceId = (body.deviceId || "BOX_001").trim().toUpperCase();

  const queued = commandQueueService.enqueueCommand(targetDeviceId, "unlock", { benchTest: true });

  const device = await Device.findOne({ deviceId: targetDeviceId });
  if (device) {
    await Log.create({
      deviceId: device._id,
      action: "unlock",
      metadata: { note: "Bench test unlock trigger", commandId: queued.commandId },
    });
  }

  return reply.send({
    success: true,
    message: `Bench test unlock command queued for ${targetDeviceId}`,
    targetDeviceId,
    commandId: queued.commandId,
  });
}

// 5. Add Co-Owner (Primary Owner only, limited by allowedSlots)
export async function addCoOwner(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const user = request.user as { id: string };
  const { email } = request.body as { email?: string };

  if (!email) {
    return reply.status(400).send({ error: "Co-owner email is required" });
  }

  const device = await Device.findById(id);
  if (!device) {
    return reply.status(404).send({ error: "Device not found" });
  }

  // Only the Primary Owner can invite/add co-owners
  if (device.ownerId.toString() !== user.id) {
    return reply.status(403).send({ error: "Only the primary owner can add co-owners to this device" });
  }

  const maxAllowed = device.allowedSlots || 2;
  const currentOccupied = 1 + (device.coOwners ? device.coOwners.length : 0);

  if (currentOccupied >= maxAllowed) {
    return reply.status(403).send({
      error: `All ${maxAllowed} available user slots are occupied. Additional slots are locked (max 5). Please contact platform admin to unlock extra slots.`,
      occupiedSlots: currentOccupied,
      allowedSlots: maxAllowed,
      totalCapacity: 5,
    });
  }

  const targetUser = await User.findOne({ email: email.trim().toLowerCase() });
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

// 6. Remove Co-Owner (Primary Owner only)
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

// 7. Create Co-Owner Join/Invite Code (Primary Owner only)
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

  // Generate 6-character code (e.g. SBX-79A2)
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const inviteCode = `SBX-${randomSuffix}`;
  const inviteExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

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

// 8. Cancel/Revoke Active Invite Code (Primary Owner only)
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

// 9. Join Locker Device via Invite Code (Authenticated User)
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
  device.inviteCode = undefined; // Single-use consumption
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

// 10. Get device slot summary
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

// 8. Get recent access & delivery logs
export async function getDeviceLogs(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const user = request.user as { id: string };

  const device = await Device.findById(id);
  if (!device) {
    return reply.status(404).send({ error: "Device not found" });
  }

  if (!isAuthorizedUser(device, user.id)) {
    return reply.status(403).send({ error: "Not authorized" });
  }

  const logs = await Log.find({ deviceId: id })
    .sort({ timestamp: -1 })
    .limit(100);

  return reply.send({ logs });
}

// 9. IoT Device Polling Endpoint: GET /api/device/command?deviceId=BOX_001
export async function getDeviceCommand(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { deviceId?: string };
  const headerDeviceId = request.headers["x-device-id"] as string | undefined;
  const targetId = (query.deviceId || headerDeviceId || "").trim().toUpperCase();

  if (!targetId) {
    return reply.status(400).send({ error: "deviceId query parameter or x-device-id header is required" });
  }

  // Check device registration
  const device = await Device.findOne({ deviceId: targetId });
  if (!device) {
    return reply.status(404).send({ error: `Device '${targetId}' not registered` });
  }

  // Automatic heartbeat update on poll
  const wasOffline = !device.online;
  device.online = true;
  device.lastHeartbeat = new Date();
  await device.save();

  if (wasOffline) {
    wsService.broadcastToDevice(targetId, {
      type: "DEVICE_STATUS",
      deviceId: targetId,
      doorState: device.doorState,
      online: true,
    });
    wsService.broadcastToDevice(targetId, {
      type: "DEVICE_ONLINE",
      deviceId: targetId,
    });
  }

  // Consume next pending command from queue
  const pending = commandQueueService.popPendingCommand(targetId);
  if (pending) {
    return reply.send({
      action: pending.action,
      commandId: pending.commandId,
      timestamp: pending.enqueuedAt,
    });
  }

  return reply.send({ action: "none" });
}

// 10. IoT Device Telemetry Endpoint: POST /api/device/telemetry
export async function receiveTelemetry(request: FastifyRequest, reply: FastifyReply) {
  const body = (request.body as { deviceId?: string; doorState?: string }) || {};
  const headerDeviceId = request.headers["x-device-id"] as string | undefined;
  const targetId = (body.deviceId || headerDeviceId || "").trim().toUpperCase();
  const doorState = body.doorState?.toLowerCase();

  if (!targetId) {
    return reply.status(400).send({ error: "deviceId is required" });
  }

  if (!doorState || (doorState !== "open" && doorState !== "closed")) {
    return reply.status(400).send({ error: "doorState must be 'open' or 'closed'" });
  }

  const device = await Device.findOne({ deviceId: targetId });
  if (!device) {
    return reply.status(404).send({ error: `Device '${targetId}' not registered` });
  }

  device.doorState = doorState as "open" | "closed";
  device.online = true;
  device.lastHeartbeat = new Date();
  await device.save();

  console.log(`📦 [REST Telemetry] ${targetId}: doorState=${doorState}, online=true`);

  wsService.broadcastToDevice(targetId, {
    type: "DEVICE_STATUS",
    deviceId: targetId,
    doorState,
    online: true,
  });

  if (doorState === "closed") {
    await Log.create({
      deviceId: device._id,
      action: "delivery_success",
    });

    const owner = await User.findById(device.ownerId);
    if (owner && owner.email) {
      await emailService.sendDeliveryNotification(owner.email, device.name);
    }

    wsService.broadcastToDevice(targetId, {
      type: "DELIVERY_SUCCESS",
      deviceId: targetId,
      doorState: "closed",
    });
  } else {
    await Log.create({
      deviceId: device._id,
      action: "door_open",
    });

    wsService.broadcastToDevice(targetId, {
      type: "DOOR_OPEN",
      deviceId: targetId,
      doorState: "open",
    });
  }

  return reply.send({ success: true, doorState, online: true });
}

// 11. IoT Device Heartbeat Endpoint: POST /api/device/heartbeat
export async function receiveHeartbeat(request: FastifyRequest, reply: FastifyReply) {
  const body = (request.body as { deviceId?: string }) || {};
  const headerDeviceId = request.headers["x-device-id"] as string | undefined;
  const targetId = (body.deviceId || headerDeviceId || "").trim().toUpperCase();

  if (!targetId) {
    return reply.status(400).send({ error: "deviceId is required" });
  }

  const device = await Device.findOne({ deviceId: targetId });
  if (!device) {
    return reply.status(404).send({ error: `Device '${targetId}' not registered` });
  }

  const wasOffline = !device.online;
  device.online = true;
  device.lastHeartbeat = new Date();
  await device.save();

  if (wasOffline) {
    wsService.broadcastToDevice(targetId, {
      type: "DEVICE_STATUS",
      deviceId: targetId,
      doorState: device.doorState,
      online: true,
    });
    wsService.broadcastToDevice(targetId, {
      type: "DEVICE_ONLINE",
      deviceId: targetId,
    });
  }

  return reply.send({ success: true, online: true, timestamp: device.lastHeartbeat });
}

// 12. Watchdog: Mark devices offline if no heartbeat within 30 seconds
export async function checkDeviceWatchdog() {
  try {
    const threshold = new Date(Date.now() - 30 * 1000); // 30 seconds inactivity
    const staleDevices = await Device.find({
      online: true,
      $or: [{ lastHeartbeat: { $lt: threshold } }, { lastHeartbeat: null }],
    });

    for (const dev of staleDevices) {
      dev.online = false;
      await dev.save();
      console.log(`⚠️ [Watchdog] Device ${dev.deviceId} timed out -> online: false`);

      wsService.broadcastToDevice(dev.deviceId, {
        type: "DEVICE_STATUS",
        deviceId: dev.deviceId,
        online: false,
        doorState: dev.doorState,
      });

      wsService.broadcastToDevice(dev.deviceId, {
        type: "DEVICE_OFFLINE",
        deviceId: dev.deviceId,
      });
    }
  } catch (err) {
    console.error("Error in device watchdog:", err);
  }
}
