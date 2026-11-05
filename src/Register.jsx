
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("donor");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    bloodGroup: "",
    location: "",
    password: "",
    confirmPassword: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (form.password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (role === "donor" && !form.bloodGroup) {
      setMessage("Please select your blood group.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
            bloodGroup: role === "donor" ? form.bloodGroup : undefined,
            location: form.location,
            password: form.password,
            role: role
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setMessage("Registration successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      setMessage(
        error.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-side">
        <Link to="/" className="auth-brand">
          <span>♥</span> BloodBridge.
        </Link>

        <div className="auth-side-content">
          <span className="auth-eyebrow">
            BE THE REASON SOMEONE SMILES
          </span>

          <h1>Your kindness could change a life.</h1>

          <p>
            Become part of a caring community bringing donors
            and recipients closer together.
          </p>

          <div className="auth-highlight">
            <span className="highlight-icon">✚</span>

            <div>
              <strong>One community. One shared purpose.</strong>
              <p>Helping people find support when it matters.</p>
            </div>
          </div>
        </div>

        <p className="auth-side-footer">
          Connecting hearts. Supporting lives.
        </p>
      </aside>

      <main className="auth-main">
        <Link to="/" className="mobile-brand">
          ♥ BloodBridge.
        </Link>

        <div className="auth-form-wrap register-wrap">
          <Link to="/" className="back-link">
            ← Back to home
          </Link>

          <span className="auth-eyebrow">JOIN BLOODBRIDGE</span>

          <h2>Create your account</h2>

          <p className="auth-description">
            A few details to get you started.
          </p>

          <div className="role-switch">
            <button
              type="button"
              className={role === "donor" ? "role-active" : ""}
              onClick={() => setRole("donor")}
            >
              ♥ Donor
            </button>

            <button
              type="button"
              className={role === "recipient" ? "role-active" : ""}
              onClick={() => setRole("recipient")}
            >
              ♡ Recipient
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Full name

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </label>

            <label>
              Email address

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Phone number

              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                pattern="[0-9+() -]{7,20}"
                required
              />
            </label>

            {role === "donor" && (
              <label>
                Blood group

                <select
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select blood group</option>

                  {[
                    "A+", "A-", "B+", "B-",
                    "O+", "O-", "AB+", "AB-"
                  ].map((group) => (
                    <option value={group} key={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label>
              City / Area

              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Tiruppur"
                required
              />
            </label>

            <label>
              Password

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>

            <label>
              Confirm password

              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : `Create ${role === "donor" ? "Donor" : "Recipient"} Account →`}
            </button>
          </form>

          {message && (
            <p className="auth-message" role="status">
              {message}
            </p>
          )}

          <p className="auth-switch-text">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
