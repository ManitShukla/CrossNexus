import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import { Cpu, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';

const BRANCH_OPTIONS = [
  'CSE', 'IT', 'ECE', 'EE', 'MECH', 'ICE', 'BT', 'CIVIL', 'MAC', 'DESIGN'
];

const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const SECTION_OPTIONS = ['1', '2', '3', '4', '5', '6'];

export default function OnboardingPage() {
  const { user, verifySession } = useAuth();
  const navigate = useNavigate();

  const [branch, setBranch] = useState(user?.branch || 'ECE');
  const [semester, setSemester] = useState(user?.semester || 1);
  const [section, setSection] = useState(user?.section || '1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.put('/users/onboard', {
        branch,
        semester,
        section,
      });

      if (res.data?.success) {
        setSuccess(true);
        await verifySession();
        navigate('/feed', { replace: true });
      } else {
        throw new Error(res.data?.message || 'Academic profile setup failed.');
      }
    } catch (err) {
      console.error('[SETUP_ERR]', err);
      setError(err.message || 'Profile setup request failed. Check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-tactical-main font-mono flex flex-col selection:bg-phosphor selection:text-black">
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        {/* ACADEMIC SETUP PANEL */}
        <div className="fui-panel border border-stroke-bright bg-charcoal-panel p-6 sm:p-8 relative">
          <div className="fui-reticle-tl" />
          <div className="fui-reticle-tr" />
          <div className="fui-reticle-bl" />
          <div className="fui-reticle-br" />

          {/* CROSSHAIRS */}
          <div className="absolute top-2 right-2 fui-crosshair">+</div>
          <div className="absolute bottom-2 left-2 fui-crosshair">+</div>

          <div className="fui-panel-header">
            <span className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-phosphor" />
              STUDENT ACADEMIC COHORT SETUP
            </span>
            <span className="text-[10px] text-teal">STEP 01 // SETUP ACADEMIC PROFILE</span>
          </div>

          <p className="text-xs text-tactical-muted leading-relaxed mb-6">
            Initial setup required for automated smart timetable resolution, batch-specific announcements, and Academic Vault access. Select your assigned institutional academic parameters below.
          </p>

          {error && (
            <div className="border border-hazard bg-charcoal-base p-3 mb-6 flex items-start gap-2.5 text-xs text-hazard">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="border border-phosphor bg-phosphor/10 p-3 mb-6 flex items-center gap-2.5 text-xs text-phosphor animate-pulse">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>SETUP CONFIRMED: Redirecting to Campus Feed...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. BRANCH SELECTION */}
            <div>
              <label className="block text-[11px] text-teal tracking-label uppercase mb-2">
                [ 01 ] SELECT ENROLLED ACADEMIC BRANCH
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {BRANCH_OPTIONS.map((b) => (
                  <button
                    type="button"
                    key={b}
                    onClick={() => setBranch(b)}
                    className={`p-3 text-xs uppercase tracking-ui border text-center transition-all ${
                      branch === b
                        ? 'border-phosphor bg-phosphor/15 text-phosphor font-bold'
                        : 'border-stroke-dim bg-charcoal-base text-tactical-muted hover:border-stroke-bright hover:text-tactical-main'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. SEMESTER SELECTION */}
            <div>
              <label className="block text-[11px] text-teal tracking-label uppercase mb-2">
                [ 02 ] SELECT CURRENT ACADEMIC SEMESTER
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {SEMESTER_OPTIONS.map((sem) => (
                  <button
                    type="button"
                    key={sem}
                    onClick={() => setSemester(sem)}
                    className={`py-2.5 text-xs uppercase tracking-ui border text-center transition-all ${
                      semester === sem
                        ? 'border-phosphor bg-phosphor/15 text-phosphor font-bold'
                        : 'border-stroke-dim bg-charcoal-base text-tactical-muted hover:border-stroke-bright hover:text-tactical-main'
                    }`}
                  >
                    SEM 0{sem}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. SECTION SELECTION */}
            <div>
              <label className="block text-[11px] text-teal tracking-label uppercase mb-2">
                [ 03 ] SELECT BATCH / SECTION GROUP
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {SECTION_OPTIONS.map((sec) => (
                  <button
                    type="button"
                    key={sec}
                    onClick={() => setSection(sec)}
                    className={`py-2.5 text-xs uppercase tracking-ui border text-center transition-all ${
                      section === sec
                        ? 'border-phosphor bg-phosphor/15 text-phosphor font-bold'
                        : 'border-stroke-dim bg-charcoal-base text-tactical-muted hover:border-stroke-bright hover:text-tactical-main'
                    }`}
                  >
                    SEC {sec}
                  </button>
                ))}
              </div>
            </div>

            {/* TELEMETRY READOUT BAR */}
            <div className="border border-stroke-dim bg-black p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-tactical-muted">SELECTED COHORT:</span>
                <span className="text-phosphor font-bold tracking-ui">
                  {branch} // SEM 0{semester} // SECTION {section}
                </span>
              </div>
              <div className="text-[11px] text-tactical-muted">
                IDENTIFIER: <span className="text-tactical-bright">{user?.email}</span>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="fui-button w-full py-3.5 text-xs font-semibold tracking-ui flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>&lt;{isSubmitting ? 'SAVING ACADEMIC PROFILE...' : 'COMPLETE SETUP & ENTER PORTAL'}&gt;</span>
              <ChevronRight className="w-4 h-4 text-phosphor" />
            </button>
          </form>
        </div>
      </main>

      <footer className="border-t border-stroke-dim p-4 text-center text-[10px] text-tactical-muted">
        ACADEMIC SETUP GATEWAY // CROSSNEXUS CAMPUS OPERATING SYSTEM
      </footer>
    </div>
  );
}