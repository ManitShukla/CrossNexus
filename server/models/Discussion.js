const mongoose = require('mongoose');

/**
 * Tactical Discussion Schema (Active Deployments & Forums)
 */
const discussionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      enum: ['CAMPUS_LIFE', 'ACADEMICS', 'SOCIETY', 'General', 'Academics', 'Tech & Projects', 'Campus Life'],
      default: 'General',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    commentCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

discussionSchema.index({ channel: 1, createdAt: -1 });

module.exports = mongoose.model('Discussion', discussionSchema);