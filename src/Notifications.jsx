
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("bloodBridgeToken");

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch notifications");
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchNotifications();

  const interval = setInterval(() => {
    fetchNotifications();
  }, 5000);

  return () => clearInterval(interval);
}, []);

  const markAsRead = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update notification");
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === id ? { ...item, isRead: true } : item
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const unreadCount = notifications.filter(
    (item) => !item.isRead
  ).length;

  return (
    <div className="notifications-page">
      <header className="notifications-header">
        <Link to="/" className="notifications-logo">
          BloodBridge
        </Link>

        <Link to="/recipient-dashboard" className="notifications-back">
          Back to Dashboard
        </Link>
      </header>

      <main className="notifications-main">
        <div className="notifications-heading">
          <div>
            <p className="notifications-eyebrow">STAY UPDATED</p>
            <h1>Your Notifications</h1>
            <p>Important updates about your blood donation requests.</p>
          </div>

          <div className="notification-count">
            {unreadCount} Unread
          </div>
        </div>

        {loading ? (
          <p className="notification-message">Loading notifications...</p>
        ) : error ? (
          <p className="notification-error">{error}</p>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <span>🔔</span>
            <h2>No notifications yet</h2>
            <p>Your updates will appear here.</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((item) => (
              <div
                className={`notification-card ${
                  item.isRead ? "read" : "unread"
                }`}
                key={item._id}
              >
                <div className="notification-icon">
                  🔔
                </div>

                <div className="notification-content">
                  <div className="notification-title-row">
                    <h3>{item.title}</h3>

                    {!item.isRead && (
                      <span className="unread-label">NEW</span>
                    )}
                  </div>

                  <p>{item.message}</p>

                  <small>
                    {new Date(item.createdAt).toLocaleString()}
                  </small>

                  {!item.isRead && (
                    <button
                      className="mark-read-button"
                      onClick={() => markAsRead(item._id)}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Notifications;
