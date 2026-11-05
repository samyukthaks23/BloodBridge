
const mongoose = require("mongoose");

const bloodRequestSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: true,
      trim: true
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    },
    units: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    hospital: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    contact: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/
    },
    requiredDate: {
      type: Date,
      required: true
    },
    urgency: {
      type: String,
      enum: ["Urgent", "Within 24 hours", "Scheduled"],
      default: "Urgent"
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Completed", "Cancelled"],
      default: "Pending"
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BloodRequest", bloodRequestSchema);
