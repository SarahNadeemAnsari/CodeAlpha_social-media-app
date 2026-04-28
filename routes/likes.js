const express = require('express');
const router = express.Router();
const Like = require('../models/Like');
const auth = require('../middleware/auth');

// LIKE POST
router.post('/:postId', auth, async (req, res) => {
  try {
    const existing = await Like.findOne({ user: req.user.id, post: req.params.postId });
    if (existing) return res.status(400).json({ message: 'Already liked' });

    const like = new Like({
      user: req.user.id,
      post: req.params.postId
    });

    await like.save();
    res.json(like);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// UNLIKE POST
router.delete('/:postId', auth, async (req, res) => {
  try {
    await Like.findOneAndDelete({
      user: req.user.id,
      post: req.params.postId
    });

    res.json({ msg: 'Post unliked' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// GET LIKES FOR A POST
router.get('/:postId', async (req, res) => {
  try {
    const likes = await Like.find({ post: req.params.postId });
    res.json(likes);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;