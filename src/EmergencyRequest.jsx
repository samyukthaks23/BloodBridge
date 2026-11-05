
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./EmergencyRequest.css";

function EmergencyRequest() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    patientName: "",
    bloodGroup: "",
    units: "1",
    hospital: "",
    location: "",
    contact: "",
    requiredDate: "",
    urgency: "Urgent",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const token = localStorage.getItem("bloodBridgeToken");

    if (!token) {
      setMessage("Please log in before submitting a request.");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...form,
            units: Number(form.units),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to submit request.");
        return;
      }

      setMessage(
        "Emergency request submitted successfully! Your request is saved in MongoDB."
      );

      setForm({
        patientName: "",
        bloodGroup: "",
        units: "1",
        hospital: "",
        location: "",
        contact: "",
        requiredDate: "",
        urgency: "Urgent",
      });

    } catch (error) {
      console.error("Request submission error:", error);
      setMessage(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="emergency-page">
      <header className="emergency-header">
        <Link to="/" className="emergency-logo">
          🩸 BloodBridge
        </Link>

        <Link to="/" className="back-home">
          ← Back to Home
        </Link>
      </header>

      <main className="emergency-container">
        <div className="emergency-heading">
          <span className="emergency-label">EMERGENCY CONNECT</span>
          <h1>Request Blood Assistance</h1>
          <p>
            Share the details below to create a blood request.
            Please verify all information before submitting.
          </p>
        </div>

        <form className="emergency-form" onSubmit={handleSubmit}>
          <div className="emergency-alert">
            <strong>Important:</strong> For a medical emergency,
            contact the hospital or a licensed blood bank directly.
            Saving a request in BloodBridge does not automatically
            notify donors or hospitals.
          </div>

          <div className="form-grid">
            <label>
              Patient Name
              <input
                type="text"
                name="patientName"
                value={form.patientName}
                onChange={handleChange}
                placeholder="Enter patient name"
                required
              />
            </label>

            <label>
              Required Blood Group
              <select
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
                required
              >
                <option value="">Select blood group</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                  (group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Units Required
              <select
                name="units"
                value={form.units}
                onChange={handleChange}
                required
              >
                {[1, 2, 3, 4, 5].map((unit) => (
                  <option key={unit} value={unit}>
                    {unit} {unit === 1 ? "unit" : "units"}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Hospital Name
              <input
                type="text"
                name="hospital"
                value={form.hospital}
                onChange={handleChange}
                placeholder="Enter hospital name"
                required
              />
            </label>

            <label>
              City / Area
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Enter city or area"
                required
              />
            </label>

            <label>
              Contact Number
              <input
                type="tel"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                placeholder="Enter contact number"
                pattern="[0-9]{10}"
                maxLength="10"
                minLength="10"
                title="Enter a 10-digit phone number"
                required
              />
            </label>

            <label>
              Required Date
              <input
                type="date"
                name="requiredDate"
                value={form.requiredDate}
                onChange={handleChange}
                min={new Date().toLocaleDateString("en-CA")}
                required
              />
            </label>

            <label>
              Urgency Level
              <select
                name="urgency"
                value={form.urgency}
                onChange={handleChange}
                required
              >
                <option value="Urgent">Urgent</option>
                <option value="Within 24 hours">Within 24 hours</option>
                <option value="Scheduled">Scheduled</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="submit-emergency"
            disabled={loading}
          >
            {loading
              ? "Submitting Request..."
              : "Submit Emergency Request"}
          </button>

          {message && (
            <p className="request-success" role="status">
              {message}
            </p>
          )}
        </form>
      </main>
    </div>
  );
}

export default EmergencyRequest;
