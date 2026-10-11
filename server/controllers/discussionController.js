const mongoose = require('mongoose');
const Discussion = require('../models/Discussion');
const Comment = require('../models/Comment');

// In-memory telemetry buffer for local offline testing
let inMemoryDiscussions = [
  {
    _id: 'mock-disc-01',
    title: 'ROBOTICS SOCIETY: AUTONOMOUS DRONE WORKSHOP SIGNUP',
    body: 'Hardware deployment session scheduled in Block 6 Mechatronics Lab. Bring laptops with ROS2 and Linux environment pre-installed. Cadets from all years welcome.',
    channel: 'Tech & Projects',
    author: {
      name: 'Rohan Verma',
      role: 'student',
      branch: 'ECE',
    },
    upvotes: ['mock-cadet-01', 'mock-cadet-02', 'mock-cadet-03'],
    commentCount: 4,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    _id: 'mock-disc-02',
    title: 'ACADEMIC VAULT: PYQ UPLOAD FOR ANALOG ELECTRONICS EC101',
    body: 'Uploaded 2023-2025 Mid-Sem papers to Academic Vault IPFS storage node. Verified Pinata hash: QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco.',
    channel: 'Academics',
    author: {
      name: 'Priya Sen',
      role: 'student',
      branch: 'ECE',
    },
    upvotes: ['mock-cadet-01', 'mock-cadet-04'],
    commentCount: 2,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    _id: 'mock-disc-03',
    title: 'CAMPUS LIFE: MOKSHA 2027 COORDINATION COMMITTEE CALLOUT',
    body: 'Logistics, sponsorship, and stage operations sub-teams are recruiting volunteers. Report to Admin Quad at 1700 HRS.',
    channel: 'Campus Life',
    author: {
      name: 'Aditya Singh',
      role: 'student',
      branch: 'IT',
    },
    upvotes: ['mock-cadet-05'],
    commentCount: 1,
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
];

let inMemoryComments = [
  {
    _id: 'mock-comm-01',
    discussionId: 'mock-disc-01',
    author: {
      name: 'Kavya Nair',
      role: 'student',
    },
    body: 'Are PX4 flight controller simulation files available prior to session?',
    parentId: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

/**
 * GET /api/discussions
 */
const getDiscussions = async (req, res) => {
  try {
    const { channel, sort = 'latest', limit = 50 } = req.query;

    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (channel && channel !== 'ALL') filter.channel = channel;

      let query = Discussion.find(filter).limit(parseInt(limit, 10));

      if (sort === 'top') {
        // Sort by upvotes count
        query = query.sort({ commentCount: -1, createdAt: -1 });
      } else {
        query = query.sort({ createdAt: -1 });
      }

      const discussions = await query.populate('author', 'name role branch avatar');

      return res.status(200).json({
        success: true,
        count: discussions.length,
        data: discussions,
      });
    }

    let results = [...inMemoryDiscussions];
    if (channel && channel !== 'ALL') {
      results = results.filter((d) => d.channel === channel);
    }
    if (sort === 'top') {
      results.sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0));
    } else {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('[DISCUSSION_GET_ERR]', error);
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: 'Failed fetching thread telemetry.',
    });
  }
};

/**
 * POST /api/discussions
 */
