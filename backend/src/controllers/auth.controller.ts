import { FastifyRequest, FastifyReply } from "fastify";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { z } from "zod";
import { User } from "../models/User.model.js";
import { Otp } from "../models/Otp.model.js";
import { LockerRequest } from "../models/LockerRequest.model.js";
import { smsService } from "../services/sms.service.js";
import { config } from "../config.js";
import { createLockerOrderRequest, redeemInviteCodeOnSignup } from "../services/registration.service.js";
import { TokenService } from "../services/token.service.js";

// 1. Send OTP with Smart Pre-Check
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

  const existingUser = await User.findOne({ phone: cleanPhone });
  if (existingUser) {
    return reply.status(409).send({
      exists: true,
      error: "An account with this mobile number already exists. Please log in instead.",
    });
  }

  // Check existing OTP records for rate limiting (10s cooldown, max 3 per minute)
  const existingOtps = await Otp.find({ phone: cleanPhone }).sort({ createdAt: -1 });
  const allTimestamps: Date[] = [];
  for (const rec of existingOtps) {
    if (rec.requestTimestamps && rec.requestTimestamps.length > 0) {
      allTimestamps.push(...rec.requestTimestamps);
    } else if (rec.createdAt) {
      allTimestamps.push(rec.createdAt);
    }
  }

  const now = Date.now();
  // 1. 10-second cooldown check
  const lastRequestTime = allTimestamps.length > 0 ? Math.max(...allTimestamps.map((t) => new Date(t).getTime())) : 0;
  if (lastRequestTime && now - lastRequestTime < 10 * 1000) {
    const waitSeconds = Math.ceil((10 * 1000 - (now - lastRequestTime)) / 1000);
    return reply.status(429).send({
      error: `Please wait ${waitSeconds}s before requesting another OTP.`,
      cooldownRemaining: waitSeconds,
    });
  }

  // 2. Max 3 requests in the last 60 seconds check
  const oneMinuteAgo = now - 60 * 1000;
  const recentRequests = allTimestamps.filter((t) => new Date(t).getTime() > oneMinuteAgo);
  if (recentRequests.length >= 3) {
    const oldestInWindow = Math.min(...recentRequests.map((t) => new Date(t).getTime()));
    const waitSeconds = Math.ceil((60 * 1000 - (now - oldestInWindow)) / 1000);
    return reply.status(429).send({
      error: `Too many OTP requests. Maximum 3 requests per minute. Please try again in ${waitSeconds}s.`,
      cooldownRemaining: waitSeconds,
    });
  }

  // Generate cryptographically random 6-digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Hash OTP using SHA-256 so plaintext OTP is never persisted in database
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  // Keep recent timestamps within the last 5 minutes to maintain sliding rate window
  const slidingTimestamps = [
    ...allTimestamps.filter((t) => new Date(t).getTime() > now - 5 * 60 * 1000),
    new Date(),
  ];

  await Otp.deleteMany({ phone: cleanPhone, verified: false });

  await Otp.create({
    phone: cleanPhone,
    otp: hashedOtp,
    expiresAt,
    attempts: 0,
    verified: false,
    requestTimestamps: slidingTimestamps,
  });

  await smsService.sendOtp(cleanPhone, otp);

  return reply.send({
    success: true,
    message: "OTP sent successfully to your mobile number",
    exists: false,
    data: {
      phone: cleanPhone,
      expiresIn: 600,
    },
  });
}

// 2. Check If Phone Exists
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

