import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import GlobalFooter from '../components/common/GlobalFooter';
import { 
  User as UserIcon, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  Database, 
  Sliders, 
  LogOut, 
  GraduationCap, 
  Radio, 
  MessageSquare, 
  ArrowRight,
  Activity,
  Award,
  Sparkles,
  BookOpen
} from 'lucide-react';

const BRANCH_NAMES = {
  'IT': 'Information Technology (IT)',
  'ECE': 'Electronics & Communication (ECE)',
  'CSE': 'Computer Science & Engineering (CSE)',
  'CSAI': 'Computer Science & AI (CSAI)',
  'CSDS': 'Computer Science & Data Science (CSDS)',
  'MAC': 'Mathematics & Computing (MAC)',
  'EE': 'Electrical Engineering (EE)',
  'ICE': 'Instrumentation & Control (ICE)',
  'MECH': 'Mechanical Engineering (MECH)',
  'BT': 'Biotechnology (BT)',
  'CIVIL': 'Civil Engineering (CIVIL)',
  'DESIGN': 'Design & Visual Arts (DESIGN)',
};

export default function PortalPage() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date().toISOString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toISOString().replace('T', ' // ').replace('Z', ' UTC'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const branchFullName = (user?.branch && BRANCH_NAMES[user.branch]) 
    ? BRANCH_NAMES[user.branch] 
    : (user?.branch || 'Information Technology (IT)');

  const semesterDisplay = user?.semester ? `Semester ${user.semester}` : 'Semester 1';
  const sectionDisplay = user?.section ? `Section ${user.section}` : 'Section 1';

  return (
    <div className="min-h-screen relative bg-black text-tactical-main font-mono flex flex-col justify-between selection:bg-phosphor selection:text-black">
      {/* CRT Textural Overlays */}
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      {/* TOP NAVBAR */}
      <Navbar />

      {/* HAZARD MONITOR DIVIDER */}
      <div className="fui-hazard-divider" />

      {/* SUB-HEADER STATUS BAR */}
      <div className="border-b border-stroke-dim bg-charcoal-base px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] text-tactical-muted">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">&gt;&gt; PORTAL_MATRIX:</span>
            <span className="text-tactical-bright font-bold">CROSSNEXUS CAMPUS DASHBOARD</span>
            <span className="text-stroke-bright">//</span>
            <span className="text-teal">{time}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-phosphor font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 bg-phosphor inline-block animate-pulse" />
              SESSION VERIFIED
            </span>
          </div>
        </div>
      </div>

      {/* MAIN OPERATIONS CONTENT */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-grow pb-20 md:pb-6 space-y-6">
        
        {/* ================================================================= */}
        {/* EXPANSIVE USER PROFILE CARD & IDENTITY MATRIX                     */}
        {/* ================================================================= */}
        <section className="fui-panel border border-stroke-bright bg-charcoal-panel p-6 relative">
          <div className="fui-reticle-tl" />
          <div className="fui-reticle-tr" />
          <div className="fui-reticle-bl" />
          <div className="fui-reticle-br" />

          {/* CARD HEADER */}
          <div className="fui-panel-header mb-6 pb-3 border-b border-stroke-dim flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <UserIcon className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-bold text-tactical-bright uppercase tracking-wider">
                // AUTHENTICATED USER IDENTITY MATRIX
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-tactical-muted uppercase">CLEARANCE LEVEL:</span>
              <span className={`px-2.5 py-0.5 text-xs font-bold font-mono uppercase tracking-wider ${
                role === 'admin' 
                  ? 'bg-red-500 text-black border border-red-400' 
                  : 'bg-yellow-400 text-black border border-yellow-300'
              }`}>
                {role === 'admin' ? '[ ADMINISTRATOR ]' : '[ STUDENT ]'}
              </span>
            </div>
          </div>

          {/* AVATAR & CORE IDENTITY BANNER */}
          <div className="bg-black border border-stroke-bright p-4 sm:p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 bg-charcoal-panel border-2 border-yellow-400 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_#facc15]">
                <GraduationCap className="w-7 h-7 text-yellow-400" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-tactical-bright uppercase tracking-tight flex items-center gap-2">
                  <span>{user?.name || 'Enrolled Student'}</span>
                  {role === 'admin' && (
                    <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5">ADMIN</span>
                  )}
                </div>
                <div className="text-xs text-teal font-mono mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{user?.email || 'student@nsut.ac.in'}</span>
                  <span className="text-stroke-bright">|</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-phosphor bg-phosphor/10 border border-phosphor/30 px-1.5 py-0.5">
                    <ShieldCheck className="w-3 h-3 text-phosphor" />
                    INSTITUTIONALLY VERIFIED (@nsut.ac.in)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <div className="border border-stroke-dim bg-charcoal-base px-3 py-1.5 text-center">
                <div className="text-[9px] text-tactical-muted uppercase">SYSTEM STATUS</div>
                <div className="text-phosphor font-bold text-xs mt-0.5">CALIBRATED</div>
              </div>
              <div className="border border-stroke-dim bg-charcoal-base px-3 py-1.5 text-center">
                <div className="text-[9px] text-tactical-muted uppercase">INSTITUTION</div>
                <div className="text-tactical-bright font-bold text-xs mt-0.5">NSUT DELHI</div>
              </div>
            </div>
          </div>

          {/* ACADEMIC SPECS 4-BLOCK GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6 text-xs font-mono">
            {/* BLOCK 1: BRANCH */}
            <div className="border-2 border-stroke-dim bg-black p-3.5 flex flex-col justify-between hover:border-yellow-400/50 transition-colors">
              <div className="text-[10px] text-tactical-muted uppercase tracking-label flex items-center justify-between">
                <span>BRANCH / DEPARTMENT</span>
                <BookOpen className="w-3 h-3 text-yellow-400" />
              </div>
              <div className="text-sm font-bold text-tactical-bright mt-2 truncate" title={branchFullName}>
                {branchFullName}
              </div>
              <div className="text-[10px] text-yellow-400 mt-1 uppercase font-semibold">
                CODE: {user?.branch || 'IT'}
              </div>
            </div>

            {/* BLOCK 2: SEMESTER */}
            <div className="border-2 border-stroke-dim bg-black p-3.5 flex flex-col justify-between hover:border-teal/50 transition-colors">
              <div className="text-[10px] text-tactical-muted uppercase tracking-label flex items-center justify-between">
                <span>CURRENT SEMESTER</span>
                <Sparkles className="w-3 h-3 text-teal" />
              </div>
              <div className="text-sm font-bold text-tactical-bright mt-2">
                {semesterDisplay}
              </div>
              <div className="text-[10px] text-teal mt-1 uppercase font-semibold">
                ACADEMIC TERM
              </div>
            </div>

            {/* BLOCK 3: SECTION / BATCH */}
            <div className="border-2 border-stroke-dim bg-black p-3.5 flex flex-col justify-between hover:border-phosphor/50 transition-colors">
              <div className="text-[10px] text-tactical-muted uppercase tracking-label flex items-center justify-between">
                <span>SECTION / BATCH</span>
                <Award className="w-3 h-3 text-phosphor" />
              </div>
              <div className="text-sm font-bold text-tactical-bright mt-2">
                {sectionDisplay}
              </div>
              <div className="text-[10px] text-phosphor mt-1 uppercase font-semibold">
                COHORT CLUSTER
              </div>
            </div>

            {/* BLOCK 4: SESSION */}
            <div className="border-2 border-stroke-dim bg-black p-3.5 flex flex-col justify-between hover:border-white/50 transition-colors">
              <div className="text-[10px] text-tactical-muted uppercase tracking-label flex items-center justify-between">
                <span>SESSION / ACADEMIC YEAR</span>
                <Calendar className="w-3 h-3 text-tactical-muted" />
              </div>
              <div className="text-sm font-bold text-tactical-bright mt-2">
                2026-27
              </div>
              <div className="text-[10px] text-tactical-muted mt-1 uppercase font-semibold">
                ANNUAL ACADEMIC CYCLE
              </div>
            </div>
          </div>

          {/* STATUS TELEMETRY & ROLE PERMISSIONS STRIP */}
          <div className="border border-stroke-dim bg-charcoal-base p-3 flex flex-wrap items-center justify-between gap-3 text-xs mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] text-tactical-muted uppercase">PERMISSIONS:</span>
              <span className="text-tactical-bright font-semibold">
                {role === 'admin' 
                  ? 'LEVEL 9 // FULL ADMINISTRATIVE CLEARANCE & BROADCAST DISPATCH' 
                  : 'LEVEL 1 // STANDARD ENROLLED STUDENT & VAULT REPOSITORY'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-tactical-muted uppercase">CALIBRATION:</span>
              <span className="text-phosphor font-bold">[PROFILE ACTIVE]</span>
            </div>
          </div>

          {/* ================================================================= */}
          {/* STEP 4: ENHANCED 4-BUTTON USER ACTION GRID                        */}
          {/* ================================================================= */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {/* Button 1: Primary Action (Schedule / Timetable) */}
            <button
              onClick={() => navigate('/timetable')}
              className="px-4 py-3 bg-black border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-mono font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 shadow-[2px_2px_0px_#facc15] cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>[ MY TIMETABLE ]</span>
            </button>

            {/* Button 2: Academic Vault */}
            <button
              onClick={() => navigate('/vault')}
              className="px-4 py-3 bg-black border-2 border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black font-mono font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 shadow-[2px_2px_0px_#00f0ff] cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>[ ACADEMIC VAULT ]</span>
            </button>

            {/* Button 3: Recalibrate Cohort / Edit Profile */}
            <button
              onClick={() => navigate('/onboard')}
              className="px-4 py-3 bg-black border-2 border-[#cfff04] text-[#cfff04] hover:bg-[#cfff04] hover:text-black font-mono font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 shadow-[2px_2px_0px_#cfff04] cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>[ EDIT PROFILE ]</span>
            </button>

            {/* Button 4: Sign Out */}
            <button
              onClick={handleLogout}
              className="px-4 py-3 bg-black border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-mono font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 shadow-[2px_2px_0px_#ef4444] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>[ SIGN OUT ]</span>
            </button>
          </div>
        </section>

        {/* TWO-COLUMN QUICK LAUNCH & CAMPUS MODULE INTEGRITY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: CORE PLATFORM SECTORS QUICK ACCESS */}
          <section className="lg:col-span-6 fui-panel border border-stroke-bright bg-charcoal-panel p-5">
            <div className="fui-panel-header mb-4">
              <span className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-phosphor" />
                CAMPUS INTELLIGENCE SECTORS
              </span>
              <span className="text-[10px] text-phosphor font-bold uppercase">4 CHANNELS ONLINE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
              <Link
                to="/feed"
                className="border border-stroke-dim hover:border-teal bg-black p-3.5 flex flex-col justify-between group transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-teal mb-1">
                    <Radio className="w-4 h-4" />
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="text-xs font-bold text-tactical-bright uppercase">OFFICIAL NOTICES</div>
                  <div className="text-[11px] text-tactical-muted mt-1">Campus announcements, exam notices &amp; T&amp;P circulars.</div>
                </div>
                <div className="text-[10px] text-teal mt-3 font-semibold uppercase">[ OPEN FEED ]</div>
              </Link>

              <Link
                to="/discussions"
                className="border border-stroke-dim hover:border-yellow-400 bg-black p-3.5 flex flex-col justify-between group transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-yellow-400 mb-1">
                    <MessageSquare className="w-4 h-4" />
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="text-xs font-bold text-tactical-bright uppercase">COMMUNITY FORUM</div>
                  <div className="text-[11px] text-tactical-muted mt-1">Student discussions, project collabs &amp; Q&amp;A threads.</div>
                </div>
                <div className="text-[10px] text-yellow-400 mt-3 font-semibold uppercase">[ OPEN DISCUSSIONS ]</div>
              </Link>

              <Link
                to="/timetable"
                className="border border-stroke-dim hover:border-phosphor bg-black p-3.5 flex flex-col justify-between group transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-phosphor mb-1">
                    <Calendar className="w-4 h-4" />
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="text-xs font-bold text-tactical-bright uppercase">SMART TIMETABLE</div>
                  <div className="text-[11px] text-tactical-muted mt-1">Cohort schedule tracker with offline continuity.</div>
                </div>
                <div className="text-[10px] text-phosphor mt-3 font-semibold uppercase">[ OPEN TIMETABLE ]</div>
              </Link>

              <Link
                to="/vault"
                className="border border-stroke-dim hover:border-[#00f0ff] bg-black p-3.5 flex flex-col justify-between group transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-[#00f0ff] mb-1">
                    <Database className="w-4 h-4" />
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="text-xs font-bold text-tactical-bright uppercase">ACADEMIC VAULT</div>
                  <div className="text-[11px] text-tactical-muted mt-1">Decentralized IPFS notes, syllabus &amp; PYQs.</div>
                </div>
                <div className="text-[10px] text-[#00f0ff] mt-3 font-semibold uppercase">[ OPEN VAULT ]</div>
              </Link>
            </div>
          </section>

          {/* RIGHT: CAMPUS CORE PLATFORM MODULES INTEGRITY */}
          <section className="lg:col-span-6 fui-panel border border-stroke-bright bg-charcoal-panel p-5">
            <div className="fui-panel-header mb-4">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-phosphor" />
                CAMPUS CORE PLATFORM MODULES
              </span>
              <span className="text-xs text-phosphor font-semibold">100% OPERATIONAL</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { title: 'Academic Setup & Cohort Sync', desc: 'Department, semester, and section cohort profile resolution.', tag: 'OPERATIONAL' },
                { title: 'Official Institutional Notices', desc: 'Real-time WebSocket alerts and priority bulletin broadcasts.', tag: 'OPERATIONAL' },
                { title: 'Student Community Forum', desc: 'Channel-categorized discussion threads with upvoting.', tag: 'OPERATIONAL' },
                { title: 'Smart Timetable Continuity', desc: 'Compound index cohort lookups with dual-layer offline caching.', tag: 'OPERATIONAL' },
                { title: 'Decentralized Academic Vault', desc: 'Deterministic SHA-256 multihash IPFS CIDv0 resource storage.', tag: 'OPERATIONAL' },
              ].map((item, idx) => (
                <div key={idx} className="border border-stroke-dim bg-black p-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-tactical-bright uppercase">{item.title}</div>
                    <div className="text-[11px] text-tactical-muted mt-0.5">{item.desc}</div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 bg-phosphor/10 border border-phosphor/30 text-phosphor font-bold uppercase tracking-wider flex-shrink-0">
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* CREATOR SPECIFICATION BOX */}
      <GlobalFooter />

      {/* FOOTER TICKER */}
      <footer className="border-t border-stroke-dim p-4 max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-3 text-[11px] text-tactical-muted font-mono">
        <div>CROSSNEXUS // CAMPUS OPERATING SYSTEM // ALL MODULES OPERATIONAL</div>
        <div className="flex items-center gap-3">
          <span>SYSTEM STATUS: PRODUCTION READY</span>
          <span className="text-phosphor font-bold">[ACTIVE]</span>
        </div>
      </footer>
    </div>
  );
}
