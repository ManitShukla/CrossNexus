import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import Navbar from '../components/common/Navbar';
import AnnouncementCard from '../components/feed/AnnouncementCard';
import CreatePostModal from '../components/feed/CreatePostModal';
import ImsNoticesSection from '../components/feed/ImsNoticesSection';
import GlobalFooter from '../components/common/GlobalFooter';
import { 
  Radio, 
  Plus, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  MessageSquare, 
  ArrowRight, 
  Building2,
  Bell
} from 'lucide-react';

const ANNOUNCEMENT_CATEGORIES = ['ALL', 'Exams', 'Placements', 'Administration', 'Events', 'General'];
const PRIORITY_OPTIONS = ['ALL', 'high', 'medium', 'low'];

export default function FeedPage() {
  const { user, role } = useAuth();
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = role === 'admin';

  // Sub-Navigation Tab: 'announcements' vs 'ims_circulars'
  const initialTab = searchParams.get('tab') === 'ims' ? 'ims_circulars' : 'announcements';
  const [activeSubTab, setActiveSubTab] = useState(initialTab);

  // Sync tab with query params
  const handleTabChange = (tab) => {
    setActiveSubTab(tab);
    if (tab === 'ims_circulars') {
      setSearchParams({ tab: 'ims' });
    } else {
      setSearchParams({});
    }
  };

  // Feed State
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        category: activeCategory,
      };
      const res = await api.get('/announcements', { params });
      if (res.data?.success) {
        setAnnouncements(res.data.data || []);
      }
    } catch (err) {
      console.error('[FETCH_ANNOUNCEMENTS_ERR]', err);
      setError('Failed to retrieve official campus announcements.');
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Real-time live announcement interception via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleLiveAnnouncement = (newNotice) => {
      if (!newNotice || !newNotice._id) return;
      console.log(`[WSS_FEED] Live announcement received: '${newNotice.title}'`);
      setAnnouncements((prev) => {
        if (prev.some((a) => a._id === newNotice._id)) return prev;
        if (activeCategory !== 'ALL' && newNotice.category !== activeCategory) {
          return prev;
        }
        return [newNotice, ...prev];
      });
    };

    const handleDeleteLiveAnnouncement = ({ id }) => {
      if (!id) return;
      console.log(`[WSS_FEED] Notice removed: ${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    };

    socket.on('new_announcement', handleLiveAnnouncement);
    socket.on('delete_announcement', handleDeleteLiveAnnouncement);
    return () => {
      socket.off('new_announcement', handleLiveAnnouncement);
      socket.off('delete_announcement', handleDeleteLiveAnnouncement);
    };
  }, [socket, activeCategory]);

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('CONFIRM DELETION: Remove announcement permanently?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handlePostCreated = (newPost) => {
    setAnnouncements((prev) => [newPost, ...prev]);
  };

  // Client-side filtering by priority & search query
  const filteredAnnouncements = announcements.filter((ann) => {
    if (priorityFilter !== 'ALL' && ann.priority !== priorityFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = ann.title?.toLowerCase().includes(q);
    const bodyMatch = ann.body?.toLowerCase().includes(q);
    const catMatch = ann.category?.toLowerCase().includes(q);
    const authorMatch = ann.author?.name?.toLowerCase().includes(q);
    return titleMatch || bodyMatch || catMatch || authorMatch;
  });

  const pinnedCount = announcements.filter((a) => a.isPinned).length;

  return (
    <div className="min-h-screen bg-black text-tactical-main font-mono flex flex-col selection:bg-phosphor selection:text-black">
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      <Navbar />

      {/* SUB-HEADER STATUS STRIP */}
      <div className="border-b border-stroke-dim bg-charcoal-base px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] text-tactical-muted">
          <div className="flex items-center gap-2">
            <span className="text-teal">&gt;&gt; INSTITUTIONAL_BROADCAST:</span>
            <span className="text-tactical-bright font-bold">NSUT OFFICIAL NOTICES &amp; IMS ARCHIVE</span>
            <span className="text-stroke-bright">|</span>
            <span className="text-phosphor">CLEARANCE: {role?.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>PINNED: <span className="text-yellow-400 font-bold">{pinnedCount}</span></span>
            <span>CAMPUS NOTICES: <span className="text-teal font-bold">{announcements.length}</span></span>
            <button
              onClick={fetchAnnouncements}
              className="text-tactical-muted hover:text-teal flex items-center gap-1 cursor-pointer transition-colors"
              title="Refresh notices"
            >
              <RefreshCw className="w-3 h-3" />
              <span>SYNC</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-grow pb-20 md:pb-6">
        {/* CROSS-NAVIGATION RIBBON TO DISCUSSIONS */}
        <div className="border border-stroke-dim bg-charcoal-panel p-3 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-tactical-muted">
            <MessageSquare className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span>Looking for student community Q&amp;A, campus debates, or society threads?</span>
          </div>
          <Link
            to="/discussions"
            className="text-yellow-400 hover:text-black hover:bg-yellow-400 border border-yellow-400/60 hover:border-yellow-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            <span>[ OPEN CAMPUS DISCUSSIONS ]</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* ================================================================= */}
        {/* SUB-NAVIGATION TOGGLE: CAMPUS ANNOUNCEMENTS VS IMS CIRCULARS      */}
        {/* ================================================================= */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => handleTabChange('announcements')}
            className={`px-4 py-2.5 font-mono font-bold text-xs uppercase tracking-wider border-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'announcements'
                ? 'border-yellow-400 bg-yellow-400 text-black shadow-[2px_2px_0px_#facc15]'
                : 'border-stroke-dim text-zinc-300 hover:border-stroke-bright hover:text-white bg-black'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>[ CAMPUS ANNOUNCEMENTS ]</span>
          </button>

          <button
            onClick={() => handleTabChange('ims_circulars')}
            className={`px-4 py-2.5 font-mono font-bold text-xs uppercase tracking-wider border-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'ims_circulars'
                ? 'border-yellow-400 bg-yellow-400 text-black shadow-[2px_2px_0px_#facc15]'
                : 'border-stroke-dim text-zinc-300 hover:border-stroke-bright hover:text-white bg-black'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>[ OFFICIAL IMS CIRCULARS ]</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: OFFICIAL IMS CIRCULARS (SCRAPED DIRECTORY)                 */}
        {/* ================================================================= */}
        {activeSubTab === 'ims_circulars' && (
          <ImsNoticesSection />
        )}

        {/* ================================================================= */}
        {/* TAB 2: CAMPUS ANNOUNCEMENTS (ADMIN BROADCASTS)                     */}
        {/* ================================================================= */}
        {activeSubTab === 'announcements' && (
          <div className="space-y-6">
            {/* NOTICES CONTROL BAR */}
            <div className="fui-panel border border-stroke-bright bg-charcoal-panel p-4">
              <div className="fui-reticle-tl" />
              <div className="fui-reticle-tr" />
              <div className="fui-reticle-bl" />
              <div className="fui-reticle-br" />

              <div className="fui-panel-header mb-4">
                <span className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-teal" />
                  OFFICIAL CAMPUS BROADCASTS // REAL-TIME DISPATCH
                </span>
                {isAdmin && (
                  <button
                    onClick={() => setModalOpen(true)}
                    className="px-3 py-1.5 bg-black border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-mono font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 shadow-[2px_2px_0px_#ef4444] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>[ + POST NOTICE ]</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
                {/* CATEGORY TABS */}
                <div className="flex flex-wrap gap-1.5">
                  {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1 text-xs uppercase font-mono font-semibold border transition-colors cursor-pointer ${
                        activeCategory === cat
                          ? 'border-teal bg-teal text-black font-bold'
                          : 'border-stroke-dim text-zinc-300 hover:border-stroke-bright hover:text-white bg-black'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* CONTROLS: PRIORITY & SEARCH */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* SEARCH INPUT */}
                  <div className="flex items-center gap-1.5 border border-stroke-dim bg-black px-2.5 py-1 text-xs flex-grow sm:flex-grow-0">
                    <Search className="w-3.5 h-3.5 text-tactical-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="SEARCH BROADCASTS..."
                      className="bg-transparent text-tactical-bright outline-none font-mono text-xs w-32 sm:w-44 placeholder:text-tactical-muted"
                    />
                  </div>

                  {/* PRIORITY FILTER */}
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[10px] text-tactical-muted uppercase">PRIORITY:</span>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="bg-black border border-stroke-mid text-tactical-bright text-xs px-2 py-1 outline-none focus:border-teal font-mono cursor-pointer"
                    >
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ANNOUNCEMENTS STREAM */}
            {loading ? (
              <div className="fui-panel border border-stroke-dim p-12 text-center bg-charcoal-panel">
                <div className="text-base text-teal font-mono tracking-widest mb-2 font-bold">
                  FETCHING OFFICIAL NOTICES <span className="fui-cursor">█</span>
                </div>
                <div className="text-xs text-tactical-muted font-mono uppercase tracking-label">
                  Connecting to university institutional communications feed...
                </div>
              </div>
            ) : error ? (
              <div className="border border-hazard bg-charcoal-base p-4 text-xs text-hazard flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={fetchAnnouncements}
                  className="px-2 py-1 border border-hazard text-hazard hover:bg-hazard hover:text-black uppercase text-[10px] font-bold"
                >
                  [ RETRY ]
                </button>
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="fui-panel border border-stroke-dim p-12 text-center bg-charcoal-panel">
                <div className="text-xs text-tactical-muted uppercase tracking-label mb-2">
                  // NO OFFICIAL NOTICES MATCHING SELECTION
                </div>
                <div className="text-xs text-tactical-bright mt-1">
                  No bulletins published under category '{activeCategory}' {searchQuery ? `matching "${searchQuery}"` : ''}.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAnnouncements.map((ann) => (
                  <AnnouncementCard
                    key={ann._id}
                    announcement={ann}
                    onDelete={handleDeleteAnnouncement}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <GlobalFooter />

      {/* CREATE ANNOUNCEMENT MODAL */}
      <CreatePostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handlePostCreated}
        defaultType="announcement"
        isAdmin={isAdmin}
      />
    </div>
  );
}