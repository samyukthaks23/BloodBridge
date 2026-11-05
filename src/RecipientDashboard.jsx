
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./RecipientDashboard.css";

function RecipientDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [donorRequests, setDonorRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [donorRequestError, setDonorRequestError] = useState("");

  const token = localStorage.getItem("bloodBridgeToken");

  // LOAD RECIPIENT DASHBOARD
  useEffect(() => {
    async function loadDashboard() {
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const profileResponse = await fetch(
          "http://localhost:5000/api/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const profileData = await profileResponse.json();

        if (!profileResponse.ok) {
          throw new Error(
            profileData.message || "Unable to load profile"
          );
        }

        if (profileData.user.role !== "recipient") {
          setError("This dashboard is only for recipient accounts.");
          return;
        }

        setUser(profileData.user);

        // LOAD EMERGENCY REQUEST HISTORY
        try {
          const requestResponse = await fetch(
            "http://localhost:5000/api/requests/my",
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          const requestData = await requestResponse.json();

          if (!requestResponse.ok) {
            throw new Error(
              requestData.message || "Unable to load requests"
            );
          }

          setRequests(requestData.requests || []);

        } catch (requestError) {
          console.error("Request history error:", requestError);

          setRequestError(
            "Unable to load your emergency request history."
          );
        }

        // LOAD DONOR RESPONSES
        try {
          const donorResponse = await fetch(
            "http://localhost:5000/api/donor-requests/sent",
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          const donorData = await donorResponse.json();

          if (!donorResponse.ok) {
            throw new Error(
              donorData.message || "Unable to load donor responses"
            );
          }

          setDonorRequests(donorData.requests || []);

        } catch (donorError) {
          console.error("Donor response error:", donorError);

          setDonorRequestError(
            "Unable to load donor responses. Please try again."
          );
        }

      } catch (error) {
        console.error("Recipient dashboard error:", error);
        setError(error.message);

      } finally {
        setLoading(false);
      }
    }

    loadDashboard();

  }, [token, navigate]);


  // AUTOMATICALLY FETCH UNREAD NOTIFICATIONS
  useEffect(() => {
    async function fetchUnreadNotifications() {
      const currentToken = localStorage.getItem(
        "bloodBridgeToken"
      );

      if (!currentToken) return;

      try {
        const response = await fetch(
          "http://localhost:5000/api/notifications",
          {
            headers: {
              Authorization: `Bearer ${currentToken}`
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

    const interval = setInterval(
      fetchUnreadNotifications,
      5000
    );

    return () => clearInterval(interval);

  }, []);


  // LOGOUT
  function handleLogout() {
    localStorage.removeItem("bloodBridgeToken");
    localStorage.removeItem("bloodBridgeUser");

    navigate("/login", { replace: true });
  }


  // FORMAT DATE
  function formatDate(date) {
    if (!date) return "Not specified";

    return new Date(date).toLocaleDateString("en-IN");
  }


  // FORMAT STATUS CLASS
  function getStatusClass(status) {
    return (status || "Pending")
      .toLowerCase()
      .replace(/\s+/g, "-");
  }


  // REQUEST STATISTICS
  const pendingRequests = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const completedRequests = requests.filter(
    (request) => request.status === "Completed"
  ).length;

  const acceptedResponses = donorRequests.filter(
    (request) => request.status === "Accepted"
  ).length;

  const pendingResponses = donorRequests.filter(
    (request) => request.status === "Pending"
  ).length;


  // TRACKING STEP ICON
  function getTrackingIcon(completed) {
    return completed ? "✓" : "○";
  }


  // LOADING SCREEN
  if (loading) {
    return (
      <div className="recipient-loading">
        <div className="recipient-loading-heart">♥</div>
        <h2>Preparing your dashboard...</h2>
      </div>
    );
  }


  // ERROR SCREEN
  if (error) {
    return (
      <div className="recipient-loading">
        <h2>Unable to load dashboard</h2>
        <p>{error}</p>

        <button onClick={handleLogout}>
          Login Again
        </button>
      </div>
    );
  }

  if (!user) return null;


  return (
    <div className="recipient-dashboard">

      {/* NAVIGATION */}
      <header className="recipient-header">

        <Link to="/" className="recipient-logo">
          <span>♥</span>
          BloodBridge
        </Link>

        <nav className="recipient-nav">

          <Link to="/">Home</Link>

          <a href="#my-blood-requests">
            My Requests
          </a>

          <a href="#emergency-tracking">
            Request Tracking
          </a>

          <a href="#donor-responses">
            Donor Responses
          </a>

          <Link
            to="/notifications"
            className="recipient-notification-link"
          >
            <span>🔔 Notifications</span>

            {unreadCount > 0 && (
              <span className="recipient-notification-count">
                {unreadCount}
              </span>
            )}
          </Link>

          <button onClick={handleLogout}>
            Logout
          </button>

        </nav>
      </header>


      <main className="recipient-main">

        {/* WELCOME BANNER */}
        <section className="recipient-welcome">

          <div className="recipient-welcome-content">

            <span className="recipient-welcome-tag">
              RECIPIENT DASHBOARD
            </span>

            <h1>Welcome back, {user.name}!</h1>

            <p>
              Your journey to finding the right blood donor
              starts here. Track your requests and donor responses.
            </p>

            <div className="recipient-welcome-actions">

              <Link to="/emergency-request">
                + Create Blood Request
              </Link>

              <a href="#my-blood-requests">
                View My Requests →
              </a>

            </div>

          </div>

          <div className="recipient-welcome-icon">
            ♥
          </div>

          <div className="recipient-welcome-decoration">
            +
          </div>

        </section>


        {/* STATISTICS */}
        <section className="recipient-stats">

          <article className="recipient-stat-card">
            <div className="recipient-stat-icon">🩸</div>

            <div>
              <h2>{requests.length}</h2>
              <p>Total Blood Requests</p>
            </div>
          </article>


          <article className="recipient-stat-card">
            <div className="recipient-stat-icon pending-icon">
              ⏳
            </div>

            <div>
              <h2>{pendingRequests}</h2>
              <p>Pending Requests</p>
            </div>
          </article>


          <article className="recipient-stat-card">
            <div className="recipient-stat-icon accepted-icon">
              ✓
            </div>

            <div>
              <h2>{acceptedResponses}</h2>
              <p>Accepted Donor Responses</p>
            </div>
          </article>


          <article className="recipient-stat-card">
            <div className="recipient-stat-icon completed-icon">
              ♥
            </div>

            <div>
              <h2>{completedRequests}</h2>
              <p>Completed Requests</p>
            </div>
          </article>

        </section>


        {/* PROFILE AND RESPONSE OVERVIEW */}
        <section className="recipient-overview">

          <article className="recipient-profile">

            <div className="recipient-card-heading">

              <div>
                <span className="recipient-eyebrow">
                  ACCOUNT DETAILS
                </span>

                <h2>Your Profile</h2>
              </div>

              <span className="recipient-profile-symbol">
                👤
              </span>

            </div>

            <div className="recipient-profile-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>

            <h3>{user.name}</h3>

            <p className="recipient-profile-role">
              Registered Recipient
            </p>

            <div className="recipient-profile-detail">
              <span>✉ Email</span>
              <strong>{user.email || "Not provided"}</strong>
            </div>

            <div className="recipient-profile-detail">
              <span>☎ Phone</span>
              <strong>{user.phone || "Not provided"}</strong>
            </div>

            <div className="recipient-profile-detail">
              <span>📍 Location</span>
              <strong>{user.location || "Not provided"}</strong>
            </div>

            <div className="recipient-profile-detail">
              <span>Account type</span>
              <strong>Recipient</strong>
            </div>

          </article>


          <article className="recipient-response-overview">

            <span className="recipient-overview-icon">
              📨
            </span>

            <span className="recipient-eyebrow">
              DONOR CONNECTIONS
            </span>

            <h2>Your Donor Responses</h2>

            <p>
              Follow the responses received from donors
              who you have contacted.
            </p>

            <div className="response-overview-numbers">

              <div>
                <strong>{donorRequests.length}</strong>
                <span>Total Responses</span>
              </div>

              <div>
                <strong>{pendingResponses}</strong>
                <span>Awaiting Response</span>
              </div>

              <div>
                <strong>{acceptedResponses}</strong>
                <span>Accepted</span>
              </div>

            </div>

            <a
              href="#donor-responses"
              className="recipient-view-responses"
            >
              View Donor Responses →
            </a>

          </article>

        </section>


        {/* EMERGENCY REQUEST HISTORY */}
        <section
          className="recipient-request-section"
          id="my-blood-requests"
        >

          <div className="recipient-section-heading">

            <div>
              <span className="recipient-eyebrow">
                REQUEST MANAGEMENT
              </span>

              <h2>My Blood Requests</h2>

              <p>
                Track your submitted emergency blood requests.
              </p>
            </div>

            <Link
              to="/emergency-request"
              className="recipient-new-request"
            >
              + New Request
            </Link>

          </div>


          {requestError && (
            <p className="recipient-error">
              {requestError}
            </p>
          )}


          {requests.length === 0 ? (

            <div className="recipient-empty">

              <span>🩸</span>

              <h3>No blood requests yet</h3>

              <p>
                Create your first emergency request to start
                connecting with available donors.
              </p>

              <Link to="/emergency-request">
                Create Your First Request →
              </Link>

            </div>

          ) : (

            <div className="recipient-table-wrapper">

              <table className="recipient-table">

                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Blood Group</th>
                    <th>Units</th>
                    <th>Hospital</th>
                    <th>Required Date</th>
                    <th>Urgency</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {requests.map((request) => (

                    <tr key={request._id || request.id}>

                      <td>
                        <strong>{request.patientName}</strong>
                      </td>

                      <td>
                        <span className="recipient-blood-group">
                          {request.bloodGroup}
                        </span>
                      </td>

                      <td>{request.units}</td>

                      <td>{request.hospital}</td>

                      <td>{formatDate(request.requiredDate)}</td>

                      <td>
                        <span
                          className={`recipient-urgency urgency-${getStatusClass(request.urgency)}`}
                        >
                          {request.urgency || "Normal"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`recipient-status status-${getStatusClass(request.status)}`}
                        >
                          {request.status || "Pending"}
                        </span>
                      </td>

                      <td>
                        <Link
                          to="/find-donors"
                          state={{
                            bloodGroup: request.bloodGroup,
                            location: request.location,
                            bloodRequestId: request._id
                          }}
                          className="recipient-find-donors"
                        >
                          Find Donors →
                        </Link>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* EMERGENCY REQUEST TRACKING */}
        <section
          className="recipient-request-section"
          id="emergency-tracking"
        >

          <div className="recipient-section-heading">

            <div>
              <span className="recipient-eyebrow">
                LIVE REQUEST PROGRESS
              </span>

              <h2>Emergency Request Tracking</h2>

              <p>
                Follow every stage of your emergency blood request.
              </p>
            </div>

          </div>


          {requests.length === 0 ? (

            <div className="recipient-empty">
              <span>📍</span>

              <h3>No requests to track</h3>

              <p>
                Your request progress will appear here after
                you submit an emergency blood request.
              </p>
            </div>

          ) : (

            <div className="recipient-tracking-list">

              {requests.map((request) => {

                const tracking = request.tracking;

                const donorStats = tracking?.donorStatistics || {
                  totalContacted: 0,
                  accepted: 0,
                  pending: 0,
                  declined: 0
                };

                const donorConnections =
                  request.donorConnections || [];

                return (

                  <article
                    className="recipient-tracking-card"
                    key={`tracking-${request._id}`}
                  >

                    {/* TRACKING HEADER */}
                    <div className="recipient-tracking-header">

                      <div>
                        <span className="recipient-eyebrow">
                          BLOOD REQUEST
                        </span>

                        <h3>{request.patientName}</h3>

                        <p>
                          {request.bloodGroup} · {request.units} unit(s)
                          · {request.hospital}
                        </p>

                        <small>
                          Submitted: {formatDate(request.createdAt)}
                        </small>
                      </div>

                      <span
                        className={`recipient-status status-${getStatusClass(tracking?.currentStatus || request.status)}`}
                      >
                        {tracking?.currentStatus || request.status}
                      </span>

                    </div>


                    {/* TRACKING MESSAGE */}
                    <div className="recipient-tracking-message">
                      <strong>Current update</strong>

                      <p>
                        {tracking?.message ||
                          "Your blood request is awaiting approval."}
                      </p>
                    </div>


                    {/* TRACKING TIMELINE */}
                    <div className="recipient-tracking-timeline">

                      {(tracking?.steps || []).map((step, index) => (

                        <div
                          className={`recipient-tracking-step ${
                            step.completed ? "completed" : "incomplete"
                          }`}
                          key={`${request._id}-step-${index}`}
                        >

                          <div className="recipient-tracking-marker">
                            {getTrackingIcon(step.completed)}
                          </div>

                          <div className="recipient-tracking-step-content">

                            <h4>{step.title}</h4>

                            <p>{step.description}</p>

                            {step.date && (
                              <small>
                                {formatDate(step.date)}
                              </small>
                            )}

                          </div>

                        </div>

                      ))}

                    </div>


                    {/* DONOR RESPONSE STATISTICS */}
                    <div className="recipient-tracking-donor-stats">

                      <div>
                        <strong>{donorStats.totalContacted}</strong>
                        <span>Contacted</span>
                      </div>

                      <div>
                        <strong>{donorStats.accepted}</strong>
                        <span>Accepted</span>
                      </div>

                      <div>
                        <strong>{donorStats.pending}</strong>
                        <span>Pending</span>
                      </div>

                      <div>
                        <strong>{donorStats.declined}</strong>
                        <span>Declined</span>
                      </div>

                    </div>


                    {/* ACCEPTED DONOR DETAILS */}
                    {donorConnections.some(
                      (item) => item.status === "Accepted"
                    ) && (

                      <div className="recipient-connected-donors">

                        <h4>✓ Connected Donors</h4>

                        {donorConnections
                          .filter((item) => item.status === "Accepted")
                          .map((item) => (

                            <div
                              className="recipient-connected-donor"
                              key={item._id}
                            >

                              <span className="recipient-connected-donor-icon">
                                ♥
                              </span>

                              <div>
                                <strong>
                                  {item.donor?.name || "Connected Donor"}
                                </strong>

                                <p>
                                  {item.donor?.bloodGroup || request.bloodGroup}
                                  {" · "}
                                  {item.donor?.location || "Location not specified"}
                                </p>
                              </div>

                              <span className="recipient-status status-accepted">
                                Accepted
                              </span>

                            </div>

                          ))}

                      </div>

                    )}


                    {/* TRACKING ACTION */}
                    {request.status !== "Cancelled" &&
                      request.status !== "Completed" && (
                        <div className="recipient-tracking-action">

                          <Link
                            to="/find-donors"
                            state={{
                              bloodGroup: request.bloodGroup,
                              location: request.location,
                              bloodRequestId: request._id
                            }}
                            className="recipient-find-donors"
                          >
                            Find More Donors →
                          </Link>

                        </div>
                      )}

                  </article>

                );

              })}

            </div>

          )}

        </section>


        {/* DONOR RESPONSES */}
        <section
          className="recipient-request-section"
          id="donor-responses"
        >

          <div className="recipient-section-heading">

            <div>
              <span className="recipient-eyebrow">
                DONOR CONNECTIONS
              </span>

              <h2>Donor Responses</h2>

              <p>
                See which donors have accepted or declined your requests.
              </p>
            </div>

            <span className="recipient-response-count">
              {donorRequests.length} Responses
            </span>

          </div>


          {donorRequestError && (
            <p className="recipient-error">
              {donorRequestError}
            </p>
          )}


          {donorRequests.length === 0 ? (

            <div className="recipient-empty">

              <span>📨</span>

              <h3>No donor responses yet</h3>

              <p>
                Find matching donors and send connection requests.
                Their responses will appear here.
              </p>

              <Link to="/find-donors">
                Find Available Donors →
              </Link>

            </div>

          ) : (

            <div className="recipient-table-wrapper">

              <table className="recipient-table">

                <thead>
                  <tr>
                    <th>Donor Name</th>
                    <th>Blood Group</th>
                    <th>Location</th>
                    <th>Patient</th>
                    <th>Hospital</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {donorRequests.map((request) => (

                    <tr key={request._id}>

                      <td>
                        <strong>
                          {request.donor?.name || "Donor"}
                        </strong>
                      </td>

                      <td>
                        <span className="recipient-blood-group">
                          {request.bloodGroup}
                        </span>
                      </td>

                      <td>
                        {request.donor?.location || "Not specified"}
                      </td>

                      <td>{request.patientName}</td>

                      <td>{request.hospital}</td>

                      <td>
                        <span
                          className={`recipient-status status-${getStatusClass(request.status)}`}
                        >
                          {request.status || "Pending"}
                        </span>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* SAFETY INFORMATION */}
        <section className="recipient-safety">

          <span>🛡️</span>

          <div>
            <h3>Your safety matters</h3>

            <p>
              Confirm donor eligibility, blood compatibility,
              and donation arrangements with a licensed blood
              bank or healthcare professional.
            </p>
          </div>

        </section>


        {/* FOOTER */}
        <footer className="recipient-footer">

          <p>
            © 2026 BloodBridge · Every drop counts. Every life matters.
          </p>

        </footer>

      </main>

    </div>
  );
}

export default RecipientDashboard;