// 3. Register Account with OTP
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

  const existingUser = await User.findOne({ phone: cleanPhone });
  if (existingUser) {
    return reply.status(409).send({
      exists: true,
      error: "An account with this mobile number already exists. Please log in instead.",
    });
  }

  const otpRecord = await Otp.findOne({
    phone: cleanPhone,
    verified: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return reply.status(400).send({ error: "Invalid or expired OTP. Please request a new one." });
  }

  const candidateHash = crypto.createHash("sha256").update(otp.trim()).digest("hex");
  const isHashMatch = otpRecord.otp === candidateHash;
  const isLegacyPlainMatch = otpRecord.otp === otp.trim();

  if (!isHashMatch && !isLegacyPlainMatch) {
    otpRecord.attempts += 1;
    if (otpRecord.attempts >= 3) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return reply.status(400).send({ error: "Maximum incorrect OTP attempts exceeded. Please request a new OTP." });
    }
    await otpRecord.save();
    return reply.status(400).send({ error: "Incorrect OTP. Please try again." });
  }

  otpRecord.verified = true;
  await Otp.deleteOne({ _id: otpRecord._id });

  const isPlacingOrder = Boolean(address && address.trim());

  const hashedPassword = await bcrypt.hash(password, 10);

  const userData: any = {
    phone: cleanPhone,
    name: name ? name.trim() : undefined,
    password: hashedPassword,
    role: "user",
    isPhoneVerified: true,
  };
  if (email && email.trim()) userData.email = email.toLowerCase().trim();
  if (isPlacingOrder) {
    userData.address = address!.trim();
    if (pincode && pincode.trim()) userData.pincode = pincode.trim();
    userData.units = units ? Number(units) || 1 : 1;
    userData.orderStatus = "pending";
  }

  const newUser = await User.create(userData);

  // Only create a Locker Delivery Request if user explicitly ordered with address
  if (isPlacingOrder) {
    await createLockerOrderRequest({
      userId: newUser._id,
      name: newUser.name,
      phone: newUser.phone,
      email: newUser.email,
      address: newUser.address,
      pincode: newUser.pincode,
      units: newUser.units,
    });
  }

  // Handle optional Join Code
  let joinedDevice = null;
  if (inviteCode) {
    joinedDevice = await redeemInviteCodeOnSignup(inviteCode, newUser._id);
  }

  const token = request.server.jwt.sign({
    id: newUser._id,
    phone: newUser.phone,
    email: newUser.email,
    role: newUser.role,
  });

  const refreshToken = await TokenService.createRefreshToken(newUser._id);

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
      units: newUser.units,
      orderStatus: newUser.orderStatus,
      assignedDevices: newUser.assignedDevices || [],
    },
    token,
    refreshToken,
    joinedDevice,
  });
}

// 4. User Login
export async function login(request: FastifyRequest, reply: FastifyReply) {
  const loginSchema = z.object({
    identifier: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    password: z.string().min(1, "Password is required"),
  });

  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      error: parsed.error.issues[0]?.message || "Invalid login payload",
    });
  }

  const { password, identifier, phone, email } = parsed.data;
  const idString = (phone || email || identifier || "").trim();
  if (!idString) {
    return reply.status(400).send({ error: "Mobile number or email is required" });
  }

  const cleanPhone = smsService.normalizePhone(idString);
  const queryConditions: Array<{ phone: string } | { email: string }> = [];
  if (cleanPhone) {
    queryConditions.push({ phone: cleanPhone });
  }
  queryConditions.push({ email: idString.toLowerCase() });

  const user = await User.findOne({ $or: queryConditions });
  if (!user) {
    return reply.status(401).send({ error: "Invalid mobile number/email or password" });
  }

  // Account Lockout / Exponential Backoff Check
  if (user.lockUntil && user.lockUntil > new Date()) {
    const waitSeconds = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000);
    return reply.status(429).send({
      error: `Too many failed login attempts. Account temporarily locked. Please wait ${waitSeconds} seconds before trying again.`,
      lockoutRemaining: waitSeconds,
    });
  }

  let isMatch = false;
  // Check if password in DB is a bcrypt hash
  const isBcrypt = user.password.startsWith("$2a$") || user.password.startsWith("$2b$");
  if (isBcrypt) {
    isMatch = await bcrypt.compare(password, user.password);
  } else {
    // Legacy plain text check
    isMatch = user.password === password;
    if (isMatch) {
      // Seamlessly upgrade legacy plain text password to bcrypt hash
      user.password = await bcrypt.hash(password, 10);
    }
  }

  if (!isMatch) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    user.failedLoginAttempts = attempts;

    // Exponential backoff locks:
    // 5 failed attempts -> 1 minute lockout
    // 10 failed attempts -> 15 minutes lockout
    // 15+ failed attempts -> 60 minutes lockout
    if (attempts >= 15) {
      user.lockUntil = new Date(Date.now() + 60 * 60 * 1000);
    } else if (attempts >= 10) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    } else if (attempts >= 5) {
      user.lockUntil = new Date(Date.now() + 60 * 1000);
    }

    await user.save();
    return reply.status(401).send({ error: "Invalid mobile number/email or password" });
  }

  // On successful login, reset failed attempts and lockout
  if (user.failedLoginAttempts || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  const token = request.server.jwt.sign({
    id: user._id,
    phone: user.phone,
    email: user.email,
    role: user.role,
  });

  const refreshToken = await TokenService.createRefreshToken(user._id);

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
    refreshToken,
  });
}

