const mongoose = require('mongoose');

/**
 * Tactical Timetable Slot Schema
 * Represents an individual scheduled class or laboratory sortie.
 * Enforces strict 24h military time format (HH:mm) regex.
 */
const slotSchema = new mongoose.Schema({
  day: { 
    type: String, 
    enum: {
      values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      message: '{VALUE} is not a valid institutional academic weekday.'
    }, 
    required: [true, 'Academic weekday is mandatory.']
  },
  startTime: { 
    type: String, 
    required: [true, 'Slot start time is mandatory.'],
    match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must strictly match 24h military format (HH:mm)']
  },
  endTime: { 
    type: String, 
    required: [true, 'Slot end time is mandatory.'],
    match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must strictly match 24h military format (HH:mm)']
  },
  subjectCode: { type: String, required: [true, 'Subject code is mandatory.'], uppercase: true, trim: true },
  subjectName: { type: String, required: [true, 'Subject title is mandatory.'], trim: true },
  faculty: { type: String, default: 'TBA', trim: true },
  room: { type: String, required: [true, 'Room vector is mandatory.'], trim: true }
}, { _id: true });

/**
 * Primary Timetable Document Schema
 * Enforces compound unique indexing across academic cohort dimensions.
 */
const timetableSchema = new mongoose.Schema({
  branch: { type: String, required: true, uppercase: true, trim: true },
  semester: { type: Number, required: true, min: 1, max: 8 },
  section: { type: String, required: true, uppercase: true, trim: true },
  schedule: [slotSchema]
}, { timestamps: true });

// Compound Unique Index: instantaneous O(1) B-tree lookup across cohort parameters
timetableSchema.index({ branch: 1, semester: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
