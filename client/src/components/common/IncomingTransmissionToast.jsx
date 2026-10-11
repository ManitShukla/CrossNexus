import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { Radio, AlertTriangle, ShieldAlert, ArrowRight, X } from 'lucide-react';

/**
 * Tactical FUI Notification Sentry: IncomingTransmissionToast
 * Renders an unyielding brutalist notification HUD when an official announcement
 * is intercepted from the real-time WebSocket telemetry uplink.
 * Strictly adheres to 0px border-radius, monospace typography, and sharp linear transit.
 */
export default function IncomingTransmissionToast() {
  const { incomingNotice, clearIncomingNotice } = useSocket();
  const navigate = useNavigate();

  const [activeNotice, setActiveNotice] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(8);

  const timerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Play subtle tactical audio blip (Web Audio API)
  const playTacticalBeep = (isCritical = false) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isCritical ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(isCritical ? 960 : 720, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isCritical ? 1440 : 1080, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio autoplay policy catch; fails silently without impacting rendering
    }
  };

  useEffect(() => {
    if (!incomingNotice) return;

    setActiveNotice(incomingNotice);
    setIsVisible(true);
    setCountdown(8);

    const isCritical = incomingNotice.priority === 'critical' || incomingNotice.priority === 'urgent';
    playTacticalBeep(isCritical);

    // Countdown ticker
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-dismiss timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, 8000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [incomingNotice]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setTimeout(() => {
      setActiveNotice(null);
      clearIncomingNotice();
    }, 150);
  };

  const handleInspect = () => {
    handleDismiss();
    navigate('/feed');
  };

  if (!activeNotice) return null;

  const isCritical = activeNotice.priority === 'critical' || activeNotice.priority === 'urgent';
  const isHigh = activeNotice.priority === 'high';

  // Strict tactical styling tokens
  const borderClass = isCritical 
    ? 'border-hazard bg-black' 
    : isHigh 
    ? 'border-amber-400 bg-black' 
    : 'border-phosphor bg-black';

  const accentColor = isCritical 
    ? 'text-hazard' 
    : isHigh 
    ? 'text-amber-400' 
    : 'text-phosphor';

  const headerLabel = isCritical
    ? '[ INC // CRITICAL ADMINISTRATIVE OVERRIDE ]'
    : isHigh
    ? '[ INC // HIGH-PRIORITY COMMAND DISPATCH ]'
    : '[ INC // OFFICIAL BROADCAST NOTICE ]';

  // Compute 8-block monospace visual ticker: e.g. [ ■■■■■□□□ ]
  const filledBlocks = Math.max(0, Math.min(8, countdown));
  const emptyBlocks = 8 - filledBlocks;
  const tickerString = '■'.repeat(filledBlocks) + '□'.repeat(emptyBlocks);

  return (
    <aside 
      role="alert"
      aria-live="assertive"
      style={{
        transition: 'transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 150ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
      className={`fixed top-4 right-4 z-50 max-w-md w-full sm:w-[440px] border ${borderClass} p-4 font-mono select-none transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0 pointer-events-none'
      }`}
    >
      {/* RETICLE CORNER ANCHORS */}
      <div className="fui-reticle-tl" />
      <div className="fui-reticle-tr" />
      <div className="fui-reticle-bl" />
      <div className="fui-reticle-br" />

      {/* HEADER RAIL */}
      <div className="flex items-center justify-between border-b border-stroke-dim pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          {isCritical ? (
            <ShieldAlert className="w-4 h-4 text-hazard flex-shrink-0 animate-pulse" />
          ) : (
            <Radio className="w-4 h-4 text-phosphor flex-shrink-0 animate-pulse" />
          )}
          <span className={`text-[11px] font-bold tracking-alert uppercase ${accentColor}`}>
            {headerLabel}
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-tactical-muted hover:text-tactical-bright p-0.5 border border-transparent hover:border-stroke-dim"
          title="Acknowledge & Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* METADATA STRIP */}
      <div className="flex items-center justify-between text-[10px] text-tactical-muted uppercase tracking-label mb-2">
        <div className="flex items-center gap-2">
          <span className="text-teal font-semibold">[{activeNotice.category || 'GENERAL'}]</span>
          <span>//</span>
          <span>AUTH: {activeNotice.author?.name || 'CAMPUS ADMIN'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-stroke-bright">TTL:</span>
          <span className="text-tactical-bright font-mono">{tickerString}</span>
        </div>
      </div>

      {/* TITLE & TRANSMISSION SNIPPET */}
      <div className="mb-3">
        <h4 className="text-xs font-bold text-tactical-bright uppercase tracking-wide leading-snug mb-1">
          {activeNotice.title}
        </h4>
        <p className="text-[11px] text-tactical-muted leading-relaxed line-clamp-2">
          {activeNotice.body}
        </p>
      </div>

      {/* ACTION RAIL */}
      <div className="flex items-center justify-between pt-2 border-t border-stroke-dim gap-2 text-[10px]">
        <button
          onClick={handleInspect}
          className={`fui-button py-1 px-3 ${accentColor} border-${isCritical ? 'hazard' : isHigh ? 'amber-400' : 'phosphor'} flex items-center gap-1.5`}
        >
          <span>&lt;VIEW IN TACTICAL FEED&gt;</span>
          <ArrowRight className="w-3 h-3" />
        </button>

        <button
          onClick={handleDismiss}
          className="fui-button py-1 px-2.5 text-tactical-muted hover:text-tactical-bright border-stroke-dim hover:border-stroke-bright"
        >
          <span>&lt;ACKNOWLEDGE&gt;</span>
        </button>
      </div>
    </aside>
  );
}
