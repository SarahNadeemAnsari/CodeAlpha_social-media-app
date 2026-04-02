// routes/likes.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// @route POST /api/likes/toggle
// Like or unlike a post
router.post('/toggle', async (req, res) => {
  const { userID, postID } = req.body;

  try {
    const post = await Post.findById(postID);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    // Check if user already liked the post
    const index = post.likes.indexOf(userID);
    if (index === -1) {
      post.likes.push(userID); // Like
    } else {
      post.likes.splice(index, 1); // Unlike
    }

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;