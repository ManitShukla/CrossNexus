import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Send, CornerDownRight, RefreshCw, MessageSquare } from 'lucide-react';

export default function CommentSection({ discussionId, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [discussionId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/discussions/${discussionId}/comments`);
      if (res.data?.success) {
        setComments(res.data.data || []);
      }
    } catch (err) {
      console.error('[COMMENT_FETCH_ERR]', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post(`/discussions/${discussionId}/comments`, {
        body: newComment.trim(),
      });

      if (res.data?.success) {
        setNewComment('');
        setComments((prev) => [...prev, res.data.data]);
        if (onCommentAdded) onCommentAdded();
      }
    } catch (err) {
      setError(err.message || 'Failed transmitting reply.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-stroke-dim bg-black/60 p-3">
      <div className="text-[10px] text-teal tracking-label uppercase mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3 text-teal" />
          [ DEPLOYMENT COMM-LOG ] ({comments.length} RESPONSES)
        </span>
        {loading && <span className="text-[10px] text-phosphor font-mono tracking-widest">[ SYNCING █ ]</span>}
      </div>

      {/* COMMENTS LIST */}
      <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
        {comments.length === 0 && !loading && (
          <div className="text-[11px] text-tactical-muted py-2 font-mono">
            // NO REPLIES RECORDED. AWAITING TELEMETRY █
          </div>
        )}

        {comments.map((comm) => (
          <div key={comm._id} className="border-l-2 border-stroke-mid pl-2.5 py-1 text-xs">
            <div className="flex items-center gap-2 text-[10px] text-tactical-muted mb-0.5">
              <span className="text-tactical-bright font-medium">{comm.author?.name || 'Cadet'}</span>
              {comm.author?.branch && <span className="text-teal">[{comm.author.branch}]</span>}
              <span className="text-stroke-bright">•</span>
              <span>{new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="text-tactical-main font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
              {comm.body}
            </p>
          </div>
        ))}
      </div>

      {/* INLINE COMPOSER */}
      <form onSubmit={handlePostComment} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="TRANSMIT FIELD REPLY..."
          className="flex-grow bg-charcoal-base border border-stroke-mid px-3 py-1.5 text-xs text-tactical-bright placeholder:text-tactical-muted font-mono focus:border-phosphor focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="fui-button py-1.5 px-3 text-[10px] flex items-center gap-1 border-stroke-bright hover:border-phosphor"
        >
          <span>&lt;SEND&gt;</span>
          <Send className="w-3 h-3 text-phosphor" />
        </button>
      </form>
    </div>
  );
}