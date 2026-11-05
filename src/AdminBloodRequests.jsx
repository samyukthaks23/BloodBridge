import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminBloodRequests.css";

function AdminBloodRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [bloodGroup, setBloodGroup] = useState("All");
  const [urgency, setUrgency] = useState("All");
  const [status, setStatus] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const token = localStorage.getItem("bloodBridgeToken");

  // FETCH BLOOD REQUESTS
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) params.append("search", search.trim());
      if (bloodGroup !== "All") params.append("bloodGroup", bloodGroup);
      if (urgency !== "All") params.append("urgency", urgency);
      if (status !== "All") params.append("status", status);

      const response = await fetch(
        `http://localhost:5000/api/admin/blood-requests?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch blood requests");
      }

      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // FETCH WHEN FILTERS CHANGE
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests();
    }, 350);

    return () => clearTimeout(timer);
  }, [search, bloodGroup, urgency, status]);

  // UPDATE REQUEST STATUS
  const updateStatus = async (requestId, newStatus) => {
    try {
      setUpdatingId(requestId);

      const response = await fetch(
        `http://localhost:5000/api/admin/blood-requests/${requestId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update status");
      }

      setRequests((previousRequests) =>
        previousRequests.map((request) =>
          request._id === requestId
            ? { ...request, status: data.request.status }
            : request
        )
      );

      alert("Blood request status updated successfully!");
    } catch (err) {
      alert(err.message || "Unable to update status");
    } finally {
      setUpdatingId("");
    }
  };

  // SUMMARY COUNTS
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(
    (request) => request.status === "Pending"
  ).length;
  const approvedRequests = requests.filter(
    (request) => request.status === "Approved"
  ).length;
  const completedRequests = requests.filter(
    (request) => request.status === "Completed"
  ).length;

  return (
    <div className="admin-blood-requests-page">

      <div className="abr-header">
        <button
          className="abr-back-btn"
          onClick={() => navigate("/admin-dashboard")}
        >
          ← Back to Dashboard
        </button>

        <div>
          <p className="abr-eyebrow">ADMIN PANEL</p>
          <h1>Blood Request Management</h1>
          <p>View and manage emergency blood requests.</p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="abr-stats-grid">
        <div className="abr-stat-card">
          <span>Total Requests</span>
          <h2>{totalRequests}</h2>
        </div>

        <div className="abr-stat-card">
          <span>Pending</span>
          <h2>{pendingRequests}</h2>
        </div>

        <div className="abr-stat-card">
          <span>Approved</span>
          <h2>{approvedRequests}</h2>
        </div>

        <div className="abr-stat-card">
          <span>Completed</span>
          <h2>{completedRequests}</h2>
        </div>
      </div>

      {/* FILTERS */}
      <div className="abr-filter-section">
        <input
          type="text"
          placeholder="Search patient, hospital or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={bloodGroup}
          onChange={(e) => setBloodGroup(e.target.value)}
        >
          <option value="All">All Blood Groups</option>
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
            (group) => (
              <option key={group} value={group}>{group}</option>
            )
          )}
        </select>

        <select
          value={urgency}
          onChange={(e) => setUrgency(e.target.value)}
        >
          <option value="All">All Urgency</option>
          <option value="Urgent">Urgent</option>
          <option value="Within 24 hours">Within 24 hours</option>
          <option value="Scheduled">Scheduled</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* ERROR */}
      {error && (
        <div className="abr-error">
          {error}
          <button onClick={fetchRequests}>Retry</button>
        </div>
      )}

      {/* REQUEST TABLE */}
      <div className="abr-table-container">
        <div className="abr-table-heading">
          <h2>Emergency Blood Requests</h2>
          <span>{requests.length} records</span>
        </div>

        {loading ? (
          <div className="abr-message">Loading blood requests...</div>
        ) : requests.length === 0 ? (
          <div className="abr-message">No blood requests found.</div>
        ) : (
          <div className="abr-table-scroll">
            <table className="abr-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Blood Group</th>
                  <th>Units</th>
                  <th>Hospital</th>
                  <th>Location</th>
                  <th>Urgency</th>
                  <th>Required Date</th>
                  <th>Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
                  <tr key={request._id}>
                    <td>
                      <strong>{request.patientName}</strong>
                      <small>{request.contact}</small>
                    </td>

                    <td>
                      <span className="abr-blood-badge">
                        {request.bloodGroup}
                      </span>
                    </td>

                    <td>{request.units}</td>
                    <td>{request.hospital}</td>
                    <td>{request.location}</td>

                    <td>
                      <span className={`abr-urgency ${request.urgency === "Urgent" ? "urgent" : request.urgency === "Within 24 hours" ? "within-24" : "scheduled"}`}>
                        {request.urgency}
                      </span>
                    </td>

                    <td>
                      {request.requiredDate
                        ? new Date(request.requiredDate).toLocaleDateString()
                        : "Not specified"}
                    </td>

                    <td>
                      <span className={`abr-status ${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
                    </td>

                    <td>
                      <select
                        className="abr-status-select"
                        value={request.status}
                        disabled={updatingId === request._id}
                        onChange={(e) =>
                          updateStatus(request._id, e.target.value)
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      {updatingId === request._id && (
                        <small>Updating...</small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default AdminBloodRequests;