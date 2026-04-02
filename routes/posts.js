// routes/posts.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// @route POST /api/posts
router.post('/', async (req, res) => {
  const { content, author } = req.body;
  try {
    const post = new Post({ content, author });
    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route GET /api/posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).populate('author', 'username');
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;