// src/components/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      if (allowedRoles && !allowedRoles.includes(user?.role)) {
        navigate('/');
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, navigate]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || (allowedRoles && !allowedRoles.includes(user?.role))) {
    return null;
  }

  return <>{children}</>;
}