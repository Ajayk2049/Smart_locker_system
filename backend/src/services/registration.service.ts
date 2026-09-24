import { LockerRequest } from "../models/LockerRequest.model.js";
import { Log } from "../models/Log.model.js";
import { Device } from "../models/Device.model.js";
import { User } from "../models/User.model.js";
import mongoose from "mongoose";

interface CreateLockerRequestParams {
  userId: mongoose.Types.ObjectId;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  pincode?: string;
  units?: number;
}

export async function createLockerOrderRequest(params: CreateLockerRequestParams) {
  try {
    const lockerReq = await LockerRequest.create({
      userId: params.userId,
      name: params.name || "Customer",
      phone: params.phone || "",
      email: params.email,
      address: params.address || "",
      pincode: params.pincode || "",
      units: params.units || 1,
      status: "pending",
      assignedDeviceIds: [],
    });

    await Log.create({
      action: "order_requested",
      metadata: {
        requestId: lockerReq._id,
        userId: params.userId,
        phone: params.phone,
        units: params.units || 1,
        pincode: params.pincode,
        address: params.address,
      },
    });

    return lockerReq;
  } catch (err) {
    console.error("Failed to create LockerRequest:", err);
    return null;
  }
}

export async function redeemInviteCodeOnSignup(inviteCode: string, userId: mongoose.Types.ObjectId) {
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

  if (!device) return null;

  const allowed = device.allowedSlots || 2;
  const current = 1 + (device.coOwners ? device.coOwners.length : 0);

  if (current < allowed) {
    device.coOwners.push(userId);
    device.inviteCode = undefined;
    device.inviteExpiresAt = undefined;
    await device.save();

    await User.findByIdAndUpdate(userId, {
      $addToSet: { assignedDevices: device.deviceId },
    });

    await Log.create({
      deviceId: device._id,
      action: "co_owner_added",
      metadata: {
        coOwnerId: userId,
        method: "join_code_signup",
      },
    });

    return {
      id: device._id,
      deviceId: device.deviceId,
      name: device.name,
    };
  }

  return null;
}
