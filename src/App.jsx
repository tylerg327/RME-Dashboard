import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Oncall pages
import { DashboardPage } from "./pages/oncall/DashboardPage";
import { AddEventPage } from "./pages/oncall/AddEventPage";
import { AdminPage } from "./pages/oncall/AdminPage";

// Tools
import { BitTogglePage } from "./pages/bitToggle/BitTogglePage";
import { HeatmapPage } from "./pages/heatmap/HeatmapPage";

// Super pages
import { UserManagementPage } from "./pages/super/UserManagementPage";

//Metrics
import { LoopFullnessPage } from "./pages/metrics/LoopFullnessPage";

// Auth pages
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { LoginPage } from "./pages/LoginPage";

export const App = () => {
  const { user, mustChangePassword, loading } = useAuth();
  const location = useLocation();

  // Don't route until auth finishes loading
  if (loading) return null;

  // Not logged in → only allow /login
  if (!user && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  // Logged in AND must change pwd → force redirect
  if (
    user &&
    mustChangePassword &&
    location.pathname !== "/change-password"
  ) {
    return <Navigate to="/change-password" replace />;
  }

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <Layout>
              <ChangePasswordPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Oncall Routes */}
      <Route
        path="/oncall/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/oncall/add"
        element={
          <ProtectedRoute>
            <Layout>
              <AddEventPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/oncall/admin"
        element={
          <ProtectedRoute requireAdmin={true}>
            <Layout>
              <AdminPage />
            </Layout>
          </ProtectedRoute>
        }
      />
		<Route
			path="/metrics/loop-fullness"
			element={
				<ProtectedRoute>
					<Layout>
						<LoopFullnessPage />
					</Layout>
				</ProtectedRoute>
		}
		/>

      {/* Tools */}
      <Route
        path="/tools/toggler"
        element={
          <ProtectedRoute requireAdmin={true}>
            <Layout>
              <BitTogglePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tools/heatmap"
        element={
          <ProtectedRoute requireAdmin={true}>
            <Layout>
              <HeatmapPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Super Tools */}
      <Route
        path="/super/users"
        element={
          <ProtectedRoute requireSuper={true}>
            <Layout>
              <UserManagementPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* DEFAULT ROUTE */}
      <Route path="*" element={<Navigate to="/oncall/dashboard" replace />} />
    </Routes>
  );
};
