import { FastifyRequest, FastifyReply } from "fastify";
import crypto from "crypto";
import { User } from "../models/User.model.js";
import { Otp } from "../models/Otp.model.js";
import { Device } from "../models/Device.model.js";
import { Log } from "../models/Log.model.js";
import { LockerRequest } from "../models/LockerRequest.model.js";
import { smsService } from "../services/sms.service.js";
import { config } from "../config.js";

// 1. Smart Pre-Check & Send OTP
export async function sendOtp(request: FastifyRequest, reply: FastifyReply) {
  const { phone } = request.body as { phone?: string };

  if (!phone) {
    return reply.status(400).send({ error: "Mobile number is required" });
  }

  const cleanPhone = smsService.normalizePhone(phone);
  if (!cleanPhone) {
    return reply.status(400).send({
      error: "Invalid phone number. Must be a 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
    });
  }

  // --- SMART PRE-CHECK (Cost & Spam Optimization) ---
  // If the user is already a customer, do NOT send OTP. Inform them to log in instead!
  const existingUser = await User.findOne({ phone: cleanPhone });
  if (existingUser) {
    return reply.status(409).send({
      exists: true,
      error: "An account with this mobile number already exists. Please log in instead.",
    });
  }

  // Generate 6-digit OTP
  const isDemo = config.demoMode || cleanPhone === "9876543210";
  const otp = isDemo ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any older unverified OTPs for this phone
  await Otp.deleteMany({ phone: cleanPhone, verified: false });

  // Save OTP in MongoDB with TTL
  await Otp.create({
    phone: cleanPhone,
    otp,
    sessionId,
    expiresAt,
    attempts: 0,
    verified: false,
  });

  // Dispatch via StartMessaging
  await smsService.sendOtp(cleanPhone, otp);

  return reply.send({
    success: true,
    message: "OTP sent successfully to your mobile number",
    exists: false,
    data: {
      phone: cleanPhone,
      expiresIn: 600,
      ...(isDemo || process.env.NODE_ENV !== "production" ? { sessionId, demoOtp: otp } : {}),
    },
  });
}

// 1b. Check If Phone Exists (Lightweight Pre-check)
export async function checkPhone(request: FastifyRequest, reply: FastifyReply) {
  const { phone } = (request.body as { phone?: string }) || {};

  if (!phone) {
    return reply.status(400).send({ error: "Mobile number is required" });
  }

  const cleanPhone = smsService.normalizePhone(phone);
  if (!cleanPhone) {
    return reply.status(400).send({
      error: "Invalid phone number. Must be a 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
    });
  }

  const existingUser = await User.findOne({ phone: cleanPhone });
  return reply.send({
    exists: Boolean(existingUser),
    phone: cleanPhone,
    message: existingUser
      ? "An account with this mobile number already exists. Please sign in."
      : "Mobile number is available",
  });
}

