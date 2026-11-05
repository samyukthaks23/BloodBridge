
import { Link } from "react-router-dom";
import { useState } from "react";
import "./App.css";

const donors = [
  { name: "Arun Kumar", group: "O+", area: "Peelamedu", distance: "2.4 km", available: true },
  { name: "Priya S", group: "A+", area: "Gandhipuram", distance: "3.1 km", available: true },
  { name: "Karthik R", group: "B+", area: "Saibaba Colony", distance: "4.2 km", available: false },
  { name: "Meena R", group: "O-", area: "Singanallur", distance: "5.0 km", available: true },
  { name: "Divya K", group: "AB+", area: "Peelamedu", distance: "1.8 km", available: true }
];

function App() {
  const [searchGroup, setSearchGroup] = useState("All");
  const [searchArea, setSearchArea] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filteredDonors = donors.filter((donor) => {
    const groupMatch =
      searchGroup === "All" || donor.group === searchGroup;

    const areaMatch = donor.area
      .toLowerCase()
      .includes(searchArea.toLowerCase());

    return groupMatch && areaMatch && donor.available;
  });

  function handleSearch(event) {
    event.preventDefault();
    setShowSearch(true);

    document.getElementById("donors")?.scrollIntoView({
      behavior: "smooth"
    });
  }

  return (
    <div className="app">
      <nav className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">♥</span>
          BloodBridge<span className="brand-dot">.</span>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#how">How it works</a>
          <Link to="/find-donors">Find donors</Link>          
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>

        <Link
          to="/emergency-request"
          className="nav-button"
        >
          Emergency Request ↗
        </Link>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot"></span>
              EVERY SECOND COUNTS
            </div>

            <h1>
              Be someone's
              <br />
              <span>reason to live.</span>
            </h1>

            <p className="hero-text">
              Connecting blood donors with people who need
              them. One small act of kindness can make a
              life-changing difference.
            </p>

            <div className="hero-actions">
              <Link
                to="/emergency-request"
                className="primary-button"
              >
                Request Blood <span>→</span>
              </Link>

              <Link className="secondary-button" to="/find-donors">
               Find a donor ↗
              </Link>
            </div>

            <div className="trust-row">
              <div className="avatar-stack">
                <span>A</span>
                <span>P</span>
                <span>K</span>
                <span>+</span>
              </div>
              <p>
                <strong>Every donor matters.</strong>
                <br />
                Start your journey of giving today.
              </p>
            </div>
          </div>

          <div className="hero-art">
            <div className="art-glow"></div>
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>

            <div className="heart-illustration">♥</div>

            <div className="floating-card card-top">
              <span className="mini-icon">✚</span>
              <div>
                <strong>Every drop counts</strong>
                <p>A little help. A big impact.</p>
              </div>
            </div>

            <div className="floating-card card-bottom">
              <span className="status-dot"></span>
              <div>
                <strong>Help is closer than you think</strong>
                <p>Connect with potential donors</p>
              </div>
            </div>

            <div className="art-label">GIVE BLOOD. GIVE HOPE.</div>
          </div>
        </section>

        <section className="stats">
          <div>
            <span className="stat-icon">♡</span>
            <p>Every donation can help</p>
            <h3>Save lives</h3>
          </div>
          <div>
            <span className="stat-icon">⌖</span>
            <p>Discover potential</p>
            <h3>Nearby donors</h3>
          </div>
          <div>
            <span className="stat-icon">↗</span>
            <p>Respond to urgent</p>
            <h3>Blood requests</h3>
          </div>
        </section>

        <section className="search-section" id="donors">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FIND YOUR MATCH</span>
              <h2>Every second matters.</h2>
              <p>
                Search potential donors by blood group and area.
              </p>
            </div>
            <span className="heading-symbol">⌕</span>
          </div>

          <form className="search-form" onSubmit={handleSearch}>
            <label>
              Blood group
              <select
                value={searchGroup}
                onChange={(event) => setSearchGroup(event.target.value)}
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
              Area
              <input
                value={searchArea}
                onChange={(event) => setSearchArea(event.target.value)}
                placeholder="e.g. Peelamedu"
              />
            </label>

            <button className="primary-button" type="submit">
              Search donors →
            </button>
          </form>

          {showSearch && (
            <div className="donor-results">
              <h3>{filteredDonors.length} sample donor(s) found</h3>

              {filteredDonors.length === 0 && (
                <p>
                  No sample donors match those filters. Try
                  another blood group or area.
                </p>
              )}

              <div className="donor-grid">
                {filteredDonors.map((donor) => (
                  <article className="donor-card" key={donor.name}>
                    <div className="blood-badge">{donor.group}</div>
                    <div>
                      <h4>{donor.name}</h4>
                      <p>{donor.area} · {donor.distance}</p>
                      <span className="available-label">
                        ● Sample status: Available
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              <p className="demo-note">
                Demo data only. Contact and eligibility details
                must be verified before any real donation.
              </p>
            </div>
          )}
        </section>

        <section className="how-section" id="how">
          <span className="eyebrow">SIMPLE. HUMAN. IMPACTFUL.</span>
          <h2>Three steps. One powerful difference.</h2>

          <div className="steps-grid">
            <article className="step-card">
              <span>01</span>
              <h3>Share your need</h3>
              <p>Enter the blood group, hospital and units needed.</p>
            </article>

            <article className="step-card">
              <span>02</span>
              <h3>Find a match</h3>
              <p>Discover potential donors who fit your search.</p>
            </article>

            <article className="step-card">
              <span>03</span>
              <h3>Connect with care</h3>
              <p>
                Coordinate with donors and confirm eligibility
                with a blood bank.
              </p>
            </article>
          </div>
        </section>

        <section className="emergency-section" id="emergency">
          <div>
            <span className="eyebrow light-eyebrow">
              NEED BLOOD URGENTLY?
            </span>
            <h2>A moment of help can mean a lifetime of hope.</h2>
            <p>
              Create an emergency request to start connecting
              with potential donors.
            </p>
          </div>

          <Link
            to="/emergency-request"
            className="light-button"
          >
            Create a request →
          </Link>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">♥</span>
          BloodBridge<span className="brand-dot">.</span>
        </a>
        <p>Connecting hearts. Supporting lives.</p>
        <span>© 2026 BloodBridge · College project prototype</span>
      </footer>
    </div>
  );
}

export default App;
