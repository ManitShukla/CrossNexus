import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import DiscussionCard from '../components/feed/DiscussionCard';
import CreatePostModal from '../components/feed/CreatePostModal';
import GlobalFooter from '../components/common/GlobalFooter';
import { 
  Terminal, 
  Plus, 
  Flame, 
  Clock, 
  Search, 
  Radio, 
  ShieldAlert, 
  ArrowRight,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

const DISCUSSION_CHANNELS = ['ALL', 'Tech & Projects', 'Academics', 'Campus Life', 'General'];

export default function DiscussionsPage() {
  const { user } = useAuth();

  // State
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [activeChannel, setActiveChannel] = useState('ALL');
  const [discussionSort, setDiscussionSort] = useState('latest'); // 'latest' | 'top'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);

  const fetchDiscussions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
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
      setError('Failed to retrieve discussions from server.');
    } finally {
      setLoading(false);
    }
  }, [activeChannel, discussionSort]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  const handlePostCreated = (newPost) => {
    setDiscussions((prev) => [newPost, ...prev]);
  };

  // Filter discussions by search query client-side
  const filteredDiscussions = discussions.filter((disc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = disc.title?.toLowerCase().includes(q);
    const bodyMatch = disc.body?.toLowerCase().includes(q);
    const authorMatch = disc.author?.name?.toLowerCase().includes(q);
    const channelMatch = disc.channel?.toLowerCase().includes(q);
    return titleMatch || bodyMatch || authorMatch || channelMatch;
  });

  return (
    <div className="min-h-screen bg-black text-tactical-main font-mono flex flex-col selection:bg-phosphor selection:text-black">
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      <Navbar />

      {/* SUB-HEADER STATUS STRIP */}
      <div className="border-b border-stroke-dim bg-charcoal-base px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] text-tactical-muted">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">&gt;&gt; CAMPUS_COMMUNITY:</span>
            <span className="text-tactical-bright font-bold">NSUT STUDENT DISCUSSIONS &amp; FORUM</span>
            <span className="text-stroke-bright">|</span>
            <span className="text-teal">USER: {user?.email}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>ACTIVE THREADS: <span className="text-yellow-400 font-bold">{discussions.length}</span></span>
            <button
              onClick={fetchDiscussions}
              className="text-tactical-muted hover:text-yellow-400 flex items-center gap-1 cursor-pointer transition-colors"
              title="Refresh discussions"
            >
              <RefreshCw className="w-3 h-3" />
              <span>SYNC</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-grow pb-20 md:pb-6">
        {/* CROSS-NAVIGATION RIBBON TO OFFICIAL FEED */}
        <div className="border border-stroke-dim bg-charcoal-panel p-3 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-tactical-muted">
            <Radio className="w-4 h-4 text-teal flex-shrink-0" />
            <span>Looking for official administrative notices, exam circulars, or placement alerts?</span>
          </div>
          <Link
            to="/feed"
            className="text-teal hover:text-white border border-teal/40 hover:border-teal px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            <span>[ OPEN CAMPUS NOTICES FEED ]</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* FORUM TOOLBAR PANEL */}
        <div className="fui-panel border border-stroke-bright bg-charcoal-panel mb-6 p-4">
          <div className="fui-reticle-tl" />
          <div className="fui-reticle-tr" />
          <div className="fui-reticle-bl" />
          <div className="fui-reticle-br" />

          <div className="fui-panel-header mb-4">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-yellow-400" />
              COMMUNITY CHANNELS // FORUM THREADS
            </span>
            <button
              onClick={() => setModalOpen(true)}
              className="px-3 py-1.5 bg-black border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-mono font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 shadow-[2px_2px_0px_#facc15] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>[ + CREATE THREAD ]</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
            {/* CHANNEL BUTTONS */}
            <div className="flex flex-wrap gap-1.5">
              {DISCUSSION_CHANNELS.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setActiveChannel(ch)}
                  className={`px-3 py-1 text-xs uppercase font-mono font-semibold border transition-colors cursor-pointer ${
                    activeChannel === ch
                      ? 'border-yellow-400 bg-yellow-400 text-black font-bold'
                      : 'border-stroke-dim text-zinc-300 hover:border-stroke-bright hover:text-white bg-black'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* CONTROLS: SORT & SEARCH */}
            <div className="flex flex-wrap items-center gap-3">
              {/* SEARCH INPUT */}
              <div className="flex items-center gap-1.5 border border-stroke-dim bg-black px-2.5 py-1 text-xs flex-grow sm:flex-grow-0">
                <Search className="w-3.5 h-3.5 text-tactical-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="FILTER THREADS..."
                  className="bg-transparent text-tactical-bright outline-none font-mono text-xs w-32 sm:w-44 placeholder:text-tactical-muted"
                />
              </div>

              {/* SORT TOGGLE */}
              <div className="flex items-center border border-stroke-dim p-0.5 bg-black text-xs">
                <button
                  onClick={() => setDiscussionSort('latest')}
                  className={`px-2.5 py-1 flex items-center gap-1 cursor-pointer font-bold ${
                    discussionSort === 'latest' ? 'bg-yellow-400 text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  LATEST
                </button>
                <button
                  onClick={() => setDiscussionSort('top')}
                  className={`px-2.5 py-1 flex items-center gap-1 cursor-pointer font-bold ${
                    discussionSort === 'top' ? 'bg-yellow-400 text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  TOP
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DISCUSSIONS STREAM */}
        {loading ? (
          <div className="fui-panel border border-stroke-dim p-12 text-center bg-charcoal-panel">
            <div className="text-base text-yellow-400 font-mono tracking-widest mb-2 font-bold">
              HYDRATING COMMUNITY FORUM <span className="fui-cursor">█</span>
            </div>
            <div className="text-xs text-tactical-muted font-mono uppercase tracking-label">
              Retrieving peer discussions and replies from central repository...
            </div>
          </div>
        ) : error ? (
          <div className="border border-hazard bg-charcoal-base p-4 text-xs text-hazard flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchDiscussions}
              className="px-2 py-1 border border-hazard text-hazard hover:bg-hazard hover:text-black uppercase text-[10px] font-bold"
            >
              [ RETRY ]
            </button>
          </div>
        ) : filteredDiscussions.length === 0 ? (
          <div className="fui-panel border border-stroke-dim p-12 text-center bg-charcoal-panel">
            <div className="text-xs text-tactical-muted uppercase tracking-label mb-2">
              [ NOTICE ] NO DISCUSSIONS MATCHING CRITERIA
            </div>
            <div className="text-xs text-tactical-bright mt-1">
              No threads found for channel '{activeChannel}' {searchQuery ? `matching "${searchQuery}"` : ''}.
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 px-4 py-2 bg-black border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-[2px_2px_0px_#facc15] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>[ START FIRST THREAD ]</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDiscussions.map((disc) => (
              <DiscussionCard
                key={disc._id}
                discussion={disc}
                currentUserId={user?._id || user?.id}
              />
            ))}
          </div>
        )}
      </main>

      <GlobalFooter />

      {/* CREATE DISCUSSION MODAL */}
      <CreatePostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handlePostCreated}
        defaultType="discussion"
        isAdmin={false}
      />
    </div>
  );
}
