import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, checking, adminOk } = useAuth();
  const loc = useLocation();

  if (checking) return null;
  if (!user || !adminOk) return <Navigate to="/login" replace state={{ from: loc }} />;
  return children;
}
