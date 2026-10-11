const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const { pinFileToIPFS } = require('../config/ipfs');

// Hydrate tactical initial seed resources for instant testing
let inMemoryResources = [
  {
    _id: 'mock-vault-01',
    title: 'Analog Electronics 2024 Mid-Sem PYQ & Detailed Solutions',
    courseCode: 'EC101',
    type: 'PYQ',
    ipfsHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    fileSize: 2451000,
    uploadedBy: {
      name: 'Rohan Verma',
      branch: 'ECE',
      role: 'student',
      avatar: '',
    },
    verified: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    _id: 'mock-vault-02',
    title: 'Data Structures & Linux Laboratory Operating Manual',
    courseCode: 'CS102',
    type: 'Lab Manual',
    ipfsHash: 'Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu',
    fileSize: 4890000,
    uploadedBy: {
      name: 'Dr. M. K. Rao',
      branch: 'CSE',
      role: 'admin',
      avatar: '',
    },
    verified: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    _id: 'mock-vault-03',
    title: 'Engineering Mathematics I Complete Lecture Notes (Dr. R. Gupta)',
    courseCode: 'MA101',
    type: 'Notes',
    ipfsHash: 'QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx',
    fileSize: 11200000,
    uploadedBy: {
      name: 'Priya Sen',
      branch: 'ECE',
      role: 'student',
      avatar: '',
    },
    verified: true,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    _id: 'mock-vault-04',
    title: 'Electronics Circuit Emulation & SPICE Simulation Blueprint',
    courseCode: 'EC101',
    type: 'Notes',
    ipfsHash: 'QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsMnR',
    fileSize: 1540000,
    uploadedBy: {
      name: 'Aditya Singh',
      branch: 'IT',
      role: 'student',
      avatar: '',
    },
    verified: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    _id: 'mock-vault-05',
    title: 'Applied Physics End-Sem Historical Examination Papers 2023-2025',
    courseCode: 'PH101',
    type: 'PYQ',
    ipfsHash: 'QmSrPmbaUKA3ZmWhuTqa2KcNFxjULDHpmmP8PYdITzrNX6',
    fileSize: 3120000,
    uploadedBy: {
      name: 'Command Staff',
      branch: 'ADMIN',
      role: 'admin',
      avatar: '',
    },
    verified: true,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    _id: 'mock-vault-06',
    title: 'Foundations of Computer Systems Curriculum & Lab Syllabus Matrix',
    courseCode: 'CS101',
    type: 'Syllabus',
    ipfsHash: 'QmdmQXB2mzChmMeKY47C43LxU2eKWhy7Hp3usNMuLvk2vd',
    fileSize: 450000,
    uploadedBy: {
      name: 'Kavya Nair',
      branch: 'ECE',
      role: 'student',
      avatar: '',
    },
    verified: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

/**
 * GET /api/vault
 * Retrieves pinned academic resources with courseCode, type, and verification filters.
 * STRICT PRIVACY: strictly projects { name, branch, role, avatar } and never leaks email/googleId.
 */
const getResources = async (req, res) => {
  try {
    const { courseCode, type, verified, search } = req.query;

    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (courseCode && courseCode !== 'ALL') {
        filter.courseCode = courseCode.trim().toUpperCase();
      }
      if (type && type !== 'ALL') {
        filter.type = type;
      }
      if (verified === 'true') {
        filter.verified = true;
      } else if (verified === 'false') {
        filter.verified = false;
      }
      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        filter.$or = [{ title: regex }, { courseCode: regex }];
      }

      const resources = await Resource.find(filter)
        .sort({ verified: -1, createdAt: -1 })
        .populate('uploadedBy', 'name branch role avatar');

      const allDocs = await Resource.find({});
      const totalBytes = allDocs.reduce((acc, r) => acc + (r.fileSize || 0), 0);
      const verifiedCount = allDocs.filter((r) => r.verified).length;

      return res.status(200).json({
        success: true,
        count: resources.length,
        stats: {
          totalBlocks: allDocs.length,
          totalBytes,
          verifiedCount,
          gatewayStatus: 'ONLINE',
        },
        data: resources,
      });
    }

    // In-Memory Dev Mode
    let results = [...inMemoryResources];
    if (courseCode && courseCode !== 'ALL') {
      const code = courseCode.trim().toUpperCase();
      results = results.filter((r) => r.courseCode === code);
    }
    if (type && type !== 'ALL') {
      results = results.filter((r) => r.type === type);
    }
    if (verified === 'true') {
      results = results.filter((r) => r.verified === true);
    } else if (verified === 'false') {
      results = results.filter((r) => r.verified === false);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(
        (r) => r.title.toLowerCase().includes(q) || r.courseCode.toLowerCase().includes(q)
      );
    }

    const totalBytes = inMemoryResources.reduce((acc, r) => acc + (r.fileSize || 0), 0);
    const verifiedCount = inMemoryResources.filter((r) => r.verified).length;

    return res.status(200).json({
      success: true,
      count: results.length,
      stats: {
        totalBlocks: inMemoryResources.length,
        totalBytes,
        verifiedCount,
        gatewayStatus: 'ONLINE',
      },
      data: results,
    });
  } catch (error) {
    console.error('[VAULT_GET_ERR]', error);
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: 'Failed retrieving Academic Vault telemetry.',
    });
  }
};

