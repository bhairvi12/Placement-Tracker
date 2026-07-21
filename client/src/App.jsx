import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';

// Route guards
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

// Navigation layout
import Navbar from './components/Navbar.jsx';

// Pages
import Login from './pages/Login.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ResumeAnalyzer from './pages/ResumeAnalyzer.jsx';
import TestScores from './pages/TestScores.jsx';
import Certifications from './pages/Certifications.jsx';
import SkillsMap from './pages/SkillsMap.jsx';
import Profile from './pages/Profile.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

// New Practice pages
import PracticeSetup from './pages/PracticeSetup.jsx';
import PracticeTest from './pages/PracticeTest.jsx';
import PracticeResults from './pages/PracticeResults.jsx';
import PracticeHistory from './pages/PracticeHistory.jsx';

import ResetPassword from './pages/ResetPassword.jsx';

// Layout wrapper including the Navbar
const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* React Hot Toast Notifications Panel */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#FFFFFF',
              color: '#0F172A',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#22C55E',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected Routes Without Navbar */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes With Navbar Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/resume" element={<ResumeAnalyzer />} />
            <Route path="/tests" element={<TestScores />} />
            <Route path="/tests/practice" element={<PracticeSetup />} />
            <Route path="/tests/practice/:sessionId" element={<PracticeTest />} />
            <Route path="/tests/practice/:sessionId/results" element={<PracticeResults />} />
            <Route path="/tests/history" element={<PracticeHistory />} />
            <Route path="/certifications" element={<Certifications />} />
            <Route path="/skills" element={<SkillsMap />} />
            <Route path="/profile" element={<Profile />} />

            {/* Admin Only Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Route>

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
