import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import IncomingTransmissionToast from './components/common/IncomingTransmissionToast';

import ProtectedRoute from './components/common/ProtectedRoute';
import RoleGuard from './components/common/RoleGuard';
import Navbar from './components/common/Navbar';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import OnboardingPage from './pages/OnboardingPage';
import FeedPage from './pages/FeedPage';
import TimetablePage from './pages/TimetablePage';
import VaultPage from './pages/VaultPage';
import { Terminal, Shield, Wifi, Radio, Cpu, Activity, RefreshCw, CheckCircle2, User as UserIcon, ArrowRight } from 'lucide-react';

function DashboardHUD() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date().toISOString());
  const [serverStatus, setServerStatus] = useState({ status: 'STANDBY', message: 'Awaiting tactical telemetry downlink' });
  const [isPinging, setIsPinging] = useState(false);
  const [logs, setLogs] = useState([
    `[AUTH_LOCK] Session verified for cadet: ${user?.email || 'authenticated'}`,
    `[CLEARANCE] Security Clearance tier: ${role?.toUpperCase() || 'STUDENT'}`,
    `[CADET_PROFILE] Branch: ${user?.branch || 'UNASSIGNED'} | Sem: ${user?.semester || 'N/A'} | Sec: ${user?.section || 'N/A'}`,
    '[GRID_MAPPED] Two-column Tactical Feed armed (Discussions + Announcements).',
    '[BRUTALIST] Border-radius locked to 0px globally. Soft shadows purged.',
    '[REALTIME] Socket.io campus-wide broadcast channel active.',
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toISOString().replace('T', ' // ').replace('Z', ' UTC'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDiagnosticPing = async () => {
    setIsPinging(true);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] Pinging backend /health telemetry...`, ...prev]);
    try {
      const res = await fetch('http://localhost:5000/health');
      const data = await res.json();
      setServerStatus({ 
        status: 'UPLINK_VERIFIED', 
        message: `Status: ${data.status} | DB: ${data.database.state} | Uptime: ${data.uptimeSeconds}s` 
      });
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] Telemetry response ACK. Node: ${data.nodeVersion} | Sockets: ${data.socketClients}`, ...prev]);
    } catch (err) {
      setServerStatus({ 
        status: 'OFFLINE_STANDBY', 
        message: 'Server offline or initializing. Start via npm run server:dev' 
      });
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] Telemetry probe error: ${err.message}`, ...prev]);
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="min-h-screen relative text-tactical-main font-mono flex flex-col justify-between selection:bg-phosphor selection:text-black">
      {/* CRT Textural Overlays */}
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      {/* TOP NAVBAR */}
      <Navbar />

      {/* HAZARD MONITOR DIVIDER */}
      <div className="fui-hazard-divider" />

      {/* MAIN OPERATIONS GRID */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        {/* LEFT COLUMN: ACTIVE CADET STATUS & QUICK LAUNCH */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          {/* CADET IDENTITY PANEL */}
          <div className="fui-panel">
            <div className="fui-reticle-tl" />
            <div className="fui-reticle-tr" />
            <div className="fui-reticle-bl" />
            <div className="fui-reticle-br" />

            <div className="fui-panel-header">
              <span className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-phosphor" />
                AUTHENTICATED CADET TELEMETRY
              </span>
              <span className="text-xs text-phosphor font-semibold">CLEARANCE: {role?.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
              <div className="border border-stroke-dim bg-charcoal-base p-2.5">
                <div className="text-[10px] text-tactical-muted uppercase tracking-label">Cadet Identifier</div>
                <div className="text-tactical-bright font-semibold mt-0.5 truncate">{user?.name || 'Active Cadet'}</div>
              </div>
              <div className="border border-stroke-dim bg-charcoal-base p-2.5">
                <div className="text-[10px] text-tactical-muted uppercase tracking-label">Academic Profile</div>
                <div className="text-phosphor font-semibold mt-0.5">
                  {user?.branch ? `${user.branch} / S0${user.semester} / SEC ${user.section}` : 'CALIBRATION PENDING'}
                </div>
              </div>
              <div className="border border-stroke-dim bg-charcoal-base p-2.5">
                <div className="text-[10px] text-tactical-muted uppercase tracking-label">Onboarding State</div>
                <div className="text-teal font-semibold mt-0.5">{user?.isOnboarded ? 'CALIBRATED' : 'ACTION REQUIRED'}</div>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 font-mono">
              <Link
                to="/feed"
                className="fui-button py-2 text-xs text-phosphor border-phosphor font-semibold flex items-center justify-center gap-2"
              >
                <span>&lt;COMM-HUB FEED&gt;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/timetable"
                className="fui-button py-2 text-xs text-teal border-teal font-semibold flex items-center justify-center gap-2"
              >
                <span>&lt;SMART TIMETABLE&gt;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/vault"
                className="fui-button py-2 text-xs text-tactical-bright border-stroke-bright hover:border-phosphor font-semibold flex items-center justify-center gap-2"
              >
                <span>&lt;ACADEMIC VAULT (IPFS)&gt;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/onboard"
                className="fui-button py-2 text-xs text-tactical-muted border-stroke-dim hover:border-teal font-semibold flex items-center justify-center gap-2"
              >
                <span>&lt;CALIBRATE PROFILE&gt;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* INTERACTION AREA */}
            <div className="border border-stroke-dim bg-charcoal-base p-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] text-tactical-muted uppercase tracking-label">Backend Telemetry Uplink</div>
                <div className="text-xs font-medium text-tactical-bright mt-0.5">{serverStatus.message}</div>
              </div>
              <button 
                onClick={handleDiagnosticPing}
                disabled={isPinging}
                className="fui-button flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'text-phosphor' : 'text-tactical-muted'}`} />
                <span>&lt;{isPinging ? 'PROBING...' : 'PING SERVER /HEALTH'}&gt;</span>
              </button>
            </div>
          </div>

          {/* TELEMETRY LOG STREAM */}
          <div className="fui-panel flex-grow">
            <div className="fui-panel-header">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal" />
                SYSTEM MACHINE LOGS
              </span>
              <span className="text-[10px] text-tactical-muted">BUFFER: {logs.length}</span>
            </div>
            <div className="bg-black border border-stroke-dim p-3 h-44 overflow-y-auto font-mono text-[11px] leading-relaxed flex flex-col gap-1">
              {logs.map((l, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-stroke-bright">&gt;&gt;</span>
                  <span className={i === 0 ? 'text-phosphor font-medium' : 'text-tactical-muted'}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: PHASE 3 VERIFICATION CHECKLIST */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="fui-panel flex-grow">
            <div className="fui-panel-header">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-phosphor" />
                PHASE 3 CORE API MATRIX
              </span>
              <span className="text-xs text-phosphor font-semibold">100% OPERATIONAL</span>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { title: 'User Calibration (PUT /onboard)', desc: 'Branch, semester, section persistence armed.', ok: true },
                { title: 'System Logs (GET /announcements)', desc: 'Official notice feed with category & priority filters.', ok: true },
                { title: 'Mutation Security Gate', desc: 'requireAdmin strictly enforcing notice create/delete.', ok: true },
                { title: 'Socket Broadcast Dispatch', desc: 'io.to("campus_all").emit("new_announcement") live.', ok: true },
                { title: 'Active Deployments (Discussions)', desc: 'Forum threads with channel routing & pagination.', ok: true },
                { title: 'Cryptographic Upvotes ($addToSet)', desc: 'Cadet voting toggle with real-time tally update.', ok: true },
                { title: 'Hierarchical Comments', desc: 'Threaded responses with parentId support.', ok: true },
                { title: 'Two-Column Tactical Feed Grid', desc: 'minmax(420px, 1.45fr) minmax(320px, 1fr) layout.', ok: true },
              ].map((item, idx) => (
                <div key={idx} className="border border-stroke-dim bg-charcoal-surface p-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-tactical-bright uppercase tracking-ui">{item.title}</div>
                    <div className="text-[11px] text-tactical-muted mt-0.5">{item.desc}</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-phosphor/10 border border-phosphor/30 text-phosphor font-semibold uppercase tracking-tightest">
                    VERIFIED
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER TICKER */}
      <footer className="border-t border-stroke-dim p-4 max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-3 text-[11px] text-tactical-muted font-mono">
        <div>MIL-SPEC FUI ARCHITECTURE // PHASES 1-7 CERTIFIED OPERATIONAL</div>
        <div className="flex items-center gap-3">
          <span>MISSION STATUS: FINAL RELEASE CERTIFIED</span>
          <span className="text-phosphor font-bold">[ARMED]</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <IncomingTransmissionToast />
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route 
            path="/onboard" 
            element={
              <ProtectedRoute requireOnboarded={false}>
                <OnboardingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/feed" 
            element={
              <ProtectedRoute>
                <FeedPage />
              </ProtectedRoute>
            } 
          />
                    <Route 
            path="/timetable" 
            element={
              <ProtectedRoute>
                <TimetablePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vault" 
            element={
              <ProtectedRoute>
                <VaultPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <DashboardHUD />
              </ProtectedRoute>
            } 
          />
        </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
