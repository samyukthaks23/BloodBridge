
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// AUTHENTICATION HELPER
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required"
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
}


// REGISTER API
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      bloodGroup,
      location,
      role
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !location ||
      (role === "donor" && !bloodGroup)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields"
      });
    }

    // Admin registration is not allowed publicly.
    if (!["donor", "recipient"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account role"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters"
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone,
      bloodGroup: role === "donor" ? bloodGroup : undefined,
      location,
      role
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        bloodGroup: newUser.bloodGroup,
        location: newUser.location,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again."
    });
  }
});


// LOGIN API
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Please enter email, password and role"
      });
    }

    // Admin login is allowed.
    if (!["donor", "recipient", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account role"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email or password is incorrect"
      });
    }

    if (user.role !== role) {
      return res.status(403).json({
        success: false,
        message: "Please select the correct account type"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email or password is incorrect"
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        location: user.location,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
  }
});


// GET LOGGED-IN USER PROFILE
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        location: user.location,
        role: user.role,
        isAvailable: user.isAvailable,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        city: user.city,
        district: user.district,
        state: user.state,
        pincode: user.pincode,
        donationCount: user.donationCount,
        lastDonationDate: user.lastDonationDate
      }
    });

  } catch (error) {
    console.error("Profile error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch profile"
    });
  }
});


// GET COMPLETE PRIVATE PROFILE
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("+healthInformation");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const profile = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      bloodGroup: user.bloodGroup,
      location: user.location,
      isAvailable: user.isAvailable,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      city: user.city,
      district: user.district,
      state: user.state,
      pincode: user.pincode,
      donationCount: user.donationCount,
      lastDonationDate: user.lastDonationDate
    };

    // Only donors can retrieve their own health information.
    if (user.role === "donor") {
      profile.healthInformationConsent =
        user.healthInformationConsent;

      profile.healthInformation =
        user.healthInformationConsent
          ? user.healthInformation
          : undefined;
    }

    res.status(200).json({
      success: true,
      user: profile
    });

  } catch (error) {
    console.error("Complete profile error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch complete profile"
    });
  }
});


// UPDATE PERSONAL AND HEALTH PROFILE
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("+healthInformation");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const {
      name,
      phone,
      location,
      dateOfBirth,
      gender,
      city,
      district,
      state,
      pincode,
      bloodGroup,
      healthInformationConsent,
      healthInformation
    } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (dateOfBirth !== undefined) {
      user.dateOfBirth = dateOfBirth || null;
    }
    if (gender !== undefined) user.gender = gender;
    if (city !== undefined) user.city = city;
    if (district !== undefined) user.district = district;
    if (state !== undefined) user.state = state;
    if (pincode !== undefined) user.pincode = pincode;

    // Only donors can update their blood group.
    if (bloodGroup !== undefined) {
      if (user.role !== "donor") {
        return res.status(403).json({
          success: false,
          message: "Only donors can update blood group"
        });
      }

      user.bloodGroup = bloodGroup;
    }

    // Health information is donor-only and consent-based.
    if (
      healthInformation !== undefined ||
      healthInformationConsent !== undefined
    ) {
      if (user.role !== "donor") {
        return res.status(403).json({
          success: false,
          message: "Only donors can update health information"
        });
      }

      if (typeof healthInformationConsent !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Please provide your health information consent"
        });
      }

      if (healthInformationConsent === false) {
        user.healthInformationConsent = false;
        user.healthInformationConsentDate = null;
        user.healthInformation = undefined;
      } else {
        if (
          healthInformation !== undefined &&
          (
            healthInformation === null ||
            typeof healthInformation !== "object" ||
            Array.isArray(healthInformation)
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid health information"
          });
        }

        if (!user.healthInformationConsent) {
          user.healthInformationConsentDate = new Date();
        }

        user.healthInformationConsent = true;

        if (healthInformation !== undefined) {
          const allowedHealthFields = [
            "weight",
            "hemoglobin",
            "bloodPressureSystolic",
            "bloodPressureDiastolic",
            "hasFeverOrInfection",
            "seriousMedicalConditions",
            "recentSurgeryDate",
            "recentBloodTransfusionDate",
            "medications",
            "seriousHeartCondition",
            "bloodBorneInfectionHistory",
            "pregnancyStatus",
            "otherRestrictions"
          ];

          const safeHealthInformation = {};

          for (const field of allowedHealthFields) {
            if (
              Object.prototype.hasOwnProperty.call(
                healthInformation,
                field
              )
            ) {
              safeHealthInformation[field] =
                healthInformation[field];
            }
          }

          user.healthInformation = {
            ...(user.healthInformation?.toObject?.() || {}),
            ...safeHealthInformation
          };
        }
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        bloodGroup: user.bloodGroup,
        location: user.location,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        city: user.city,
        district: user.district,
        state: user.state,
        pincode: user.pincode,
        healthInformationConsent:
          user.role === "donor"
            ? user.healthInformationConsent
            : undefined
      }
    });

  } catch (error) {
    console.error("Profile update error:", error);

    res.status(
      error.name === "ValidationError" || error.name === "CastError"
        ? 400
        : 500
    ).json({
      success: false,
      message:
        error.name === "ValidationError" || error.name === "CastError"
          ? error.message
          : "Unable to update profile"
    });
  }
});


// UPDATE DONOR AVAILABILITY
router.patch("/availability", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid availability status"
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.role !== "donor") {
      return res.status(403).json({
        success: false,
        message: "Only donors can update availability"
      });
    }

    user.isAvailable = isAvailable;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      isAvailable: user.isAvailable
    });

  } catch (error) {
    console.error("Availability update error:", error.message);

    res.status(401).json({
      success: false,
      message: "Unable to update availability"
    });
  }
});


// GET ALL REGISTERED DONORS
router.get("/donors", async (req, res) => {
  try {
    const { bloodGroup, location } = req.query;

    const filter = {
      role: "donor"
    };

    if (bloodGroup && bloodGroup !== "All") {
      filter.bloodGroup = bloodGroup;
    }

    if (location && location.trim()) {
      filter.location = {
        $regex: location.trim(),
        $options: "i"
      };
    }

    const donors = await User.find(filter)
      .select("name bloodGroup location isAvailable");

    res.status(200).json({
      success: true,
      count: donors.length,
      donors
    });

  } catch (error) {
    console.error("Donor search error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch donor details"
    });
  }
});

module.exports = router;
