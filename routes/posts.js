const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const auth = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

// CREATE POST
router.post("/", auth, upload.single("media"), async (req, res) => {
  try {
    const text = req.body?.text || "";
    const isVideo = req.file?.mimetype?.startsWith("video/");

    if (!text.trim() && !req.file) {
      return res.status(400).json({ message: "Post must have text or media" });
    }

    const post = new Post({
      text,
      user: req.user.id,
      mediaUrl: req.file ? req.file.path : null,
      mediaType: req.file ? (isVideo ? "video" : "image") : null,
    });

    await post.save();
    const populatedPost = await post.populate("user", "username profilePicture");
    res.status(201).json(populatedPost);
  } catch (err) {
    console.log("POST CREATE ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL POSTS
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE POST
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;