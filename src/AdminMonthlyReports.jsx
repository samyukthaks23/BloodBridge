
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminMonthlyReports.css";

function AdminMonthlyReports() {
  const navigate = useNavigate();

  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("bloodBridgeToken");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/statistics/monthly-report?year=${year}`,
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

          throw new Error(data.message || "Unable to fetch report");
        }

        setReport(data);

      } catch (err) {
        setError(err.message || "Unable to load report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [year, token, navigate]);

  const downloadCSV = () => {
    if (!report) return;

    const rows = [
      ["BLOODBRIDGE MONTHLY REPORT"],
      ["Year", report.year],
      [],
      ["OVERALL STATISTICS"],
      ["Total Donors", report.summary.totalDonors],
      ["Total Recipients", report.summary.totalRecipients],
      ["Pending Blood Requests", report.summary.pendingRequests],
      ["Total Donations", report.summary.totalDonations],
      ["Verified Donations", report.summary.verifiedDonations],
      ["Pending Donations", report.summary.pendingDonations],
      ["Rejected Donations", report.summary.rejectedDonations],
      [],
      ["MONTHLY DONATION STATISTICS"],
      ["Month", "Total", "Verified", "Pending", "Rejected"],
      ...report.monthlyDonations.map((item) => [
        item.month,
        item.total,
        item.verified,
        item.pending,
        item.rejected
      ]),
      [],
      ["BLOOD GROUP STATISTICS"],
      ["Blood Group", "Total", "Verified", "Pending", "Rejected"],
      ...report.bloodGroupStatistics.map((item) => [
        item.bloodGroup,
        item.total,
        item.verified,
        item.pending,
        item.rejected
      ])
    ];

    const csvContent = rows
      .map((row) =>
        row.map((value) =>
          `"${String(value ?? "").replace(/"/g, '""')}"`
        ).join(",")
      )
      .join("\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `BloodBridge_Report_${report.year}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const summaryCards = report
    ? [
        {
          title: "Total Donors",
          value: report.summary.totalDonors,
          icon: "👥",
          color: "blue"
        },
        {
          title: "Total Recipients",
          value: report.summary.totalRecipients,
          icon: "❤️",
          color: "purple"
        },
        {
          title: "Total Donations",
          value: report.summary.totalDonations,
          icon: "🩸",
          color: "pink"
        },
        {
          title: "Verified Donations",
          value: report.summary.verifiedDonations,
          icon: "✓",
          color: "green"
        },
        {
          title: "Pending Donations",
          value: report.summary.pendingDonations,
          icon: "⌛",
          color: "orange"
        },
        {
          title: "Rejected Donations",
          value: report.summary.rejectedDonations,
          icon: "✕",
          color: "red"
        }
      ]
    : [];

  const maximumDonation = report
    ? Math.max(
        1,
        ...report.monthlyDonations.map((item) => item.total)
      )
    : 1;

  return (
    <div className="monthly-report-page">

      {/* HEADER */}
      <div className="monthly-report-header">

        <div>
          <span className="monthly-report-eyebrow">
            BLOODBRIDGE ADMINISTRATION
          </span>

          <h1>Monthly Reports</h1>

          <p>
            Monitor donation activities and blood group statistics.
          </p>
        </div>

        <div className="monthly-report-actions">

          <button
            className="monthly-back-btn"
            onClick={() => navigate("/admin-dashboard")}
          >
            ← Dashboard
          </button>

          <button
            className="monthly-download-btn"
            onClick={downloadCSV}
            disabled={!report}
          >
            ↓ Download CSV
          </button>

        </div>

      </div>

      {/* YEAR SELECTOR */}
      <div className="monthly-year-panel">

        <div>
          <h3>Report Period</h3>
          <p>Select a year to view donation statistics.</p>
        </div>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {Array.from(
            { length: 5 },
            (_, index) => new Date().getFullYear() - index
          ).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

      </div>

      {error && (
        <div className="monthly-report-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="monthly-report-message">
          Loading monthly report...
        </div>
      ) : report ? (
        <>

          {/* SUMMARY CARDS */}
          <div className="monthly-summary-grid">

            {summaryCards.map((card) => (
              <div
                className={`monthly-summary-card ${card.color}`}
                key={card.title}
              >
                <div className="monthly-card-top">
                  <span>{card.title}</span>
                  <div className="monthly-card-icon">
                    {card.icon}
                  </div>
                </div>

                <h2>{card.value}</h2>
              </div>
            ))}

          </div>

          {/* MONTHLY CHART */}
          <div className="monthly-report-section">

            <div className="monthly-section-heading">
              <div>
                <h2>Monthly Donation Overview</h2>
                <p>Donation records across {report.year}</p>
              </div>
            </div>

            <div className="monthly-chart">

              {report.monthlyDonations.map((item) => (
                <div className="monthly-chart-column" key={item.month}>

                  <span className="monthly-chart-value">
                    {item.total}
                  </span>

                  <div className="monthly-chart-track">
                    <div
                      className="monthly-chart-bar"
                      style={{
                        height: `${(item.total / maximumDonation) * 100}%`
                      }}
                    />
                  </div>

                  <span className="monthly-chart-label">
                    {item.month.slice(0, 3)}
                  </span>

                </div>
              ))}

            </div>

          </div>

          {/* MONTHLY TABLE */}
          <div className="monthly-report-section">

            <div className="monthly-section-heading">
              <div>
                <h2>Monthly Donation Details</h2>
                <p>Verification status for each month</p>
              </div>
            </div>

            <div className="monthly-table-wrapper">

              <table className="monthly-report-table">

                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Total</th>
                    <th>Verified</th>
                    <th>Pending</th>
                    <th>Rejected</th>
                  </tr>
                </thead>

                <tbody>
                  {report.monthlyDonations.map((item) => (
                    <tr key={item.month}>
                      <td><strong>{item.month}</strong></td>
                      <td>{item.total}</td>
                      <td className="monthly-verified">{item.verified}</td>
                      <td className="monthly-pending">{item.pending}</td>
                      <td className="monthly-rejected">{item.rejected}</td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </div>

          </div>

          {/* BLOOD GROUP STATISTICS */}
          <div className="monthly-report-section">

            <div className="monthly-section-heading">
              <div>
                <h2>Blood Group Statistics</h2>
                <p>Donation records grouped by blood type</p>
              </div>
            </div>

            {report.bloodGroupStatistics.length === 0 ? (
              <div className="monthly-report-message">
                No blood group donation records found for {report.year}.
              </div>
            ) : (
              <div className="monthly-table-wrapper">

                <table className="monthly-report-table">

                  <thead>
                    <tr>
                      <th>Blood Group</th>
                      <th>Total</th>
                      <th>Verified</th>
                      <th>Pending</th>
                      <th>Rejected</th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.bloodGroupStatistics.map((item) => (
                      <tr key={item.bloodGroup}>
                        <td>
                          <span className="monthly-blood-group">
                            {item.bloodGroup}
                          </span>
                        </td>
                        <td>{item.total}</td>
                        <td className="monthly-verified">{item.verified}</td>
                        <td className="monthly-pending">{item.pending}</td>
                        <td className="monthly-rejected">{item.rejected}</td>
                      </tr>
                    ))}
                  </tbody>

                </table>

              </div>
            )}

          </div>

          {/* REQUEST STATISTICS */}
          <div className="monthly-request-summary">
            <div>
              <span>Pending Blood Requests</span>
              <h2>{report.summary.pendingRequests}</h2>
            </div>
            <span className="monthly-request-icon">📋</span>
          </div>

        </>
      ) : null}

    </div>
  );
}

export default AdminMonthlyReports;