/**
 * POST /api/vault/upload
 * Multipart file upload -> Memory buffer -> Pinata IPFS -> Resource registration
 */
const uploadResource = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        status: 'VALIDATION_FAILURE',
        message: 'Binary file payload is mandatory.',
      });
    }

    const { title, courseCode, type } = req.body;
    if (!title || !courseCode || !type) {
      return res.status(400).json({
        success: false,
        status: 'VALIDATION_FAILURE',
        message: 'Title, Course Code, and Resource Type are mandatory.',
      });
    }

    const cleanCourseCode = courseCode.trim().toUpperCase();
    const cleanTitle = title.trim();

    // Stream buffer to IPFS
    const ipfsResult = await pinFileToIPFS(req.file.buffer, req.file.originalname, {
      courseCode: cleanCourseCode,
      type,
      title: cleanTitle,
    });

    const isCadetAdmin = req.user?.role === 'admin';

    let createdDoc;
    if (mongoose.connection.readyState === 1) {
      const doc = await Resource.create({
        title: cleanTitle,
        courseCode: cleanCourseCode,
        type,
        ipfsHash: ipfsResult.ipfsHash,
        fileSize: req.file.size,
        uploadedBy: req.user._id,
        verified: isCadetAdmin, // Admin uploads auto-verified; cadet uploads pending audit
      });

      createdDoc = await Resource.findById(doc._id).populate('uploadedBy', 'name branch role avatar');
    } else {
      createdDoc = {
        _id: 'mock-vault-' + Date.now(),
        title: cleanTitle,
        courseCode: cleanCourseCode,
        type,
        ipfsHash: ipfsResult.ipfsHash,
        fileSize: req.file.size,
        uploadedBy: {
          _id: req.user?._id || req.user?.id,
          name: req.user?.name || 'Tactical Cadet',
          branch: req.user?.branch || 'ECE',
          role: req.user?.role || 'student',
          avatar: req.user?.avatar || '',
        },
        verified: isCadetAdmin,
        createdAt: new Date().toISOString(),
      };
      inMemoryResources.unshift(createdDoc);
    }

    console.log(`[VAULT_PINNED] CID: ${ipfsResult.ipfsHash} | Course: ${cleanCourseCode} | Size: ${req.file.size}B`);

    return res.status(201).json({
      success: true,
      status: 'BLOCK_PINNED',
      message: 'Document cryptographically pinned to decentralized IPFS storage.',
      data: createdDoc,
    });
  } catch (error) {
    console.error('[VAULT_UPLOAD_ERR]', error);
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: error.message || 'Internal failure during IPFS transmission sequence.',
    });
  }
};

/**
 * PATCH /api/vault/:id/verify (Admin Only)
 * Toggles verification state for community uploaded assets
 */
const toggleVerifyResource = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const resource = await Resource.findById(id);
      if (!resource) {
        return res.status(404).json({
          success: false,
          status: 'NOT_FOUND',
          message: 'Resource record not found in vault registry.',
        });
      }

      resource.verified = !resource.verified;
      await resource.save();

      const updated = await Resource.findById(id).populate('uploadedBy', 'name branch role avatar');

      return res.status(200).json({
        success: true,
        status: 'VERIFICATION_UPDATED',
        verified: updated.verified,
        data: updated,
      });
    }

    const item = inMemoryResources.find((r) => r._id === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    item.verified = !item.verified;

    return res.status(200).json({
      success: true,
      status: 'VERIFICATION_UPDATED',
      verified: item.verified,
      data: item,
    });
  } catch (error) {
    console.error('[VAULT_VERIFY_ERR]', error);
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: error.message,
    });
  }
};

/**
 * DELETE /api/vault/:id
 * Removes resource metadata from registry
 */
const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const deleted = await Resource.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Record not found.' });
      }
    } else {
      inMemoryResources = inMemoryResources.filter((r) => r._id !== id);
    }

    return res.status(200).json({
      success: true,
      status: 'RECORD_PURGED',
      message: 'Resource decommissioned from active vault registry.',
      id,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getResources,
  uploadResource,
  toggleVerifyResource,
  deleteResource,
};
