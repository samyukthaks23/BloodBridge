
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDonationVerification.css";

function AdminDonationVerification() {
  const navigate = useNavigate();

  const [donations, setDonations] = useState([]);
  const [search, setSearch] = useState("");
  const [bloodGroup, setBloodGroup] = useState("All");
  const [status, setStatus] = useState("All");
  const [verificationStatus, setVerificationStatus] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [notes, setNotes] = useState({});

  const token = localStorage.getItem("bloodBridgeToken");

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          search,
          bloodGroup,
          status,
          verificationStatus
        });

        const response = await fetch(
          `http://localhost:5000/api/admin/donations?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            navigate("/login");
            return;
          }

          throw new Error(data.message || "Unable to fetch donations");
        }

        setDonations(data.donations || []);

      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchDonations, 350);

    return () => clearTimeout(delay);
  }, [search, bloodGroup, status, verificationStatus, token, navigate]);

  const updateVerification = async (donationId, action) => {
    const actionText = action === "verify" ? "verify" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} this donation?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(donationId);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/admin/donations/${donationId}/${action}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            notes: notes[donationId] || ""
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update donation");
      }

      setDonations((previous) =>
        previous.map((donation) =>
          donation._id === donationId
            ? data.donation
            : donation
        )
      );

      alert(data.message);

    } catch (err) {
      setError(err.message || "Unable to update donation");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const totalDonations = donations.length;

  const pendingDonations = donations.filter(
    (d) => d.verificationStatus === "Pending"
  ).length;

  const verifiedDonations = donations.filter(
    (d) => d.verificationStatus === "Verified"
  ).length;

  const rejectedDonations = donations.filter(
    (d) => d.verificationStatus === "Rejected"
  ).length;

  return (
    <div className="admin-donation-page">

      {/* HEADER */}
      <div className="admin-donation-header">
        <div>
          <span className="admin-donation-eyebrow">
            BLOODBRIDGE ADMINISTRATION
          </span>

          <h1>Donation Verification</h1>

          <p>
            Review donation records and verify completed donations.
          </p>
        </div>

        <div className="admin-donation-header-actions">

          <button
            className="record-donation-button"
            onClick={() => navigate("/admin-record-donation")}
          >
            + Record Donation
          </button>

          <button
            className="admin-donation-back"
            onClick={() => navigate("/admin-dashboard")}
          >
            ← Dashboard
          </button>

        </div>
      </div>

      {/* STATISTICS */}
      <div className="donation-stat-grid">

        <div className="donation-stat-card">
          <span>Total Records</span>
          <h2>{totalDonations}</h2>
        </div>

        <div className="donation-stat-card pending">
          <span>Pending Verification</span>
          <h2>{pendingDonations}</h2>
        </div>

        <div className="donation-stat-card verified">
          <span>Verified</span>
          <h2>{verifiedDonations}</h2>
        </div>

        <div className="donation-stat-card rejected">
          <span>Rejected</span>
          <h2>{rejectedDonations}</h2>
        </div>

      </div>

      {/* FILTERS */}
      <div className="donation-filter-panel">

        <input
          type="text"
          placeholder="Search donor, location or blood bank..."
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
              <option key={group} value={group}>
                {group}
              </option>
            )
          )}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="All">All Donation Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={verificationStatus}
          onChange={(e) => setVerificationStatus(e.target.value)}
        >
          <option value="All">All Verification Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Verified">Verified</option>
          <option value="Rejected">Rejected</option>
        </select>

      </div>

      {error && (
        <div className="donation-error">
          {error}
        </div>
      )}

      {/* DONATION TABLE */}
      <div className="donation-table-card">

        <div className="donation-table-heading">
          <h2>Donation Records</h2>
          <span>{donations.length} records</span>
        </div>

        {loading ? (
          <div className="donation-message">
            Loading donation records...
          </div>
        ) : donations.length === 0 ? (
          <div className="donation-message">
            No donation records found.
          </div>
        ) : (
          <div className="donation-table-wrapper">

            <table className="donation-table">

              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Blood Group</th>
                  <th>Donation Date</th>
                  <th>Location</th>
                  <th>Blood Bank</th>
                  <th>Status</th>
                  <th>Verification</th>
                  <th>Verification Notes</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {donations.map((donation) => (
                  <tr key={donation._id}>

                    <td>
                      <strong>{donation.donorName}</strong>
                      <small>
                        {donation.donor?.email || "Email unavailable"}
                      </small>
                    </td>

                    <td>
                      <span className="donation-blood-group">
                        {donation.bloodGroup}
                      </span>
                    </td>

                    <td>{formatDate(donation.donationDate)}</td>

                    <td>{donation.location}</td>

                    <td>{donation.bloodBank || "Not specified"}</td>

                    <td>
                      <span
                        className={`donation-status ${donation.status.toLowerCase()}`}
                      >
                        {donation.status}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`verification-status ${donation.verificationStatus.toLowerCase()}`}
                      >
                        {donation.verificationStatus}
                      </span>
                    </td>

                    <td>
                      <textarea
                        rows="2"
                        maxLength="500"
                        placeholder="Add notes..."
                        value={
                          notes[donation._id] ??
                          donation.verificationNotes ??
                          ""
                        }
                        disabled={donation.verificationStatus !== "Pending"}
                        onChange={(e) =>
                          setNotes((previous) => ({
                            ...previous,
                            [donation._id]: e.target.value
                          }))
                        }
                      />
                    </td>

                    <td>
                      {donation.verificationStatus === "Pending" &&
                      donation.status === "Completed" ? (
                        <div className="donation-action-buttons">

                          <button
                            className="verify-donation-btn"
                            disabled={updatingId === donation._id}
                            onClick={() =>
                              updateVerification(donation._id, "verify")
                            }
                          >
                            {updatingId === donation._id
                              ? "Please wait..."
                              : "Verify"}
                          </button>

                          <button
                            className="reject-donation-btn"
                            disabled={updatingId === donation._id}
                            onClick={() =>
                              updateVerification(donation._id, "reject")
                            }
                          >
                            Reject
                          </button>

                        </div>
                      ) : (
                        <span className="donation-no-action">
                          {donation.status !== "Completed" &&
                          donation.verificationStatus === "Pending"
                            ? "Awaiting completion"
                            : "Processed"}
                        </span>
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

export default AdminDonationVerification;
