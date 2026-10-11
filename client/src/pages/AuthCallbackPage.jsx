import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('VERIFYING');
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        navigate(`/login?error=${error}`);
        return;
      }

      if (!token) {
        setStatus('FAILED');
        setErrorMessage('No authentication token detected in callback.');
        setTimeout(() => navigate('/login?error=token_missing'), 2000);
        return;
      }

      try {
        setStatus('HYDRATING_SESSION');
        const success = await login(token);

        if (success) {
          setStatus('VERIFIED');
          setTimeout(() => navigate('/'), 800);
        } else {
          throw new Error('Token verification rejected.');
        }
      } catch (err) {
        setStatus('FAILED');
        setErrorMessage(err.message || 'Authentication handshake failure.');
        setTimeout(() => navigate('/login?error=session_hydration_failure'), 2500);
      }
    };

    processCallback();
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-black text-tactical-main font-mono flex flex-col items-center justify-center p-6 relative">
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      <div className="fui-panel max-w-md w-full border border-stroke-bright bg-charcoal-panel p-8 text-center relative">
        <div className="fui-reticle-tl" />
        <div className="fui-reticle-tr" />
        <div className="fui-reticle-bl" />
        <div className="fui-reticle-br" />

        {status === 'FAILED' ? (
          <>
            <ShieldAlert className="w-10 h-10 text-hazard mx-auto mb-4 animate-bounce" />
            <div className="text-xs font-bold text-hazard tracking-alert uppercase mb-2">
              [ AUTHENTICATION FAILED ]
            </div>
            <div className="text-[11px] text-tactical-muted leading-relaxed">
              {errorMessage}
            </div>
          </>
        ) : status === 'VERIFIED' ? (
          <>
            <CheckCircle2 className="w-10 h-10 text-phosphor mx-auto mb-4 animate-pulse" />
            <div className="text-xs font-bold text-phosphor tracking-alert uppercase mb-2">
              [ LOGIN VERIFIED ]
            </div>
            <div className="text-[11px] text-tactical-muted">
              Redirecting to campus portal...
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-bold text-teal font-mono tracking-widest mb-4">[ VERIFYING SESSION TOKEN █ ]</div>
            <div className="text-xs font-bold text-teal tracking-alert uppercase mb-2">
              [ VERIFYING SESSION TOKEN ]
            </div>
            <div className="text-[11px] text-tactical-muted">
              Establishing authenticated session...
            </div>
          </>
        )}
      </div>
    </div>
  );
}