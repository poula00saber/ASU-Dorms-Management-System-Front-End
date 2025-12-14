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
import StudentsList from "./components/StudentsList";
import StudentForm from "./components/StudentForm";
import StudentDetails from "./components/StudentDetails";
import HolidayManager from "./components/HolidayManagerFinal";
import Reports from "./components/Reports";
import MealScanner from "./components/MealScanner";
import ProtectedRoute from "./components/ProtectedRoute";
import PaymentManagerArabic from "./components/Payment Manager";
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
              {/* Root route - redirect based on role */}
              <Route
                path="/"
                element={
                  userRole === "user" ? (
                    <Navigate to="/holidays" replace />
                  ) : userRole === "restaurant" ? (
                    <Navigate to="/scanner/breakfast-dinner" replace />
                  ) : (
                    <ProtectedRoute allowedRoles={["registration"]}>
                      <Dashboard userRole={userRole} />
                    </ProtectedRoute>
                  )
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
                  <ProtectedRoute allowedRoles={["registration"]}>
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

              {/* Restaurant Routes */}
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

              {/* Catch all - redirect to appropriate home */}
              <Route
                path="*"
                element={
                  userRole === "user" ? (
                    <Navigate to="/holidays" replace />
                  ) : userRole === "restaurant" ? (
                    <Navigate to="/scanner/breakfast-dinner" replace />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
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
