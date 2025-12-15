import { Navigate } from "react-router-dom";
import { UserRole } from "../App";

interface Props {
  children: JSX.Element;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") as UserRole | null;

  // If no token, redirect to login
  if (!token) return <Navigate to="/login" replace />;

  // If no role restrictions, allow access
  if (!allowedRoles.includes(role)) {
    // Redirect based on user's actual role
    if (role === "user") {
      return <Navigate to="/payments" replace />; // Changed from "/holidays"
    } else if (role === "restaurant") {
      return <Navigate to="/restaurant-dashboard" replace />;
    } else if (role === "registration") {
      return <Navigate to="/" replace />;
    }

    // Fallback to login if role is unknown
    return <Navigate to="/login" replace />;
  }

  return children;
}
