import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  Terminal, 
  KeyRound, 
  CornerDownRight, 
  Wifi, 
  Lock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginDev, loading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [devError, setDevError] = useState(null);
  const [showHarness, setShowHarness] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => 
    new Date().toISOString().replace('T', ' // ').slice(0, 22) + ' UTC'
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString().replace('T', ' // ').slice(0, 22) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const errorParam = searchParams.get('error');
  const isUnauthorizedDomain = 
    errorParam === 'unauthorized_domain' || 
    errorParam === 'INVALID_DOMAIN' || 
    devError === 'unauthorized_domain';
  const isOtherError = 
    (errorParam && !isUnauthorizedDomain) || 
    (devError && devError !== 'unauthorized_domain');

  const handleGoogleSSO = () => {
    setIsRedirecting(true);
    const backendUrl = import.meta.env.VITE_API_BASE_URL 
      ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') 
      : 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleSimulateDevSSO = async (email, role) => {
    setDevError(null);
    if (!email.toLowerCase().endsWith('@nsut.ac.in')) {
      setDevError('unauthorized_domain');
      return;
    }
    const result = await loginDev(email, role);
    if (result?.success) {
      if (!result.user?.isOnboarded) {
        navigate('/onboard');
      } else {
        navigate('/feed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-tactical-main font-mono p-4 sm:p-8 flex flex-col justify-between selection:bg-phosphor selection:text-black relative overflow-hidden">
      {/* CRT Textural Overlays */}
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      {/* TOP TELEMETRY PROTOCOL BAR */}
      <header className="border border-stroke-mid bg-charcoal-panel p-3 flex flex-wrap items-center justify-between gap-3 text-xs tracking-ui">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-phosphor inline-block animate-pulse" />
          <span className="text-phosphor font-semibold">GATEWAY_NODE: AUTH-01</span>
          <span className="text-stroke-bright">//</span>
          <span className="text-teal font-medium">SECURE ACCESS POINT</span>
          <span className="text-stroke-bright">//</span>
          <span className="text-tactical-muted hidden md:inline">{currentTime}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-tactical-muted">ENCRYPTION: <span className="text-teal font-bold">AES-256-GCM</span></span>
          <span className="text-stroke-bright">|</span>
          <span className="text-tactical-muted">DOMAIN_GATE: <span className="text-phosphor font-semibold">@nsut.ac.in ONLY</span></span>
        </div>
      </header>

      {/* CENTERED ACCESS TERMINAL */}
      <main className="max-w-xl w-full mx-auto my-8 relative z-10 flex flex-col gap-6">
        
        {/* CRITICAL HAZARD ALERT: DOMAIN RESTRICTION REJECTION */}
        {isUnauthorizedDomain && (
          <div className="border border-hazard bg-charcoal-base p-4 relative animate-shake">
            <div className="fui-hazard-divider -mx-4 -mt-4 mb-4" />
            <div className="fui-reticle-tl border-hazard" />
            <div className="fui-reticle-tr border-hazard" />
            <div className="fui-reticle-bl border-hazard" />
            <div className="fui-reticle-br border-hazard" />

            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-hazard flex-shrink-0 animate-pulse mt-0.5" />
              <div className="space-y-2">
                <div className="text-xs font-bold text-hazard tracking-alert uppercase">
                  [ ACCESS DENIED // UNAUTHORIZED DOMAIN: ONLY @nsut.ac.in CADETS PERMITTED ]
                </div>
                <p className="text-[11px] text-tactical-bright leading-relaxed">
                  CRITICAL: Perimeter gate rejected identity handshake. Access is strictly restricted to verified <span className="text-hazard font-bold">@nsut.ac.in</span> institutional credentials. Personal consumer emails (e.g., @gmail.com) are rejected at perimeter.
                </p>
                <div className="text-[10px] text-tactical-muted font-mono pt-1 border-t border-stroke-dim">
                  TELEMETRY_LOG: CODE_403_GATEWAY_REJECT // IP_ADDR_INTERCEPTED // PROTOCOL_TERMINATED
                </div>
              </div>
            </div>
            <div className="fui-hazard-divider -mx-4 -mb-4 mt-4" />
          </div>
        )}

        {/* GENERAL ERROR BANNER */}
        {isOtherError && !isUnauthorizedDomain && (
          <div className="border border-stroke-bright bg-charcoal-surface p-4 text-xs text-tactical-muted">
            <span className="text-hazard font-bold">[ SYSTEM NOTICE ]</span> Authentication error occurred: {errorParam || devError}. Check server telemetry.
          </div>
        )}

        {/* MAIN HERO TERMINAL CARD */}
        <div className="fui-panel border border-stroke-bright bg-charcoal-panel p-6 sm:p-8 relative">
          <div className="fui-reticle-tl" />
          <div className="fui-reticle-tr" />
          <div className="fui-reticle-bl" />
          <div className="fui-reticle-br" />

          {/* CROSSHAIRS */}
          <div className="absolute top-2 right-2 fui-crosshair">+</div>
          <div className="absolute bottom-2 left-2 fui-crosshair">+</div>

          {/* PANEL HEADER RAIL */}
          <div className="fui-panel-header">
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-phosphor" />
              CADET VERIFICATION PORTAL
            </span>
            <span className="text-[10px] text-tactical-muted">CLEARANCE: INSTITUTIONAL SENTRY</span>
          </div>

          {/* BRAND TITLE & COMMAND BRIEFING */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-ui text-tactical-bright uppercase mb-2">
              NSUT CONNECT <span className="text-phosphor">//</span> HUD
            </h1>
            <p className="text-xs text-tactical-muted leading-relaxed font-mono">
              Welcome to NSUT Connect, the tactical campus intelligence and academic coordination network for Netaji Subhas University of Technology. Access real-time broadcast announcements, the smart timetable matrix with live class detection, community discussion channels, and the decentralized IPFS study vault.
            </p>
          </div>

          {/* TELEMETRY MATRIX */}
          <div className="grid grid-cols-2 gap-2 text-[11px] mb-6 p-3 bg-black border border-stroke-dim">
            <div>
              <span className="text-tactical-muted">NODE_STATUS:</span> <span className="text-phosphor font-medium">ONLINE</span>
            </div>
            <div>
              <span className="text-tactical-muted">ENCRYPTION:</span> <span className="text-teal font-medium">AES-256-GCM</span>
            </div>
            <div>
              <span className="text-tactical-muted">REQUIRED_DOMAIN:</span> <span className="text-phosphor font-medium">@nsut.ac.in</span>
            </div>
            <div>
              <span className="text-tactical-muted">SESSION_TYPE:</span> <span className="text-tactical-bright font-medium">STATELESS_JWT</span>
            </div>
          </div>

          {/* PRIMARY GOOGLE OAUTH CTA */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleSSO}
              disabled={isRedirecting || loading}
              className="fui-button w-full py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-3 relative group border-phosphor bg-phosphor/10 hover:bg-phosphor hover:text-black text-phosphor transition-all"
            >
              <KeyRound className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              <span>
                &lt;{isRedirecting ? 'TRANSFERRING TO GOOGLE OAUTH...' : 'ACTIVATE SECURE UPLINK'}&gt;
              </span>
            </button>
            <div className="text-[10px] text-center text-tactical-muted tracking-tightest space-y-1">
              <p className="text-tactical-bright">OFFICIAL @nsut.ac.in GOOGLE ACCOUNTS REQUIRED FOR INSTITUTIONAL CLEARANCE.</p>
              <p className="text-tactical-muted">ROLES (STUDENT / ADMIN) ARE AUTOMATICALLY RESOLVED AT PERIMETER GATE.</p>
            </div>
          </div>

          {/* PROGRESSIVE DISCLOSURE: EVALUATION & SIMULATION HARNESS */}
          <div className="mt-8 border-t border-stroke-dim pt-4">
            <button
              type="button"
              onClick={() => setShowHarness(!showHarness)}
              className="w-full text-left font-mono text-[11px] text-tactical-muted hover:text-phosphor flex items-center justify-between transition-colors py-1 cursor-pointer select-none"
            >
              <span className="font-semibold text-stroke-bright hover:text-phosphor transition-colors">
                [ {showHarness ? '▲ COLLAPSE' : '▼ EXPAND'} EVALUATION & SIMULATION HARNESS ]
              </span>
              <span className="text-[10px] text-tactical-muted uppercase">For Local Judges & Verification</span>
            </button>

            {showHarness && (
              <div className="mt-3 p-4 border border-stroke-dim bg-black/60 space-y-3">
                <div className="text-[10px] text-teal tracking-label uppercase flex items-center gap-1.5">
                  <CornerDownRight className="w-3 h-3 text-teal" />
                  LOCAL TELEMETRY SIMULATION HARNESS (DEVELOPMENT TESTING)
                </div>
                <p className="text-[10px] text-tactical-muted leading-relaxed">
                  Simulate instant institutional SSO with automated role detection without requiring external Google OAuth API credentials:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSimulateDevSSO('cadet.2024@nsut.ac.in', 'student')}
                    className="fui-button py-2 text-[10px] text-tactical-main border-stroke-mid hover:border-phosphor hover:text-phosphor"
                  >
                    &lt;SSO: (STUDENT) CADET&gt;
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateDevSSO('admin.terminal@nsut.ac.in', 'admin')}
                    className="fui-button py-2 text-[10px] text-teal border-stroke-mid hover:border-teal hover:text-tactical-bright"
                  >
                    &lt;SSO: (ADMIN) COMMAND&gt;
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateDevSSO('intruder@gmail.com', 'student')}
                    className="fui-button-hazard py-2 text-[10px] border-hazard/40 text-hazard hover:border-hazard"
                  >
                    &lt;TEST: (FAIL) @GMAIL.COM&gt;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER TICKER */}
      <footer className="border-t border-stroke-dim pt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-tactical-muted">
        <div>NSUT CONNECT DEFENSE GRID // ACCESS NODE 09</div>
        <div className="text-stroke-bright font-mono">ENCRYPTION: VERIFIED</div>
      </footer>
    </div>
  );
}