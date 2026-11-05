
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RecordDonation.css";

function RecordDonation() {
  const navigate = useNavigate();

  const [donors, setDonors] = useState([]);
  const [loadingDonors, setLoadingDonors] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    donorId: "",
    donationDate: "",
    location: "",
    bloodBank: "",
    relatedBloodRequest: ""
  });

  // FETCH REGISTERED DONORS
  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const token = localStorage.getItem("bloodBridgeToken");

        const response = await fetch(
          "http://localhost:5000/api/admin/donors",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to fetch donors.");
        }

        setDonors(data.donors || []);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingDonors(false);
      }
    };

    fetchDonors();
  }, []);

  // HANDLE INPUT CHANGES
  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  // SUBMIT DONATION RECORD
  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.donorId ||
      !formData.donationDate ||
      !formData.location.trim() ||
      !formData.bloodBank.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("bloodBridgeToken");

      const payload = {
        donorId: formData.donorId,
        donationDate: formData.donationDate,
        location: formData.location.trim(),
        bloodBank: formData.bloodBank.trim()
      };

      if (formData.relatedBloodRequest.trim()) {
        payload.relatedBloodRequest =
          formData.relatedBloodRequest.trim();
      }

      const response = await fetch(
        "http://localhost:5000/api/admin/donations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create donation record."
        );
      }

      setSuccess(
        "Donation record created successfully! It is now awaiting verification."
      );

      setFormData({
        donorId: "",
        donationDate: "",
        location: "",
        bloodBank: "",
        relatedBloodRequest: ""
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // LOADING SCREEN
  if (loadingDonors) {
    return (
      <div className="record-donation-loading">
        Loading registered donors...
      </div>
    );
  }

  return (
    <div className="record-donation-page">

      <div className="record-donation-container">

        {/* HEADER */}
        <div className="record-donation-header">

          <button
            type="button"
            className="record-back-button"
            onClick={() => navigate("/admin-donations")}
          >
            ← Back to Donations
          </button>

          <span className="record-tag">
            ADMIN CONTROL PANEL
          </span>

          <h1>Record a Donation</h1>

          <p>
            Add a completed blood donation to the BloodBridge
            verification system.
          </p>

        </div>

        {/* FORM */}
        <form
          className="record-donation-form"
          onSubmit={handleSubmit}
        >

          <div className="record-form-heading">
            <h2>Donation Information</h2>

            <p>
              Enter the details provided by the authorized
              blood bank.
            </p>
          </div>

          {/* DONOR */}
          <div className="record-form-group">

            <label htmlFor="donorId">
              Select Donor *
            </label>

            <select
              id="donorId"
              name="donorId"
              value={formData.donorId}
              onChange={handleChange}
              required
            >
              <option value="">Choose a registered donor</option>

              {donors.map((donor) => (
                <option
                  key={donor._id}
                  value={donor._id}
                >
                  {donor.name} — {donor.bloodGroup || "Not specified"} — {donor.location || donor.email}
                </option>
              ))}

            </select>

            {donors.length === 0 && (
              <small>
                No registered donors are available.
              </small>
            )}

          </div>

          {/* DONATION DATE */}
          <div className="record-form-group">

            <label htmlFor="donationDate">
              Donation Date *
            </label>

            <input
              type="date"
              id="donationDate"
              name="donationDate"
              value={formData.donationDate}
              onChange={handleChange}
              max={new Date().toLocaleDateString("en-CA")}
              required
            />

          </div>

          {/* LOCATION */}
          <div className="record-form-group">

            <label htmlFor="location">
              Donation Location *
            </label>

            <input
              type="text"
              id="location"
              name="location"
              placeholder="Enter city or donation centre location"
              value={formData.location}
              onChange={handleChange}
              maxLength={150}
              required
            />

          </div>

          {/* BLOOD BANK */}
          <div className="record-form-group">

            <label htmlFor="bloodBank">
              Blood Bank / Hospital Name *
            </label>

            <input
              type="text"
              id="bloodBank"
              name="bloodBank"
              placeholder="Enter authorized blood bank name"
              value={formData.bloodBank}
              onChange={handleChange}
              maxLength={150}
              required
            />

          </div>

          {/* RELATED REQUEST */}
          <div className="record-form-group">

            <label htmlFor="relatedBloodRequest">
              Related Blood Request ID (Optional)
            </label>

            <input
              type="text"
              id="relatedBloodRequest"
              name="relatedBloodRequest"
              placeholder="Enter MongoDB request ID if applicable"
              value={formData.relatedBloodRequest}
              onChange={handleChange}
            />

            <small>
              Leave this empty if the donation is not connected
              to a specific blood request.
            </small>

          </div>

          {/* MESSAGES */}
          {error && (
            <div className="record-error">
              {error}
            </div>
          )}

          {success && (
            <div className="record-success">
              {success}
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            className="record-submit-button"
            disabled={submitting || donors.length === 0}
          >
            {submitting
              ? "Saving Donation..."
              : "Save Donation Record →"}
          </button>

          <p className="record-note">
            New records will remain Pending until an administrator
            verifies them. Donor statistics will update only after
            successful verification.
          </p>

        </form>

      </div>

    </div>
  );
}

export default RecordDonation;
