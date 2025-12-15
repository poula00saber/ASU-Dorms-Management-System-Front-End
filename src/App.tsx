import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import RestaurantDashboard from "./components/RestaurantDashboard"; // ADD THIS IMPORT
import StudentsList from "./components/StudentsList";
import StudentForm from "./components/StudentForm";
import StudentDetails from "./components/StudentDetails";
import HolidayManager from "./components/HolidayManagerFinal";
import Reports from "./components/Reports";
import MealScanner from "./components/MealScanner";
import AllLocationsMealSettings from "./components/AllLocationsMealSettings";
import ProtectedRoute from "./components/ProtectedRoute";
import PaymentManagerArabic from "./components/Payment Manager";
import StudentIdPrinter from "./components/StudentIdPrinter";

import { Toaster } from "sonner";

export type UserRole = "registration" | "restaurant" | "user" | null;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);

  // Load token + role on refresh
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") as UserRole | null;

    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  const handleLogin = (role: UserRole) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUserRole(null);
  };

  // Function to get default route based on role
  const getDefaultRoute = (role: UserRole) => {
    switch (role) {
      case "registration":
        return "/";
      case "restaurant":
        return "/restaurant-dashboard";
      case "user":
        return "/holidays";
      default:
        return "/login";
    }
  };

  return (
    <Router>
      {!isAuthenticated ? (
        <>
          <Routes>
            <Route path="/*" element={<Login onLogin={handleLogin} />} />
          </Routes>
          <Toaster position="top-right" />
        </>
      ) : (
        <>
          <Layout userRole={userRole} onLogout={handleLogout}>
            <Routes>
              {/* Registration Dashboard */}
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={["registration"]}>
                    <Dashboard userRole="registration" />
                  </ProtectedRoute>
                }
              />

              {/* Restaurant Dashboard - Use the separate RestaurantDashboard component */}
              <Route
                path="/restaurant-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["restaurant"]}>
                    <RestaurantDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Registration Routes */}
              <Route
                path="/students"
                element={
                  <ProtectedRoute allowedRoles={["registration"]}>
                    <StudentsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/students/add"
                element={
                  <ProtectedRoute allowedRoles={["registration"]}>
                    <StudentForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/students/edit/:id"
                element={
                  <ProtectedRoute allowedRoles={["registration"]}>
                    <StudentForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/students/:id"
                element={
                  <ProtectedRoute allowedRoles={["registration"]}>
                    <StudentDetails />
                  </ProtectedRoute>
                }
              />

{/* Print ids - accessible by  Registration */}
              <Route
                path="/print-ids"
                element={
                  <ProtectedRoute allowedRoles={["registration"]}>
                    <StudentIdPrinter />
                  </ProtectedRoute>
                }
              />

              {/* Holidays - accessible by both Registration and User roles */}
              <Route
                path="/holidays"
                element={
                  <ProtectedRoute allowedRoles={["registration", "user"]}>
                    <HolidayManager />
                  </ProtectedRoute>
                }
              />

              {/* Payments - Registration only */}
              <Route
                path="/payments"
                element={
                  <ProtectedRoute allowedRoles={["registration", "user"]}>
                    {" "}
                    {/* Added "user" here */}
                    <PaymentManagerArabic />
                  </ProtectedRoute>
                }
              />

              {/* Reports - Registration only */}
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={["registration"]}>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              {/* Meal Settings - Registration only */}
              <Route
                path="/meal-settings"
                element={
                  <ProtectedRoute allowedRoles={["registration"]}>
                    <AllLocationsMealSettings />
                  </ProtectedRoute>
                }
              />

              {/* Restaurant Scanner Routes */}
              <Route
                path="/scanner/breakfast-dinner"
                element={
                  <ProtectedRoute allowedRoles={["restaurant"]}>
                    <MealScanner mealType="breakfast-dinner" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scanner/lunch"
                element={
                  <ProtectedRoute allowedRoles={["restaurant"]}>
                    <MealScanner mealType="lunch" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scanner/combined"
                element={
                  <ProtectedRoute allowedRoles={["restaurant"]}>
                    <MealScanner mealType="combined" />
                  </ProtectedRoute>
                }
              />

              {/* Root redirect - goes to appropriate dashboard */}
              <Route
                path="/"
                element={<Navigate to={getDefaultRoute(userRole)} replace />}
              />

              {/* Catch all - redirect to appropriate dashboard */}
              <Route
                path="*"
                element={<Navigate to={getDefaultRoute(userRole)} replace />}
              />
            </Routes>
          </Layout>

          <Toaster position="top-right" />
        </>
      )}
    </Router>
  );
}

export default App;
