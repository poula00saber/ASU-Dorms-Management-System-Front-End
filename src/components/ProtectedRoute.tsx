import { Navigate } from "react-router-dom";
import { UserRole } from "../App";

interface Props {
  children: JSX.Element;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") as UserRole | null;

  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(role))
    return <Navigate to="/" replace />;

  return children;
}
