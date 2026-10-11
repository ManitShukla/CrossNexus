const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');

let inMemoryTimetables = [];
try {
  inMemoryTimetables = require('../utils/seedTimetable.json');
} catch (e) {
  console.warn('[TIMETABLE_BOOT] Initializing empty seed buffer.');
}

const studentTimetableData = inMemoryTimetables[0] || {
  branch: 'IT',
  semester: 1,
  section: '1',
  academicYear: '2026-27',
  schedule: [],
};

const adminTimetableData = inMemoryTimetables[1] || {
  branch: 'ECE',
  semester: 3,
  section: '3',
  academicYear: '2026-27',
  schedule: [],
};

/**
 * GET /api/timetable
 * Resolves academic schedule for cohort, universally defaulting to IT Sem 1 Sec 1 (1st.pdf)
 * or ECE Sem 3 Sec 3 (2nd.pdf) for Admin.
 */
const getTimetable = async (req, res) => {
  try {
    const user = req.user || {};

    const rawBranch = typeof req.query.branch === 'string' && req.query.branch.trim()
      ? req.query.branch
      : (user.branch || 'IT');

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
    let isFallback = false;

    // 1. Query live MongoDB Atlas if active
    if (mongoose.connection.readyState === 1) {
      try {
        timetable = await Timetable.findOne({
          branch: cleanBranch,
          semester: cleanSemester,
          section: cleanSection,
        });
      } catch (dbErr) {
        console.warn('[TIMETABLE_DB_WARN] MongoDB query failed, falling back to seed:', dbErr.message);
      }
    }

    // 2. In-memory / Universal Fallback Resolution
    if (!timetable) {
      if (cleanBranch === 'ECE' && cleanSemester === 3 && cleanSection === '3') {
        timetable = adminTimetableData;
      } else if (cleanBranch === 'IT' && cleanSemester === 1 && cleanSection === '1') {
        timetable = studentTimetableData;
      } else {
        // Universal Fallback Rule: For any new, guest, or unmapped cohort query,
        // automatically default to IT Semester 1, Section 1 (1st.pdf)
        timetable = studentTimetableData;
        isFallback = true;
      }
    }

    return res.status(200).json({
      success: true,
      status: 'SCHEDULE_RESOLVED',
      isFallback,
      cohort: {
        branch: timetable.branch || cleanBranch,
        semester: timetable.semester || cleanSemester,
        section: timetable.section || cleanSection,
        academicYear: timetable.academicYear || '2026-27',
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
