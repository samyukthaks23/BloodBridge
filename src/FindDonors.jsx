
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./FindDonors.css";

function FindDonors() {
  const routeLocation = useLocation();

  const [donors, setDonors] = useState([]);

  const [bloodGroup, setBloodGroup] = useState(
    routeLocation.state?.bloodGroup || "All"
  );

  const [area, setArea] = useState(
    routeLocation.state?.location || ""
  );

  const [availability, setAvailability] = useState("All");

  const [searched, setSearched] = useState(
    Boolean(routeLocation.state?.bloodGroup)
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingTo, setSendingTo] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  // FETCH DONORS
  async function fetchDonors(group = "All", location = "") {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (group !== "All") {
        params.append("bloodGroup", group);
      }

      if (location.trim()) {
        params.append("location", location.trim());
      }

      const response = await fetch(
        `http://localhost:5000/api/auth/donors?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch donors");
      }

      setDonors(data.donors || []);

    } catch (error) {
      console.error("Donor fetching error:", error);

      setError(
        "Unable to load donors. Please check your server connection."
      );

      setDonors([]);

    } finally {
      setLoading(false);
    }
  }

  // AUTOMATICALLY SEARCH WHEN OPENED FROM A BLOOD REQUEST
  useEffect(() => {
    if (routeLocation.state?.bloodGroup) {
      fetchDonors(
        routeLocation.state.bloodGroup,
        routeLocation.state.location || ""
      );
    } else {
      fetchDonors();
    }
  }, []);

  // FILTER DONORS BY AVAILABILITY
  const filteredDonors = donors.filter((donor) => {
    return (
      availability === "All" ||
      (availability === "Available" && donor.isAvailable) ||
      (availability === "Unavailable" && !donor.isAvailable)
    );
  });

  // SEARCH DONORS
  async function handleSearch(event) {
    event.preventDefault();

    setSearched(true);

    await fetchDonors(bloodGroup, area);
  }

  // SEND DIRECT REQUEST TO SELECTED DONOR
  async function handleSendRequest(donor) {
    const token = localStorage.getItem("bloodBridgeToken");

    const bloodRequestId = routeLocation.state?.bloodRequestId;

    setRequestMessage("");

    if (!token) {
      setRequestMessage(
        "Please log in as a recipient first."
      );
      return;
    }

    if (!bloodRequestId) {
      setRequestMessage(
        "Please open Find Donors using the Find Donors button in your emergency request history."
      );
      return;
    }

    try {
      setSendingTo(donor._id);

      const response = await fetch(
        "http://localhost:5000/api/donor-requests",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            donorId: donor._id,
            bloodRequestId: bloodRequestId
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to send request"
        );
      }

      setRequestMessage(
        `Request successfully sent to ${donor.name}!`
      );

    } catch (error) {
      setRequestMessage(error.message);

    } finally {
      setSendingTo("");
    }
  }

  // RESET SEARCH
  function resetSearch() {
    setBloodGroup("All");
    setArea("");
    setAvailability("All");
    setSearched(false);
    setRequestMessage("");

    fetchDonors();
  }

  return (
    <div className="find-donors-page">

      <header className="find-header">
        <Link to="/" className="find-logo">
          ♥ BloodBridge
        </Link>

        <nav>
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </nav>
      </header>

      <main className="find-main">

        <section className="find-intro">
          <span className="find-eyebrow">
            TOGETHER, WE CAN SAVE LIVES
          </span>

          <h1>Find a Blood Donor</h1>

          <p>
            Search potential donors by blood group, area, and availability.
          </p>
        </section>

        {/* DONOR SEARCH FORM */}
        <form
          className="donor-search-box"
          onSubmit={handleSearch}
        >

          <label>
            Blood Group

            <select
              value={bloodGroup}
              onChange={(event) =>
                setBloodGroup(event.target.value)
              }
            >
              <option value="All">All blood groups</option>

              {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                (group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            City / Area

            <input
              type="text"
              value={area}
              onChange={(event) =>
                setArea(event.target.value)
              }
              placeholder="e.g. Tiruppur"
            />
          </label>

          <label>
            Availability

            <select
              value={availability}
              onChange={(event) =>
                setAvailability(event.target.value)
              }
            >
              <option value="All">All donors</option>
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </label>

          <button
            type="submit"
            className="find-search-button"
          >
            Search Donors →
          </button>

          <button
            type="button"
            className="find-reset-button"
            onClick={resetSearch}
          >
            Reset
          </button>

        </form>

        {/* DONOR LIST */}
        <section className="donor-list-section">

          {requestMessage && (
            <p className="find-demo-notice">
              {requestMessage}
            </p>
          )}

          <div className="donor-list-heading">

            <div>
              <h2>
                {searched
                  ? "Matching Donors"
                  : "Registered Donors"}
              </h2>

              <p>
                {loading
                  ? "Loading donor profiles..."
                  : `${filteredDonors.length} matching donor(s)`}
              </p>
            </div>

            <span className="sample-count">
              {filteredDonors.length} profiles
            </span>

          </div>

          {loading ? (

            <div className="no-donors">
              <h3>Loading donors...</h3>
              <p>
                Please wait while we fetch donor details.
              </p>
            </div>

          ) : error ? (

            <div className="no-donors">
              <h3>Unable to load donors</h3>
              <p>{error}</p>

              <button
                onClick={() => fetchDonors(bloodGroup, area)}
              >
                Try Again
              </button>
            </div>

          ) : filteredDonors.length === 0 ? (

            <div className="no-donors">
              <span>🔎</span>

              <h3>No matching donors found</h3>

              <p>
                Try a different blood group or area.
              </p>

              <button onClick={resetSearch}>
                Show all donors
              </button>
            </div>

          ) : (

            <div className="find-donor-grid">

              {filteredDonors.map((donor) => (

                <article
                  className="find-donor-card"
                  key={donor._id}
                >

                  <div className="find-card-top">

                    <div className="find-blood-badge">
                      {donor.bloodGroup}
                    </div>

                    <span
                      className={
                        donor.isAvailable
                          ? "find-status status-available"
                          : "find-status status-unavailable"
                      }
                    >
                      {donor.isAvailable
                        ? "Available"
                        : "Unavailable"}
                    </span>

                  </div>

                  <h3>{donor.name}</h3>

                  <p className="find-location">
                    📍 {donor.location}
                  </p>

                  <p className="find-distance">
                    Registered Blood Donor
                  </p>

                  <button
                    type="button"
                    className="find-request-button"
                    onClick={() => handleSendRequest(donor)}
                    disabled={
                      !donor.isAvailable ||
                      sendingTo === donor._id
                    }
                  >
                    {sendingTo === donor._id
                      ? "Sending..."
                      : "Request Blood →"}
                  </button>

                </article>

              ))}

            </div>

          )}

          <p className="find-demo-notice">
            Donor profiles are retrieved from registered BloodBridge
            accounts. Always confirm donor eligibility and blood
            compatibility with a licensed blood bank or healthcare
            professional.
          </p>

        </section>

      </main>

    </div>
  );
}

export default FindDonors;
