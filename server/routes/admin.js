
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const BloodRequest = require("../models/BloodRequest");
const Donation = require("../models/Donation");

const router = express.Router();

// ESCAPE SPECIAL CHARACTERS IN SEARCH TEXT
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// VERIFY ADMIN ACCESS
const verifyAdmin = async (req, res, next) => {
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

    const admin = await User.findById(decoded.userId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    req.adminId = admin._id;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};


// GET ALL DONORS - ADMIN ONLY
router.get("/donors", verifyAdmin, async (req, res) => {
  try {
    const { search, bloodGroup, availability } = req.query;

    const filter = {
      role: "donor"
    };

    if (search && search.trim()) {
      const searchRegex = new RegExp(
        escapeRegex(search.trim()),
        "i"
      );

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { location: searchRegex }
      ];
    }

    if (bloodGroup && bloodGroup !== "All") {
      filter.bloodGroup = bloodGroup;
    }

    if (availability === "Available") {
      filter.isAvailable = true;
    } else if (availability === "Unavailable") {
      filter.isAvailable = false;
    }

    const donors = await User.find(filter)
      .select(
        "name email phone bloodGroup location isAvailable city district state donationCount lastDonationDate createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: donors.length,
      donors
    });

  } catch (error) {
    console.error("Admin donor fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch donor records"
    });
  }
});


// GET ALL BLOOD REQUESTS - ADMIN ONLY
router.get("/blood-requests", verifyAdmin, async (req, res) => {
  try {
    const { search, bloodGroup, urgency, status } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(
        escapeRegex(search.trim()),
        "i"
      );

      filter.$or = [
        { patientName: searchRegex },
        { hospital: searchRegex },
        { location: searchRegex },
        { contact: searchRegex }
      ];
    }

    if (bloodGroup && bloodGroup !== "All") {
      filter.bloodGroup = bloodGroup;
    }

    if (urgency && urgency !== "All") {
      filter.urgency = urgency;
    }

    if (status && status !== "All") {
      filter.status = status;
    }

    const requests = await BloodRequest.find(filter)
      .populate("requestedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    console.error("Admin blood request fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch blood requests"
    });
  }
});


// UPDATE BLOOD REQUEST STATUS - ADMIN ONLY
router.patch("/blood-requests/:id/status", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Approved",
      "Completed",
      "Cancelled"
    ];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blood request ID"
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request status"
      });
    }

    const updatedRequest = await BloodRequest.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true
      }
    ).populate("requestedBy", "name email");

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Blood request status updated successfully",
      request: updatedRequest
    });

  } catch (error) {
    console.error("Admin blood request status update error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update blood request status"
    });
  }
});


// CREATE A COMPLETED DONATION RECORD - ADMIN ONLY
router.post("/donations", verifyAdmin, async (req, res) => {
  try {
    const {
      donorId,
      donationDate,
      location,
      bloodBank,
      relatedBloodRequest
    } = req.body;

    if (!donorId || !donationDate || !location || !bloodBank) {
      return res.status(400).json({
        success: false,
        message: "Please provide donor, donation date, location and blood bank."
      });
    }

    if (!mongoose.Types.ObjectId.isValid(donorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid donor ID."
      });
    }

    const parsedDate = new Date(donationDate);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate > new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid donation date that is not in the future."
      });
    }

    const donor = await User.findOne({
      _id: donorId,
      role: "donor"
    }).select("name bloodGroup");

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found."
      });
    }

    if (!donor.bloodGroup) {
      return res.status(400).json({
        success: false,
        message: "Donor blood group is not available."
      });
    }

    let requestId;

    if (relatedBloodRequest) {
      if (!mongoose.Types.ObjectId.isValid(relatedBloodRequest)) {
        return res.status(400).json({
          success: false,
          message: "Invalid blood request ID."
        });
      }

      const request = await BloodRequest.findById(relatedBloodRequest);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Related blood request not found."
        });
      }

      requestId = request._id;
    }

    // CHECK FOR AN EXISTING DONATION ON THE SAME DATE
    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(parsedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingDonation = await Donation.findOne({
      donor: donor._id,
      donationDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (existingDonation) {
      return res.status(409).json({
        success: false,
        message: "A donation record already exists for this donor on this date."
      });
    }

    // CREATE DONATION RECORD
    const donation = await Donation.create({
      donor: donor._id,
      donorName: donor.name,
      bloodGroup: donor.bloodGroup,
      donationDate: parsedDate,
      location: location.trim(),
      bloodBank: bloodBank.trim(),
      status: "Completed",
      verificationStatus: "Pending",
      relatedBloodRequest: requestId,
      recordedBy: req.adminId
    });

    res.status(201).json({
      success: true,
      message: "Donation record created successfully. Awaiting verification.",
      donation
    });

  } catch (error) {
    console.error("Create Donation Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create donation record."
    });
  }
});


