import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import AddRestaurantPage from "../pages/AddRestaurantPage";
import { useAuth } from "../auth/useAuth";

function IndexRedirect() {
  const { user, checking, adminOk } = useAuth();
  if (checking) return null;
  if (user && adminOk) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<IndexRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/restaurants/new"
        element={
          <ProtectedRoute>
            <AddRestaurantPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
