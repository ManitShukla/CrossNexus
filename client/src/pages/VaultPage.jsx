import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../components/common/Navbar';
import ResourceCard from '../components/vault/ResourceCard';
import UploadResourceModal from '../components/vault/UploadResourceModal';
import api from '../services/api';
import { 
  Database, 
  Search, 
  Plus, 
  Filter, 
  HardDrive, 
  ShieldCheck, 
  Wifi, 
  RefreshCw,
  FolderOpen,
  FileQuestion
} from 'lucide-react';

const CATEGORIES = ['ALL', 'PYQ', 'Notes', 'Lab Manual', 'Syllabus'];

export default function VaultPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [onlyVerified, setOnlyVerified] = useState(false);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/vault');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setResources(res.data.data);
      } else {
        throw new Error(res.data?.message || 'Failed to retrieve vault records.');
      }
    } catch (err) {
      console.error('[VAULT_FETCH_ERROR]', err);
      setError(err.response?.data?.message || err.message || 'IPFS repository query rejected.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Telemetry Calculations
  const telemetry = useMemo(() => {
    const totalRecords = resources.length;
    const totalBytes = resources.reduce((acc, r) => acc + (r.fileSize || 0), 0);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
    const verifiedCount = resources.filter((r) => r.verified).length;
    const verifiedRatio = totalRecords > 0 ? Math.round((verifiedCount / totalRecords) * 100) : 100;

    return {
      totalRecords,
      totalMB,
      verifiedCount,
      verifiedRatio,
    };
  }, [resources]);

  // Client-side filtering
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      // Type filter
      if (selectedType !== 'ALL' && r.type !== selectedType) {
        return false;
      }
      // Verified filter
      if (onlyVerified && !r.verified) {
        return false;
      }
      // Search query (matches courseCode or title)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const codeMatch = r.courseCode?.toLowerCase().includes(q);
        const titleMatch = r.title?.toLowerCase().includes(q);
        if (!codeMatch && !titleMatch) return false;
      }
      return true;
    });
  }, [resources, selectedType, onlyVerified, searchQuery]);

  // Card callbacks
  const handleVerifyToggle = (id, newStatus) => {
    setResources((prev) =>
      prev.map((r) => (r._id === id ? { ...r, verified: newStatus } : r))
    );
  };

  const handleDelete = (id) => {
    setResources((prev) => prev.filter((r) => r._id !== id));
  };

  const handleUploadSuccess = (newResource) => {
    setResources((prev) => [newResource, ...prev]);
  };

  return (
    <div className="min-h-screen bg-black text-tactical-main font-mono flex flex-col selection:bg-phosphor selection:text-black">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* TELEMETRY BANNER */}
        <section className="border border-stroke-dim bg-charcoal-panel p-4">
          <div className="flex items-center justify-between gap-4 border-b border-stroke-dim pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-phosphor inline-block animate-pulse" />
              <h1 className="text-sm font-bold tracking-widest text-phosphor uppercase">
                // ACADEMIC VAULT // IPFS REPOSITORY
              </h1>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-teal">
              <Wifi className="w-3.5 h-3.5 text-teal animate-pulse" />
              <span className="hidden sm:inline">RESOURCE GATEWAY:</span>
              <span className="font-bold tracking-wider">ONLINE [PINATA IPFS]</span>
            </div>
          </div>

          {/* TELEMETRY SENSORS ROW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="border border-stroke-dim bg-black/50 p-3">
              <span className="text-[10px] text-tactical-muted block uppercase tracking-wider">
                TOTAL DOCUMENTS
              </span>
              <span className="text-base sm:text-lg font-bold text-phosphor">
                {telemetry.totalRecords} FILES
              </span>
            </div>

            <div className="border border-stroke-dim bg-black/50 p-3">
              <span className="text-[10px] text-tactical-muted block uppercase tracking-wider">
                STORAGE FOOTPRINT
              </span>
              <span className="text-base sm:text-lg font-bold text-teal">
                {telemetry.totalMB} MB
              </span>
            </div>

            <div className="border border-stroke-dim bg-black/50 p-3">
              <span className="text-[10px] text-tactical-muted block uppercase tracking-wider">
                VERIFICATION STATUS
              </span>
              <span className="text-base sm:text-lg font-bold text-phosphor">
                {telemetry.verifiedRatio}% VERIFIED
              </span>
            </div>

            <div className="border border-stroke-dim bg-black/50 p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-tactical-muted block uppercase tracking-wider">
                  STORAGE PROTOCOL
                </span>
                <span className="text-xs font-bold text-tactical-bright uppercase">
                  SHA-256 // BASE58
                </span>
              </div>
              <button
                type="button"
                onClick={fetchResources}
                disabled={loading}
                className="p-1.5 border border-stroke-dim hover:border-phosphor text-tactical-muted hover:text-phosphor transition-colors cursor-pointer"
                title="Refresh resources"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'text-phosphor animate-pulse' : ''}`} />
              </button>
            </div>
          </div>
        </section>

        {/* CONTROLS & FILTERING DOCK */}
        <section className="border border-stroke-dim bg-charcoal-panel p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* SEARCH INPUT */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stroke-bright absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH BY COURSE CODE (E.G. EC101) OR TITLE..."
                className="w-full bg-black border border-stroke-dim pl-9 pr-3 py-2 text-xs text-tactical-bright placeholder-tactical-muted/40 focus:border-phosphor focus:outline-none uppercase font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-tactical-muted hover:text-hazard font-mono cursor-pointer"
                >
                  [CLEAR]
                </button>
              )}
            </div>

            {/* VERIFIED ONLY TOGGLE & UPLOAD CTA */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyVerified(!onlyVerified)}
                className={`px-3 py-2 text-xs uppercase font-mono tracking-wider border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  onlyVerified
                    ? 'border-phosphor bg-phosphor/15 text-phosphor font-bold'
                    : 'border-stroke-dim bg-black/40 text-tactical-muted hover:border-stroke-bright hover:text-tactical-main'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{onlyVerified ? 'VERIFIED ONLY' : 'ALL DOCUMENTS'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2 border border-phosphor bg-phosphor text-black hover:bg-phosphor/90 font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>UPLOAD MATERIAL</span>
              </button>
            </div>
          </div>

          {/* CATEGORY FILTER PILLS */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stroke-dim/60 text-xs">
            <span className="text-[10px] text-tactical-muted uppercase tracking-wider mr-1">
              CATEGORY FILTER:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedType(cat)}
                className={`px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                  selectedType === cat
                    ? 'border-teal bg-teal/20 text-teal font-bold'
                    : 'border-stroke-dim bg-black/40 text-tactical-muted hover:border-stroke-bright hover:text-tactical-main'
                }`}
              >
                // {cat}
              </button>
            ))}
          </div>
        </section>

        {/* ERROR NOTICE */}
        {error && (
          <div className="border border-hazard bg-hazard/10 p-4 text-hazard font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-hazard inline-block animate-pulse" />
              <span>[NOTICE] {error}</span>
            </div>
            <button
              onClick={fetchResources}
              className="border border-hazard px-2.5 py-1 hover:bg-hazard hover:text-black uppercase text-[11px] cursor-pointer"
            >
              [ RETRY REQUEST ]
            </button>
          </div>
        )}

        {/* RESOURCE CARDS GRID */}
        {loading ? (
          <div className="border border-stroke-dim bg-charcoal-panel p-12 text-center space-y-2">
            <p className="text-phosphor font-bold tracking-widest text-xs animate-pulse">
              [ LOADING DOCUMENTS █ ]
            </p>
            <p className="text-[11px] text-tactical-muted">
              QUERYING IPFS RESOURCE GATEWAY...
            </p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="border border-dashed border-stroke-dim bg-charcoal-panel/60 p-12 text-center space-y-3">
            <FileQuestion className="w-8 h-8 text-stroke-bright mx-auto" />
            <h3 className="text-tactical-bright font-bold tracking-wider text-xs uppercase">
              [ NO RESOURCES FOUND ]
            </h3>
            <p className="text-[11px] text-tactical-muted max-w-md mx-auto">
              No matching academic resources found in repository. Adjust search filters or upload a new syllabus/PYQ document.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              {(searchQuery || selectedType !== 'ALL' || onlyVerified) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('ALL');
                    setOnlyVerified(false);
                  }}
                  className="px-3 py-1.5 border border-stroke-bright text-xs text-tactical-muted hover:text-white uppercase cursor-pointer"
                >
                  [ RESET FILTERS ]
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-1.5 border border-phosphor bg-phosphor/10 text-phosphor hover:bg-phosphor hover:text-black text-xs font-bold uppercase cursor-pointer"
              >
                + UPLOAD STUDY MATERIAL
              </button>
            </div>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((res) => (
              <ResourceCard
                key={res._id}
                resource={res}
                onVerifyToggle={handleVerifyToggle}
                onDelete={handleDelete}
              />
            ))}
          </section>
        )}
      </main>

      {/* UPLOAD MODAL COMPONENT */}
      <UploadResourceModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
