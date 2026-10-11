import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  FileText, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertCircle, 
  Trash2, 
  Database,
  User,
  Clock
} from 'lucide-react';

export default function ResourceCard({ resource, onVerifyToggle, onDelete }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isOwner = user?._id && (resource.uploadedBy?._id === user._id || resource.uploadedBy?.id === user._id);
  const canDelete = isAdmin || isOwner;

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(resource.ipfsHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('[HASH_CLIPBOARD_FAILED]', err);
    }
  };

  const handleVerifyToggle = async () => {
    if (!isAdmin || verifying) return;
    try {
      setVerifying(true);
      const res = await api.patch(`/vault/${resource._id}/verify`);
      if (res.data?.success && onVerifyToggle) {
        onVerifyToggle(resource._id, res.data.verified);
      }
    } catch (err) {
      console.error('[VERIFY_TOGGLE_ERR]', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete || deleting) return;
    const confirmPurge = window.confirm(`Confirm deletion of resource: ${resource.title}?`);
    if (!confirmPurge) return;

    try {
      setDeleting(true);
      const res = await api.delete(`/vault/${resource._id}`);
      if (res.data?.success && onDelete) {
        onDelete(resource._id);
      }
    } catch (err) {
      console.error('[DELETE_RESOURCE_ERR]', err);
    } finally {
      setDeleting(false);
    }
  };

  // Truncated CID for compact display
  const truncatedHash = resource.ipfsHash 
    ? `${resource.ipfsHash.slice(0, 10)}...${resource.ipfsHash.slice(-8)}`
    : 'UNKNOWN_CID';

  return (
    <article className="border border-stroke-dim bg-charcoal-panel hover:border-stroke-bright transition-all duration-150 flex flex-col justify-between">
      {/* CARD HEADER & METADATA */}
      <div className="p-4 border-b border-stroke-dim">
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* COURSE CODE BADGE */}
          <span className="px-2 py-0.5 text-xs font-mono font-bold tracking-wider border border-phosphor/60 bg-phosphor/10 text-phosphor">
            [ {resource.courseCode} ]
          </span>

          {/* TYPE BADGE */}
          <span className="text-[11px] font-mono uppercase tracking-wider text-teal border border-teal/30 bg-teal/5 px-2 py-0.5">
            // {resource.type}
          </span>
        </div>

        {/* RESOURCE TITLE */}
        <h3 className="text-sm font-bold text-tactical-bright tracking-tight leading-snug line-clamp-2 mt-2">
          {resource.title}
        </h3>

        {/* AUTHOR & UPLOAD METADATA (PRIVACY-PRESERVED) */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-tactical-muted font-mono border-t border-stroke-dim/60 pt-2.5">
          <div className="flex items-center gap-1.5 truncate max-w-[70%]">
            <User className="w-3 h-3 text-stroke-bright shrink-0" />
            <span className="text-tactical-main font-medium truncate">
              {resource.uploadedBy?.name || 'Student'}
            </span>
            {resource.uploadedBy?.branch && (
              <>
                <span className="text-stroke-bright">//</span>
                <span className="text-teal font-semibold">{resource.uploadedBy.branch}</span>
              </>
            )}
          </div>
          <span className="text-tactical-muted shrink-0">
            {formatFileSize(resource.fileSize)}
          </span>
        </div>
      </div>

      {/* STORAGE & IPFS TELEMETRY STRIP */}
      <div className="px-4 py-3 bg-black/40 border-b border-stroke-dim space-y-2">
        {/* CID TELEMETRY BADGE */}
        <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-tactical-muted truncate">
            <Database className="w-3.5 h-3.5 text-stroke-bright shrink-0" />
            <span className="text-stroke-bright">CID:</span>
            <span className="text-tactical-bright font-mono tracking-tight truncate" title={resource.ipfsHash}>
              {truncatedHash}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyHash}
            className={`px-2 py-1 text-[10px] uppercase font-mono tracking-wider border transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${
              copied
                ? 'border-phosphor bg-phosphor/20 text-phosphor'
                : 'border-stroke-dim hover:border-phosphor text-tactical-muted hover:text-phosphor'
            }`}
            title="Copy full IPFS hash to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-phosphor" />
                <span>[ COPIED ]</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>COPY HASH</span>
              </>
            )}
          </button>
        </div>

        {/* VERIFICATION STATUS BADGE */}
        <div className="flex items-center justify-between pt-1">
          {resource.verified ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 border border-phosphor/60 bg-phosphor/10 text-phosphor text-[10px] font-mono font-bold tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-phosphor shrink-0" />
              <span>[ VERIFIED STUDY MATERIAL ]</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 border border-teal/40 bg-teal/5 text-teal text-[10px] font-mono tracking-wider">
              <Clock className="w-3.5 h-3.5 text-teal shrink-0" />
              <span>[ PENDING VERIFICATION ]</span>
            </div>
          )}

          {resource.createdAt && (
            <span className="text-[10px] text-tactical-muted font-mono">
              {new Date(resource.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* CARD ACTION BUTTONS */}
      <div className="p-3 bg-charcoal-panel/80 flex flex-wrap items-center justify-between gap-2">
        <a
          href={`https://gateway.pinata.cloud/ipfs/${resource.ipfsHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-phosphor/80 bg-phosphor/10 text-phosphor hover:bg-phosphor hover:text-black transition-colors text-center cursor-pointer"
        >
          <span>OPEN DOCUMENT (IPFS)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {isAdmin && (
          <button
            type="button"
            onClick={handleVerifyToggle}
            disabled={verifying}
            className={`px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
              resource.verified
                ? 'border-hazard/60 text-hazard hover:bg-hazard hover:text-black'
                : 'border-teal/60 text-teal hover:bg-teal hover:text-black'
            }`}
          >
            {verifying ? 'UPDATING █' : resource.verified ? 'REVOKE' : 'VERIFY'}
          </button>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-stroke-bright hover:text-hazard border border-transparent hover:border-hazard/40 transition-colors cursor-pointer"
            title="Delete resource"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </article>
  );
}
