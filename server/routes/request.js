
const express = require("express");
const jwt = require("jsonwebtoken");

const BloodRequest = require("../models/BloodRequest");
const DonorConnectionRequest = require("../models/DonorConnectionRequest");

const router = express.Router();


// AUTHENTICATION HELPER
function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.userId = decoded.userId;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token"
    });
  }
}


// GENERATE REQUEST TRACKING TIMELINE
function getRequestTracking(request, donorRequests = []) {
  const status = request.status;

  const acceptedDonors = donorRequests.filter(
    (item) => item.status === "Accepted"
  );

  const pendingDonors = donorRequests.filter(
    (item) => item.status === "Pending"
  );

  const declinedDonors = donorRequests.filter(
    (item) => item.status === "Declined"
  );

  const donorConnected = acceptedDonors.length > 0;

  const steps = [
    {
      title: "Request Submitted",
      description: "Your emergency blood request has been submitted.",
      completed: true,
      date: request.createdAt
    },
    {
      title: "Request Approved",
      description: "Your request has been approved by the administrator.",
      completed: ["Approved", "Completed"].includes(status),
      date: null
    },
    {
      title: "Donor Connected",
      description: donorConnected
        ? `${acceptedDonors.length} donor(s) accepted your request.`
        : "Waiting for a donor to accept your request.",
      completed: donorConnected,
      date: donorConnected
        ? acceptedDonors[0].updatedAt
        : null
    },
    {
      title: "Donation Completed",
      description: "The donation has been completed.",
      completed: status === "Completed",
      date: status === "Completed" ? request.updatedAt : null
    }
  ];

  let currentStatus = status;
  let message = "Your blood request is awaiting approval.";

  if (status === "Cancelled") {
    currentStatus = "Cancelled";
    message = "This blood request has been cancelled.";
  } else if (status === "Completed") {
    currentStatus = "Completed";
    message = "Your blood request has been completed.";
  } else if (donorConnected) {
    currentStatus = "Donor Connected";
    message = "A donor has accepted your blood request.";
  } else if (status === "Approved") {
    currentStatus = "Approved";
    message = "Your blood request has been approved.";
  }

  return {
    currentStatus,
    message,
    steps,
    cancelled: status === "Cancelled",

    donorStatistics: {
      totalContacted: donorRequests.length,
      accepted: acceptedDonors.length,
      pending: pendingDonors.length,
      declined: declinedDonors.length
    }
  };
}


// CREATE A NEW BLOOD REQUEST
router.post("/", authenticateUser, async (req, res) => {
  try {
    const {
      patientName,
      bloodGroup,
      units,
      hospital,
      location,
      contact,
      requiredDate,
      urgency
    } = req.body;

    const newRequest = new BloodRequest({
      patientName,
      bloodGroup,
      units,
      hospital,
      location,
      contact,
      requiredDate,
      urgency,
      requestedBy: req.userId
    });

    await newRequest.save();

    res.status(201).json({
      success: true,
      message: "Blood request submitted successfully!",
      request: newRequest,
      tracking: getRequestTracking(newRequest)
    });

  } catch (error) {
    console.error("Blood request error:", error.message);

    res.status(400).json({
      success: false,
      message: "Unable to submit blood request. Please check your details."
    });
  }
});


// GET REQUESTS SUBMITTED BY LOGGED-IN USER
router.get("/my", authenticateUser, async (req, res) => {
  try {
    const requests = await BloodRequest.find({
      requestedBy: req.userId
    }).sort({ createdAt: -1 });

    // GET ALL DONOR CONNECTION REQUESTS
    const requestIds = requests.map(
      (request) => request._id
    );

    const donorRequests = await DonorConnectionRequest.find({
      bloodRequest: { $in: requestIds }
    })
      .populate("donor", "name location bloodGroup")
      .sort({ createdAt: -1 });

    // GROUP DONOR RESPONSES BY BLOOD REQUEST
    const donorRequestsMap = {};

    donorRequests.forEach((donorRequest) => {
      const requestId = donorRequest.bloodRequest.toString();

      if (!donorRequestsMap[requestId]) {
        donorRequestsMap[requestId] = [];
      }

      donorRequestsMap[requestId].push(donorRequest);
    });

    // GENERATE TRACKING INFORMATION
    const trackedRequests = requests.map((request) => {
      const requestData = request.toObject();

      const connectedDonors =
        donorRequestsMap[request._id.toString()] || [];

      return {
        ...requestData,

        tracking: getRequestTracking(
          request,
          connectedDonors
        ),

        donorConnections: connectedDonors.map((item) => ({
          _id: item._id,
          status: item.status,
          donor: item.donor,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }))
      };
    });

    res.status(200).json({
      success: true,
      count: trackedRequests.length,
      requests: trackedRequests
    });

  } catch (error) {
    console.error("Fetch requests error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch your requests"
    });
  }
});


module.exports = router;
