import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import Navbar from '../components/common/Navbar';
import DiscussionCard from '../components/feed/DiscussionCard';
import AnnouncementCard from '../components/feed/AnnouncementCard';
import CreatePostModal from '../components/feed/CreatePostModal';
import { Terminal, Plus, RefreshCw, Radio, Flame, Clock, Filter, AlertOctagon, ShieldAlert } from 'lucide-react';

const DISCUSSION_CHANNELS = ['ALL', 'Tech & Projects', 'Academics', 'Campus Life', 'General'];
const ANNOUNCEMENT_CATEGORIES = ['ALL', 'Exams', 'Placements', 'Administration', 'Events', 'General'];

export default function FeedPage() {
  const { user, role } = useAuth();
  const { socket } = useSocket();
  const isAdmin = role === 'admin';

  // Feed State
  const [discussions, setDiscussions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [discError, setDiscError] = useState(null);
  const [annError, setAnnError] = useState(null);

  // Filters & Sorting
  const [activeChannel, setActiveChannel] = useState('ALL');
  const [discussionSort, setDiscussionSort] = useState('latest'); // 'latest' or 'top'
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('discussion');

  const fetchDiscussions = useCallback(async () => {
    try {
      setLoadingDiscussions(true);
      setDiscError(null);
      const params = {
        channel: activeChannel,
        sort: discussionSort,
      };
      const res = await api.get('/discussions', { params });
      if (res.data?.success) {
        setDiscussions(res.data.data || []);
      }
    } catch (err) {
      console.error('[FETCH_DISCUSSIONS_ERR]', err);
      setDiscError('Failed retrieving thread deployments.');
    } finally {
      setLoadingDiscussions(false);
    }
  }, [activeChannel, discussionSort]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoadingAnnouncements(true);
      setAnnError(null);
      const params = {
        category: activeCategory,
      };
      const res = await api.get('/announcements', { params });
      if (res.data?.success) {
        setAnnouncements(res.data.data || []);
      }
    } catch (err) {
      console.error('[FETCH_ANNOUNCEMENTS_ERR]', err);
      setAnnError('Failed fetching command notices.');
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Real-time live announcement interception via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleLiveAnnouncement = (newNotice) => {
      if (!newNotice || !newNotice._id) return;
      console.log(`[WSS_FEED_INTERCEPT] Live announcement received: '${newNotice.title}'`);
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
      console.log(`[WSS_FEED_INTERCEPT] Notice purged remotely: ${id}`);
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
    if (!window.confirm('CONFIRM RECORD PURGE: Permanently decommission notice?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      alert('Decommission failed: ' + err.message);
    }
  };

  const handlePostCreated = (newPost, type) => {
    if (type === 'announcement') {
      setAnnouncements((prev) => [newPost, ...prev]);
    } else {
      setDiscussions((prev) => [newPost, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-tactical-main font-mono flex flex-col selection:bg-phosphor selection:text-black">
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      <Navbar />

      {/* SUB-HEADER TELEMETRY STRIP */}
      <div className="border-b border-stroke-dim bg-charcoal-base px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] text-tactical-muted">
          <div className="flex items-center gap-2">
            <span className="text-phosphor">&gt;&gt; SECTOR_GRID:</span>
            <span className="text-tactical-bright font-semibold">NSUT CENTRAL COMM-HUB</span>
            <span className="text-stroke-bright">|</span>
            <span>ACTIVE CADET: {user?.email}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>DISCUSSIONS: <span className="text-teal font-semibold">{discussions.length}</span></span>
            <span>NOTICES: <span className="text-phosphor font-semibold">{announcements.length}</span></span>
          </div>
        </div>
      </div>

      {/* CORE TWO-COLUMN TACTICAL FEED GRID */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(420px,1.45fr)_minmax(320px,1fr)] gap-6 items-start">
          
          {/* ================================================================= */}
          {/* LEFT COLUMN: ACTIVE DISCUSSIONS & FORUMS                          */}
          {/* ================================================================= */}
          <section className="flex flex-col">
            {/* COLUMN CONTROL BAR */}
            <div className="fui-panel border border-stroke-bright bg-charcoal-panel mb-4 p-3.5">
              <div className="fui-panel-header">
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-phosphor" />
                  ACTIVE DEPLOYMENTS // CADET FORUMS
                </span>
                <button
                  onClick={() => {
                    setModalType('discussion');
                    setModalOpen(true);
                  }}
                  className="fui-button py-1 px-2.5 text-[10px] text-phosphor border-phosphor flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>&lt;DEPLOY THREAD&gt;</span>
                </button>
              </div>

              {/* CHANNELS & SORT FILTERS */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                {/* CHANNEL TABS */}
                <div className="flex flex-wrap gap-1">
                  {DISCUSSION_CHANNELS.map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setActiveChannel(ch)}
                      className={`px-2 py-1 text-[10px] uppercase border transition-colors ${
                        activeChannel === ch
                          ? 'border-phosphor bg-phosphor/10 text-phosphor font-bold'
                          : 'border-stroke-dim text-tactical-muted hover:border-stroke-bright hover:text-tactical-bright'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>

                {/* SORT TOGGLE */}
                <div className="flex items-center gap-1 border border-stroke-dim p-0.5 bg-black text-[10px]">
                  <button
                    onClick={() => setDiscussionSort('latest')}
                    className={`px-2 py-0.5 flex items-center gap-1 ${
                      discussionSort === 'latest' ? 'bg-charcoal-panel text-phosphor font-bold' : 'text-tactical-muted'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    LATEST
                  </button>
                  <button
                    onClick={() => setDiscussionSort('top')}
                    className={`px-2 py-0.5 flex items-center gap-1 ${
                      discussionSort === 'top' ? 'bg-charcoal-panel text-phosphor font-bold' : 'text-tactical-muted'
                    }`}
                  >
                    <Flame className="w-3 h-3" />
                    TOP
                  </button>
                </div>
              </div>
            </div>

            {/* DISCUSSIONS STREAM */}
            {loadingDiscussions ? (
              <div className="fui-panel border border-stroke-dim p-8 text-center bg-charcoal-panel">
                <div className="text-base text-phosphor font-mono tracking-widest mb-2 font-bold">
                  AWAITING TELEMETRY <span className="fui-cursor">█</span>
                </div>
                <div className="text-[11px] text-tactical-muted font-mono uppercase tracking-label">
                  Scanning campus deployment channels...
                </div>
              </div>
            ) : discError ? (
              <div className="border border-hazard bg-charcoal-base p-4 text-xs text-hazard flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{discError}</span>
              </div>
            ) : discussions.length === 0 ? (
              <div className="fui-panel border border-stroke-dim p-8 text-center bg-charcoal-panel">
                <div className="text-xs text-tactical-muted uppercase tracking-label">
                  [ ERR ] NO ACTIVE DEPLOYMENTS RETURNED
                </div>
                <div className="text-[11px] text-tactical-muted mt-2">
                  No transmissions in channel '{activeChannel}'. Be the first cadet to broadcast.
                </div>
              </div>
            ) : (
              <div>
                {discussions.map((disc) => (
                  <DiscussionCard
                    key={disc._id}
                    discussion={disc}
                    currentUserId={user?._id || user?.id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: OFFICIAL ANNOUNCEMENTS & SYSTEM LOGS                */}
          {/* ================================================================= */}
          <aside className="flex flex-col sticky top-16">
            <div className="fui-panel border border-stroke-bright bg-charcoal-panel p-3.5 mb-4">
              <div className="fui-panel-header">
                <span className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-teal" />
                  SYSTEM LOGS // OFFICIAL NOTICES
                </span>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setModalType('announcement');
                      setModalOpen(true);
                    }}
                    className="fui-button py-1 px-2.5 text-[10px] text-hazard border-hazard/50 hover:border-hazard flex items-center gap-1.5"
                  >
                    <Plus className="w-3 h-3 text-hazard" />
                    <span>&lt;+ BROADCAST NOTICE&gt;</span>
                  </button>
                )}
              </div>

              {/* CATEGORY FILTERS */}
              <div className="flex flex-wrap gap-1 text-[10px]">
                {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2 py-0.5 border uppercase transition-colors ${
                      activeCategory === cat
                        ? 'border-teal bg-teal/15 text-teal font-bold'
                        : 'border-stroke-dim text-tactical-muted hover:border-stroke-bright hover:text-tactical-bright'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* ANNOUNCEMENTS STREAM */}
            {loadingAnnouncements ? (
              <div className="fui-panel border border-stroke-dim p-8 text-center bg-charcoal-panel">
                <div className="text-base text-teal font-mono tracking-widest mb-2 font-bold">
                  ACQUIRING COMMAND DOWNLINK <span className="fui-cursor">█</span>
                </div>
                <div className="text-[11px] text-tactical-muted font-mono uppercase tracking-label">
                  Intercepting high-priority administrative broadcasts...
                </div>
              </div>
            ) : annError ? (
              <div className="border border-hazard bg-charcoal-base p-4 text-xs text-hazard flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{annError}</span>
              </div>
            ) : announcements.length === 0 ? (
              <div className="fui-panel border border-stroke-dim p-6 text-center bg-charcoal-panel">
                <div className="text-xs text-tactical-muted uppercase tracking-label">
                  // NO OFFICIAL NOTICES FOR CATEGORY '{activeCategory}'
                </div>
              </div>
            ) : (
              <div>
                {announcements.map((ann) => (
                  <AnnouncementCard
                    key={ann._id}
                    announcement={ann}
                    onDelete={handleDeleteAnnouncement}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* CREATE POST / NOTICE MODAL */}
      <CreatePostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handlePostCreated}
        defaultType={modalType}
        isAdmin={isAdmin}
      />
    </div>
  );
}