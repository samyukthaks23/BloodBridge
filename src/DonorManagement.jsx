
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DonorManagement.css";

function DonorManagement() {
  const navigate = useNavigate();

  const [donors, setDonors] = useState([]);
  const [search, setSearch] = useState("");
  const [bloodGroup, setBloodGroup] = useState("All");
  const [availability, setAvailability] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const token = localStorage.getItem("bloodBridgeToken");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const params = new URLSearchParams();

        if (search.trim()) params.append("search", search.trim());
        if (bloodGroup !== "All") params.append("bloodGroup", bloodGroup);
        if (availability !== "All") {
          params.append("availability", availability);
        }

        const response = await fetch(
          `http://localhost:5000/api/admin/donors?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          navigate("/login", { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Unable to load donors.");
        }

        setDonors(data.donors || []);
        setError("");

      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchDonors, 300);

    return () => clearTimeout(timer);
  }, [search, bloodGroup, availability, navigate]);

  const totalAvailable = useMemo(
    () => donors.filter((donor) => donor.isAvailable).length,
    [donors]
  );

  return (
    <div className="donor-management-page">
      <header className="donor-management-header">
        <div>
          <button
            className="dm-back-button"
            onClick={() => navigate("/admin-dashboard")}
          >
            ← Back to Dashboard
          </button>

          <h1>Donor Management</h1>
          <p>View and manage registered BloodBridge donors.</p>
        </div>

        <div className="dm-header-icon">♥</div>
      </header>

      <section className="dm-summary-grid">
        <article className="dm-summary-card">
          <span>Total Donors</span>
          <h2>{donors.length}</h2>
        </article>

        <article className="dm-summary-card">
          <span>Available Donors</span>
          <h2>{totalAvailable}</h2>
        </article>

        <article className="dm-summary-card">
          <span>Unavailable Donors</span>
          <h2>{donors.length - totalAvailable}</h2>
        </article>
      </section>

      <section className="dm-content">
        <div className="dm-content-heading">
          <div>
            <h2>Registered Donors</h2>
            <p>Search and filter donor records.</p>
          </div>
        </div>

        <div className="dm-filters">
          <input
            type="text"
            placeholder="Search name, email or location..."
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
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="All">All Availability</option>
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>

        {loading ? (
          <div className="dm-message">Loading donor records...</div>
        ) : error ? (
          <div className="dm-message dm-error">{error}</div>
        ) : donors.length === 0 ? (
          <div className="dm-message">
            No donors found matching your search.
          </div>
        ) : (
          <div className="dm-table-wrapper">
            <table className="dm-table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Contact</th>
                  <th>Blood Group</th>
                  <th>Location</th>
                  <th>Donations</th>
                  <th>Availability</th>
                </tr>
              </thead>

              <tbody>
                {donors.map((donor) => (
                  <tr key={donor._id}>
                    <td>
                      <div className="dm-donor-name">
                        <div className="dm-avatar">
                          {donor.name?.charAt(0).toUpperCase() || "D"}
                        </div>
                        <strong>{donor.name}</strong>
                      </div>
                    </td>

                    <td>
                      <div>{donor.email}</div>
                      <small>{donor.phone || "Not provided"}</small>
                    </td>

                    <td>
                      <span className="dm-blood-group">
                        {donor.bloodGroup || "—"}
                      </span>
                    </td>

                    <td>
                      {donor.location || donor.city || "Not provided"}
                    </td>

                    <td>{donor.donationCount ?? 0}</td>

                    <td>
                      <span
                        className={
                          donor.isAvailable
                            ? "dm-status available"
                            : "dm-status unavailable"
                        }
                      >
                        {donor.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default DonorManagement;
