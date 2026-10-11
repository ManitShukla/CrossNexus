import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw } from 'lucide-react';

/**
 * Route Guard: ProtectedRoute
 * Intercepts unauthenticated navigation attempts and directs students to the login portal.
 */
export const ProtectedRoute = ({ children, requireOnboarded = false }) => {
  const { isAuthenticated, isOnboarded, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-tactical-main font-mono">
        <div className="crt-scanlines" />
        <div className="crt-vignette" />
        <div className="fui-panel max-w-md w-full border border-stroke-mid bg-charcoal-panel p-6 text-center">
          <div className="fui-reticle-tl" />
          <div className="fui-reticle-tr" />
          <div className="fui-reticle-bl" />
          <div className="fui-reticle-br" />
          <div className="text-sm font-bold text-phosphor font-mono tracking-widest mb-4">VERIFYING SESSION <span className="fui-cursor">█</span></div>
          <div className="text-xs font-semibold tracking-alert text-phosphor uppercase mb-2">
            [ AUTHENTICATING SESSION ]
          </div>
          <div className="text-[11px] text-tactical-muted">
            Verifying session credentials with NSUT authentication gateway...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireOnboarded && !isOnboarded && location.pathname !== '/onboard') {
    return <Navigate to="/onboard" replace />;
  }

  return children;
};

export default ProtectedRoute;