import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  Terminal, 
  KeyRound, 
  UserCheck, 
  ShieldCheck, 
  XCircle,
  Activity,
  Layers
} from 'lucide-react';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginDev, loading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [simulatingRole, setSimulatingRole] = useState(null);
  const [devError, setDevError] = useState(null);
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
  const isGoogleUnconfigured = 
    errorParam === 'google_oauth_unconfigured' || 
    errorParam === 'oauth_unconfigured';
  const isOtherError = 
    (errorParam && !isUnauthorizedDomain && !isGoogleUnconfigured) || 
    (devError && devError !== 'unauthorized_domain');

  const handleGoogleSSO = () => {
    setIsRedirecting(true);
    const rawBackend = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://nsut-connect.onrender.com';
    const backendUrl = rawBackend.replace(/\/+$/, '').replace(/\/api$/, '');
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleSimulateDevSSO = async (email, role) => {
    setDevError(null);
    if (!email.toLowerCase().endsWith('@nsut.ac.in')) {
      setDevError('unauthorized_domain');
      return;
    }
    try {
      setSimulatingRole(role);
      const result = await loginDev(email, role);
      if (result?.success) {
        if (!result.user?.isOnboarded) {
          navigate('/onboard');
        } else {
          navigate('/feed');
        }
      } else {
        const errDetail = typeof result?.error === 'string'
          ? result.error
          : result?.error?.message || result?.error?.error || 'Server connection failed. Please ensure backend is active.';
        setDevError(errDetail);
      }
    } catch (err) {
      setDevError(err.message || 'Simulation error.');
    } finally {
      setSimulatingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-tactical-main font-mono p-4 sm:p-8 flex flex-col justify-between selection:bg-phosphor selection:text-black relative overflow-hidden">
      {/* CRT Textural Overlays */}
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      {/* TOP SYSTEM STATUS BAR */}
      <header className="border border-stroke-mid bg-charcoal-panel p-3 flex flex-wrap items-center justify-between gap-3 text-xs tracking-ui">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-phosphor inline-block animate-pulse" />
          <span className="text-phosphor font-semibold">CAMPUS AUTHENTICATION GATEWAY</span>
          <span className="text-stroke-bright">//</span>
          <span className="text-teal font-medium">STUDENT & FACULTY PORTAL</span>
          <span className="text-stroke-bright">//</span>
          <span className="text-tactical-muted hidden md:inline">{currentTime}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-tactical-muted">STATUS: <span className="text-phosphor font-bold">ONLINE</span></span>
          <span className="text-stroke-bright">|</span>
          <span className="text-tactical-muted">DOMAIN: <span className="text-phosphor font-semibold">@nsut.ac.in ONLY</span></span>
        </div>
      </header>

      {/* CENTERED ACCESS TERMINAL */}
      <main className="max-w-2xl w-full mx-auto my-8 relative z-10 flex flex-col gap-6">
        
        {/* CRITICAL DOMAIN RESTRICTION REJECTION BANNER */}
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
                  [ ACCESS DENIED // UNAUTHORIZED DOMAIN: ONLY @nsut.ac.in ACCOUNTS PERMITTED ]
                </div>
                <p className="text-[11px] text-tactical-bright leading-relaxed">
                  Perimeter gate rejected identity handshake. Access is strictly restricted to verified <span className="text-hazard font-bold">@nsut.ac.in</span> institutional credentials. Personal consumer emails (e.g., @gmail.com) are rejected at the authentication gateway.
                </p>
                <div className="text-[10px] text-tactical-muted font-mono pt-1 border-t border-stroke-dim">
                  AUDIT LOG: HTTP_403_DOMAIN_REJECT // NON_INSTITUTIONAL_IDENTITY // ACCESS_REFUSED
                </div>
              </div>
            </div>
            <div className="fui-hazard-divider -mx-4 -mb-4 mt-4" />
          </div>
        )}

        {/* GOOGLE OAUTH CONFIGURATION NOTICE */}
        {isGoogleUnconfigured && (
          <div className="border border-teal/70 bg-charcoal-panel p-4 relative">
            <div className="fui-reticle-tl border-teal" />
            <div className="fui-reticle-tr border-teal" />
            <div className="fui-reticle-bl border-teal" />
            <div className="fui-reticle-br border-teal" />

            <div className="flex items-start gap-3">
              <KeyRound className="w-6 h-6 text-teal flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-teal tracking-alert uppercase">
                  [ GOOGLE OAUTH CREDENTIALS PENDING CONFIGURATION ]
                </div>
                <p className="text-[11px] text-tactical-bright leading-relaxed">
                  Google OAuth 2.0 credentials have not yet been registered in Render environment variables. You can enter immediately using the <span className="text-phosphor font-bold">Evaluator Demo Harness</span> below to test Student or Campus Admin roles without needing Google credentials.
                </p>
                <div className="text-[10px] text-tactical-muted font-mono pt-1 border-t border-stroke-dim">
                  GUIDANCE: Populate GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on Render Dashboard to enable live Google SSO.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GENERAL ERROR NOTICE */}
        {isOtherError && !isUnauthorizedDomain && !isGoogleUnconfigured && (
          <div className="border border-stroke-bright bg-charcoal-surface p-4 text-xs text-tactical-muted">
            <span className="text-hazard font-bold">[ SYSTEM NOTICE ]</span> Authentication error occurred: {errorParam || devError}. Check server status.
          </div>
        )}

        {/* CONTAINER A: MAIN AUTHENTICATION BOX */}
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
              STUDENT & FACULTY PORTAL
            </span>
            <span className="text-[10px] text-tactical-muted">AUTH SPEC: GOOGLE OAUTH 2.0</span>
          </div>

          {/* BRAND TITLE & ACADEMIC PORTAL BRIEFING */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-ui text-tactical-bright uppercase mb-1">
              CROSSNEXUS <span className="text-phosphor">//</span> PORTAL
            </h1>
            <p className="text-xs text-teal font-medium mb-3 uppercase tracking-wider">
              Official Academic Portal // Netaji Subhas University of Technology
            </p>
            <p className="text-xs text-tactical-muted leading-relaxed font-mono">
              Welcome to CrossNexus, the unified academic collaboration and campus operations network. Access real-time campus announcements, the smart timetable matrix with live lecture tracking, peer discussion forums, and the decentralized IPFS academic resource repository.
            </p>
          </div>

          {/* SYSTEM STATUS TELEMETRY */}
          <div className="grid grid-cols-3 gap-2 text-[11px] mb-6 p-3 bg-black border border-stroke-dim">
            <div>
              <span className="text-tactical-muted block text-[10px]">STATUS:</span>
              <span className="text-phosphor font-medium">ONLINE</span>
            </div>
            <div>
              <span className="text-tactical-muted block text-[10px]">AUTH:</span>
              <span className="text-teal font-medium">GOOGLE OAUTH 2.0</span>
            </div>
            <div>
              <span className="text-tactical-muted block text-[10px]">DOMAIN:</span>
              <span className="text-phosphor font-medium">@nsut.ac.in</span>
            </div>
          </div>

          {/* PRIMARY GOOGLE OAUTH CTA */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleSSO}
              disabled={isRedirecting || loading}
              className="w-full py-4 px-6 border border-phosphor bg-black hover:bg-phosphor hover:text-black font-mono font-bold text-sm tracking-widest text-phosphor transition-colors uppercase flex items-center justify-center gap-3 cursor-pointer group"
            >
              <KeyRound className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              <span>
                {isRedirecting 
                  ? '[ CONNECTING TO GOOGLE OAUTH... ]' 
                  : '[ SIGN IN WITH GOOGLE // @nsut.ac.in ]'}
              </span>
            </button>
            <div className="text-[10px] text-center text-tactical-muted tracking-tightest space-y-1">
              <p className="text-tactical-bright uppercase">Only official @nsut.ac.in institutional accounts are permitted entry.</p>
              <p className="text-tactical-muted">Roles (Student / Campus Admin) are automatically resolved upon verified institutional login.</p>
            </div>
          </div>
        </div>

        {/* CONTAINER B: EVALUATOR & VERIFICATION BOX (UNMISSABLE HACKATHON HARNESS) */}
        <div className="border border-teal/40 bg-charcoal-panel/90 p-5 sm:p-6 relative">
          <div className="fui-reticle-tl border-teal" />
          <div className="fui-reticle-tr border-teal" />
          <div className="fui-reticle-bl border-teal" />
          <div className="fui-reticle-br border-teal" />

          {/* HEADER BADGE */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-stroke-dim">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal" />
              <span className="text-xs font-bold text-teal tracking-widest uppercase">
                [ EVALUATOR & HACKATHON DEMO HARNESS // INSTANT ACCESS ]
              </span>
            </div>
            <span className="text-[10px] text-phosphor bg-phosphor/10 px-2 py-0.5 border border-phosphor/30 font-semibold uppercase">
              ZERO CONFIG / INSTANT DEMO
            </span>
          </div>

          {/* GUIDANCE TEXT */}
          <p className="text-[11px] text-tactical-muted mb-4 leading-relaxed font-mono">
            For faculty review, hackathon evaluation, and offline local testing. Select an identity below to bypass Google OAuth and inspect the platform with full role-specific permissions:
          </p>

          {/* THREE LARGE ACTION CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* STUDENT DEMO CARD */}
            <button
              type="button"
              disabled={simulatingRole !== null || isRedirecting}
              onClick={() => handleSimulateDevSSO('student@nsut.ac.in', 'student')}
              className={`text-left p-3.5 border ${
                simulatingRole === 'student' ? 'border-phosphor bg-phosphor/10' : 'border-phosphor/50 hover:border-phosphor bg-black hover:bg-phosphor/5'
              } transition-colors group flex flex-col justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-phosphor uppercase mb-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>
                    {simulatingRole === 'student' ? '[ AUTHENTICATING STUDENT... ]' : '<DEMO: LOGIN AS STUDENT>'}
                  </span>
                </div>
                <p className="text-[10px] text-tactical-muted leading-snug">
                  Standard student privileges: View timetable, browse IPFS vault, participate in discussions.
                </p>
              </div>
              <div className="mt-3 text-[9px] text-phosphor/70 font-mono tracking-tight pt-2 border-t border-stroke-dim">
                ID: student@nsut.ac.in (IT-1-1)
              </div>
            </button>

            {/* ADMIN DEMO CARD */}
            <button
              type="button"
              disabled={simulatingRole !== null || isRedirecting}
              onClick={() => handleSimulateDevSSO('admin@nsut.ac.in', 'admin')}
              className={`text-left p-3.5 border ${
                simulatingRole === 'admin' ? 'border-teal bg-teal/10' : 'border-teal/50 hover:border-teal bg-black hover:bg-teal/5'
              } transition-colors group flex flex-col justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal uppercase mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {simulatingRole === 'admin' ? '[ AUTHENTICATING ADMIN... ]' : '<DEMO: LOGIN AS CAMPUS ADMIN>'}
                  </span>
                </div>
                <p className="text-[10px] text-tactical-muted leading-snug">
                  Administrative privileges: Broadcast urgent real-time announcements, verify uploaded study materials.
                </p>
              </div>
              <div className="mt-3 text-[9px] text-teal/70 font-mono tracking-tight pt-2 border-t border-stroke-dim">
                ID: admin@nsut.ac.in (ECE-3-3)
              </div>
            </button>

            {/* DOMAIN FAILURE TEST CARD */}
            <button
              type="button"
              disabled={simulatingRole !== null || isRedirecting}
              onClick={() => handleSimulateDevSSO('intruder@gmail.com', 'student')}
              className="text-left p-3.5 border border-hazard/50 hover:border-hazard bg-black hover:bg-hazard/5 transition-colors group flex flex-col justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-hazard uppercase mb-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>&lt;TEST: ATTEMPT @GMAIL.COM LOGIN&gt;</span>
                </div>
                <p className="text-[10px] text-tactical-muted leading-snug">
                  Simulates unauthorized personal email to verify the domain gate rejects non-NSUT addresses.
                </p>
              </div>
              <div className="mt-3 text-[9px] text-hazard/70 font-mono tracking-tight pt-2 border-t border-stroke-dim">
                ID: intruder@gmail.com (REJECTED)
              </div>
            </button>
          </div>
        </div>

      </main>

      {/* FOOTER TICKER */}
      <footer className="border-t border-stroke-dim pt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-tactical-muted">
        <div>CROSSNEXUS // OFFICIAL ACADEMIC PLATFORM // NODE 01</div>
        <div className="text-stroke-bright font-mono">STATUS: VERIFIED</div>
      </footer>
    </div>
  );
}