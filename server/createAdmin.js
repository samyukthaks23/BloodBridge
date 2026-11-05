require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createAdmin() {
  try {
    // Check required environment variables
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PHONE, ADMIN_LOCATION } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_PHONE || !ADMIN_LOCATION) {
      throw new Error("Please configure all ADMIN environment variables.");
    }

    if (ADMIN_PASSWORD.length < 8) {
      throw new Error("Admin password must contain at least 8 characters.");
    }

    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected!");

    // Check whether admin already exists
    const existingAdmin = await User.findOne({
      email: ADMIN_EMAIL.toLowerCase().trim()
    });

    if (existingAdmin) {
  existingAdmin.password = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await existingAdmin.save();

  console.log("Admin password updated successfully!");
  return;
}

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create admin account
    const admin = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase().trim(),
      password: hashedPassword,
      phone: ADMIN_PHONE,
      location: ADMIN_LOCATION,
      role: "admin"
    });

    await admin.save();

    console.log("Admin account created successfully!");
    console.log("Admin email:", admin.email);

  } catch (error) {
    console.error("Admin setup failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();