const createDiscussion = async (req, res) => {
  try {
    const { title, body, channel = 'General' } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        status: 'VALIDATION_FAILURE',
        message: 'Thread title and body content are required.',
      });
    }

    let createdDiscussion;

    if (mongoose.connection.readyState === 1) {
      const doc = await Discussion.create({
        title: title.trim(),
        body: body.trim(),
        channel,
        author: req.user._id,
        upvotes: [req.user._id],
        commentCount: 0,
      });

      createdDiscussion = await Discussion.findById(doc._id).populate('author', 'name role branch avatar');
    } else {
      createdDiscussion = {
        _id: 'mock-disc-' + Date.now(),
        title: title.trim(),
        body: body.trim(),
        channel,
        author: {
          _id: req.user._id || req.user.id,
          name: req.user.name,
          role: req.user.role,
          branch: req.user.branch || 'CADET',
        },
        upvotes: [req.user._id || req.user.id],
        commentCount: 0,
        createdAt: new Date().toISOString(),
      };
      inMemoryDiscussions.unshift(createdDiscussion);
    }

    console.log(`[THREAD_DEPLOYED] Channel: ${channel} | Title: '${title.slice(0, 30)}...'`);

    return res.status(201).json({
      success: true,
      status: 'DEPLOYMENT_LIVE',
      message: 'Discussion transmission established.',
      data: createdDiscussion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: error.message,
    });
  }
};

/**
 * POST /api/discussions/:id/upvote
 * Toggles cadet ID in upvotes array
 */
const toggleUpvote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (mongoose.connection.readyState === 1) {
      const discussion = await Discussion.findById(id);
      if (!discussion) {
        return res.status(404).json({
          success: false,
          status: 'NOT_FOUND',
          message: 'Thread not found in registry.',
        });
      }

      const hasUpvoted = discussion.upvotes.some((u) => u.toString() === userId.toString());
      const updateOp = hasUpvoted
        ? { $pull: { upvotes: userId } }
        : { $addToSet: { upvotes: userId } };

      const updated = await Discussion.findByIdAndUpdate(id, updateOp, { new: true });

      return res.status(200).json({
        success: true,
        upvoted: !hasUpvoted,
        count: updated.upvotes.length,
      });
    }

    // In-memory toggle
    const thread = inMemoryDiscussions.find((d) => d._id === id);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found.' });
    }

    const idx = thread.upvotes.indexOf(userId);
    const hasUpvoted = idx !== -1;

    if (hasUpvoted) {
      thread.upvotes.splice(idx, 1);
    } else {
      thread.upvotes.push(userId);
    }

    return res.status(200).json({
      success: true,
      upvoted: !hasUpvoted,
      count: thread.upvotes.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: error.message,
    });
  }
};

/**
 * GET /api/discussions/:id/comments
 */
const getDiscussionComments = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const comments = await Comment.find({ discussionId: id })
        .sort({ createdAt: 1 })
        .populate('author', 'name role branch avatar');

      return res.status(200).json({
        success: true,
        count: comments.length,
        data: comments,
      });
    }

    const comments = inMemoryComments.filter((c) => c.discussionId === id);
    return res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: error.message,
    });
  }
};

/**
 * POST /api/discussions/:id/comments
 */
const createComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { body, parentId = null } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({
        success: false,
        status: 'VALIDATION_FAILURE',
        message: 'Comment content cannot be empty.',
      });
    }

    let createdComment;

    if (mongoose.connection.readyState === 1) {
      const commentDoc = await Comment.create({
        discussionId: id,
        author: req.user._id,
        body: body.trim(),
        parentId,
      });

      await Discussion.findByIdAndUpdate(id, { $inc: { commentCount: 1 } });
      createdComment = await Comment.findById(commentDoc._id).populate('author', 'name role branch avatar');
    } else {
      createdComment = {
        _id: 'mock-comm-' + Date.now(),
        discussionId: id,
        author: {
          _id: req.user._id || req.user.id,
          name: req.user.name,
          role: req.user.role,
        },
        body: body.trim(),
        parentId,
        createdAt: new Date().toISOString(),
      };
      inMemoryComments.push(createdComment);

      const parentThread = inMemoryDiscussions.find((d) => d._id === id);
      if (parentThread) parentThread.commentCount += 1;
    }

    return res.status(201).json({
      success: true,
      status: 'TRANSMISSION_RECORDED',
      data: createdComment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: error.message,
    });
  }
};

module.exports = {
  getDiscussions,
  createDiscussion,
  toggleUpvote,
  getDiscussionComments,
  createComment,
};