// 5. Current Authenticated Profile
export async function getMe(request: FastifyRequest, reply: FastifyReply) {
  const authUser = request.user as { id: string };
  if (!authUser?.id) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  const user = await User.findById(authUser.id).select("-password");
  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

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
      units: latestRequest?.units || user.units,
      orderStatus: latestRequest?.status || user.orderStatus,
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

// 6. Authenticated User Places a Locker Order
export async function placeOrder(request: FastifyRequest, reply: FastifyReply) {
  const authUser = request.user as { id: string };
  if (!authUser?.id) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  const { address, pincode, units } = (request.body as {
    address?: string;
    pincode?: string;
    units?: number;
  }) || {};

  if (!address || !address.trim()) {
    return reply.status(400).send({ error: "Doorstep delivery address is required" });
  }

  const cleanPincode = (pincode || "").trim();
  const orderUnits = units ? Number(units) || 1 : 1;

  const user = await User.findById(authUser.id);
  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  user.address = address.trim();
  if (cleanPincode) user.pincode = cleanPincode;
  user.units = orderUnits;
  user.orderStatus = "pending";
  await user.save();

  const lockerReq = await createLockerOrderRequest({
    userId: user._id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    address: user.address,
    pincode: user.pincode,
    units: user.units,
  });

  return reply.status(201).send({
    success: true,
    message: "Order placed successfully! In queue for hub preparation.",
    order: lockerReq,
    user: {
      id: user._id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
      address: user.address,
      pincode: user.pincode,
      units: user.units,
      orderStatus: user.orderStatus,
      assignedDevices: user.assignedDevices || [],
    },
  });
}

// 7. Update User Profile (Name, Email)
export async function updateProfile(request: FastifyRequest, reply: FastifyReply) {
  const authUser = request.user as { id: string };
  if (!authUser?.id) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  const { name, email } = (request.body as { name?: string; email?: string }) || {};

  const user = await User.findById(authUser.id);
  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  if (name !== undefined) {
    const cleanName = name.trim();
    if (!cleanName) {
      return reply.status(400).send({ error: "Name cannot be empty" });
    }
    user.name = cleanName;
  }

  if (email !== undefined) {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return reply.status(400).send({ error: "Please enter a valid email address" });
      }
      // Check if email taken by another user
      const existing = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
      if (existing) {
        return reply.status(409).send({ error: "This email address is already in use" });
      }
      user.email = cleanEmail;
    } else {
      user.email = undefined;
    }
  }

  await user.save();

  return reply.send({
    success: true,
    message: "Profile updated successfully",
    user: {
      id: user._id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
      address: user.address,
      pincode: user.pincode,
      units: user.units,
      orderStatus: user.orderStatus,
      assignedDevices: user.assignedDevices || [],
    },
  });
}

// 6. Refresh Access Token with Token Rotation
export async function refreshTokenHandler(request: FastifyRequest, reply: FastifyReply) {
  const { refreshToken } = (request.body as { refreshToken?: string }) || {};

  if (!refreshToken) {
    return reply.status(400).send({ error: "Refresh token is required" });
  }

  const rotationResult = await TokenService.rotateRefreshToken(refreshToken);
  if (!rotationResult) {
    return reply.status(401).send({ error: "Invalid or expired refresh token. Please sign in again." });
  }

  const user = await User.findById(rotationResult.userId);
  if (!user) {
    return reply.status(401).send({ error: "User associated with token no longer exists" });
  }

  const token = request.server.jwt.sign({
    id: user._id,
    phone: user.phone,
    email: user.email,
    role: user.role,
  });

  return reply.send({
    success: true,
    token,
    refreshToken: rotationResult.newRefreshToken,
  });
}

// 7. Logout & Revoke Refresh Token
export async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
  const { refreshToken } = (request.body as { refreshToken?: string }) || {};

  if (refreshToken) {
    await TokenService.revokeToken(refreshToken);
  }

  return reply.send({
    success: true,
    message: "Logged out successfully",
  });
}

