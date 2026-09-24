import { FastifyRequest, FastifyReply } from "fastify";
import { Device } from "../models/Device.model.js";
import { Log } from "../models/Log.model.js";
import { User } from "../models/User.model.js";
import { commandQueueService } from "../services/commandQueue.service.js";
import { wsService } from "../services/websocket.service.js";
import { emailService } from "../services/email.service.js";

// 1. Diagnostics endpoint for bench testing: POST /api/test/unlock
export async function testUnlockDevice(request: FastifyRequest, reply: FastifyReply) {
  const { deviceId } = request.body as { deviceId?: string };

  if (!deviceId) {
    return reply.status(400).send({ error: "deviceId is required in JSON body" });
  }

  const cleanDeviceId = deviceId.trim().toUpperCase();
  const device = await Device.findOne({ deviceId: cleanDeviceId });
  if (!device) {
    return reply.status(404).send({ error: `Device '${cleanDeviceId}' not found` });
  }

  const enqueued = commandQueueService.enqueueCommand(cleanDeviceId, "unlock");

  await Log.create({
    deviceId: device._id,
    action: "test_unlock_command",
    metadata: { source: "test_endpoint", commandId: enqueued.commandId },
  });

  wsService.broadcastToDevice(cleanDeviceId, {
    type: "UNLOCK_COMMAND",
    deviceId: cleanDeviceId,
    commandId: enqueued.commandId,
  });

  return reply.send({
    success: true,
    message: `Bench unlock command enqueued for ${cleanDeviceId}`,
    commandId: enqueued.commandId,
    device: {
      deviceId: cleanDeviceId,
      name: device.name,
      online: device.online,
    },
  });
}

// 2. Short-polling: GET /api/device/command?deviceId=BOX_001
export async function getDeviceCommand(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { deviceId?: string };
  const headerDeviceId = request.headers["x-device-id"] as string | undefined;
  const targetId = (query.deviceId || headerDeviceId || "").trim().toUpperCase();

  if (!targetId) {
    return reply.status(400).send({ error: "deviceId query parameter or x-device-id header is required" });
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

// 3. Telemetry: POST /api/device/telemetry
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

  const statusMsg = {
    type: "DEVICE_STATUS",
    deviceId: targetId,
    doorState,
    online: true,
  };
  wsService.broadcastToDevice(targetId, statusMsg);
  wsService.broadcastToDevice(device._id.toString(), statusMsg);
  if (device.ownerId) wsService.broadcastToDevice(device.ownerId.toString(), statusMsg);
  wsService.broadcastToAll(statusMsg);

  if (doorState === "closed") {
    await Log.create({
      deviceId: device._id,
      action: "lock",
      metadata: {
        event: "door_locked",
        source: "physical_sensor",
        userName: "Mechanical Latch",
        userRole: "Auto / Sensor",
        deviceId: device.deviceId,
      },
    });

    const owner = await User.findById(device.ownerId);
    if (owner && owner.email) {
      await emailService.sendDeliveryNotification(owner.email, device.name);
    }

    const deliveryMsg = {
      type: "DELIVERY_SUCCESS",
      deviceId: targetId,
      doorState: "closed",
      online: true,
    };
    wsService.broadcastToDevice(targetId, deliveryMsg);
    wsService.broadcastToAll(deliveryMsg);
  } else {
    // Hardware door opened: notify WebSocket clients in real-time
    // (We do not log a redundant 'door_open' entry so user unlock is the single source of truth)
    const openMsg = {
      type: "DOOR_OPEN",
      deviceId: targetId,
      doorState: "open",
      online: true,
    };
    wsService.broadcastToDevice(targetId, openMsg);
    wsService.broadcastToAll(openMsg);
  }

  return reply.send({ success: true, doorState, online: true });
}

// 4. Heartbeat: POST /api/device/heartbeat
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

  device.online = true;
  device.lastHeartbeat = new Date();
  await device.save();

  const heartbeatMsg = {
    type: "DEVICE_STATUS",
    deviceId: targetId,
    doorState: device.doorState,
    online: true,
  };
  wsService.broadcastToDevice(targetId, heartbeatMsg);
  wsService.broadcastToDevice(device._id.toString(), heartbeatMsg);
  if (device.ownerId) wsService.broadcastToDevice(device.ownerId.toString(), heartbeatMsg);
  wsService.broadcastToAll(heartbeatMsg);

  return reply.send({ success: true, online: true, timestamp: device.lastHeartbeat });
}

// 5. Watchdog: Inactivity timer marking devices offline
export async function checkDeviceWatchdog() {
  try {
    const threshold = new Date(Date.now() - 30 * 1000);
    const staleDevices = await Device.find({
      online: true,
      $or: [{ lastHeartbeat: { $lt: threshold } }, { lastHeartbeat: null }],
    });

    for (const dev of staleDevices) {
      dev.online = false;
      await dev.save();

      const offlineMsg = {
        type: "DEVICE_STATUS",
        deviceId: dev.deviceId,
        online: false,
        doorState: dev.doorState,
      };
      wsService.broadcastToDevice(dev.deviceId, offlineMsg);
      wsService.broadcastToDevice(dev._id.toString(), offlineMsg);
      if (dev.ownerId) wsService.broadcastToDevice(dev.ownerId.toString(), offlineMsg);
      wsService.broadcastToAll(offlineMsg);
    }
  } catch (err) {
    console.error("Error in device watchdog:", err);
  }
}
