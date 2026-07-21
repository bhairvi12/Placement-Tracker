import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PageLoader from './PageLoader.jsx';

/**
 * Route protection wrapper. Redirects non-logged-in sessions to /login.
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin && location.pathname !== '/admin' && location.pathname !== '/profile') {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
