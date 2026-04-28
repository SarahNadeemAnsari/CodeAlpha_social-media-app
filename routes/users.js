const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user });
  } catch (err) {
    console.error('REGISTER ERROR:', err.message);
    res.status(500).send('Server error');
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err.message);
    res.status(500).send('Server error');
  }
});

// GET OWN PROFILE
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const posts = await Post.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ user, posts });
  } catch (err) {
    console.error('GET ME ERROR:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET ANY USER PROFILE
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const posts = await Post.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json({ user, posts });
  } catch (err) {
    console.error('GET USER ERROR:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE OWN PROFILE
router.put('/me', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const updateFields = {};

    // only update username if it actually changed
    if (req.body.username && req.body.username !== currentUser.username) {
      // check if new username is taken by someone else
      const existingUser = await User.findOne({ username: req.body.username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      updateFields.username = req.body.username;
    }

    if (req.body.bio !== undefined) updateFields.bio = req.body.bio;
    if (req.file) updateFields.profilePicture = req.file.path;

    await mongoose.connection.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId(req.user.id) },
      { $set: updateFields }
    );

    const updated = await User.findById(req.user.id).select('-password');
    res.json(updated);
  } catch (err) {
    console.error('UPDATE ERROR:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;