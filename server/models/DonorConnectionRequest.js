
const mongoose = require("mongoose");

const donorConnectionRequestSchema = new mongoose.Schema(
  {
    bloodRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodRequest",
      required: true
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    },

    patientName: {
      type: String,
      required: true
    },

    hospital: {
      type: String,
      required: true
    },

    location: {
      type: String,
      required: true
    },

    contact: {
      type: String,
      required: true
    },

    requiredDate: {
      type: Date,
      required: true
    },

    units: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Declined"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DonorConnectionRequest",
  donorConnectionRequestSchema
);
