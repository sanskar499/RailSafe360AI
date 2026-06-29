import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// Layout
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Locomotives } from './pages/Locomotives';
import { LocomotiveDetail } from './pages/LocomotiveDetail';
import { RTISMap } from './pages/RTISMap';
import { KavachDashboard } from './pages/KavachDashboard';
import { SLAMDashboard } from './pages/SLAMDashboard';
import { Maintenance } from './pages/Maintenance';
import { Incidents } from './pages/Incidents';
import { PredictiveMaintenance } from './pages/PredictiveMaintenance';
import { Reports } from './pages/Reports';
import { Analytics } from './pages/Analytics';
import { FirePrevention } from './pages/FirePrevention';
import { HealthIntelligence } from './pages/HealthIntelligence';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-railway-gold"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main Layout Wrapper
const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto px-6 py-6 print:px-0 print:py-0">
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            
            {/* Fleet */}
            <Route
              path="/locomotives"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Maintenance Technician', 'Inspector']}>
                  <Locomotives />
                </ProtectedRoute>
              }
            />
            <Route
              path="/locomotives/:idOrNo"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Maintenance Technician', 'Inspector']}>
                  <LocomotiveDetail />
                </ProtectedRoute>
              }
            />

            {/* RTIS Map */}
            <Route
              path="/rtis"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Loco Engineer', 'Inspector']}>
                  <RTISMap />
                </ProtectedRoute>
              }
            />

            {/* Kavach */}
            <Route
              path="/kavach"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Loco Engineer']}>
                  <KavachDashboard />
                </ProtectedRoute>
              }
            />

            {/* SLAM */}
            <Route
              path="/slam"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Maintenance Technician']}>
                  <SLAMDashboard />
                </ProtectedRoute>
              }
            />

            {/* Maintenance */}
            <Route
              path="/maintenance"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Maintenance Technician', 'Inspector']}>
                  <Maintenance />
                </ProtectedRoute>
              }
            />

            {/* Incidents */}
            <Route path="/incidents" element={<ProtectedRoute><Incidents /></ProtectedRoute>} />

            {/* Predictive */}
            <Route
              path="/predictive"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Maintenance Technician', 'Inspector']}>
                  <PredictiveMaintenance />
                </ProtectedRoute>
              }
            />

            {/* Fire Prevention */}
            <Route
              path="/fire-prevention"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Loco Engineer', 'Maintenance Technician', 'Inspector']}>
                  <FirePrevention />
                </ProtectedRoute>
              }
            />

            {/* AI Health Intelligence */}
            <Route
              path="/health-intelligence"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Loco Engineer', 'Maintenance Technician', 'Inspector']}>
                  <HealthIntelligence />
                </ProtectedRoute>
              }
            />

            {/* Reports */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Inspector']}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* Analytics */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Inspector']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const AppContent: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
