import { FastifyRequest, FastifyReply } from "fastify";
import { LockerRequest } from "../models/LockerRequest.model.js";
import { User } from "../models/User.model.js";
import { Device } from "../models/Device.model.js";
import { Log } from "../models/Log.model.js";

// 1. Get all locker requests / orders
export async function getAllRequests(request: FastifyRequest, reply: FastifyReply) {
  // Sync fallback: only for customers who actually ordered with an address
  const usersWithOrders = await User.find({
    orderStatus: { $exists: true, $ne: null },
    address: { $exists: true, $ne: "" },
    role: { $ne: "admin" },
  });

  for (const u of usersWithOrders) {
    const existingReq = await LockerRequest.findOne({ userId: u._id });
    if (!existingReq) {
      await LockerRequest.create({
        userId: u._id,
        name: u.name || "Customer",
        phone: u.phone,
        email: u.email,
        address: u.address || "Bengaluru",
        pincode: u.pincode || "560001",
        units: u.units || 1,
        status: (u.orderStatus as any) || "pending",
        assignedDeviceIds: u.assignedDevices || [],
        createdAt: u.createdAt || new Date(),
      });
    }
  }

  const requests = await LockerRequest.find()
    .populate("userId", "name phone email address pincode units orderStatus")
    .sort({ createdAt: -1 });

  // Attach live device heartbeat and online status from Device model
  const allAssignedIds = requests.flatMap((r) => r.assignedDeviceIds || []);
  const devices = await Device.find({ deviceId: { $in: allAssignedIds } }).select(
    "deviceId online lastHeartbeat doorState"
  );
  const deviceMap = new Map(devices.map((d) => [d.deviceId, d]));

  const requestsWithStatus = requests.map((req) => {
    const obj = req.toObject();
    const assignedDevicesInfo = (req.assignedDeviceIds || []).map((id) => {
      const d = deviceMap.get(id);
      return {
        deviceId: id,
        online: d ? !!d.online : false,
        lastHeartbeat: d ? d.lastHeartbeat : null,
        doorState: d ? d.doorState : "closed",
      };
    });

    const isDeviceOnline = assignedDevicesInfo.some((d) => d.online);
    const lastHeartbeat = assignedDevicesInfo.find((d) => d.lastHeartbeat)?.lastHeartbeat || null;

    return {
      ...obj,
      assignedDevicesInfo,
      isDeviceOnline,
      lastHeartbeat,
    };
  });

  return reply.send({ requests: requestsWithStatus });
}

