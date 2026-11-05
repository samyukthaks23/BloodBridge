
const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    donorName: {
      type: String,
      required: true,
      trim: true
    },

    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    },

    donationDate: {
      type: Date,
      required: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    bloodBank: {
      type: String,
      trim: true,
      default: ""
    },

    status: {
      type: String,
      enum: ["Pending", "Scheduled", "Completed", "Cancelled"],
      default: "Pending"
    },

    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending"
    },

    relatedBloodRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodRequest",
      default: null
    },

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    verifiedAt: {
      type: Date,
      default: null
    },

    verificationNotes: {
      type: String,
      trim: true,
      default: ""
    },

    // Prevents counting the same donation more than once
    donorCountedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Retrieve donations by donor and date
donationSchema.index({ donor: 1, donationDate: -1 });

// Support verified donation statistics
donationSchema.index({
  bloodGroup: 1,
  status: 1,
  verificationStatus: 1,
  donationDate: 1
});

module.exports = mongoose.model("Donation", donationSchema);
