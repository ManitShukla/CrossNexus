import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

/**
 * Role-Based Access Sentry: RoleGuard
 * Isolates sensitive command modules to validated clearance levels (e.g., ADMIN).
 */
export const RoleGuard = ({ allowedRoles = ['admin'], children, fallback = null }) => {
  const { user, role } = useAuth();

  if (!user || !allowedRoles.includes(role)) {
    if (fallback) return fallback;

    return (
      <div className="fui-panel border border-hazard bg-charcoal-panel p-4 my-4 relative">
        <div className="fui-reticle-tl" />
        <div className="fui-reticle-tr" />
        <div className="fui-reticle-bl" />
        <div className="fui-reticle-br" />
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-hazard flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-hazard tracking-alert uppercase">
              [ ACCESS DENIED // CLEARANCE INSUFFICIENT ]
            </div>
            <div className="text-[11px] text-tactical-muted mt-1 leading-relaxed">
              Target sector requires clearance: <span className="text-tactical-bright font-semibold">[{allowedRoles.join(', ')}]</span>. Cadet status: <span className="text-hazard font-semibold">{role || 'ANONYMOUS'}</span>.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleGuard;