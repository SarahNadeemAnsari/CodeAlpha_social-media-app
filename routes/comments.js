// routes/comments.js
const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @route POST /api/comments
// Add a comment to a post
router.post('/', async (req, res) => {
  const { content, author, postID } = req.body;

  try {
    // Check if post exists
    const post = await Post.findById(postID);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    const comment = new Comment({ content, author, postID });
    await comment.save();

    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route GET /api/comments/:postID
// Get all comments for a post
router.get('/:postID', async (req, res) => {
  try {
    const comments = await Comment.find({ postID: req.params.postID })
      .sort({ createdAt: 1 }) // oldest first
      .populate('author', 'username');
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;