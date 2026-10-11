import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useOfflineTimetable } from '../hooks/useOfflineTimetable';
import Navbar from '../components/common/Navbar';
import CurrentSlotCard from '../components/timetable/CurrentSlotCard';
import DayView from '../components/timetable/DayView';
import WeekView from '../components/timetable/WeekView';
import GlobalFooter from '../components/common/GlobalFooter';
import { 
  Calendar, 
  Grid, 
  Sliders, 
  RefreshCw, 
  AlertTriangle, 
  RotateCcw, 
  Check, 
  Compass,
  Database,
  WifiOff
} from 'lucide-react';

const BRANCH_OPTIONS = ['ECE', 'CSE', 'IT', 'CSAI', 'CSDS', 'MAC', 'EE', 'ICE', 'MECH', 'BT', 'CIVIL', 'DESIGN'];
const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const SECTION_OPTIONS = ['1', '2', '3', '4', 'A', 'B', 'C', 'E1', 'E2'];

export default function TimetablePage() {
  const { user } = useAuth();
  const {
    isOffline,
    isFromCache,
    setIsFromCache,
    saveTimetableLocally,
    loadTimetableLocally,
    cachedTimestamp,
  } = useOfflineTimetable();

  // Active view tab: 'day' or 'week'
  const [activeTab, setActiveTab] = useState('day');

  // Override cohort filters (default to user profile, universal fallback IT-1-1)
  const defaultBranch = user?.branch || 'IT';
  const defaultSemester = user?.semester || 1;
  const defaultSection = user?.section || '1';

  const [selectedBranch, setSelectedBranch] = useState(defaultBranch);
  const [selectedSemester, setSelectedSemester] = useState(defaultSemester);
  const [selectedSection, setSelectedSection] = useState(defaultSection);

  // Timetable State
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync when user profile loads
  useEffect(() => {
    if (user?.branch) setSelectedBranch(user.branch);
    if (user?.semester) setSelectedSemester(user.semester);
    if (user?.section) setSelectedSection(user.section);
  }, [user]);

  const fetchTimetable = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/timetable', {
        params: {
          branch: selectedBranch,
          semester: selectedSemester,
          section: selectedSection,
        },
      });

      if (res.data?.success && res.data.data) {
        setTimetable(res.data.data);
        setIsFromCache(false);
        saveTimetableLocally(res.data.data, {
          branch: selectedBranch,
          semester: selectedSemester,
          section: selectedSection,
        });
      } else {
        throw new Error(res.data?.message || 'Failed to resolve timetable.');
      }
    } catch (err) {
      console.warn('[TIMETABLE_FETCH_ERR]', err);
      // Attempt local resilient cache recovery
      const cached = loadTimetableLocally({
        branch: selectedBranch,
        semester: selectedSemester,
        section: selectedSection,
      });

      if (cached) {
        console.log('[TIMETABLE_CACHE_RESTORED] Serving stored timetable schedule snapshot.');
        setTimetable(cached);
        setIsFromCache(true);
        setError(null);
      } else {
        setError(err.response?.data?.message || err.message || 'Timetable resolution rejected.');
        setTimetable(null);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, selectedSemester, selectedSection, saveTimetableLocally, loadTimetableLocally, setIsFromCache]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const handleResetToMyProfile = () => {
    setSelectedBranch(defaultBranch);
    setSelectedSemester(defaultSemester);
    setSelectedSection(defaultSection);
  };

  const isOverrideActive = 
    selectedBranch !== defaultBranch || 
    selectedSemester !== defaultSemester || 
    selectedSection !== defaultSection;

  return (
    <div className="min-h-screen bg-black text-tactical-main font-mono flex flex-col selection:bg-phosphor selection:text-black">
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      <Navbar />

      {/* SUB-HEADER STATUS BAR */}
      <div className="border-b border-stroke-dim bg-charcoal-base px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] text-tactical-muted">
          <div className="flex items-center gap-2">
            <span className="text-phosphor">&gt;&gt; SCHEDULE_MODULE:</span>
            <span className="text-tactical-bright font-bold">SMART TIMETABLE SCHEDULE</span>
            <span className="text-stroke-bright">//</span>
            <span className="text-teal">COHORT: {selectedBranch} - SEM {selectedSemester} - SEC {selectedSection}</span>
          </div>

          <div className="flex items-center gap-3">
            <span>ACTIVE SCHEDULE: {timetable?.schedule?.length || 0} SLOTS</span>
            <span className="text-stroke-bright">|</span>
            {isOffline || isFromCache ? (
              <span className="text-hazard font-semibold flex items-center gap-1">
                <WifiOff className="w-3 h-3 text-hazard" />
                [OFFLINE LOCAL CACHE]
              </span>
            ) : (
              <span className="text-phosphor">[LIVE TRACKING ACTIVE]</span>
            )}
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 pb-20 md:pb-6">
        {/* OFFLINE STATUS BANNER */}
        {(isOffline || isFromCache) && (
          <div className="w-full bg-black border border-amber-500 text-amber-500 p-3 mb-4 font-mono text-xs tracking-wider flex flex-wrap items-center justify-between gap-2">
            <span>[ STATUS: DISCONNECTED // OFFLINE CACHE PROTOCOL ENGAGED ]</span>
            <span>[ OFFLINE MODE ACTIVE // SHOWING LOCALLY STORED TIMETABLE ]</span>
          </div>
        )}

        {/* COHORT FILTER TOOLBAR */}
        <div className="fui-panel border border-stroke-bright bg-charcoal-panel p-4 mb-6">
          <div className="fui-reticle-tl" />
          <div className="fui-reticle-tr" />
          <div className="fui-reticle-bl" />
          <div className="fui-reticle-br" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal flex-shrink-0" />
              <div>
                <div className="text-[10px] text-teal tracking-label uppercase">COHORT SELECTION</div>
                <div className="text-xs font-bold text-tactical-bright uppercase">
                  ACADEMIC COHORT FILTER
                </div>
              </div>
            </div>

            {/* SELECTION CONTROLS */}
            <div className="flex flex-wrap items-center gap-3">
              {/* BRANCH SELECTOR */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[10px] text-tactical-muted uppercase">BRANCH:</span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-black border border-stroke-mid text-tactical-bright text-xs px-2 py-1 outline-none focus:border-phosphor font-mono cursor-pointer"
                >
                  {BRANCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* SEMESTER SELECTOR */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[10px] text-tactical-muted uppercase">SEM:</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(Number(e.target.value))}
                  className="bg-black border border-stroke-mid text-tactical-bright text-xs px-2 py-1 outline-none focus:border-phosphor font-mono cursor-pointer"
                >
                  {SEMESTER_OPTIONS.map((s) => (
                    <option key={s} value={s}>SEM {s}</option>
                  ))}
                </select>
              </div>

              {/* SECTION SELECTOR */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[10px] text-tactical-muted uppercase">SEC:</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="bg-black border border-stroke-mid text-tactical-bright text-xs px-2 py-1 outline-none focus:border-phosphor font-mono cursor-pointer"
                >
                  {SECTION_OPTIONS.map((sec) => (
                    <option key={sec} value={sec}>SEC {sec}</option>
                  ))}
                </select>
              </div>

              {/* RESET BUTTON */}
              {isOverrideActive && (
                <button
                  onClick={handleResetToMyProfile}
                  className="fui-button py-1 px-2.5 text-[10px] text-teal border-teal/50 hover:border-teal flex items-center gap-1 cursor-pointer"
                  title="Restore My Saved Profile Cohort"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>&lt;RESET TO MY COHORT&gt;</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* REAL-TIME "HAPPENING NOW" BANNER */}
        <CurrentSlotCard schedule={timetable?.schedule || []} />

        {/* VIEW NAVIGATION TABS */}
        <div className="flex items-center justify-between border-b border-stroke-dim mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('day')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-label border-t border-x transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'day'
                  ? 'border-stroke-bright bg-charcoal-panel text-phosphor border-b-2 border-b-transparent'
                  : 'border-transparent text-tactical-muted hover:text-tactical-bright'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>&lt;DAY VIEW&gt;</span>
            </button>

            <button
              onClick={() => setActiveTab('week')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-label border-t border-x transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'week'
                  ? 'border-stroke-bright bg-charcoal-panel text-phosphor border-b-2 border-b-transparent'
                  : 'border-transparent text-tactical-muted hover:text-tactical-bright'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>&lt;WEEKLY VIEW&gt;</span>
            </button>
          </div>

          <div className="text-[10px] text-tactical-muted uppercase hidden sm:block">
            VIEW MODE: ACADEMIC CALENDAR
          </div>
        </div>

        {/* LOADING & ERROR STATES */}
        {loading ? (
          <div className="fui-panel border border-stroke-dim p-12 text-center bg-charcoal-panel">
            <div className="text-base text-phosphor font-mono tracking-widest mb-2 font-bold">
              LOADING TIMETABLE DATA <span className="fui-cursor">█</span>
            </div>
            <div className="text-[11px] text-tactical-muted font-mono uppercase tracking-label">
              Resolving academic cohort schedule...
            </div>
          </div>
        ) : error ? (
          <div className="border border-hazard bg-charcoal-base p-6 text-xs text-hazard flex flex-col items-center text-center gap-2">
            <AlertTriangle className="w-6 h-6 text-hazard mb-1 animate-pulse" />
            <div className="font-bold tracking-alert uppercase">[ NOTICE ] NO TIMETABLE FOUND</div>
            <p className="text-tactical-muted max-w-md">{error}</p>
          </div>
        ) : (
          <div>
            {activeTab === 'day' ? (
              <DayView schedule={timetable?.schedule || []} />
            ) : (
              <WeekView schedule={timetable?.schedule || []} />
            )}
          </div>
        )}
      </main>

      {/* CREATOR SPECIFICATION BOX */}
      <GlobalFooter />
    </div>
  );
}
