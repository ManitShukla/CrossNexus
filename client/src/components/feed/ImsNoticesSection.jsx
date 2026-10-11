import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import { 
  FileText, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  RefreshCw, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  Calendar, 
  UserCheck,
  Building2,
  HardDrive
} from 'lucide-react';

const CATEGORIES = ['ALL', 'EXAMS', 'RESULTS', 'PLACEMENTS', 'ACADEMICS', 'ADMIN'];
const NOTICES_PER_PAGE = 15;

export default function ImsNoticesSection() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState({ source: 'STANDBY', cachedAt: null, total: 0 });

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination & Interaction
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 300ms Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1); // Reset to first page on search change
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchNotices = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) setIsRefreshing(true);
      else setLoading(true);
      setError(null);

      const params = {};
      if (forceRefresh) params.refresh = 'true';

      const res = await api.get('/notices', { params });
      if (res.data?.success) {
        setNotices(res.data.data || []);
        setMetadata({
          source: res.data.source || 'LIVE',
          cachedAt: res.data.cachedAt || new Date().toISOString(),
          total: res.data.total || (res.data.data ? res.data.data.length : 0),
        });
      } else {
        throw new Error(res.data?.message || 'Failed to retrieve IMS notices.');
      }
    } catch (err) {
      console.error('[IMS_NOTICES_FETCH_ERR]', err);
      setError(err.message || 'Error communicating with notice proxy service.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // Client-side instant filtering with pipe-delimited search support
  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      // 1. Category check
      if (selectedCategory !== 'ALL' && notice.category !== selectedCategory) {
        return false;
      }

      // 2. Debounced search query (supports pipe "|" delimiters e.g. "exam | datesheet | 2026")
      if (!debouncedSearch.trim()) return true;

      const pipeTerms = debouncedSearch.split('|').map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (pipeTerms.length === 0) return true;

      const haystack = `${notice.title} ${notice.publisher || ''} ${notice.rawDate || ''} ${notice.category}`.toLowerCase();

      return pipeTerms.some((term) => {
        const words = term.split(/\s+/).filter(Boolean);
        return words.every((w) => haystack.includes(w));
      });
    });
  }, [notices, selectedCategory, debouncedSearch]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / NOTICES_PER_PAGE));
  const paginatedNotices = useMemo(() => {
    const startIndex = (currentPage - 1) * NOTICES_PER_PAGE;
    return filteredNotices.slice(startIndex, startIndex + NOTICES_PER_PAGE);
  }, [filteredNotices, currentPage]);

  const handleCopyLink = (notice) => {
    const linkToCopy = notice.isExternal 
      ? notice.url 
      : `${API_BASE_URL}/notices/view?url=${encodeURIComponent(notice.url)}`;

    navigator.clipboard.writeText(linkToCopy).then(() => {
      setCopiedId(notice.id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch((err) => {
      console.warn('Clipboard write failed:', err);
    });
  };

  const getNoticeViewUrl = (notice) => {
    if (notice.isExternal) {
      return notice.url;
    }
    return `${API_BASE_URL}/notices/view?url=${encodeURIComponent(notice.url)}`;
  };

  return (
    <div className="space-y-6">
      {/* DIRECTORY CONTROL HEADER */}
      <div className="fui-panel border border-stroke-bright bg-charcoal-panel p-4">
        <div className="fui-reticle-tl" />
        <div className="fui-reticle-tr" />
        <div className="fui-reticle-bl" />
        <div className="fui-reticle-br" />

        <div className="fui-panel-header mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span className="font-bold text-tactical-bright uppercase tracking-wider text-xs">
              OFFICIAL UNIVERSITY IMS CIRCULARS // DIRECTORY ARCHIVE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-teal font-semibold hidden sm:inline">
              [ PROXY ENGINE: ACTIVE // REFERER BYPASS ]
            </span>
            <button
              onClick={() => fetchNotices(true)}
              disabled={isRefreshing}
              className="px-2.5 py-1 bg-black border border-stroke-bright hover:border-yellow-400 text-tactical-bright hover:text-yellow-400 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Force sync live notices from IMS portal"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-yellow-400' : ''}`} />
              <span>{isRefreshing ? 'SYNCING...' : 'SYNC IMS'}</span>
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS TOOLBAR */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
          {/* CATEGORY FILTER CHIPS */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-xs uppercase font-mono font-bold border transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'border-yellow-400 bg-yellow-400 text-black shadow-[2px_2px_0px_#facc15]'
                    : 'border-stroke-dim text-zinc-300 hover:border-stroke-bright hover:text-white bg-black'
                }`}
              >
                [ {cat} ]
              </button>
            ))}
          </div>

          {/* DEBOUNCED SEARCH BAR */}
          <div className="flex items-center gap-2 border-2 border-stroke-dim focus-within:border-yellow-400 bg-black px-3 py-1.5 flex-grow lg:flex-grow-0 lg:w-96 transition-colors">
            <Search className="w-4 h-4 text-tactical-muted flex-shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="SEARCH (E.G. EXAM | DATESHEET | 2026)..."
              className="bg-transparent text-tactical-bright outline-none font-mono text-xs w-full placeholder:text-tactical-muted"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="text-[10px] text-tactical-muted hover:text-yellow-400 uppercase font-mono"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* TALLY & CACHE METADATA STRIP */}
        <div className="mt-4 pt-3 border-t border-stroke-dim flex flex-wrap items-center justify-between gap-2 text-[11px] text-tactical-muted font-mono">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-bold">&gt;&gt;</span>
            <span className="text-tactical-bright font-bold">
              DISPLAYING {filteredNotices.length} / {notices.length} OFFICIAL NOTICES
            </span>
            {selectedCategory !== 'ALL' && (
              <span className="text-stroke-bright">| CATEGORY: {selectedCategory}</span>
            )}
            {debouncedSearch && (
              <span className="text-teal">| FILTER: "{debouncedSearch}"</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            <span>CACHE: {metadata.source}</span>
            <span className="text-stroke-bright">//</span>
            <span>UPDATED: {metadata.cachedAt ? new Date(metadata.cachedAt).toLocaleTimeString() : 'RECENT'}</span>
          </div>
        </div>
      </div>

      {/* NOTICES DIRECTORY STREAM */}
      {loading ? (
        <div className="fui-panel border border-stroke-dim p-12 text-center bg-charcoal-panel">
          <div className="text-base text-yellow-400 font-mono tracking-widest mb-2 font-bold">
            SCRAPING IMS NOTICES ARCHIVE <span className="fui-cursor">█</span>
          </div>
          <div className="text-xs text-tactical-muted font-mono uppercase tracking-label">
            Resolving obfuscated notification tables from imsnsit.org...
          </div>
        </div>
      ) : error ? (
        <div className="border-2 border-red-500 bg-charcoal-base p-5 text-xs text-red-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-500" />
            <div>
              <div className="font-bold uppercase text-white">IMS CONNECTION EXCEPTION</div>
              <div className="text-[11px] mt-0.5 text-zinc-300">{error}</div>
            </div>
          </div>
          <button
            onClick={() => fetchNotices(true)}
            className="px-4 py-2 bg-black border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-black font-mono font-bold text-xs uppercase tracking-wider self-start sm:self-auto cursor-pointer"
          >
            [ RETRY LINK ]
          </button>
        </div>
      ) : paginatedNotices.length === 0 ? (
        <div className="fui-panel border border-stroke-dim p-12 text-center bg-charcoal-panel">
          <div className="text-xs text-tactical-muted uppercase tracking-label mb-2">
            // ZERO CIRCULARS MATCHING SEARCH SPECIFICATION
          </div>
          <div className="text-xs text-tactical-bright mt-1">
            No notices found under category '{selectedCategory}' {debouncedSearch ? `matching "${debouncedSearch}"` : ''}.
          </div>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSearchInput('');
            }}
            className="mt-4 px-3 py-1.5 bg-black border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            [ RESET ALL FILTERS ]
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {paginatedNotices.map((notice) => (
            <div
              key={notice.id}
              className="fui-panel border border-stroke-bright bg-charcoal-panel hover:border-yellow-400/80 p-4 transition-colors"
            >
              <div className="fui-reticle-tl" />
              <div className="fui-reticle-tr" />
              <div className="fui-reticle-bl" />
              <div className="fui-reticle-br" />

              {/* CARD METADATA HEADER */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 text-[11px] font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  {/* DATE BADGE */}
                  <span className="px-2 py-0.5 bg-black border border-stroke-bright text-tactical-bright font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-yellow-400" />
                    [ {notice.rawDate || notice.isoDate} ]
                  </span>

                  {/* CATEGORY PILL */}
                  <span className="px-2 py-0.5 bg-black border border-yellow-400 text-yellow-400 font-bold uppercase text-[10px] tracking-wider">
                    {notice.category}
                  </span>

                  {/* SOURCE PILL */}
                  {notice.isExternal ? (
                    <span className="px-2 py-0.5 bg-black border border-phosphor/40 text-phosphor text-[10px] font-semibold flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-phosphor" />
                      G_DRIVE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-black border border-teal/40 text-teal text-[10px] font-semibold flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-teal" />
                      IMS_PORTAL
                    </span>
                  )}
                </div>

                {/* PUBLISHER SIGNATURE */}
                {notice.publisher && (
                  <div className="text-[10px] text-tactical-muted uppercase truncate max-w-xs flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-tactical-muted flex-shrink-0" />
                    <span>{notice.publisher}</span>
                  </div>
                )}
              </div>

              {/* NOTICE TITLE */}
              <h3 className="text-sm font-bold text-tactical-bright font-mono leading-snug mb-4">
                {notice.title}
              </h3>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stroke-dim">
                {/* VIEW DOCUMENT (STREAMED VIA PROXY) */}
                <a
                  href={getNoticeViewUrl(notice)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-black border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-mono font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center gap-2 shadow-[2px_2px_0px_#facc15] cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>[ VIEW DOCUMENT ]</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {/* COPY DIRECT LINK */}
                <button
                  type="button"
                  onClick={() => handleCopyLink(notice)}
                  className="px-3 py-2 bg-black border-2 border-stroke-bright hover:border-white text-zinc-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === notice.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-phosphor" />
                      <span className="text-phosphor">[ COPIED ]</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-tactical-muted" />
                      <span>[ COPY URL ]</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="fui-panel border border-stroke-dim bg-charcoal-panel p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="text-tactical-muted">
            PAGE <span className="text-yellow-400 font-bold">{currentPage}</span> OF <span className="text-tactical-bright font-bold">{totalPages}</span> ({filteredNotices.length} TOTAL)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 bg-black border font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1 ${
                currentPage === 1
                  ? 'border-stroke-dim text-tactical-muted opacity-50 cursor-not-allowed'
                  : 'border-stroke-bright hover:border-yellow-400 text-tactical-bright hover:text-yellow-400 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>[ PREV ]</span>
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 bg-black border font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1 ${
                currentPage === totalPages
                  ? 'border-stroke-dim text-tactical-muted opacity-50 cursor-not-allowed'
                  : 'border-stroke-bright hover:border-yellow-400 text-tactical-bright hover:text-yellow-400 cursor-pointer'
              }`}
            >
              <span>[ NEXT ]</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
