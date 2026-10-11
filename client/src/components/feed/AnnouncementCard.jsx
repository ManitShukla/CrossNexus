import React from 'react';
import { Pin, AlertCircle, ShieldAlert, Trash2, Calendar, FileText } from 'lucide-react';

export default function AnnouncementCard({ announcement, onDelete, isAdmin }) {
  const { _id, title, body, category, priority, isPinned, author, createdAt } = announcement;

  const isCritical = priority === 'critical';
  const isHigh = priority === 'high';

  // Strict FUI Border Hierarchies
  let borderStyle = 'border-stroke-dim hover:border-stroke-bright';
  let badgeStyle = 'text-teal border-teal/30 bg-teal/5';

  if (isCritical) {
    borderStyle = 'border-hazard bg-hazard/5';
    badgeStyle = 'text-hazard border-hazard bg-hazard/10 font-bold';
  } else if (isHigh) {
    borderStyle = 'border-phosphor/70 bg-phosphor/5';
    badgeStyle = 'text-phosphor border-phosphor/40 bg-phosphor/10 font-bold';
  }

  const formattedDate = new Date(createdAt).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

  return (
    <div className={`fui-panel border ${borderStyle} transition-all relative group mb-3`}>
      {/* CORNER RETICLES */}
      <div className={`fui-reticle-tl ${isCritical ? 'border-hazard' : ''}`} />
      <div className={`fui-reticle-tr ${isCritical ? 'border-hazard' : ''}`} />

      {/* HEADER RAIL */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-stroke-dim text-[10px] uppercase tracking-label">
        <div className="flex items-center gap-2">
          {isPinned && (
            <span className="flex items-center gap-1 text-phosphor border border-phosphor/40 bg-phosphor/10 px-1.5 py-0.5 font-bold">
              <Pin className="w-2.5 h-2.5 fill-phosphor" />
              [PINNED]
            </span>
          )}
          <span className={`px-1.5 py-0.5 border ${badgeStyle}`}>
            [{category}]
          </span>
          <span className={`px-1.5 py-0.5 border ${isCritical ? 'text-hazard border-hazard font-bold' : 'text-tactical-muted border-stroke-dim'}`}>
            [{priority}]
          </span>
        </div>

        <div className="flex items-center gap-2 text-tactical-muted">
          <span>{formattedDate}</span>
          {isAdmin && onDelete && (
            <button
              onClick={() => onDelete(_id)}
              className="text-tactical-muted hover:text-hazard transition-colors p-0.5"
              title="Purge Command Notice"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* NOTICE TITLE */}
      <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-ui mb-2 ${isCritical ? 'text-hazard' : isHigh ? 'text-phosphor' : 'text-tactical-bright'}`}>
        {title}
      </h3>

      {/* NOTICE BODY */}
      <p className="text-xs text-tactical-main leading-relaxed mb-3 whitespace-pre-line font-mono">
        {body}
      </p>

      {/* FOOTER METADATA */}
      <div className="pt-2 border-t border-stroke-dim/60 flex items-center justify-between text-[10px] text-tactical-muted">
        <div className="flex items-center gap-1.5">
          <span className="text-stroke-bright">&gt; TRANSMITTED_BY:</span>
          <span className="text-tactical-bright font-medium">{author?.name || 'Academic Command'}</span>
          <span className="text-teal font-mono">[{author?.role?.toUpperCase() || 'OFFICER'}]</span>
        </div>
        <span className="font-mono text-stroke-bright">SYS_NOTICE_ID: {_id.slice(-6).toUpperCase()}</span>
      </div>
    </div>
  );
}