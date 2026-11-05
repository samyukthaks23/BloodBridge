
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalDonors: 0,
    totalRecipients: 0,
    pendingRequests: 0,
    verifiedDonations: 0
  });

  const [statsError, setStatsError] = useState("");

  // FETCH AND VERIFY ADMIN PROFILE
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = localStorage.getItem("bloodBridgeToken");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

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
          throw new Error(
            data.message || "Unable to load admin profile."
          );
        }

        const currentUser = data.user || data;

        if (currentUser.role !== "admin") {
          localStorage.removeItem("bloodBridgeToken");
          localStorage.removeItem("bloodBridgeUser");

          navigate("/login", { replace: true });
          return;
        }

        setAdmin(currentUser);

      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, [navigate]);

  // FETCH LIVE DASHBOARD STATISTICS
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const token = localStorage.getItem("bloodBridgeToken");

        if (!token) return;

        const response = await fetch(
          "http://localhost:5000/api/statistics/overview",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load statistics."
          );
        }

        setStats(data.statistics);
        setStatsError("");

      } catch (err) {
        console.error("Statistics Error:", err);

        setStatsError(
          err.message || "Failed to load statistics."
        );
      }
    };

    fetchStatistics();
  }, []);

  // ADMIN LOGOUT
  function handleLogout() {
    localStorage.removeItem("bloodBridgeToken");
    localStorage.removeItem("bloodBridgeUser");

    navigate("/login", { replace: true });
  }

  // LOADING SCREEN
  if (loading) {
    return (
      <div className="admin-loading">
        Loading Admin Dashboard...
      </div>
    );
  }

  // ERROR SCREEN
  if (error) {
    return (
      <div className="admin-loading">
        <p>{error}</p>

        <button onClick={() => navigate("/login")}>
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <div className="admin-brand">
          <span className="admin-brand-icon">♥</span>
          BloodBridge<span>.</span>
        </div>

        <p className="admin-menu-label">ADMIN MENU</p>

        <nav className="admin-nav">

          <a href="#overview" className="admin-nav-link active">
            <span>▦</span> Overview
          </a>

          <a href="#statistics" className="admin-nav-link">
            <span>◷</span> Statistics
          </a>

          <a href="#management" className="admin-nav-link">
            <span>♙</span> Management
          </a>

          <a
            href="#donations"
            className="admin-nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate("/admin-donations");
            }}
          >
            <span>♥</span> Donations
          </a>

        </nav>

        <div className="admin-sidebar-bottom">

          <div className="admin-sidebar-user">
            <div className="admin-avatar">A</div>

            <div>
              <strong>
                {admin?.name || "Administrator"}
              </strong>

              <span>Administrator</span>
            </div>
          </div>

          <button
            className="admin-logout"
            onClick={handleLogout}
          >
            ↪ Logout
          </button>

        </div>
      </aside>

      {/* MAIN DASHBOARD */}
      <main className="admin-main">

        {/* TOP BAR */}
        <header className="admin-topbar">

          <div>
            <p className="admin-breadcrumb">
              BloodBridge / Admin
            </p>

            <h1>Admin Dashboard</h1>
          </div>

          <div className="admin-top-profile">

            <div className="admin-avatar">A</div>

            <div>
              <strong>
                {admin?.name || "Administrator"}
              </strong>

              <span>Admin</span>
            </div>

          </div>
        </header>

        {/* WELCOME SECTION */}
        <section className="admin-welcome" id="overview">

          <div>
            <span className="admin-welcome-tag">
              ADMIN CONTROL PANEL
            </span>

            <h2>
              Welcome, {admin?.name || "Administrator"}!
            </h2>

            <p>
              Manage BloodBridge activities and monitor the
              donor-recipient connection platform.
            </p>
          </div>

          <div className="admin-welcome-heart">
            ♥
          </div>

        </section>

        {/* STATISTICS SECTION */}
        <section
          className="admin-stats-section"
          id="statistics"
        >

          <div className="admin-section-heading">
            <div>
              <h2>Platform Overview</h2>

              <p>
                Live statistics from the BloodBridge database.
              </p>
            </div>
          </div>

          {statsError && (
            <p className="admin-stats-error">
              Statistics could not be loaded: {statsError}
            </p>
          )}

          <div className="admin-stats-grid">

            <article className="admin-stat-card">
              <div className="admin-stat-icon red">♥</div>
              <p>Registered Donors</p>
              <h3>{stats.totalDonors}</h3>
              <span>Total donor accounts</span>
            </article>

            <article className="admin-stat-card">
              <div className="admin-stat-icon purple">♙</div>
              <p>Registered Recipients</p>
              <h3>{stats.totalRecipients}</h3>
              <span>Total recipient accounts</span>
            </article>

            <article className="admin-stat-card">
              <div className="admin-stat-icon orange">◷</div>
              <p>Pending Requests</p>
              <h3>{stats.pendingRequests}</h3>
              <span>Awaiting action</span>
            </article>

            <article className="admin-stat-card">
              <div className="admin-stat-icon green">✓</div>
              <p>Verified Donations</p>
              <h3>{stats.verifiedDonations}</h3>
              <span>Completed and verified</span>
            </article>

          </div>
        </section>

        {/* MANAGEMENT CENTRE */}
        <section
          className="admin-management-section"
          id="management"
        >

          <div className="admin-section-heading">
            <div>
              <h2>Management Centre</h2>

              <p>
                Administrative tools for the BloodBridge platform.
              </p>
            </div>
          </div>

          <div className="admin-management-grid">

            {/* DONOR MANAGEMENT */}
            <article
              className="admin-management-card"
              onClick={() => navigate("/admin-donors")}
              style={{ cursor: "pointer" }}
            >
              <span className="management-icon">♙</span>

              <h3>Donor Management</h3>

              <p>
                View registered donors and manage donor records.
              </p>

              <span className="management-status">
                View Donors →
              </span>
            </article>

            {/* BLOOD REQUEST MANAGEMENT */}
            <article
              className="admin-management-card"
              onClick={() => navigate("/admin-blood-requests")}
              style={{ cursor: "pointer" }}
            >
              <span className="management-icon">▣</span>

              <h3>Blood Requests</h3>

              <p>
                View emergency blood requests, filter records
                and update request statuses.
              </p>

              <span className="management-status">
                Manage Requests →
              </span>
            </article>

            {/* DONATION VERIFICATION */}
            <article
              className="admin-management-card"
              onClick={() => navigate("/admin-donations")}
              style={{ cursor: "pointer" }}
            >
              <span className="management-icon">♥</span>

              <h3>Donation Verification</h3>

              <p>
                Review donation records and verify completed donations.
              </p>

              <span className="management-status">
                Verify Donations →
              </span>
            </article>

            {/* MONTHLY REPORTS */}
            <article
              className="admin-management-card"
              onClick={() => navigate("/admin-monthly-reports")}
              style={{ cursor: "pointer" }}
            >
              <span className="management-icon">▥</span>

              <h3>Monthly Reports</h3>

              <p>
                View monthly donation trends and blood group statistics.
              </p>

              <span className="management-status">
                View Reports →
              </span>
            </article>

          </div>
        </section>

        {/* FOOTER */}
        <footer className="admin-footer">
          BloodBridge · Admin Control Panel · 2026
        </footer>

      </main>
    </div>
  );
}

export default AdminDashboard;
