const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * PUT /api/users/onboard
 * Sets up student profile with branch, semester, and section cohort parameters.
 */
const onboardUser = async (req, res) => {
  try {
    const { branch, semester, section } = req.body;

    if (!branch || !semester || !section) {
      return res.status(400).json({
        success: false,
        status: 'VALIDATION_FAILURE',
        message: 'Branch, Semester, and Section are mandatory parameters.',
      });
    }

    const parsedSemester = parseInt(semester, 10);
    if (isNaN(parsedSemester) || parsedSemester < 1 || parsedSemester > 8) {
      return res.status(400).json({
        success: false,
        status: 'VALIDATION_FAILURE',
        message: 'Semester parameter must be an integer between 1 and 8.',
      });
    }

    const VALID_BRANCHES = ['CSE', 'CSAI', 'CSDS', 'IT', 'ITNS', 'MAC', 'ECE', 'EE', 'ICE', 'MECH', 'BT', 'CIVIL', 'DESIGN'];
    const cleanBranch = branch.trim().toUpperCase();
    if (!VALID_BRANCHES.includes(cleanBranch)) {
      return res.status(400).json({
        success: false,
        status: 'VALIDATION_FAILURE',
        message: 'Branch ' + cleanBranch + ' is invalid. Must be an accredited NSUT department.',
      });
    }
    const cleanSection = section.toString().trim().toUpperCase();

    let updatedUser;

    if (mongoose.connection.readyState === 1) {
      updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          branch: cleanBranch,
          semester: parsedSemester,
          section: cleanSection,
          isOnboarded: true,
        },
        { new: true, runValidators: true }
      ).select('-__v');
    } else {
      // In-memory dev stub support
      req.user.branch = cleanBranch;
      req.user.semester = parsedSemester;
      req.user.section = cleanSection;
      req.user.isOnboarded = true;
      updatedUser = req.user;
    }

    console.log(`[USER_ONBOARDED] ${req.user.email} -> ${cleanBranch} | Sem ${parsedSemester} | Sec ${cleanSection}`);

    const profile = {
      id: updatedUser._id || updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar || '',
      role: updatedUser.role,
      branch: cleanBranch,
      semester: parsedSemester,
      section: cleanSection,
      isOnboarded: true,
      updatedAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      status: 'ONBOARDING_COMPLETE',
      message: 'Academic profile setup complete. Welcome to CrossNexus.',
      user: profile,
    });
  } catch (error) {
    console.error('[ONBOARDING_ERROR]', error);
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: error.message || 'Internal error during setup sequence.',
    });
  }
};

/**
 * GET /api/users/profile
 * Returns active user profile
 */
const getUserProfile = async (req, res) => {
  const profile = typeof req.user.toTacticalProfile === 'function' 
    ? req.user.toTacticalProfile() 
    : {
        id: req.user._id || req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar || '',
        role: req.user.role,
        branch: req.user.branch || null,
        semester: req.user.semester || null,
        section: req.user.section || null,
        isOnboarded: !!req.user.isOnboarded,
      };

  return res.status(200).json({
    success: true,
    user: profile,
  });
};

module.exports = {
  onboardUser,
  getUserProfile,
};