const mongoose = require('mongoose');
const Discussion = require('../models/Discussion');
const Comment = require('../models/Comment');

// Authentic NSUT Campus Discussions Seed Buffer
let inMemoryDiscussions = [
  {
    _id: 'seed-disc-01',
    title: 'Nescii Lawn Canteen vs Student Center (Kachori & Coffee): The definitive verdict?',
    body: 'Between the post-16:00 Nescii lawn counter coffee and the central canteen chhole bhature, what is your go-to sustenance during 4-hour lab blocks in APJ?',
    content: 'Between the post-16:00 Nescii lawn counter coffee and the central canteen chhole bhature, what is your go-to sustenance during 4-hour lab blocks in APJ?',
    channel: 'CAMPUS_LIFE',
    author: {
      name: 'Aarav Sharma',
      role: 'student',
      branch: 'IT',
    },
    authorName: 'Aarav Sharma (IT-1)',
    upvotes: Array.from({ length: 42 }, (_, i) => `user-mock-${i + 1}`),
    commentCount: 2,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    _id: 'seed-disc-02',
    title: 'Quantum Physics (FCPH0114) vs Electronics (FCEC0106) PYQs uploaded in Vault',
    body: 'Uploaded previous 5 years end-sem question papers with worked numericals for APJ-03 first year batches onto the Academic Vault. IPFS hash pinned.',
    content: 'Uploaded previous 5 years end-sem question papers with worked numericals for APJ-03 first year batches onto the Academic Vault. IPFS hash pinned.',
    channel: 'ACADEMICS',
    author: {
      name: 'Manit Shukla',
      role: 'student',
      branch: 'ECE',
    },
    authorName: 'Manit Shukla (ECE)',
    upvotes: Array.from({ length: 88 }, (_, i) => `user-mock-${i + 1}`),
    commentCount: 1,
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
  },
  {
    _id: 'seed-disc-03',
    title: 'Moksha-Innovision 2026 Core Working Committee Openings',
    body: 'Applications for sponsorship and stage ops for Moksha 2026 are opening this Friday. First round interviews will take place outside the Admin block auditorium.',
    content: 'Applications for sponsorship and stage ops for Moksha 2026 are opening this Friday. First round interviews will take place outside the Admin block auditorium.',
    channel: 'SOCIETY',
    author: {
      name: 'Student Council Secretariat',
      role: 'student',
      branch: 'ADMIN',
    },
    authorName: 'Student Council Secretariat',
    upvotes: Array.from({ length: 65 }, (_, i) => `user-mock-${i + 1}`),
    commentCount: 1,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

let inMemoryComments = [
  {
    _id: 'seed-comm-01',
    discussionId: 'seed-disc-01',
    author: {
      name: 'Priya Verma',
      role: 'student',
      branch: 'ECE',
    },
    authorName: 'Priya Verma (ECE-3)',
    body: 'Nescii coffee hits different during winters, hands down.',
    content: 'Nescii coffee hits different during winters, hands down.',
    parentId: null,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    _id: 'seed-comm-02',
    discussionId: 'seed-disc-01',
    author: {
      name: 'Rohan Gupta',
      role: 'student',
      branch: 'CSAI',
    },
    authorName: 'Rohan Gupta (CSAI-2)',
    body: 'Student center cold coffee + maggi after a brutal Quantum Physics tutorial.',
    content: 'Student center cold coffee + maggi after a brutal Quantum Physics tutorial.',
    parentId: null,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    _id: 'seed-comm-03',
    discussionId: 'seed-disc-02',
    author: {
      name: 'Devansh K.',
      role: 'student',
      branch: 'IT',
    },
    authorName: 'Devansh K. (IT-1)',
    body: 'Lifesaver! The wave mechanics derivation is identical to the 2024 paper.',
    content: 'Lifesaver! The wave mechanics derivation is identical to the 2024 paper.',
    parentId: null,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    _id: 'seed-comm-04',
    discussionId: 'seed-disc-03',
    author: {
      name: 'Ananya S.',
      role: 'student',
      branch: 'MAC',
    },
    authorName: 'Ananya S. (MAC-2)',
    body: 'Will technical societies get separate stalls near Mini CC?',
    content: 'Will technical societies get separate stalls near Mini CC?',
    parentId: null,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

/**
 * GET /api/discussions
 * Fetches feed with live MongoDB search, falling back to seed discussions if empty or offline.
 */
const getDiscussions = async (req, res) => {
  try {
    const { channel, sort = 'latest', limit = 50 } = req.query;

    const mapChannel = (ch) => {
      if (!ch || ch === 'ALL') return null;
      const c = ch.toUpperCase().replace(/\s+&\s+/g, '_').replace(/\s+/g, '_');
      if (c === 'CAMPUS_LIFE') return ['CAMPUS_LIFE', 'Campus Life'];
      if (c === 'ACADEMICS') return ['ACADEMICS', 'Academics'];
      if (c === 'SOCIETY' || c === 'SOCIETIES' || c === 'TECH_PROJECTS') return ['SOCIETY', 'Tech & Projects', 'Societies & Clubs'];
      return [ch, c];
    };

    const targetChannels = mapChannel(channel);

    if (mongoose.connection.readyState === 1) {
      try {
        const filter = {};
        if (targetChannels) filter.channel = { $in: targetChannels };

        let query = Discussion.find(filter).limit(parseInt(limit, 10));

        if (sort === 'top') {
          query = query.sort({ commentCount: -1, createdAt: -1 });
        } else {
          query = query.sort({ createdAt: -1 });
        }

        const discussions = await query.populate('author', 'name role branch avatar');

        if (discussions.length > 0) {
          return res.status(200).json({
            success: true,
            count: discussions.length,
            data: discussions,
          });
        }
      } catch (dbErr) {
        console.warn('[DISCUSSIONS_DB_WARN] MongoDB query failed, falling back to seed:', dbErr.message);
      }
    }

    let results = [...inMemoryDiscussions];
    if (targetChannels) {
      results = results.filter((d) => targetChannels.includes(d.channel));
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
      message: 'Failed fetching discussion threads.',
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
          branch: req.user.branch || 'STUDENT',
        },
        upvotes: [req.user._id || req.user.id],
        commentCount: 0,
        createdAt: new Date().toISOString(),
      };
      inMemoryDiscussions.unshift(createdDiscussion);
    }

    console.log(`[POST_CREATED] Channel: ${channel} | Title: '${title.slice(0, 30)}...'`);

    return res.status(201).json({
      success: true,
      status: 'POST_PUBLISHED',
      message: 'Discussion post created successfully.',
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
 * Toggles user ID in upvotes array
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
          message: 'Discussion thread not found.',
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
    let thread = inMemoryDiscussions.find((d) => d._id === id);
    if (!thread && (id === 'mock-disc-01' || String(id).startsWith('mock-') || String(id).startsWith('seed-'))) {
      thread = inMemoryDiscussions[0];
    }
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
      try {
        const comments = await Comment.find({ discussionId: id })
          .sort({ createdAt: 1 })
          .populate('author', 'name role branch avatar');

        if (comments.length > 0) {
          return res.status(200).json({
            success: true,
            count: comments.length,
            data: comments,
          });
        }
      } catch (dbErr) {
        console.warn('[COMMENTS_DB_WARN] MongoDB query failed, falling back to seed:', dbErr.message);
      }
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
      status: 'COMMENT_POSTED',
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