// 2. Register Account with OTP (+ Optional Join Code)
export async function registerWithOtp(request: FastifyRequest, reply: FastifyReply) {
  const { phone, otp, password, email, name, inviteCode, address, pincode, units } = request.body as {
    phone?: string;
    otp?: string;
    password?: string;
    email?: string;
    name?: string;
    inviteCode?: string;
    address?: string;
    pincode?: string;
    units?: number;
  };

  if (!phone || !otp || !password) {
    return reply.status(400).send({ error: "phone, otp, and password are required" });
  }

  if (password.length < 6) {
    return reply.status(400).send({ error: "Password must be at least 6 characters long" });
  }

  const cleanPhone = smsService.normalizePhone(phone);
  if (!cleanPhone) {
    return reply.status(400).send({ error: "Invalid mobile number format" });
  }

  // Check if phone was registered in the interim
  const existingUser = await User.findOne({ phone: cleanPhone });
  if (existingUser) {
    return reply.status(409).send({
      exists: true,
      error: "An account with this mobile number already exists. Please log in instead.",
    });
  }

  // Find latest active OTP
  const otpRecord = await Otp.findOne({
    phone: cleanPhone,
    verified: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return reply.status(400).send({ error: "Invalid or expired OTP. Please request a new one." });
  }

  // Timing-safe OTP comparison
  const expectedBuffer = Buffer.from(otpRecord.otp);
  const actualBuffer = Buffer.from(otp.trim());

  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    otpRecord.attempts += 1;
    if (otpRecord.attempts >= 3) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return reply.status(400).send({ error: "Maximum incorrect OTP attempts exceeded. Please request a new OTP." });
    }
    await otpRecord.save();
    return reply.status(400).send({ error: "Incorrect OTP. Please try again." });
  }

  // Mark OTP verified and delete
  otpRecord.verified = true;
  await Otp.deleteOne({ _id: otpRecord._id });

  // Create User
  const userData: any = {
    phone: cleanPhone,
    name: name ? name.trim() : undefined,
    password,
    role: "user",
    isPhoneVerified: true,
    isDemo: cleanPhone === "9876543210",
  };
  if (email && email.trim()) {
    userData.email = email.toLowerCase().trim();
  }
  if (address && address.trim()) {
    userData.address = address.trim();
  }
  if (pincode && pincode.trim()) {
    userData.pincode = pincode.trim();
  }
  if (units) {
    userData.units = Number(units) || 1;
  }
  userData.orderStatus = "pending";

  const newUser = await User.create(userData);

  // Automatically create a Locker Delivery Request for Admin review
  try {
    const lockerReq = await LockerRequest.create({
      userId: newUser._id,
      name: newUser.name || "Customer",
      phone: newUser.phone,
      email: newUser.email,
      address: newUser.address || "",
      pincode: newUser.pincode || "",
      units: newUser.units || 1,
      status: "pending",
      assignedDeviceIds: [],
    });

    await Log.create({
      action: "order_requested",
      metadata: {
        requestId: lockerReq._id,
        userId: newUser._id,
        phone: newUser.phone,
        units: newUser.units || 1,
        pincode: newUser.pincode,
        address: newUser.address,
      },
    });
  } catch (err) {
    console.error("Failed to create LockerRequest:", err);
  }

  // Handle optional Join Code (instant co-owner enrollment)
  let joinedDevice = null;
  if (inviteCode) {
    const cleanCode = inviteCode.trim().toUpperCase();
    const device = await Device.findOne({
      inviteCode: cleanCode,
      inviteExpiresAt: { $gt: new Date() },
    });

    if (device) {
      const allowed = device.allowedSlots || 2;
      const current = 1 + (device.coOwners ? device.coOwners.length : 0);

      if (current < allowed) {
        device.coOwners.push(newUser._id as any);
        device.inviteCode = undefined;
        device.inviteExpiresAt = undefined;
        await device.save();

        await Log.create({
          deviceId: device._id,
          action: "co_owner_added",
          metadata: {
            coOwnerId: newUser._id,
            coOwnerPhone: newUser.phone,
            method: "join_code_signup",
          },
        });

        joinedDevice = {
          id: device._id,
          deviceId: device.deviceId,
          name: device.name,
        };
        console.log(`🤝 User ${cleanPhone} joined device ${device.deviceId} via signup join code!`);
      }
    }
  }

  const token = request.server.jwt.sign({
    id: newUser._id,
    phone: newUser.phone,
    email: newUser.email,
    role: newUser.role,
  });

  return reply.status(201).send({
    success: true,
    message: "Account created successfully",
    user: {
      id: newUser._id,
      phone: newUser.phone,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      address: newUser.address,
      pincode: newUser.pincode,
      units: newUser.units || 1,
      orderStatus: newUser.orderStatus || "pending",
      assignedDevices: newUser.assignedDevices || [],
    },
    token,
    joinedDevice,
  });
}

// 3. User Login (Supports Mobile Number OR Email + Password)
export async function login(request: FastifyRequest, reply: FastifyReply) {
  const body = (request.body as {
    identifier?: string;
    phone?: string;
    email?: string;
    password?: string;
  }) || {};

  const password = body.password;
  if (!password) {
    return reply.status(400).send({ error: "Password is required" });
  }

  const idString = (body.phone || body.email || body.identifier || "").trim();
  if (!idString) {
    return reply.status(400).send({ error: "Mobile number or email is required" });
  }

  // Resolve user by normalized phone or email
  const cleanPhone = smsService.normalizePhone(idString);
  const queryConditions: any[] = [];
  if (cleanPhone) {
    queryConditions.push({ phone: cleanPhone });
  }
  queryConditions.push({ email: idString.toLowerCase() });

  const user = await User.findOne({ $or: queryConditions });

  if (!user || user.password !== password) {
    return reply.status(401).send({ error: "Invalid mobile number/email or password" });
  }

  const token = request.server.jwt.sign({
    id: user._id,
    phone: user.phone,
    email: user.email,
    role: user.role,
  });

  return reply.send({
    success: true,
    user: {
      id: user._id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
      address: user.address,
      pincode: user.pincode,
      units: user.units || 1,
      orderStatus: user.orderStatus || "pending",
      assignedDevices: user.assignedDevices || [],
    },
    token,
  });
}

// 4. Get Current Authenticated Profile
export async function getMe(request: FastifyRequest, reply: FastifyReply) {
  const authUser = request.user as { id: string };
  if (!authUser?.id) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  const user = await User.findById(authUser.id).select("-password");
  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  // Find latest locker request if any
  const latestRequest = await LockerRequest.findOne({ userId: user._id }).sort({ createdAt: -1 });

  return reply.send({
    user: {
      id: user._id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
      address: user.address,
      pincode: user.pincode,
      units: user.units || 1,
      orderStatus: latestRequest?.status || user.orderStatus || "pending",
      assignedDevices: latestRequest?.assignedDeviceIds || user.assignedDevices || [],
      requestDetails: latestRequest
        ? {
            id: latestRequest._id,
            status: latestRequest.status,
            rejectionReason: latestRequest.rejectionReason,
            units: latestRequest.units,
            createdAt: latestRequest.createdAt,
          }
        : null,
    },
  });
}
