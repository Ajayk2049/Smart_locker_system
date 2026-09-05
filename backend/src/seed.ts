import mongoose from "mongoose";
import { config } from "./config.js";
import { User } from "./models/User.model.js";
import { Device } from "./models/Device.model.js";

async function seed() {
  console.log("🌱 Connecting to MongoDB for seeding...");
  await mongoose.connect(config.mongodbUri);
  console.log("✅ MongoDB connected");

  // 1. Seed or find default test user
  const testEmail = "test@smartbox.com";
  let user = await User.findOne({ email: testEmail });
  if (!user) {
    user = await User.create({
      email: testEmail,
      password: "password123",
      role: "user",
    });
    console.log(`👤 Created test user: ${testEmail} (id: ${user._id})`);
  } else {
    console.log(`👤 Found existing test user: ${testEmail} (id: ${user._id})`);
  }

  // 2. Seed or find default test device
  const defaultDeviceId = "BOX_001";
  let device = await Device.findOne({ deviceId: defaultDeviceId });
  if (!device) {
    device = await Device.create({
      deviceId: defaultDeviceId,
      name: "Front Porch Locker",
      ownerId: user._id,
      doorState: "closed",
      online: false,
    });
    console.log(`📦 Created test device: ${defaultDeviceId} (mongo _id: ${device._id})`);
  } else {
    // Ensure ownership is tied to test user
    device.ownerId = user._id as mongoose.Types.ObjectId;
    device.doorState = "closed";
    await device.save();
    console.log(`📦 Updated test device: ${defaultDeviceId} (mongo _id: ${device._id})`);
  }

  console.log("\n==================================================");
  console.log("🎉 Database Seed Completed Successfully!");
  console.log("==================================================");
  console.log(`Test User Email:    ${testEmail}`);
  console.log(`Test User Password: password123`);
  console.log(`Test Device ID:     ${defaultDeviceId}`);
  console.log(`Device Mongo ID:    ${device._id}`);
  console.log("==================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
