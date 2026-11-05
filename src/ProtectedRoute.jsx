
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRole }) {
  const token = localStorage.getItem("bloodBridgeToken");

  const savedUser = localStorage.getItem("bloodBridgeUser");

  if (!token || !savedUser) {
    return <Navigate to="/login" replace />;
  }

  let user;

  try {
    user = JSON.parse(savedUser);
  } catch (error) {
    localStorage.removeItem("bloodBridgeToken");
    localStorage.removeItem("bloodBridgeUser");

    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
