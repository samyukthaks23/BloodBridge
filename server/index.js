
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Import routes
const authRoutes = require("./routes/auth");
const requestRoutes = require("./routes/request");
const donorConnectionRoutes = require("./routes/donorConnection");
const notificationRoutes = require("./routes/notification");
const statisticsRoutes = require("./routes/statistics");
const adminRoutes = require("./routes/admin");


// Middleware
app.use(cors());
app.use(express.json());


// Home route
app.get("/", (req, res) => {
  res.send("BloodBridge Backend is Running!");
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "BloodBridge API is working successfully!",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/donor-requests", donorConnectionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/admin", adminRoutes);


// Server configuration
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, () => {
      console.log(`BloodBridge server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Failed!");
    console.error("Main Error:", error.message);

    if (error.reason && error.reason.servers) {
      for (const [address, server] of error.reason.servers) {
        console.log("\nServer:", address);
        console.log(
          "Network Error:",
          server.error?.message || "No detailed error available"
        );
      }
    }
  });
