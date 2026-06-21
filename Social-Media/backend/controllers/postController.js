// postController.js
const Post = require("../models/Post");
const User = require("../models/User");

// Create a new post
// Frontend sends FormData keys (body/type/media/tags) and uses JSON.
// Auth middleware sets req.user.
exports.createPost = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { body, content, type, media, imageUrl, tags } = req.body;

    const finalBody = body ?? content ?? "";

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const finalType = type || (media || imageUrl ? "photo" : "text");
    const finalMedia = media || imageUrl;

    const parsedTags = Array.isArray(tags)
      ? tags
      : typeof tags === "string"
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

    const post = new Post({
      user: userId,
      body: finalBody,
      type: finalType,
      media: finalMedia,
      tags: parsedTags,
      timestamp: Date.now(),
    });

    await post.save();
    await post.populate("user", "username profilePic");

    // Frontend expects full post shape in response
    res.status(201).json(postToUi(post));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all posts (feed)
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username email profilePic")
      .sort({ timestamp: -1 });

    res.json(posts.map(postToUi));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get posts by a specific user
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ user: userId })
      .populate("user", "username email profilePic")
      .sort({ timestamp: -1 });

    res.json(posts.map(postToUi));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Like a post
// Frontend calls: POST /api/posts/:postId/like
exports.likePost = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.likes.map(String).includes(String(userId))) {
      return res.status(400).json({ message: "Post already liked" });
    }

    post.likes.push(userId);
    await post.save();
    await post.populate("user", "username profilePic");

    res.json(postToUi(post));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Save a post
exports.savePost = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.savedBy.map(String).includes(String(userId))) {
      return res.status(400).json({ message: "Post already saved" });
    }

    post.savedBy.push(userId);
    await post.save();
    await post.populate("user", "username profilePic");

    res.json(postToUi(post));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Comment on a post
// Frontend calls: POST /api/posts/:postId/comments
exports.commentOnPost = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { postId } = req.params;
    const { body } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user: userId, body, timestamp: Date.now() });
    await post.save();
    await post.populate("user", "username profilePic");

    res.json(postToUi(post));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function postToUi(post) {
  return {
    id: post._id,
    author: {
      id: post.user?._id,
      name: post.user?.username || "User",
      username: post.user?.username || "user",
      avatar: post.user?.profilePic,
    },
    body: post.body || "",
    type: post.type || (post.media ? "photo" : "text"),
    media: post.media,
    tags: post.tags || [],
    likes: (post.likes || []).map(String),
    savedBy: (post.savedBy || []).map(String),
    comments: (post.comments || []).map((c) => ({
      authorId: c.user?.toString?.() || c.user,
      author: {
        id: c.user?._id || c.user,
        name: (post.user?.username) || "User",
        username: (post.user?.username) || "user",
        avatar: post.user?.profilePic,
      },
      body: c.body,
      createdAt: c.timestamp,
    })),
    createdAt: post.timestamp,
  };
}

