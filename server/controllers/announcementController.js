const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');

// Authentic NSUT Campus Announcements Seed Buffer
let inMemoryAnnouncements = [
  {
    _id: 'seed-ann-01',
    title: 'OFFICIAL // MID-SEMESTER EXAMINATION SCHEDULE & SEATING MATRIX (ODD SEM 2026)',
    body: 'All B.Tech students are hereby informed that Mid-Semester Examinations commence from Monday. Seating plans for APJ Block (APJ-01 to APJ-12) and Block 6 will be displayed outside the Examination Cell. Ensure physical possession of your NSUT Smart Identity Card.',
    content: 'All B.Tech students are hereby informed that Mid-Semester Examinations commence from Monday. Seating plans for APJ Block (APJ-01 to APJ-12) and Block 6 will be displayed outside the Examination Cell. Ensure physical possession of your NSUT Smart Identity Card.',
    category: 'ACADEMIC',
    priority: 'critical',
    isPinned: true,
    author: {
      name: 'Academic Examination Cell',
      role: 'admin',
    },
    authorName: 'Academic Examination Cell',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    _id: 'seed-ann-02',
    title: 'CROSSLINKS // ANNUAL CAMPUS JOURNALIST & MEDIA TEAM RECRUITMENT',
    body: 'Crosslinks, the official student media and publication body of NSUT, is now accepting applications for Tech, Editorial, and Visual Design teams for the 2026-27 session. Online briefing tomorrow at 18:00 hrs.',
    content: 'Crosslinks, the official student media and publication body of NSUT, is now accepting applications for Tech, Editorial, and Visual Design teams for the 2026-27 session. Online briefing tomorrow at 18:00 hrs.',
    category: 'SOCIETY',
    priority: 'high',
    isPinned: true,
    author: {
      name: 'Crosslinks Media Body',
      role: 'admin',
    },
    authorName: 'Crosslinks Media Body',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    _id: 'seed-ann-03',
    title: 'TRAINING & PLACEMENT CELL // TIER-1 SDE MOCK ASSESSMENT LINK ACTIVE',
    body: 'The Training & Placement Cell (TNP) mock coding rounds are active in Mini CC Labs 1-3. All registered pre-final and final year candidates must log in with institutional credentials.',
    content: 'The Training & Placement Cell (TNP) mock coding rounds are active in Mini CC Labs 1-3. All registered pre-final and final year candidates must log in with institutional credentials.',
    category: 'PLACEMENT',
    priority: 'medium',
    isPinned: false,
    author: {
      name: 'Training & Placement Cell',
      role: 'admin',
    },
    authorName: 'Training & Placement Cell',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'seed-ann-04',
    title: 'ADMIN // APJ COMPLEX WING-B HVAC & WI-FI RE-CALIBRATION NOTICE',
    body: 'Maintenance activities in progress across APJ-03 and APJ-04 smart podiums. Lectures scheduled in these halls between 08:00 and 10:00 will proceed in normal hybrid mode.',
    content: 'Maintenance activities in progress across APJ-03 and APJ-04 smart podiums. Lectures scheduled in these halls between 08:00 and 10:00 will proceed in normal hybrid mode.',
    category: 'ADMIN',
    priority: 'low',
    isPinned: false,
    author: {
      name: 'Estate & Campus Management',
      role: 'admin',
    },
    authorName: 'Estate & Campus Management',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

/**
 * GET /api/announcements
 * Fetches official announcements sorted by isPinned DESC, createdAt DESC.
 * Strict Privacy: Never populates email or googleId.
 * Fallback Resilience: Serves seed announcements if DB collection is empty.
 */
const getAnnouncements = async (req, res) => {
  try {
    const { category, priority, limit = 50 } = req.query;

    const mapCategory = (cat) => {
      if (!cat || cat === 'ALL') return null;
      const c = cat.toUpperCase();
      if (c === 'EXAMS' || c === 'ACADEMIC' || c === 'ACADEMICS') return ['ACADEMIC', 'Exams', 'Academics'];
      if (c === 'PLACEMENTS' || c === 'PLACEMENT') return ['PLACEMENT', 'Placements'];
      if (c === 'ADMINISTRATION' || c === 'ADMIN') return ['ADMIN', 'Administration'];
      if (c === 'EVENTS' || c === 'SOCIETY' || c === 'SOCIETIES') return ['SOCIETY', 'Events', 'Societies'];
      return [cat];
    };

    const targetCategories = mapCategory(category);

    if (mongoose.connection.readyState === 1) {
      try {
        const filter = {};
        if (targetCategories) filter.category = { $in: targetCategories };
        if (priority && priority !== 'ALL') filter.priority = priority;

        const announcements = await Announcement.find(filter)
          .sort({ isPinned: -1, createdAt: -1 })
          .limit(parseInt(limit, 10))
          .populate('author', 'name role avatar'); // Sanitized: No email or googleId

        if (announcements.length > 0) {
          return res.status(200).json({
            success: true,
            count: announcements.length,
            data: announcements,
          });
        }
      } catch (dbErr) {
        console.warn('[ANNOUNCEMENTS_DB_WARN] MongoDB query failed, falling back to seed:', dbErr.message);
      }
    }

    let results = [...inMemoryAnnouncements];
    if (targetCategories) results = results.filter((a) => targetCategories.includes(a.category));
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
      message: 'Failed fetching announcements.',
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
        message: 'Announcement title and body content are required.',
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
      console.log(`[SOCKET_BROADCAST] Sent notice '${createdAnnouncement.title}' to campus_all.`);
    }

    return res.status(201).json({
      success: true,
      status: 'NOTICE_PUBLISHED',
      message: 'Official announcement published to campus feed.',
      data: createdAnnouncement,
    });
  } catch (error) {
    console.error('[ANNOUNCEMENT_CREATE_ERR]', error);
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: error.message || 'Failed creating announcement.',
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
      status: 'ANNOUNCEMENT_REMOVED',
      message: 'Announcement removed successfully.',
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