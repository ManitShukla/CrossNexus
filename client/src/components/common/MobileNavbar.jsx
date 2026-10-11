import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Radio, Calendar, Database, Activity, X, Bell, Shield, User, Wifi, WifiOff } from 'lucide-react';
import { subscribeToPushNotifications, getNotificationPermissionState } from '../../utils/pushNotifications';

export default function MobileNavbar() {
  const { user, role } = useAuth();
  const location = useLocation();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pushStatus, setPushStatus] = useState(() => getNotificationPermissionState());
  const [subscribing, setSubscribing] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // If user is not logged in, don't display HUD navigation
  if (!user) return null;

  const handleTogglePush = async () => {
    setSubscribing(true);
    setStatusMsg(null);
    try {
      const res = await subscribeToPushNotifications();
      if (res?.success) {
        setPushStatus('granted');
        setStatusMsg('Push alerts active');
      } else {
        setStatusMsg(res?.message || 'Permission denied or unconfigured');
      }
    } catch (err) {
      setStatusMsg(err.message || 'Push registration failed');
    } finally {
      setSubscribing(false);
    }
  };

  const navItems = [
    { name: 'FEED', path: '/feed', icon: Radio },
    { name: 'TIMETABLE', path: '/timetable', icon: Calendar },
    { name: 'VAULT', path: '/vault', icon: Database },
  ];

  return (
    <>
      {/* MOBILE BOTTOM-DOCKED HUD NAVIGATION DOCK */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-stroke-dim pb-[env(safe-area-inset-bottom)] font-mono text-[11px] selection:bg-phosphor selection:text-black">
        <div className="grid grid-cols-4 items-stretch h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 border-r border-stroke-dim/40 transition-colors uppercase font-bold tracking-tight ${
                  isActive
                    ? 'bg-phosphor text-black'
                    : 'text-tactical-muted hover:text-tactical-bright bg-black'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[9px] tracking-widest">{item.name}</span>
              </NavLink>
            );
          })}

          {/* STATUS TAB TRIGGER */}
          <button
            type="button"
            onClick={() => setShowStatusModal(true)}
            className={`flex flex-col items-center justify-center gap-1 transition-colors uppercase font-bold tracking-tight cursor-pointer ${
              showStatusModal
                ? 'bg-phosphor text-black'
                : 'text-tactical-muted hover:text-teal bg-black'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="text-[9px] tracking-widest">STATUS</span>
          </button>
        </div>
      </nav>

      {/* STATUS & SESSION CLEARANCE MODAL */}
      {showStatusModal && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col justify-end p-4 animate-in fade-in duration-200">
          <div className="fui-panel border border-stroke-bright bg-charcoal-panel p-5 relative max-h-[85vh] overflow-y-auto mb-16">
            <div className="fui-reticle-tl" />
            <div className="fui-reticle-tr" />
            <div className="fui-reticle-bl" />
            <div className="fui-reticle-br" />

            {/* HEADER RAIL */}
            <div className="fui-panel-header pb-2 mb-4 border-b border-stroke-dim flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-phosphor uppercase tracking-ui">
                <Activity className="w-4 h-4 text-phosphor" />
                SESSION STATUS & HUD CLEARANCE
              </span>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-tactical-muted hover:text-hazard p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* IDENTITY DETAILS */}
            <div className="space-y-3 mb-4 text-xs font-mono">
              <div className="border border-stroke-dim bg-black p-2.5">
                <div className="text-[10px] text-tactical-muted uppercase tracking-label">Authenticated Identity</div>
                <div className="text-tactical-bright font-semibold mt-0.5 truncate">{user?.name || 'Student'}</div>
                <div className="text-[11px] text-teal mt-0.5 truncate">{user?.email}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="border border-stroke-dim bg-black p-2">
                  <div className="text-[9px] text-tactical-muted uppercase tracking-label">Clearance Role</div>
                  <div className="text-phosphor font-bold uppercase mt-0.5">{role || 'STUDENT'}</div>
                </div>
                <div className="border border-stroke-dim bg-black p-2">
                  <div className="text-[9px] text-tactical-muted uppercase tracking-label">Cohort</div>
                  <div className="text-tactical-bright font-bold mt-0.5">
                    {user?.branch ? `${user.branch} / S0${user.semester} / SEC ${user.section}` : 'IT-1-1 (FALLBACK)'}
                  </div>
                </div>
              </div>

              <div className="border border-stroke-dim bg-black p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {navigator.onLine ? (
                    <Wifi className="w-3.5 h-3.5 text-phosphor" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5 text-hazard" />
                  )}
                  <span className="text-[10px] text-tactical-muted uppercase">Network Protocol:</span>
                </div>
                <span className={`text-[10px] font-bold ${navigator.onLine ? 'text-phosphor' : 'text-hazard'}`}>
                  {navigator.onLine ? '[LIVE UPLINK ACTIVE]' : '[AUTONOMOUS OFFLINE]'}
                </span>
              </div>
            </div>

            {/* PUSH NOTIFICATIONS CONTROLLER */}
            <div className="border border-stroke-dim bg-black p-3 mb-4 font-mono">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-teal" />
                  <span className="text-[10px] text-tactical-bright font-bold uppercase">CAMPUS BROADCAST ALERTS</span>
                </div>
                <span className="text-[9px] text-teal px-1.5 py-0.5 border border-teal/30">
                  {pushStatus === 'granted' ? '[ACTIVE]' : '[STANDBY]'}
                </span>
              </div>

              <p className="text-[10px] text-tactical-muted leading-relaxed mb-3">
                Receive locked-screen institutional alerts for urgent exam updates, venue relocations, and campus notices via VAPID Web Push.
              </p>

              <button
                type="button"
                onClick={handleTogglePush}
                disabled={subscribing || pushStatus === 'granted'}
                className={`w-full py-2.5 px-3 border text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  pushStatus === 'granted'
                    ? 'border-phosphor/40 bg-phosphor/10 text-phosphor cursor-default'
                    : 'border-phosphor bg-black hover:bg-phosphor hover:text-black text-phosphor'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>
                  {subscribing
                    ? '[ ENROLLING IN PUSH PROTOCOL... ]'
                    : pushStatus === 'granted'
                    ? '[ NOTIFICATIONS ENABLED ]'
                    : '[ ENABLE CAMPUS NOTIFICATIONS ]'}
                </span>
              </button>

              {statusMsg && (
                <div className="mt-2 text-[10px] text-phosphor font-mono text-center">
                  &gt;&gt; {statusMsg}
                </div>
              )}
            </div>

            {/* DISMISS BUTTON */}
            <button
              type="button"
              onClick={() => setShowStatusModal(false)}
              className="w-full py-2 text-xs border border-stroke-bright text-tactical-muted hover:text-tactical-bright uppercase tracking-widest cursor-pointer"
            >
              [ CLOSE STATUS PANEL ]
            </button>
          </div>
        </div>
      )}
    </>
  );
}
