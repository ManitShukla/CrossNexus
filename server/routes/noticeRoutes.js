const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');

// GET /api/notices -> List categorized IMS circulars with search & category filtering
router.get('/', noticeController.getNotices);

// GET /api/notices/view -> Stream notice PDF with Referer header injection
router.get('/view', noticeController.proxyNoticeView);

module.exports = router;
