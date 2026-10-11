const mongoose = require('mongoose');

/**
 * Academic Vault Decentralized Resource Schema
 * Maps institutional study assets pinned to the InterPlanetary File System (IPFS).
 */
const resourceSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Resource title is mandatory.'], 
    trim: true 
  },
  courseCode: { 
    type: String, 
    required: [true, 'Course code is mandatory.'], 
    uppercase: true, 
    trim: true,
    index: true 
  },
  type: { 
    type: String, 
    enum: {
      values: ['PYQ', 'Notes', 'Lab Manual', 'Syllabus'],
      message: '{VALUE} is not a valid academic resource type.'
    }, 
    required: [true, 'Resource category is mandatory.'] 
  },
  ipfsHash: { 
    type: String, 
    required: [true, 'IPFS Content Identifier (CID) is mandatory.'], 
    trim: true,
    index: true 
  },
  fileSize: { 
    type: Number, 
    default: 0 
  },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  verified: { 
    type: Boolean, 
    default: false,
    index: true 
  }
}, { timestamps: true });

// Compound index for category and course filtering
resourceSchema.index({ courseCode: 1, type: 1, verified: -1 });

module.exports = mongoose.model('Resource', resourceSchema);