// GET ALL DONATION RECORDS - ADMIN ONLY
router.get("/donations", verifyAdmin, async (req, res) => {
  try {
    const {
      search,
      bloodGroup,
      status,
      verificationStatus
    } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(
        escapeRegex(search.trim()),
        "i"
      );

      filter.$or = [
        { donorName: searchRegex },
        { location: searchRegex },
        { bloodBank: searchRegex }
      ];
    }

    if (bloodGroup && bloodGroup !== "All") {
      filter.bloodGroup = bloodGroup;
    }

    if (status && status !== "All") {
      filter.status = status;
    }

    if (
      verificationStatus &&
      verificationStatus !== "All"
    ) {
      filter.verificationStatus = verificationStatus;
    }

    const donations = await Donation.find(filter)
      .populate("donor", "name email phone location")
      .populate("recordedBy", "name email")
      .populate("verifiedBy", "name email")
      .sort({ donationDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: donations.length,
      donations
    });

  } catch (error) {
    console.error("Admin donation fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch donation records"
    });
  }
});


// VERIFY A COMPLETED DONATION - ADMIN ONLY
router.patch("/donations/:id/verify", verifyAdmin, async (req, res) => {
  let session;

  try {
    const { id } = req.params;
    const notes = String(req.body.notes || "").trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid donation ID"
      });
    }

    if (notes.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Verification notes cannot exceed 500 characters"
      });
    }

    session = await mongoose.startSession();

    const verificationTime = new Date();
    let verifiedDonationId;

    await session.withTransaction(async () => {
      const donation = await Donation.findById(id).session(session);

      if (!donation) {
        const error = new Error("Donation record not found");
        error.statusCode = 404;
        throw error;
      }

      if (donation.status !== "Completed") {
        const error = new Error(
          "Only completed donations can be verified"
        );
        error.statusCode = 400;
        throw error;
      }

      if (
        donation.verificationStatus !== "Pending" ||
        donation.donorCountedAt
      ) {
        const error = new Error(
          "This donation has already been processed"
        );
        error.statusCode = 409;
        throw error;
      }

      const updatedDonation = await Donation.findOneAndUpdate(
        {
          _id: id,
          status: "Completed",
          verificationStatus: "Pending",
          donorCountedAt: null
        },
        {
          $set: {
            verificationStatus: "Verified",
            verifiedBy: req.adminId,
            verifiedAt: verificationTime,
            verificationNotes: notes,
            donorCountedAt: verificationTime
          }
        },
        {
          new: true,
          runValidators: true,
          session
        }
      );

      if (!updatedDonation) {
        const error = new Error(
          "This donation has already been processed"
        );
        error.statusCode = 409;
        throw error;
      }

      const updatedDonor = await User.findByIdAndUpdate(
        updatedDonation.donor,
        {
          $inc: { donationCount: 1 },
          $max: {
            lastDonationDate: updatedDonation.donationDate
          }
        },
        {
          new: true,
          session
        }
      );

      if (!updatedDonor) {
        const error = new Error("Donor account not found");
        error.statusCode = 404;
        throw error;
      }

      verifiedDonationId = updatedDonation._id;
    });

    const result = await Donation.findById(verifiedDonationId)
      .populate(
        "donor",
        "name email bloodGroup donationCount lastDonationDate"
      )
      .populate("verifiedBy", "name email")
      .lean();

    res.status(200).json({
      success: true,
      message: "Donation verified successfully",
      donation: result
    });

  } catch (error) {
    console.error("Donation verification error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Unable to verify donation"
    });

  } finally {
    if (session) {
      await session.endSession();
    }
  }
});


// REJECT A DONATION - ADMIN ONLY
router.patch("/donations/:id/reject", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const notes = String(req.body.notes || "").trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid donation ID"
      });
    }

    if (notes.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Rejection notes cannot exceed 500 characters"
      });
    }

    const rejectedDonation = await Donation.findOneAndUpdate(
      {
        _id: id,
        verificationStatus: "Pending",
        donorCountedAt: null
      },
      {
        $set: {
          verificationStatus: "Rejected",
          verifiedBy: req.adminId,
          verifiedAt: new Date(),
          verificationNotes: notes
        }
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate("donor", "name email bloodGroup")
      .populate("verifiedBy", "name email");

    if (!rejectedDonation) {
      return res.status(404).json({
        success: false,
        message: "Pending donation not found or already processed"
      });
    }

    res.status(200).json({
      success: true,
      message: "Donation rejected successfully",
      donation: rejectedDonation
    });

  } catch (error) {
    console.error("Donation rejection error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to reject donation"
    });
  }
});

module.exports = router;
