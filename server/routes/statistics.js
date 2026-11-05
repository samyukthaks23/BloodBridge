
const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const BloodRequest = require("../models/BloodRequest");
const Donation = require("../models/Donation");

const router = express.Router();

// ADMIN AUTHENTICATION MIDDLEWARE
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

    req.admin = admin;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};


// GET ADMIN DASHBOARD OVERVIEW
router.get("/overview", verifyAdmin, async (req, res) => {
  try {
    const [
      totalDonors,
      totalRecipients,
      pendingRequests,
      verifiedDonations
    ] = await Promise.all([
      User.countDocuments({ role: "donor" }),

      User.countDocuments({ role: "recipient" }),

      BloodRequest.countDocuments({ status: "Pending" }),

      Donation.countDocuments({
        status: "Completed",
        verificationStatus: "Verified"
      })
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        totalDonors,
        totalRecipients,
        pendingRequests,
        verifiedDonations
      }
    });

  } catch (error) {
    console.error("Statistics Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics"
    });
  }
});


// GET MONTHLY REPORT
router.get("/monthly-report", verifyAdmin, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const requestedYear = Number(req.query.year || currentYear);

    if (
      !Number.isInteger(requestedYear) ||
      requestedYear < 2000 ||
      requestedYear > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid year"
      });
    }

    const startDate = new Date(Date.UTC(requestedYear, 0, 1));
    const endDate = new Date(Date.UTC(requestedYear + 1, 0, 1));

    // FETCH OVERALL STATISTICS
    const [
      totalDonors,
      totalRecipients,
      pendingRequests,
      totalDonations,
      verifiedDonations,
      rejectedDonations,
      pendingDonations
    ] = await Promise.all([
      User.countDocuments({ role: "donor" }),

      User.countDocuments({ role: "recipient" }),

      BloodRequest.countDocuments({ status: "Pending" }),

      Donation.countDocuments({
        donationDate: {
          $gte: startDate,
          $lt: endDate
        }
      }),

      Donation.countDocuments({
        donationDate: {
          $gte: startDate,
          $lt: endDate
        },
        status: "Completed",
        verificationStatus: "Verified"
      }),

      Donation.countDocuments({
        donationDate: {
          $gte: startDate,
          $lt: endDate
        },
        verificationStatus: "Rejected"
      }),

      Donation.countDocuments({
        donationDate: {
          $gte: startDate,
          $lt: endDate
        },
        verificationStatus: "Pending"
      })
    ]);

    // MONTH-WISE DONATION STATISTICS
    const monthlyData = await Donation.aggregate([
      {
        $match: {
          donationDate: {
            $gte: startDate,
            $lt: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            $month: "$donationDate"
          },
          total: { $sum: 1 },
          verified: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Completed"] },
                    { $eq: ["$verificationStatus", "Verified"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          rejected: {
            $sum: {
              $cond: [
                { $eq: ["$verificationStatus", "Rejected"] },
                1,
                0
              ]
            }
          },
          pending: {
            $sum: {
              $cond: [
                { $eq: ["$verificationStatus", "Pending"] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // INCLUDE ALL 12 MONTHS
    const monthNames = [
      "January", "February", "March", "April",
      "May", "June", "July", "August",
      "September", "October", "November", "December"
    ];

    const monthlyDonations = monthNames.map((month, index) => {
      const existingMonth = monthlyData.find(
        (item) => item._id === index + 1
      );

      return {
        month,
        total: existingMonth?.total || 0,
        verified: existingMonth?.verified || 0,
        rejected: existingMonth?.rejected || 0,
        pending: existingMonth?.pending || 0
      };
    });

    // BLOOD GROUP STATISTICS
    const bloodGroupData = await Donation.aggregate([
      {
        $match: {
          donationDate: {
            $gte: startDate,
            $lt: endDate
          }
        }
      },
      {
        $group: {
          _id: "$bloodGroup",
          total: { $sum: 1 },
          verified: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Completed"] },
                    { $eq: ["$verificationStatus", "Verified"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          rejected: {
            $sum: {
              $cond: [
                { $eq: ["$verificationStatus", "Rejected"] },
                1,
                0
              ]
            }
          },
          pending: {
            $sum: {
              $cond: [
                { $eq: ["$verificationStatus", "Pending"] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      year: requestedYear,

      summary: {
        totalDonors,
        totalRecipients,
        pendingRequests,
        totalDonations,
        verifiedDonations,
        rejectedDonations,
        pendingDonations
      },

      monthlyDonations,

      bloodGroupStatistics: bloodGroupData.map((item) => ({
        bloodGroup: item._id,
        total: item.total,
        verified: item.verified,
        rejected: item.rejected,
        pending: item.pending
      }))
    });

  } catch (error) {
    console.error("Monthly Report Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate monthly report"
    });
  }
});

module.exports = router;
