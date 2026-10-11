const express = require('express');
const {
  getDiscussions,
  createDiscussion,
  toggleUpvote,
  getDiscussionComments,
  createComment,
} = require('../controllers/discussionController');
const authenticateJWT = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', getDiscussions);
router.post('/', createDiscussion);
router.post('/:id/upvote', toggleUpvote);
router.get('/:id/comments', getDiscussionComments);
router.post('/:id/comments', createComment);

module.exports = router;