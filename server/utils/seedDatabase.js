const mongoose = require('mongoose');
const User = require('../models/User');
const Timetable = require('../models/Timetable');
const Announcement = require('../models/Announcement');
const Discussion = require('../models/Discussion');
const Comment = require('../models/Comment');
const seedTimetables = require('./seedTimetable.json');

/**
 * Autonomous Database Seeder: seedIfEmpty
 * Populates MongoDB Atlas collections with authentic NSUT datasets if collections are empty.
 */
const seedIfEmpty = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  try {
    // 1. Ensure System Identities exist for author linkages
    let adminUser = await User.findOne({ email: 'admin@nsut.ac.in' });
    if (!adminUser) {
      adminUser = await User.create({
        googleId: 'sys-admin-nsut',
        name: 'Campus Administrator',
        email: 'admin@nsut.ac.in',
        role: 'admin',
        branch: 'ECE',
        semester: 3,
        section: '3',
        isOnboarded: true,
      });
    }

    let studentUser = await User.findOne({ email: 'student@nsut.ac.in' });
    if (!studentUser) {
      studentUser = await User.create({
        googleId: 'sys-student-nsut',
        name: 'Student',
        email: 'student@nsut.ac.in',
        role: 'student',
        branch: 'IT',
        semester: 1,
        section: '1',
        isOnboarded: true,
      });
    }

    // 2. Timetable Seeding (IT Sem 1 Sec 1 and ECE Sem 3 Sec 3)
    const timetableCount = await Timetable.countDocuments();
    if (timetableCount === 0) {
      for (const tData of seedTimetables) {
        await Timetable.create({
          branch: tData.branch,
          semester: tData.semester,
          section: tData.section,
          academicYear: tData.academicYear || '2026-27',
          schedule: tData.schedule,
        });
      }
      console.log('\x1b[32m%s\x1b[0m', `[AUTO_SEED] Successfully seeded ${seedTimetables.length} authentic NSUT timetables into MongoDB Atlas.`);
    }

    // 3. Announcements Seeding
    const announcementCount = await Announcement.countDocuments();
    if (announcementCount === 0) {
      const seedAnnouncementsData = [
        {
          title: 'OFFICIAL // MID-SEMESTER EXAMINATION SCHEDULE & SEATING MATRIX (ODD SEM 2026)',
          body: 'All B.Tech students are hereby informed that Mid-Semester Examinations commence from Monday. Seating plans for APJ Block (APJ-01 to APJ-12) and Block 6 will be displayed outside the Examination Cell. Ensure physical possession of your NSUT Smart Identity Card.',
          category: 'ACADEMIC',
          priority: 'critical',
          isPinned: true,
          author: adminUser._id,
        },
        {
          title: 'CROSSLINKS // ANNUAL CAMPUS JOURNALIST & MEDIA TEAM RECRUITMENT',
          body: 'Crosslinks, the official student media and publication body of NSUT, is now accepting applications for Tech, Editorial, and Visual Design teams for the 2026-27 session. Online briefing tomorrow at 18:00 hrs.',
          category: 'SOCIETY',
          priority: 'high',
          isPinned: true,
          author: adminUser._id,
        },
        {
          title: 'TRAINING & PLACEMENT CELL // TIER-1 SDE MOCK ASSESSMENT LINK ACTIVE',
          body: 'The Training & Placement Cell (TNP) mock coding rounds are active in Mini CC Labs 1-3. All registered pre-final and final year candidates must log in with institutional credentials.',
          category: 'PLACEMENT',
          priority: 'medium',
          isPinned: false,
          author: adminUser._id,
        },
        {
          title: 'ADMIN // APJ COMPLEX WING-B HVAC & WI-FI RE-CALIBRATION NOTICE',
          body: 'Maintenance activities in progress across APJ-03 and APJ-04 smart podiums. Lectures scheduled in these halls between 08:00 and 10:00 will proceed in normal hybrid mode.',
          category: 'ADMIN',
          priority: 'low',
          isPinned: false,
          author: adminUser._id,
        },
      ];

      await Announcement.insertMany(seedAnnouncementsData);
      console.log('\x1b[32m%s\x1b[0m', `[AUTO_SEED] Successfully seeded ${seedAnnouncementsData.length} authentic NSUT announcements into MongoDB Atlas.`);
    }

    // 4. Discussions & Comments Seeding
    const discussionCount = await Discussion.countDocuments();
    if (discussionCount === 0) {
      const disc1 = await Discussion.create({
        title: 'Nescii Lawn Canteen vs Student Center (Kachori & Coffee): The definitive verdict?',
        body: 'Between the post-16:00 Nescii lawn counter coffee and the central canteen chhole bhature, what is your go-to sustenance during 4-hour lab blocks in APJ?',
        channel: 'CAMPUS_LIFE',
        author: studentUser._id,
        upvotes: [studentUser._id, adminUser._id],
        commentCount: 2,
      });

      await Comment.create({
        discussionId: disc1._id,
        author: adminUser._id,
        body: 'Nescii coffee hits different during winters, hands down.',
      });

      await Comment.create({
        discussionId: disc1._id,
        author: studentUser._id,
        body: 'Student center cold coffee + maggi after a brutal Quantum Physics tutorial.',
      });

      const disc2 = await Discussion.create({
        title: 'Quantum Physics (FCPH0114) vs Electronics (FCEC0106) PYQs uploaded in Vault',
        body: 'Uploaded previous 5 years end-sem question papers with worked numericals for APJ-03 first year batches onto the Academic Vault. IPFS hash pinned.',
        channel: 'ACADEMICS',
        author: studentUser._id,
        upvotes: [studentUser._id],
        commentCount: 1,
      });

      await Comment.create({
        discussionId: disc2._id,
        author: studentUser._id,
        body: 'Lifesaver! The wave mechanics derivation is identical to the 2024 paper.',
      });

      const disc3 = await Discussion.create({
        title: 'Moksha-Innovision 2026 Core Working Committee Openings',
        body: 'Applications for sponsorship and stage ops for Moksha 2026 are opening this Friday. First round interviews will take place outside the Admin block auditorium.',
        channel: 'SOCIETY',
        author: adminUser._id,
        upvotes: [adminUser._id, studentUser._id],
        commentCount: 1,
      });

      await Comment.create({
        discussionId: disc3._id,
        author: studentUser._id,
        body: 'Will technical societies get separate stalls near Mini CC?',
      });

      console.log('\x1b[32m%s\x1b[0m', '[AUTO_SEED] Successfully seeded authentic NSUT discussions & comments into MongoDB Atlas.');
    }
  } catch (seedErr) {
    console.warn('[AUTO_SEED_ERR] Seeding routine encountered warning:', seedErr.message);
  }
};

module.exports = { seedIfEmpty };
