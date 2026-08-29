import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";

import StudentLayout from "./pages/student/StudentLayout";
import DashboardPage from "./pages/student/DashboardPage";
import SubjectGradesPage from "./pages/student/SubjectGradesPage";
import AttendancePage from "./pages/student/AttendancePage";
import VolunteerPage from "./pages/student/VolunteerPage";
import CertificatesPage from "./pages/student/CertificatesPage";

import AdminLayout from "./pages/admin/AdminLayout";
import StudentsPage from "./pages/admin/StudentsPage";
import StudentDetailPage from "./pages/admin/StudentDetailPage";
import SubjectsPage from "./pages/admin/SubjectsPage";
import AchievementLevelsPage from "./pages/admin/AchievementLevelsPage";
import CertificateTypesPage from "./pages/admin/CertificateTypesPage";
import AttendanceRulesPage from "./pages/admin/AttendanceRulesPage";
import VolunteerConfigPage from "./pages/admin/VolunteerConfigPage";
import AdmissionTypesPage from "./pages/admin/AdmissionTypesPage";

function RootRedirect() {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  return <Navigate to={auth.role === "admin" ? "/admin" : "/student"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="grades" element={<SubjectGradesPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="volunteer" element={<VolunteerPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentsPage />} />
            <Route path="students/:id" element={<StudentDetailPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="achievement-levels" element={<AchievementLevelsPage />} />
            <Route path="certificate-types" element={<CertificateTypesPage />} />
            <Route path="attendance-rules" element={<AttendanceRulesPage />} />
            <Route path="volunteer-config" element={<VolunteerConfigPage />} />
            <Route path="admission-types" element={<AdmissionTypesPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
