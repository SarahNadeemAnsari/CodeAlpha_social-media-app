const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

// ADD COMMENT
router.post('/:postId', auth, async (req, res) => {
  try {
    const comment = new Comment({
      user: req.user.id,
      post: req.params.postId,
      text: req.body.text
    });

    await comment.save();
    const populated = await comment.populate('user', 'username');
    res.json(populated);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// GET COMMENTS
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;