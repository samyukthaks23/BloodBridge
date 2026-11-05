
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const DonorConnectionRequest = require("../models/DonorConnectionRequest");
const BloodRequest = require("../models/BloodRequest");
const User = require("../models/User");
const Notification = require("../models/Notification");

const router = express.Router();


// AUTHENTICATION HELPER
function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please log in first",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}


// SEND A DIRECT REQUEST TO A DONOR
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { bloodRequestId, donorId, message } = req.body;

    if (
      !mongoose.isValidObjectId(bloodRequestId) ||
      !mongoose.isValidObjectId(donorId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request or donor ID",
      });
    }

    const bloodRequest = await BloodRequest.findOne({
      _id: bloodRequestId,
      requestedBy: req.userId,
    });

    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        message: "Emergency request not found",
      });
    }

    if (["Completed", "Cancelled"].includes(bloodRequest.status)) {
      return res.status(400).json({
        success: false,
        message: "This blood request is no longer active",
      });
    }

    const recipient = await User.findById(req.userId);

    if (!recipient || recipient.role !== "recipient") {
      return res.status(403).json({
        success: false,
        message: "Only recipients can send donor requests",
      });
    }

    const donor = await User.findOne({
      _id: donorId,
      role: "donor",
    });

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    if (!donor.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "This donor is currently unavailable",
      });
    }

    if (donor.bloodGroup !== bloodRequest.bloodGroup) {
      return res.status(400).json({
        success: false,
        message: "Donor blood group does not match this request",
      });
    }

    // PREVENT DUPLICATE PENDING OR ACCEPTED REQUESTS
    const existingRequest = await DonorConnectionRequest.findOne({
      bloodRequest: bloodRequestId,
      donor: donorId,
      status: { $in: ["Pending", "Accepted"] },
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: "A request has already been sent to this donor",
      });
    }

    // CREATE DONOR CONNECTION REQUEST
    const newConnectionRequest = new DonorConnectionRequest({
      bloodRequest: bloodRequest._id,
      recipient: recipient._id,
      donor: donor._id,
      bloodGroup: bloodRequest.bloodGroup,
      patientName: bloodRequest.patientName,
      hospital: bloodRequest.hospital,
      location: bloodRequest.location,
      contact: bloodRequest.contact,
      requiredDate: bloodRequest.requiredDate,
      units: bloodRequest.units,
      message: message || "",
    });

    await newConnectionRequest.save();

    // NOTIFY DONOR
    await Notification.create({
      user: donor._id,
      title: "New Blood Donation Request",
      message: `${recipient.name} has sent you a blood donation request for ${bloodRequest.bloodGroup} blood.`,
      type: "New Blood Request",
      bloodRequest: bloodRequest._id,
    });

    res.status(201).json({
      success: true,
      message: "Blood donation request sent successfully!",
      request: newConnectionRequest,
    });

  } catch (error) {
    console.error("Donor connection error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to send donor request",
    });
  }
});


// GET REQUESTS RECEIVED BY THE LOGGED-IN DONOR
router.get("/received", authenticateUser, async (req, res) => {
  try {
    const donor = await User.findById(req.userId);

    if (!donor || donor.role !== "donor") {
      return res.status(403).json({
        success: false,
        message: "Only donors can view received requests",
      });
    }

    const requests = await DonorConnectionRequest.find({
      donor: req.userId,
    })
      .populate("recipient", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });

  } catch (error) {
    console.error("Received requests error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch received requests",
    });
  }
});


// ACCEPT OR DECLINE A DONOR REQUEST
router.patch("/:id/respond", authenticateUser, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid donor connection request ID",
      });
    }

    const donor = await User.findById(req.userId);

    if (!donor || donor.role !== "donor") {
      return res.status(403).json({
        success: false,
        message: "Only donors can respond to requests",
      });
    }

    const { status } = req.body;

    if (!["Accepted", "Declined"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Choose Accepted or Declined",
      });
    }

    const request = await DonorConnectionRequest.findOne({
      _id: req.params.id,
      donor: req.userId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "You have already responded to this request",
      });
    }

    // CHECK WHETHER THE ORIGINAL BLOOD REQUEST IS STILL ACTIVE
    const bloodRequest = await BloodRequest.findById(
      request.bloodRequest
    );

    if (
      status === "Accepted" &&
      (!bloodRequest ||
        ["Completed", "Cancelled"].includes(bloodRequest.status))
    ) {
      return res.status(400).json({
        success: false,
        message: "This blood request is no longer active",
      });
    }

    // UPDATE DONOR RESPONSE
    request.status = status;
    await request.save();

    // NOTIFY RECIPIENT
    await Notification.create({
      user: request.recipient,
      title:
        status === "Accepted"
          ? "Donor Accepted Your Request"
          : "Donor Declined Your Request",

      message:
        status === "Accepted"
          ? `${donor.name} has accepted your blood donation request.`
          : `${donor.name} has declined your blood donation request. You can search for another donor.`,

      type:
        status === "Accepted"
          ? "Request Accepted"
          : "Request Declined",

      bloodRequest: request.bloodRequest,
    });

    res.status(200).json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`,
      request,
    });

  } catch (error) {
    console.error("Respond request error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to update request status",
    });
  }
});


// GET DONOR RESPONSES FOR THE LOGGED-IN RECIPIENT
router.get("/sent", authenticateUser, async (req, res) => {
  try {
    const recipient = await User.findById(req.userId);

    if (!recipient || recipient.role !== "recipient") {
      return res.status(403).json({
        success: false,
        message: "Only recipients can view sent requests",
      });
    }

    const requests = await DonorConnectionRequest.find({
      recipient: req.userId,
    })
      .populate("donor", "name location bloodGroup")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });

  } catch (error) {
    console.error("Sent requests error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch donor responses",
    });
  }
});


module.exports = router;
