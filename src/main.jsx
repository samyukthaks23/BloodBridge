
import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import App from "./App.jsx";
import Login from "./Login.jsx";
import Register from "./Register.jsx";

import DonorDashboard from "./DonorDashboard.jsx";
import RecipientDashboard from "./RecipientDashboard.jsx";
import EmergencyRequest from "./EmergencyRequest.jsx";
import FindDonors from "./FindDonors.jsx";
import Notifications from "./Notifications.jsx";

import AdminDashboard from "./AdminDashboard.jsx";
import DonorManagement from "./DonorManagement.jsx";
import AdminBloodRequests from "./AdminBloodRequests.jsx";
import AdminDonationVerification from "./AdminDonationVerification.jsx";
import RecordDonation from "./RecordDonation.jsx";
import AdminMonthlyReports from "./AdminMonthlyReports.jsx";

import ProtectedRoute from "./ProtectedRoute.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/find-donors" element={<FindDonors />} />

        {/* DONOR ROUTES */}
        <Route element={<ProtectedRoute allowedRole="donor" />}>
          <Route
            path="/donor-dashboard"
            element={<DonorDashboard />}
          />
        </Route>

        {/* RECIPIENT ROUTES */}
        <Route element={<ProtectedRoute allowedRole="recipient" />}>
          <Route
            path="/recipient-dashboard"
            element={<RecipientDashboard />}
          />
        </Route>

        {/* AUTHENTICATED USER ROUTES */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/emergency-request"
            element={<EmergencyRequest />}
          />

          <Route
            path="/notifications"
            element={<Notifications />}
          />
        </Route>

        {/* ADMIN ROUTES */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>

          <Route
            path="/admin-dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin-donors"
            element={<DonorManagement />}
          />

          <Route
            path="/admin-blood-requests"
            element={<AdminBloodRequests />}
          />

          <Route
            path="/admin-donations"
            element={<AdminDonationVerification />}
          />

          <Route
            path="/admin-record-donation"
            element={<RecordDonation />}
          />

          <Route
            path="/admin-monthly-reports"
            element={<AdminMonthlyReports />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
