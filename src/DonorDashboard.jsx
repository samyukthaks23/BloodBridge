
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./DonorDashboard.css";

function DonorDashboard() {
  const navigate = useNavigate();

  const [donor, setDonor] = useState(null);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [respondingTo, setRespondingTo] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  // Notification unread count
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch donor profile
  useEffect(() => {
    async function fetchDonorProfile() {
      const token = localStorage.getItem("bloodBridgeToken");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          localStorage.removeItem("bloodBridgeToken");
          localStorage.removeItem("bloodBridgeUser");
          navigate("/login", { replace: true });
          return;
        }

        if (data.user.role !== "donor") {
          navigate("/", { replace: true });
          return;
        }

        setDonor(data.user);
        setAvailable(data.user.isAvailable);

        await fetchIncomingRequests(token);
      } catch (error) {
        console.error("Profile fetching error:", error);
        setError("Unable to load your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchDonorProfile();
  }, [navigate]);

  // Fetch incoming donor requests
  async function fetchIncomingRequests(token) {
    try {
      setRequestsLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/donor-requests/received",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch requests");
      }

      setRequests(data.requests || []);
    } catch (error) {
      console.error("Incoming requests error:", error);
      setRequestMessage(error.message);
    } finally {
      setRequestsLoading(false);
    }
  }

  // Fetch unread notification count automatically
  useEffect(() => {
    async function fetchUnreadNotifications() {
      const token = localStorage.getItem("bloodBridgeToken");

      if (!token) return;

      try {
        const response = await fetch(
          "http://localhost:5000/api/notifications",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (response.ok) {
          const unread = (data.notifications || []).filter(
            (item) => !item.isRead
          ).length;

          setUnreadCount(unread);
        }
      } catch (error) {
        console.error("Notification count error:", error);
      }
    }

    fetchUnreadNotifications();

    const interval = setInterval(fetchUnreadNotifications, 5000);

    return () => clearInterval(interval);
  }, []);

  // Accept or decline a donor request
  async function handleRespond(requestId, status) {
    const token = localStorage.getItem("bloodBridgeToken");

    try {
      setRespondingTo(requestId);
      setRequestMessage("");

      const response = await fetch(
        `http://localhost:5000/api/donor-requests/${requestId}/respond`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update request");
      }

      setRequests((previousRequests) =>
        previousRequests.map((request) =>
          request._id === requestId
            ? { ...request, status: data.request.status }
            : request
        )
      );

      setRequestMessage(`Request ${status.toLowerCase()} successfully!`);
    } catch (error) {
      console.error("Request response error:", error);
      setRequestMessage(error.message);
    } finally {
      setRespondingTo("");
    }
  }

  // Update donor availability
  async function handleAvailability() {
    const token = localStorage.getItem("bloodBridgeToken");
    const newAvailability = !available;

    setMessage("");

    try {
      setAvailabilityLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/availability",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            isAvailable: newAvailability
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to update availability.");
        return;
      }

      setAvailable(data.isAvailable);

      setDonor((previousDonor) => ({
        ...previousDonor,
        isAvailable: data.isAvailable
      }));

      setMessage("Availability updated successfully!");
    } catch (error) {
      console.error("Availability error:", error);
      setMessage("Server connection failed. Please try again.");
    } finally {
      setAvailabilityLoading(false);
    }
  }

  // Logout
  function handleLogout() {
    localStorage.removeItem("bloodBridgeToken");
    localStorage.removeItem("bloodBridgeUser");
    navigate("/login", { replace: true });
  }

  const pendingCount = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const acceptedCount = requests.filter(
    (request) => request.status === "Accepted"
  ).length;

  const declinedCount = requests.filter(
    (request) => request.status === "Declined"
  ).length;

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-heart">♥</div>
        <h2>Preparing your dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-loading">
        <h2>{error}</h2>
        <button onClick={handleLogout}>Go to Login</button>
      </div>
    );
  }

  if (!donor) return null;

  return (
    <div className="dashboard">

      {/* NAVIGATION */}
      <header className="dashboard-header">
        <Link to="/" className="dashboard-logo">
          <span className="logo-icon">♥</span>
          BloodBridge
        </Link>

        <nav className="dashboard-nav">
          <Link to="/">Home</Link>

          <a href="#incoming-requests">My Requests</a>

          <Link to="/notifications" className="dashboard-notification-link">
            <span>🔔 Notifications</span>

            {unreadCount > 0 && (
              <span className="dashboard-notification-count">
                {unreadCount}
              </span>
            )}
          </Link>

          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      <main className="dashboard-main">

        {/* WELCOME BANNER */}
        <section className="welcome-section">
          <div className="welcome-content">
            <span className="welcome-tag">DONOR DASHBOARD</span>

            <h1>Welcome back, {donor.name}!</h1>

            <p>
              Every donation is a chance to save a life.
              Thank you for being a part of BloodBridge.
            </p>

            <div className="welcome-status">
              <span className={available ? "live-dot" : "live-dot inactive"}></span>
              You are currently {available ? "available" : "unavailable"}
            </div>
          </div>

          <div className="welcome-blood">
            <span className="blood-drop">♥</span>
            <strong>{donor.bloodGroup || "N/A"}</strong>
            <small>YOUR BLOOD GROUP</small>
          </div>

          <div className="welcome-decoration">♥</div>
        </section>

        {/* STATISTICS */}
        <section className="donor-stats">
          <article className="stat-card stat-total">
            <div className="stat-icon">📨</div>
            <div>
              <h2>{requests.length}</h2>
              <p>Total Requests</p>
            </div>
          </article>

          <article className="stat-card stat-pending">
            <div className="stat-icon">⏳</div>
            <div>
              <h2>{pendingCount}</h2>
              <p>Pending Requests</p>
            </div>
          </article>

          <article className="stat-card stat-accepted">
            <div className="stat-icon">✓</div>
            <div>
              <h2>{acceptedCount}</h2>
              <p>Accepted Requests</p>
            </div>
          </article>

          <article className="stat-card stat-declined">
            <div className="stat-icon">↩</div>
            <div>
              <h2>{declinedCount}</h2>
              <p>Declined Requests</p>
            </div>
          </article>
        </section>

        {/* DONOR INFORMATION AND AVAILABILITY */}
        <section className="dashboard-middle">

          <article className="profile-card">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">YOUR INFORMATION</span>
                <h2>Donor Profile</h2>
              </div>
              <span className="profile-symbol">👤</span>
            </div>

            <div className="profile-avatar">
              {donor.name?.charAt(0).toUpperCase()}
            </div>

            <h3>{donor.name}</h3>
            <p className="profile-role">Registered Blood Donor</p>

            <div className="profile-detail">
              <span>🩸 Blood Group</span>
              <strong>{donor.bloodGroup || "Not provided"}</strong>
            </div>

            <div className="profile-detail">
              <span>📍 Location</span>
              <strong>{donor.location || "Not provided"}</strong>
            </div>

            <div className="profile-detail">
              <span>✉ Email</span>
              <strong>{donor.email || "Not provided"}</strong>
            </div>
          </article>

          <article className="availability-card">
            <span className="availability-icon">♥</span>

            <span className="section-eyebrow">DONATION STATUS</span>
            <h2>Manage Your Availability</h2>

            <p>
              Turn your availability on when you are ready
              to receive donation requests from recipients.
            </p>

            <div className={`availability-status ${available ? "is-available" : "is-unavailable"}`}>
              <span></span>
              {available ? "You are available to donate" : "You are currently unavailable"}
            </div>

            <button
              className={`availability-button ${available ? "turn-off" : "turn-on"}`}
              onClick={handleAvailability}
              disabled={availabilityLoading}
            >
              {availabilityLoading
                ? "Updating..."
                : available
                  ? "Mark as Unavailable"
                  : "Become Available"}
            </button>

            {message && <p className="dashboard-feedback">{message}</p>}
          </article>

        </section>

        {/* INCOMING REQUESTS */}
        <section className="incoming-requests" id="incoming-requests">

          <div className="incoming-heading">
            <div>
              <span className="section-eyebrow">RESPOND AND MAKE A DIFFERENCE</span>
              <h2>Incoming Donation Requests</h2>
              <p>Review requests from people who need your help.</p>
            </div>

            <span className="request-count">
              {requests.length} {requests.length === 1 ? "Request" : "Requests"}
            </span>
          </div>

          {requestMessage && (
            <p className="dashboard-feedback">{requestMessage}</p>
          )}

          {requestsLoading ? (
            <div className="empty-requests">
              <p>Loading incoming requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-requests">
              <div className="empty-icon">📨</div>
              <h3>No incoming requests yet</h3>
              <p>
                When a recipient sends you a donation request,
                it will appear here.
              </p>
            </div>
          ) : (
            <div className="incoming-request-grid">
              {requests.map((request) => (
                <article className="incoming-request-card" key={request._id}>

                  <div className="request-card-heading">
                    <span className="find-blood-badge">
                      {request.bloodGroup}
                    </span>

                    <span className={`request-status ${request.status.toLowerCase()}`}>
                      {request.status}
                    </span>
                  </div>

                  <h3 className="patient-name">{request.patientName}</h3>
                  <p className="request-subtitle">Blood donation request</p>

                  <div className="request-details">
                    <p>
                      <span>Recipient</span>
                      <strong>{request.recipient?.name || "Recipient"}</strong>
                    </p>
                    <p>
                      <span>Hospital</span>
                      <strong>{request.hospital}</strong>
                    </p>
                    <p>
                      <span>Location</span>
                      <strong>{request.location}</strong>
                    </p>
                    <p>
                      <span>Units required</span>
                      <strong>{request.units} unit(s)</strong>
                    </p>
                    <p>
                      <span>Required date</span>
                      <strong>
                        {new Date(request.requiredDate).toLocaleDateString()}
                      </strong>
                    </p>
                  </div>

                  {request.message && (
                    <div className="recipient-message">
                      <span>Recipient's message</span>
                      <p>{request.message}</p>
                    </div>
                  )}

                  {request.status === "Pending" ? (
                    <div className="request-actions">
                      <button
                        type="button"
                        className="accept-button"
                        onClick={() => handleRespond(request._id, "Accepted")}
                        disabled={respondingTo === request._id}
                      >
                        {respondingTo === request._id ? "Updating..." : "✓ Accept Request"}
                      </button>

                      <button
                        type="button"
                        className="decline-button"
                        onClick={() => handleRespond(request._id, "Declined")}
                        disabled={respondingTo === request._id}
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div className="response-complete">
                      {request.status === "Accepted"
                        ? "✓ You accepted this request"
                        : "You declined this request"}
                    </div>
                  )}

                </article>
              ))}
            </div>
          )}
        </section>

        {/* SAFETY INFORMATION */}
        <section className="safety-banner">
          <span className="safety-icon">🛡️</span>
          <div>
            <h3>Donate safely. Save lives.</h3>
            <p>
              Confirm your eligibility and donation arrangements
              with a licensed blood bank or healthcare professional.
            </p>
          </div>
        </section>

        <footer className="dashboard-footer">
          <p>© 2026 BloodBridge · Every drop counts. Every life matters.</p>
        </footer>

      </main>
    </div>
  );
}

export default DonorDashboard;
