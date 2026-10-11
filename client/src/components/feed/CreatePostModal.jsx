import React, { useState } from 'react';
import api from '../../services/api';
import { X, Send, Radio, Terminal, Pin, AlertCircle } from 'lucide-react';

export default function CreatePostModal({ isOpen, onClose, onCreated, defaultType = 'discussion', isAdmin = false }) {
  const [postType, setPostType] = useState(defaultType); // 'discussion' or 'announcement'
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState('General');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('medium');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and transmission payload required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (postType === 'announcement' && isAdmin) {
        const res = await api.post('/announcements', {
          title: title.trim(),
          body: body.trim(),
          category,
          priority,
          isPinned,
        });
        if (res.data?.success) {
          onCreated(res.data.data, 'announcement');
          onClose();
        }
      } else {
        const res = await api.post('/discussions', {
          title: title.trim(),
          body: body.trim(),
          channel,
        });
        if (res.data?.success) {
          onCreated(res.data.data, 'discussion');
          onClose();
        }
      }
    } catch (err) {
      console.error('[POST_FAIL]', err);
      setError(err.message || 'Failed transmitting payload to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="fui-panel max-w-xl w-full border border-stroke-bright bg-charcoal-panel p-6 relative">
        <div className="fui-reticle-tl" />
        <div className="fui-reticle-tr" />
        <div className="fui-reticle-bl" />
        <div className="fui-reticle-br" />

        {/* MODAL HEADER */}
        <div className="fui-panel-header">
          <span className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-phosphor" />
            COMMUNICATION DISPATCH PROTOCOL
          </span>
          <button onClick={onClose} className="text-tactical-muted hover:text-hazard">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TYPE TOGGLE (IF ADMIN) */}
        {isAdmin && (
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setPostType('discussion')}
              className={`flex-1 py-1.5 text-xs uppercase tracking-ui border ${
                postType === 'discussion'
                  ? 'border-phosphor bg-phosphor/10 text-phosphor font-bold'
                  : 'border-stroke-dim text-tactical-muted'
              }`}
            >
              [ DISCUSSION THREAD ]
            </button>
            <button
              type="button"
              onClick={() => setPostType('announcement')}
              className={`flex-1 py-1.5 text-xs uppercase tracking-ui border ${
                postType === 'announcement'
                  ? 'border-hazard bg-hazard/10 text-hazard font-bold'
                  : 'border-stroke-dim text-tactical-muted'
              }`}
            >
              [ OFFICIAL NOTICE (ADMIN) ]
            </button>
          </div>
        )}

        {error && (
          <div className="border border-hazard bg-charcoal-base p-2.5 mb-4 text-xs text-hazard flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* TITLE INPUT */}
          <div>
            <label className="block text-[10px] text-teal tracking-label uppercase mb-1">
              &gt; TRANSMISSION HEADER / TITLE
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ENTER DISPATCH TITLE..."
              className="w-full bg-black border border-stroke-mid px-3 py-2 text-xs text-tactical-bright placeholder:text-tactical-muted font-mono focus:border-phosphor focus:outline-none"
              required
            />
          </div>

          {/* CHANNEL / CATEGORY SELECTORS */}
          {postType === 'discussion' ? (
            <div>
              <label className="block text-[10px] text-teal tracking-label uppercase mb-1">
                &gt; CHANNEL ROUTING
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['General', 'Academics', 'Tech & Projects', 'Campus Life'].map((ch) => (
                  <button
                    type="button"
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={`p-2 border text-[11px] uppercase tracking-tight text-center ${
                      channel === ch
                        ? 'border-phosphor bg-phosphor/10 text-phosphor font-bold'
                        : 'border-stroke-dim bg-black text-tactical-muted hover:border-stroke-bright'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-teal tracking-label uppercase mb-1">
                  &gt; NOTICE CATEGORY
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black border border-stroke-mid px-2.5 py-1.5 text-xs text-tactical-bright focus:border-phosphor focus:outline-none"
                >
                  {['Exams', 'Placements', 'Administration', 'Events', 'General'].map((c) => (
                    <option key={c} value={c} className="bg-charcoal-base">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-teal tracking-label uppercase mb-1">
                  &gt; SEVERITY TIER
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-black border border-stroke-mid px-2.5 py-1.5 text-xs text-tactical-bright focus:border-phosphor focus:outline-none"
                >
                  {['low', 'medium', 'high', 'critical'].map((p) => (
                    <option key={p} value={p} className="bg-charcoal-base">
                      {p.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-tactical-main">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="accent-phosphor w-4 h-4 bg-black border-stroke-mid"
                  />
                  <span>[PIN TO TOP RAIL]</span>
                </label>
              </div>
            </div>
          )}

          {/* BODY INPUT */}
          <div>
            <label className="block text-[10px] text-teal tracking-label uppercase mb-1">
              &gt; DISPATCH PAYLOAD / BODY
            </label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="ENTER TELEMETRY INTEL..."
              className="w-full bg-black border border-stroke-mid p-3 text-xs text-tactical-bright placeholder:text-tactical-muted font-mono focus:border-phosphor focus:outline-none leading-relaxed"
              required
            />
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="fui-button py-2 px-4 text-xs border-stroke-mid text-tactical-muted hover:border-stroke-bright"
            >
              &lt;ABORT&gt;
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="fui-button py-2 px-5 text-xs border-phosphor text-phosphor hover:bg-phosphor hover:text-black font-semibold flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>&lt;{isSubmitting ? 'TRANSMITTING...' : 'TRANSMIT DISPATCH'}&gt;</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}