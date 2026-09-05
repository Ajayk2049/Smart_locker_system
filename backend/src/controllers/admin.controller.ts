import { FastifyRequest, FastifyReply } from "fastify";
import { Device } from "../models/Device.model.js";
import { User } from "../models/User.model.js";
import { Log } from "../models/Log.model.js";
import { LockerRequest } from "../models/LockerRequest.model.js";
import { smsService } from "../services/sms.service.js";

export async function createCustomer(request: FastifyRequest, reply: FastifyReply) {
  const { phone, email, name, password } = (request.body as {
    phone?: string;
    email?: string;
    name?: string;
    password?: string;
  }) || {};

  if (!phone && !email) {
    return reply.status(400).send({ error: "Phone number or email is required" });
  }

  const cleanPhone = phone ? smsService.normalizePhone(phone) : undefined;
  if (cleanPhone) {
    const existing = await User.findOne({ phone: cleanPhone });
    if (existing) return reply.status(409).send({ error: "Customer with this phone already exists" });
  }

  const userData: any = {
    name: name?.trim() || "Customer",
    password: password || "SecureBox@123",
    role: "user",
    isPhoneVerified: true,
  };
  if (cleanPhone) userData.phone = cleanPhone;
  if (email && email.trim()) userData.email = email.toLowerCase().trim();

  const user = await User.create(userData);
  return reply.status(201).send({ success: true, user });
}

export async function getAllDevices(request: FastifyRequest, reply: FastifyReply) {
  const devices = await Device.find()
    .populate("ownerId", "phone email name role")
    .populate("coOwners", "phone email name");

  const devicesWithSlotStats = devices.map((dev) => {
    const allowed = dev.allowedSlots || 2;
    const occupied = 1 + (dev.coOwners ? dev.coOwners.length : 0);
    return {
      ...dev.toObject(),
      totalCapacity: 5,
      allowedSlots: allowed,
      lockedSlots: 5 - allowed,
      occupiedSlots: occupied,
      availableSlots: Math.max(0, allowed - occupied),
    };
  });

  return reply.send({ devices: devicesWithSlotStats });
}

export async function getAllUsers(request: FastifyRequest, reply: FastifyReply) {
  const users = await User.find({ role: { $ne: "admin" } }).select("-password");
  return reply.send({ users });
}

export async function getSystemStats(request: FastifyRequest, reply: FastifyReply) {
  const totalDevices = await Device.countDocuments();
  const onlineDevices = await Device.countDocuments({ online: true });
  const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });
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

export async function updateDeviceSlots(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { allowedSlots } = request.body as { allowedSlots?: number };

  if (typeof allowedSlots !== "number" || allowedSlots < 2 || allowedSlots > 5) {
    return reply.status(400).send({
      error: "allowedSlots must be a number between 2 and 5 (default: 2, total capacity: 5)",
    });
  }

  const device = await Device.findById(id).populate("ownerId", "email");
  if (!device) {
    return reply.status(404).send({ error: "Device not found" });
  }

  const prevSlots = device.allowedSlots || 2;
  device.allowedSlots = allowedSlots;
  await device.save();

  await Log.create({
    deviceId: device._id,
    action: "unlock",
    metadata: {
      action: "admin_slot_update",
      previousAllowedSlots: prevSlots,
      newAllowedSlots: allowedSlots,
      updatedBy: (request.user as { id: string })?.id,
    },
  });

  return reply.send({
    success: true,
    message: `Device ${device.deviceId} slots successfully updated to ${allowedSlots} (Capacity: 5)`,
    device: {
      id: device._id,
      deviceId: device.deviceId,
      name: device.name,
      totalCapacity: 5,
      allowedSlots: device.allowedSlots,
      lockedSlots: 5 - device.allowedSlots,
      occupiedSlots: 1 + (device.coOwners ? device.coOwners.length : 0),
    },
  });
}

export async function createDeviceForUser(request: FastifyRequest, reply: FastifyReply) {
  const { deviceId, name, ownerId } = (request.body as {
    deviceId?: string;
    name?: string;
    ownerId?: string;
  }) || {};

  if (!deviceId || !name || !ownerId) {
    return reply.status(400).send({ error: "deviceId, name, and ownerId are required" });
  }

  const cleanDeviceId = deviceId.trim().toUpperCase();

  const existingDevice = await Device.findOne({ deviceId: cleanDeviceId });
  if (existingDevice) {
    return reply.status(409).send({ error: `Device ${cleanDeviceId} is already registered` });
  }

  const owner = await User.findById(ownerId);
  if (!owner) {
    return reply.status(404).send({ error: "Owner user not found" });
  }

  const device = await Device.create({
    deviceId: cleanDeviceId,
    name: name.trim(),
    ownerId: owner._id,
    coOwners: [],
    allowedSlots: 2,
    doorState: "closed",
    online: false,
    lastHeartbeat: null,
  });

  return reply.status(201).send({
    success: true,
    message: `Device ${cleanDeviceId} successfully assigned to ${owner.name || owner.email}`,
    device,
  });
}

export async function deleteDevice(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const device = await Device.findByIdAndDelete(id);
  if (!device) {
    return reply.status(404).send({ error: "Device not found" });
  }
  await Log.deleteMany({ deviceId: device._id });
  return reply.send({ success: true, message: `Device ${device.deviceId} deleted successfully` });
}

// ==========================================
// ORDER / LOCKER REQUEST MANAGEMENT
// ==========================================

export async function getAllRequests(request: FastifyRequest, reply: FastifyReply) {
  // Sync: If any registered customer has an address but no LockerRequest yet, create one
  const usersWithNoRequest = await User.find({
    role: { $ne: "admin" },
    address: { $exists: true, $ne: "" },
  });

  for (const u of usersWithNoRequest) {
    const exists = await LockerRequest.findOne({ userId: u._id });
    if (!exists) {
      await LockerRequest.create({
        userId: u._id,
        name: u.name || "Customer",
        phone: u.phone || "—",
        email: u.email,
        address: u.address,
        pincode: u.pincode || "560001",
        units: u.units || 1,
        status: u.orderStatus || "pending",
        assignedDeviceIds: u.assignedDevices || [],
        createdAt: u.createdAt || new Date(),
      });
    }
  }

  const requests = await LockerRequest.find()
    .populate("userId", "name phone email address pincode units orderStatus")
    .sort({ createdAt: -1 });

  return reply.send({ requests });
}

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

  // Step 1: Accept & Prepare (or legacy approved)
  if (status === "preparing" || status === "approved") {
    // If deviceId provided, assign device
    const targetDeviceId = deviceId || (lockerReq.assignedDeviceIds && lockerReq.assignedDeviceIds[0]);
    if (!targetDeviceId || !targetDeviceId.trim()) {
      return reply.status(400).send({ error: "Locker device ID is required to accept the request" });
    }

    const cleanDeviceId = targetDeviceId.trim().toUpperCase();

    // Find or create device and assign to customer
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

  // Step 2: Dispatched (Out for Delivery & Installation)
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

    // Mark assigned devices online
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

// ==========================================
// SYSTEM & DEVICE LOGS
// ==========================================

export async function getSystemLogs(request: FastifyRequest, reply: FastifyReply) {
  const logs = await Log.find()
    .populate("deviceId", "deviceId name")
    .sort({ timestamp: -1 })
    .limit(200);

  return reply.send({ logs });
}

export async function getDeviceLogsForAdmin(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const logs = await Log.find({ deviceId: id })
    .sort({ timestamp: -1 })
    .limit(100);

  return reply.send({ logs });
}


