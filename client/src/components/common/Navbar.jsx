import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { Terminal, Shield, Wifi, LogOut, Radio, User } from 'lucide-react';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const { connectionStatus, latency } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-1.5 text-xs tracking-ui uppercase border transition-all duration-100 ${
      isActive
        ? 'border-phosphor bg-phosphor/10 text-phosphor font-semibold'
        : 'border-transparent text-tactical-muted hover:border-stroke-bright hover:text-tactical-main'
    }`;

  return (
    <header className="border-b border-stroke-dim bg-charcoal-panel/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* BRAND */}
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2 group">
            <span className="w-2.5 h-2.5 bg-phosphor inline-block animate-pulse" />
            <span className="text-phosphor font-bold tracking-ui group-hover:text-white transition-colors">
              CROSSNEXUS
            </span>
            <span className="text-stroke-bright">//</span>
            <span className="text-[10px] text-tactical-muted hidden sm:inline">CAMPUS OS</span>
          </NavLink>
        </div>

        {/* PRIMARY NAVIGATION */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/" className={navLinkClass}>
            // PORTAL
          </NavLink>
          <NavLink to="/feed" className={navLinkClass}>
            // FEED
          </NavLink>
          <NavLink to="/timetable" className={navLinkClass}>
            // TIMETABLE
          </NavLink>
          <NavLink to="/vault" className={navLinkClass}>
            // VAULT
          </NavLink>
          <NavLink to="/onboard" className={navLinkClass}>
            // PROFILE
          </NavLink>
        </nav>

        {/* USER TELEMETRY & CONTROLS */}
        <div className="flex items-center gap-3 text-xs">
          {/* USER MONIKER */}
          <div className="hidden md:flex items-center gap-2 border border-stroke-dim bg-black px-2.5 py-1 text-[11px]">
            <User className="w-3.5 h-3.5 text-teal" />
            <span className="text-tactical-bright font-medium truncate max-w-[140px]">{user?.name || 'Student'}</span>
            <span className="text-stroke-bright">|</span>
            <span className={role === 'admin' ? 'text-hazard font-semibold' : 'text-phosphor font-semibold'}>
              {role === 'admin' ? 'ADMIN' : 'STUDENT'}
            </span>
            {user?.branch && (
              <>
                <span className="text-stroke-bright">|</span>
                <span className="text-teal">{user.branch}</span>
              </>
            )}
          </div>

          {/* REALTIME DYNAMIC TELEMETRY LINK PILL */}
          {connectionStatus === 'ONLINE' ? (
            <div className="flex items-center gap-1.5 text-[10px] text-teal border border-teal/40 bg-teal/10 px-2.5 py-1">
              <span className="w-1.5 h-1.5 bg-teal inline-block animate-ping" />
              <span className="hidden sm:inline">STATUS:</span>
              <span className="text-teal font-bold tracking-widest">
                LIVE {latency !== null ? `// ${latency}ms` : '// 24ms'}
              </span>
            </div>
          ) : connectionStatus === 'CONNECTING' ? (
            <div className="flex items-center gap-1.5 text-[10px] text-phosphor border border-phosphor/40 bg-phosphor/10 px-2.5 py-1">
              <span className="w-1.5 h-1.5 bg-phosphor inline-block animate-pulse" />
              <span className="hidden sm:inline">STATUS:</span>
              <span className="text-phosphor font-bold tracking-widest">CONNECTING █</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] text-hazard border border-hazard bg-hazard/15 px-2.5 py-1">
              <span className="w-1.5 h-1.5 bg-hazard inline-block animate-pulse" />
              <span className="hidden sm:inline">STATUS:</span>
              <span className="text-hazard font-bold tracking-widest">
                {connectionStatus === 'SIGNAL_LOST' ? 'DISCONNECTED' : 'OFFLINE'}
              </span>
            </div>
          )}

          {/* LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            className="fui-button py-1 px-2.5 text-[10px] text-hazard border-hazard/40 hover:border-hazard hover:text-black hover:bg-hazard flex items-center gap-1 cursor-pointer"
            title="Sign out of account"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">&lt;SIGN OUT&gt;</span>
          </button>
        </div>
      </div>
    </header>
  );
}
