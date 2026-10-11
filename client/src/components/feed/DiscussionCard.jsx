import React, { useState } from 'react';
import api from '../../services/api';
import CommentSection from './CommentSection';
import { ChevronUp, MessageSquare, Terminal, User } from 'lucide-react';

export default function DiscussionCard({ discussion, currentUserId }) {
  const { _id, title, body, channel, author, upvotes = [], commentCount = 0, createdAt } = discussion;

  const [upvoteList, setUpvoteList] = useState(upvotes);
  const [localCommentCount, setLocalCommentCount] = useState(commentCount);
  const [showComments, setShowComments] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);

  const hasUpvoted = upvoteList.some((id) => (typeof id === 'string' ? id : id?._id) === currentUserId);

  const handleToggleUpvote = async () => {
    if (isUpvoting) return;
    setIsUpvoting(true);

    try {
      const res = await api.post(`/discussions/${_id}/upvote`);
      if (res.data?.success) {
        if (res.data.upvoted) {
          setUpvoteList((prev) => [...prev, currentUserId]);
        } else {
          setUpvoteList((prev) => prev.filter((id) => (typeof id === 'string' ? id : id?._id) !== currentUserId));
        }
      }
    } catch (err) {
      console.error('[UPVOTE_FAIL]', err);
    } finally {
      setIsUpvoting(false);
    }
  };

  const channelColor =
    channel === 'Tech & Projects'
      ? 'text-phosphor border-phosphor/40 bg-phosphor/5'
      : channel === 'Academics'
      ? 'text-teal border-teal/40 bg-teal/5'
      : 'text-tactical-main border-stroke-bright bg-charcoal-base';

  const formattedDate = new Date(createdAt).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

  return (
    <div className="fui-panel border border-stroke-dim hover:border-stroke-bright transition-all mb-4 relative group">
      <div className="fui-reticle-tl" />
      <div className="fui-reticle-tr" />

      {/* HEADER RAIL */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-stroke-dim text-[10px] uppercase tracking-label">
        <div className="flex items-center gap-2">
          <span className={`px-1.5 py-0.5 border ${channelColor} font-bold`}>
            [{channel}]
          </span>
          <span className="text-tactical-muted font-mono">
            {formattedDate}
          </span>
        </div>
        <div className="text-tactical-muted flex items-center gap-1.5">
          <span className="text-stroke-bright">&gt; AUTHOR:</span>
          <span className="text-tactical-bright font-medium">{author?.name || 'Student'}</span>
          {author?.branch && <span className="text-teal font-mono">[{author.branch}]</span>}
        </div>
      </div>

      {/* THREAD TITLE */}
      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-ui text-tactical-bright mb-2 hover:text-phosphor cursor-pointer transition-colors flex items-center gap-1.5">
        <span className="text-phosphor text-xs">&gt;&gt;</span>
        {title}
      </h3>

      {/* THREAD CONTENT */}
      <p className="text-xs text-tactical-main leading-relaxed mb-4 whitespace-pre-line font-mono">
        {body}
      </p>

      {/* FOOTER ACTIONS */}
      <div className="pt-2 border-t border-stroke-dim/60 flex items-center justify-between text-xs">
        {/* UPVOTE TOGGLE */}
        <button
          onClick={handleToggleUpvote}
          disabled={isUpvoting}
          className={`px-2.5 py-1 text-[11px] border flex items-center gap-1.5 transition-all cursor-pointer ${
            hasUpvoted
              ? 'border-phosphor bg-phosphor text-black font-bold'
              : 'border-stroke-bright bg-charcoal-base text-tactical-muted hover:border-phosphor hover:text-phosphor'
          }`}
          title="Upvote discussion"
        >
          <ChevronUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'stroke-[3]' : ''}`} />
          <span>&lt;▲ {upvoteList.length}&gt;</span>
        </button>

        {/* COMMENT TOGGLE */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={`px-2.5 py-1 text-[11px] border border-stroke-dim bg-charcoal-base text-tactical-muted hover:border-stroke-bright hover:text-tactical-bright flex items-center gap-1.5 transition-colors cursor-pointer ${
            showComments ? 'border-teal text-teal' : ''
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-teal" />
          <span>&lt;REPLIES: {localCommentCount}&gt;</span>
        </button>
      </div>

      {/* EXPANDABLE COMMENT STREAM */}
      {showComments && (
        <CommentSection
          discussionId={_id}
          onCommentAdded={() => setLocalCommentCount((c) => c + 1)}
        />
      )}
    </div>
  );
}