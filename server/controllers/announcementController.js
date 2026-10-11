const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');

// In-memory telemetry buffer for local offline testing (Zero email leakage)
let inMemoryAnnouncements = [
  {
    _id: 'mock-ann-01',
    title: 'END-SEMESTER EXAMINATION SCHEDULE [DEC 2026]',
    body: 'Examination Cell has uploaded the provisional datesheet for all B.Tech branches. Cross-verify subject codes EC101, CS102, and MA101 with timetable portal.',
    category: 'Exams',
    priority: 'critical',
    isPinned: true,
    author: {
      name: 'Academic Affairs Admin',
      role: 'admin',
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'mock-ann-02',
    title: 'CAMPUS PLACEMENT DRIVE: TIER-1 CORE FIRMS',
    body: 'Training and Placement Cell registration window closes at 2359 HRS. Cadets must ensure verified resume hashes are attached.',
    category: 'Placements',
    priority: 'high',
    isPinned: false,
    author: {
      name: 'T&P Officer',
      role: 'admin',
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'mock-ann-03',
    title: 'CAMPUS NETWORK UPGRADE // WI-FI PORTAL SECTOR 03',
    body: 'Server telemetry maintenance scheduled between 0200-0400 HRS. Academic Vault nodes will remain reachable via Pinata IPFS gateway.',
    category: 'Administration',
    priority: 'low',
    isPinned: false,
    author: {
      name: 'Network Ops Command',
      role: 'admin',
    },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

/**
 * GET /api/announcements
 * Fetches official announcements sorted by isPinned DESC, createdAt DESC.
 * Strict Privacy: Never populates email or googleId.
 */
const getAnnouncements = async (req, res) => {
  try {
    const { category, priority, limit = 50 } = req.query;

    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (category && category !== 'ALL') filter.category = category;
      if (priority && priority !== 'ALL') filter.priority = priority;

      const announcements = await Announcement.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(parseInt(limit, 10))
        .populate('author', 'name role avatar'); // Sanitized: No email or googleId

      return res.status(200).json({
        success: true,
        count: announcements.length,
        data: announcements,
      });
    }

    let results = [...inMemoryAnnouncements];
    if (category && category !== 'ALL') results = results.filter((a) => a.category === category);
    if (priority && priority !== 'ALL') results = results.filter((a) => a.priority === priority);

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('[ANNOUNCEMENT_FETCH_ERR]', error);
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: 'Failed fetching command notices.',
    });
  }
};

/**
 * POST /api/announcements (Admin Only)
 */
const createAnnouncement = async (req, res) => {
  try {
    const { title, body, category = 'General', priority = 'medium', isPinned = false, attachments = [] } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        status: 'VALIDATION_FAILURE',
        message: 'Notice title and body content are required.',
      });
    }

    let createdAnnouncement;

    if (mongoose.connection.readyState === 1) {
      const newDoc = await Announcement.create({
        title: title.trim(),
        body: body.trim(),
        category,
        priority,
        isPinned: Boolean(isPinned),
        author: req.user._id,
        attachments,
      });

      createdAnnouncement = await Announcement.findById(newDoc._id).populate('author', 'name role avatar');
    } else {
      createdAnnouncement = {
        _id: 'mock-ann-' + Date.now(),
        title: title.trim(),
        body: body.trim(),
        category,
        priority,
        isPinned: Boolean(isPinned),
        author: {
          _id: req.user._id || req.user.id,
          name: req.user.name,
          role: req.user.role,
        },
        attachments,
        createdAt: new Date().toISOString(),
      };
      inMemoryAnnouncements.unshift(createdAnnouncement);
    }

    if (req.io) {
      req.io.to('campus_all').emit('new_announcement', createdAnnouncement);
      console.log(`[WSS_BROADCAST] Dispatched notice '${createdAnnouncement.title}' to campus_all.`);
    }

    return res.status(201).json({
      success: true,
      status: 'TRANSMISSION_BROADCAST',
      message: 'Official announcement deployed to campus telemetry.',
      data: createdAnnouncement,
    });
  } catch (error) {
    console.error('[ANNOUNCEMENT_CREATE_ERR]', error);
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: error.message || 'Failed creating notice.',
    });
  }
};

/**
 * DELETE /api/announcements/:id (Admin Only)
 */
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const deleted = await Announcement.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          status: 'NOT_FOUND',
          message: 'Announcement does not exist.',
        });
      }
    } else {
      inMemoryAnnouncements = inMemoryAnnouncements.filter((a) => a._id !== id);
    }

    if (req.io) {
      req.io.to('campus_all').emit('delete_announcement', { id });
    }

    return res.status(200).json({
      success: true,
      status: 'DECOMMISSIONED',
      message: 'Announcement removed from command buffer.',
      id,
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
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
};