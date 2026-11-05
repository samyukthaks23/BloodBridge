
const mongoose = require("mongoose");

// Optional health information.
// This information must only be collected with donor consent.
const healthInformationSchema = new mongoose.Schema(
  {
    weight: {
      type: Number,
      min: 1
    },

    hemoglobin: {
      type: Number,
      min: 1
    },

    bloodPressureSystolic: {
      type: Number,
      min: 1
    },

    bloodPressureDiastolic: {
      type: Number,
      min: 1
    },

    hasFeverOrInfection: {
      type: Boolean,
      default: null
    },

    seriousMedicalConditions: {
      type: String,
      trim: true
    },

    recentSurgeryDate: {
      type: Date,
      default: null
    },

    recentBloodTransfusionDate: {
      type: Date,
      default: null
    },

    medications: {
      type: String,
      trim: true
    },

    seriousHeartCondition: {
      type: Boolean,
      default: null
    },

    bloodBorneInfectionHistory: {
      type: Boolean,
      default: null
    },

    pregnancyStatus: {
      type: String,
      enum: [
        "Not Applicable",
        "Pregnant",
        "Recently Postpartum",
        "Prefer Not to Say"
      ],
      default: "Prefer Not to Say"
    },

    otherRestrictions: {
      type: String,
      trim: true
    }
  },
  {
    _id: false
  }
);

const userSchema = new mongoose.Schema(
  {
    // Existing account information
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    phone: {
      type: String,
      required: true
    },

    // Existing blood information
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: function () {
        return this.role === "donor";
      }
    },

    location: {
      type: String,
      required: true
    },

   role: {
  type: String,
  enum: ["donor", "recipient", "admin"],
  default: "donor"
},

    isAvailable: {
      type: Boolean,
      default: true
    },

    // Personal information
    dateOfBirth: {
      type: Date,
      default: null
    },

    gender: {
      type: String,
      enum: [
        "Male",
        "Female",
        "Other",
        "Prefer not to say"
      ],
      default: null
    },

    city: {
      type: String,
      trim: true,
      default: ""
    },

    district: {
      type: String,
      trim: true,
      default: ""
    },

    state: {
      type: String,
      trim: true,
      default: ""
    },

    pincode: {
      type: String,
validate: {
  validator: function (value) {
    return !value || /^[0-9]{6}$/.test(value);
  },
  message: "Enter a valid 6-digit Indian pincode"
},      default: ""
    },

    // Donation history.
    // These values should be maintained by verified donation records,
    // not manually entered by donors.
    donationCount: {
      type: Number,
      default: 0,
      min: 0
    },

    lastDonationDate: {
      type: Date,
      default: null
    },

    // Health information consent
    healthInformationConsent: {
      type: Boolean,
      default: false
    },

    healthInformationConsentDate: {
      type: Date,
      default: null
    },

    // Hidden by default when fetching normal user records.
    healthInformation: {
      type: healthInformationSchema,
      default: undefined,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Health information cannot be saved without consent.
userSchema.pre("validate", function () {
  if (this.healthInformation && !this.healthInformationConsent) {
    this.invalidate(
      "healthInformation",
      "Donor consent is required before saving health information."
    );
  }
});

module.exports = mongoose.model("User", userSchema);
