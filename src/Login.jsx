
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("donor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
            role
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed. Please try again.");
        return;
      }

      localStorage.setItem("bloodBridgeToken", data.token);
      localStorage.setItem(
        "bloodBridgeUser",
        JSON.stringify(data.user)
      );

      if (data.user.role === "donor") {
        navigate("/donor-dashboard", { replace: true });
      } else if (data.user.role === "recipient") {
        navigate("/recipient-dashboard", { replace: true });
      } else if (data.user.role === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        localStorage.removeItem("bloodBridgeToken");
        localStorage.removeItem("bloodBridgeUser");
        setMessage("Invalid user role. Please contact support.");
      }

    } catch (error) {
      console.error("Login error:", error);
      setMessage("Unable to connect to the server. Please try again.");
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
            TOGETHER, WE SAVE LIVES
          </span>

          <h1>Every drop brings hope.</h1>

          <p>
            Join a community that connects people in need
            with people ready to help.
          </p>

          <div className="auth-highlight">
            <span className="highlight-icon">♥</span>
            <div>
              <strong>A little kindness goes a long way.</strong>
              <p>Be there when someone needs you most.</p>
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

        <div className="auth-form-wrap">
          <Link to="/" className="back-link">
            ← Back to home
          </Link>

          <span className="auth-eyebrow">
            WELCOME BACK
          </span>

          <h2>Sign in to BloodBridge</h2>

          <p className="auth-description">
            Continue your journey of making a difference.
          </p>

          {/* USER ROLE SELECTION */}
          <div
            className="role-switch"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "8px",
              width: "100%"
            }}
          >
            <button
              type="button"
              className={role === "donor" ? "role-active" : ""}
              onClick={() => setRole("donor")}
              style={{ display: "block", minWidth: 0 }}
            >
              ♥ Donor
            </button>

            <button
              type="button"
              className={role === "recipient" ? "role-active" : ""}
              onClick={() => setRole("recipient")}
              style={{ display: "block", minWidth: 0 }}
            >
              ♡ Recipient
            </button>

            <button
              type="button"
              className={role === "admin" ? "role-active" : ""}
              onClick={() => setRole("admin")}
              style={{ display: "block", minWidth: 0 }}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Email address
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : `Sign in as ${
                    role === "admin"
                      ? "Admin"
                      : role === "donor"
                      ? "Donor"
                      : "Recipient"
                  } →`}
            </button>
          </form>

          {message && (
            <p className="auth-message">{message}</p>
          )}

          {role !== "admin" ? (
            <p className="auth-switch-text">
              Don't have an account?{" "}
              <Link to="/register">Create one</Link>
            </p>
          ) : (
            <p className="auth-privacy">
              Authorized BloodBridge staff only.
            </p>
          )}

          <p className="auth-privacy">
            Your information should always be handled securely.
          </p>
        </div>
      </main>
    </div>
  );
}
