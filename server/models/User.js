const mongoose = require('mongoose');

/**
 * Tactical User Schema (CrossNexus Core Identity)
 * Domain-restricted to @nsut.ac.in credentials.
 */
const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@nsut\.ac\.in$/,
        'Domain authorization failed: Email must strictly belong to @nsut.ac.in',
      ],
      index: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    branch: {
      type: String,
      uppercase: true,
      trim: true,
      default: null, // e.g., 'ECE', 'CSE', 'IT', 'MECH'
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
      default: null,
    },
    section: {
      type: String,
      uppercase: true,
      trim: true,
      default: null, // e.g., '1', '2'
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Tactical sanitization helper
userSchema.methods.toTacticalProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    branch: this.branch,
    semester: this.semester,
    section: this.section,
    isOnboarded: this.isOnboarded,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);