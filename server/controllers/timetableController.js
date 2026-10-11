const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');

let inMemoryTimetables = [];
try {
  inMemoryTimetables = require('../utils/seedTimetable.json');
} catch (e) {
  console.warn('[TIMETABLE_BOOT] Initializing empty seed buffer.');
}

/**
 * GET /api/timetable
 * Resolves tactical schedule for cadet cohort, falling back safely to query overrides or default seed.
 */
const getTimetable = async (req, res) => {
  try {
    const user = req.user || {};

    const rawBranch = typeof req.query.branch === 'string' && req.query.branch.trim()
      ? req.query.branch
      : (user.branch || 'ECE');

    const rawSemester = req.query.semester !== undefined
      ? parseInt(req.query.semester, 10)
      : (user.semester || 1);

    const rawSection = typeof req.query.section === 'string' && req.query.section.trim()
      ? req.query.section
      : (user.section || '1');

    const cleanBranch = String(rawBranch).trim().toUpperCase();
    const cleanSemester = isNaN(rawSemester) ? 1 : Math.max(1, Math.min(8, rawSemester));
    const cleanSection = String(rawSection).trim().toUpperCase();

    let timetable = null;

    if (mongoose.connection.readyState === 1) {
      timetable = await Timetable.findOne({
        branch: cleanBranch,
        semester: cleanSemester,
        section: cleanSection,
      });
    }

    if (!timetable) {
      timetable = inMemoryTimetables.find(
        (t) => t.branch === cleanBranch && t.semester === cleanSemester && t.section === cleanSection
      );
    }

    // Secondary fallback: match on branch if specific section is unmapped
    if (!timetable) {
      timetable = inMemoryTimetables.find((t) => t.branch === cleanBranch);
    }

    // Ultimate fallback: first available institutional seed matrix
    if (!timetable && inMemoryTimetables.length > 0) {
      timetable = inMemoryTimetables[0];
    }

    if (!timetable) {
      return res.status(404).json({
        success: false,
        status: 'SCHEDULE_UNAVAILABLE',
        message: `No active timetable schedule found for ${cleanBranch} - SEM ${cleanSemester} - SEC ${cleanSection}.`,
      });
    }

    return res.status(200).json({
      success: true,
      status: 'SCHEDULE_RESOLVED',
      cohort: {
        branch: timetable.branch || cleanBranch,
        semester: timetable.semester || cleanSemester,
        section: timetable.section || cleanSection,
      },
      data: timetable,
    });
  } catch (error) {
    console.error('[TIMETABLE_GET_ERR]', error);
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: 'Failed retrieving timetable schedule.',
    });
  }
};

/**
 * POST /api/timetable (Admin Only)
 * Bulk upserts cohort schedule matrix.
 */
const upsertTimetable = async (req, res) => {
  try {
    const { branch, semester, section, schedule } = req.body;

    if (!branch || !semester || !section || !Array.isArray(schedule)) {
      return res.status(400).json({
        success: false,
        status: 'VALIDATION_FAILURE',
        message: 'Branch, semester, section, and schedule slot array are mandatory.',
      });
    }

    const cleanBranch = String(branch).trim().toUpperCase();
    const cleanSemester = parseInt(semester, 10);
    const cleanSection = String(section).trim().toUpperCase();

    if (isNaN(cleanSemester) || cleanSemester < 1 || cleanSemester > 8) {
      return res.status(400).json({
        success: false,
        status: 'VALIDATION_FAILURE',
        message: 'Semester must be an integer between 1 and 8.',
      });
    }

    // Validate military time formatting for each slot
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (let i = 0; i < schedule.length; i++) {
      const s = schedule[i];
      if (!timeRegex.test(s.startTime) || !timeRegex.test(s.endTime)) {
        return res.status(400).json({
          success: false,
          status: 'VALIDATION_FAILURE',
          message: `Slot #${i + 1} (${s.subjectCode || 'UNKNOWN'}) contains invalid 24h time formatting. Expected HH:mm.`,
        });
      }
    }

    let updatedDoc;

    if (mongoose.connection.readyState === 1) {
      updatedDoc = await Timetable.findOneAndUpdate(
        { branch: cleanBranch, semester: cleanSemester, section: cleanSection },
        { schedule },
        { upsert: true, new: true, runValidators: true }
      );
    } else {
      const idx = inMemoryTimetables.findIndex(
        (t) => t.branch === cleanBranch && t.semester === cleanSemester && t.section === cleanSection
      );
      updatedDoc = {
        _id: 'mock-tt-' + Date.now(),
        branch: cleanBranch,
        semester: cleanSemester,
        section: cleanSection,
        schedule,
        updatedAt: new Date().toISOString(),
      };
      if (idx !== -1) {
        inMemoryTimetables[idx] = updatedDoc;
      } else {
        inMemoryTimetables.push(updatedDoc);
      }
    }

    return res.status(200).json({
      success: true,
      status: 'SCHEDULE_CALIBRATED',
      message: 'Timetable schedule updated successfully.',
      data: updatedDoc,
    });
  } catch (error) {
    console.error('[TIMETABLE_UPSERT_ERR]', error);
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: error.message || 'Internal error updating timetable matrix.',
    });
  }
};

module.exports = {
  getTimetable,
  upsertTimetable,
};
