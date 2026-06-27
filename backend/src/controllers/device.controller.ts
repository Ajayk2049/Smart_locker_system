import { FastifyRequest, FastifyReply } from "fastify";
import { Device } from "../models/Device.model.js";
import { Log } from "../models/Log.model.js";
import { mqttService } from "../services/mqtt.service.js";
import { wsService } from "../services/websocket.service.js";
import { emailService } from "../services/email.service.js";
import { User } from "../models/User.model.js";

export async function getDevices(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { id: string };
  const devices = await Device.find({ ownerId: user.id });
  return reply.send({ devices });
}

export async function unlockDevice(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const user = request.user as { id: string };

  const device = await Device.findById(id);
  if (!device) {
    return reply.status(404).send({ error: "Device not found" });
  }

  if (device.ownerId.toString() !== user.id) {
    return reply.status(403).send({ error: "Not authorized to control this device" });
  }

  mqttService.publish(device.deviceId, { action: "unlock" });

  await Log.create({
    deviceId: device._id,
    action: "unlock",
    metadata: { triggeredBy: user.id },
  });

  return reply.send({ success: true, message: "Unlock command sent" });
}

export async function getDeviceLogs(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const user = request.user as { id: string };

  const device = await Device.findById(id);
  if (!device) {
    return reply.status(404).send({ error: "Device not found" });
  }

  if (device.ownerId.toString() !== user.id) {
    return reply.status(403).send({ error: "Not authorized" });
  }

  const logs = await Log.find({ deviceId: id })
    .sort({ timestamp: -1 })
    .limit(100);

  return reply.send({ logs });
}

export async function handleTelemetry(deviceId: string, payload: Buffer) {
  try {
    const data = JSON.parse(payload.toString());
    const { doorState, battery } = data;

    const device = await Device.findOne({ deviceId });
    if (!device) return;

    device.doorState = doorState;
    if (battery !== undefined) device.battery = battery;
    device.online = true;
    await device.save();

    if (doorState === "closed") {
      await Log.create({
        deviceId: device._id,
        action: "delivery_success",
        metadata: { battery },
      });

      const owner = await User.findById(device.ownerId);
      if (owner) {
        await emailService.sendDeliveryNotification(owner.email, device.name);
      }

      wsService.broadcastToDevice(deviceId, {
        type: "DELIVERY_SUCCESS",
        deviceId,
        doorState,
      });
    } else {
      await Log.create({
        deviceId: device._id,
        action: "door_open",
      });

      wsService.broadcastToDevice(deviceId, {
        type: "DOOR_OPEN",
        deviceId,
        doorState,
      });
    }
  } catch (error) {
    console.error("Error processing telemetry:", error);
  }
}
