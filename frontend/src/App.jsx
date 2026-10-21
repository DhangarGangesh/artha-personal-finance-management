import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Layouts
import { UserLayout } from './layouts/UserLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// User Finance Pages
import { Dashboard } from './pages/user/Dashboard';
import { Transactions } from './pages/user/Transactions';
import { Budgets } from './pages/user/Budgets';
import { Goals } from './pages/user/Goals';
import { Analytics } from './pages/user/Analytics';
import { FinancialTrends } from './pages/user/FinancialTrends';
import { InsightsAlerts } from './pages/user/InsightsAlerts';
import { Settings } from './pages/user/Settings';
import { HelpCenter } from './pages/user/HelpCenter';

// Admin Governance Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { SystemMonitoring } from './pages/admin/SystemMonitoring';
import { AuditLogs } from './pages/admin/AuditLogs';
import { SecurityAccess } from './pages/admin/SecurityAccess';
import { DatasetManagement } from './pages/admin/DatasetManagement';
import { AdminSettings } from './pages/admin/AdminSettings';

// Global Styles
import './styles/global.css';

export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected User Personal Finance Portal */}
            <Route
              element={
                <ProtectedRoute>
                  <UserLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/trends" element={<FinancialTrends />} />
              <Route path="/alerts" element={<InsightsAlerts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<HelpCenter />} />
            </Route>

            {/* Protected Dedicated Admin Governance Portal */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="monitoring" element={<SystemMonitoring />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="security" element={<SecurityAccess />} />
              <Route path="datasets" element={<DatasetManagement />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