// 2. Update order lifecycle status (preparing, dispatched, delivered, rejected)
export async function updateRequestStatus(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { status, deviceId, rejectionReason, notes, verificationNotes } = (request.body as {
    status?: "preparing" | "dispatched" | "delivered" | "approved" | "rejected";
    deviceId?: string;
    rejectionReason?: string;
    notes?: string;
    verificationNotes?: string;
  }) || {};

  const validStatuses = ["preparing", "dispatched", "delivered", "approved", "rejected"];
  if (!status || !validStatuses.includes(status)) {
    return reply.status(400).send({ error: `Status must be one of: ${validStatuses.join(", ")}` });
  }

  const lockerReq = await LockerRequest.findById(id);
  if (!lockerReq) {
    return reply.status(404).send({ error: "Locker request not found" });
  }

  const adminId = (request.user as { id: string })?.id;

  // Step 1: Accept & Prepare
  if (status === "preparing" || status === "approved") {
    const targetDeviceId = deviceId || (lockerReq.assignedDeviceIds && lockerReq.assignedDeviceIds[0]);
    if (!targetDeviceId || !targetDeviceId.trim()) {
      return reply.status(400).send({ error: "Locker device ID is required to accept the request" });
    }

    const cleanDeviceId = targetDeviceId.trim().toUpperCase();

    let device = await Device.findOne({ deviceId: cleanDeviceId });
    if (device) {
      device.ownerId = lockerReq.userId;
      await device.save();
    } else {
      device = await Device.create({
        deviceId: cleanDeviceId,
        name: `${lockerReq.name}'s Secure Box`,
        ownerId: lockerReq.userId,
        coOwners: [],
        allowedSlots: 2,
        doorState: "closed",
        online: true,
      });
    }

    lockerReq.status = "preparing";
    if (!lockerReq.assignedDeviceIds.includes(cleanDeviceId)) {
      lockerReq.assignedDeviceIds.push(cleanDeviceId);
    }
    if (notes) lockerReq.notes = notes.trim();
    lockerReq.reviewedAt = new Date();
    if (adminId) lockerReq.reviewedBy = adminId as any;
    await lockerReq.save();

    await User.findByIdAndUpdate(lockerReq.userId, {
      orderStatus: "preparing",
      $addToSet: { assignedDevices: cleanDeviceId },
    });

    await Log.create({
      deviceId: device._id,
      action: "order_preparing",
      metadata: {
        requestId: lockerReq._id,
        deviceId: cleanDeviceId,
        customerId: lockerReq.userId,
        approvedBy: adminId,
        notes: lockerReq.notes,
      },
    });

    return reply.send({
      success: true,
      message: `Request accepted! Locker ${cleanDeviceId} assigned and in preparation.`,
      request: lockerReq,
      device,
    });
  }

  // Step 2: Dispatched
  if (status === "dispatched") {
    lockerReq.status = "dispatched";
    lockerReq.dispatchedAt = new Date();
    if (notes) lockerReq.notes = notes.trim();
    await lockerReq.save();

    await User.findByIdAndUpdate(lockerReq.userId, {
      orderStatus: "dispatched",
    });

    await Log.create({
      action: "order_dispatched",
      metadata: {
        requestId: lockerReq._id,
        customerId: lockerReq.userId,
        dispatchedBy: adminId,
        assignedDevices: lockerReq.assignedDeviceIds,
      },
    });

    return reply.send({
      success: true,
      message: `Order for ${lockerReq.name} marked as dispatched. Out for delivery and installation.`,
      request: lockerReq,
    });
  }

  // Step 3: Delivered & Verified Live
  if (status === "delivered") {
    lockerReq.status = "delivered";
    lockerReq.deliveredAt = new Date();
    if (verificationNotes) lockerReq.verificationNotes = verificationNotes.trim();
    if (notes) lockerReq.notes = notes.trim();
    await lockerReq.save();

    await User.findByIdAndUpdate(lockerReq.userId, {
      orderStatus: "delivered",
    });

    if (lockerReq.assignedDeviceIds?.length > 0) {
      await Device.updateMany(
        { deviceId: { $in: lockerReq.assignedDeviceIds } },
        { online: true }
      );
    }

    await Log.create({
      action: "order_delivered",
      metadata: {
        requestId: lockerReq._id,
        customerId: lockerReq.userId,
        verifiedBy: adminId,
        verificationNotes: lockerReq.verificationNotes,
      },
    });

    return reply.send({
      success: true,
      message: `Order for ${lockerReq.name} marked as delivered, installed, and verified live!`,
      request: lockerReq,
    });
  }

  // Step 4: Rejected
  if (status === "rejected") {
    lockerReq.status = "rejected";
    lockerReq.rejectionReason = rejectionReason?.trim() || "Unable to fulfill request at this address";
    if (notes) lockerReq.notes = notes.trim();
    lockerReq.reviewedAt = new Date();
    if (adminId) lockerReq.reviewedBy = adminId as any;
    await lockerReq.save();

    await User.findByIdAndUpdate(lockerReq.userId, {
      orderStatus: "rejected",
    });

    await Log.create({
      action: "order_rejected",
      metadata: {
        requestId: lockerReq._id,
        customerId: lockerReq.userId,
        reason: lockerReq.rejectionReason,
        rejectedBy: adminId,
      },
    });

    return reply.send({
      success: true,
      message: `Request for ${lockerReq.name} marked as rejected.`,
      request: lockerReq,
    });
  }
}
