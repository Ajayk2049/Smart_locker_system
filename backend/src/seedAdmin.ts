import mongoose from "mongoose";
import { config } from "./config.js";
import { User } from "./models/User.model.js";
import { Device } from "./models/Device.model.js";
import { Log } from "./models/Log.model.js";
import { Otp } from "./models/Otp.model.js";

async function seedAdmin() {
  console.log("🧹 Connecting to MongoDB to purge dummy data and seed Admin...");
  await mongoose.connect(config.mongodbUri);
  console.log("✅ MongoDB connected to:", config.mongodbUri.replace(/\/\/.*@/, "//***@"));

  // 1. Purge all dummy data across all collections
  console.log("🗑️  Purging collections...");
  const usersDeleted = await User.deleteMany({});
  const devicesDeleted = await Device.deleteMany({});
  const logsDeleted = await Log.deleteMany({});
  const otpsDeleted = await Otp.deleteMany({});

  console.log(`   - Deleted ${usersDeleted.deletedCount} users`);
  console.log(`   - Deleted ${devicesDeleted.deletedCount} devices`);
  console.log(`   - Deleted ${logsDeleted.deletedCount} logs`);
  console.log(`   - Deleted ${otpsDeleted.deletedCount} OTP records`);

  // 2. Seed Admin account
  const adminEmail = "Aibotink.web@gmail.com";
  const adminPassword = "Aibotink@123";

  const admin = await User.create({
    email: adminEmail.toLowerCase().trim(),
    password: adminPassword,
    name: "AIBotInk Admin",
    role: "admin",
    isPhoneVerified: true,
    isDemo: false,
  });

  console.log("\n==================================================");
  console.log("👑 Admin Account Seeded Successfully!");
  console.log("==================================================");
  console.log(`Admin Email:     ${adminEmail}`);
  console.log(`Admin Password:  ${adminPassword}`);
  console.log(`Role:            ${admin.role}`);
  console.log(`User ID (_id):   ${admin._id}`);
  console.log("==================================================\n");

  await mongoose.disconnect();
  console.log("🔌 MongoDB disconnected cleanly.");
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ seedAdmin failed:", err);
  process.exit(1);
});
