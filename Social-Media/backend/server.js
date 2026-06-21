const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/error");

dotenv.config();
connectDB();


const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "20mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const chatRoutes = require("./routes/chatRoutes");
const storyRoutes = require("./routes/storyRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/notifications", notificationRoutes);

// Frontend (static)
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Health
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

// Frontend state endpoint
app.get("/api/state", async (req, res) => {
  try {
    // For now: derive current user from token (if any), else return empty state.
    const token = req.headers.authorization?.split(" ")?.[1];

    // Lazy require to avoid circular deps
    const jwt = require("jsonwebtoken");
    const User = require("./models/User");
    const Post = require("./models/Post");
    const Story = require("./models/Story");
    const Notification = require("./models/Notification");
    const Message = require("./models/Message");

    let currentUser = null;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      currentUser = await User.findById(decoded.id).select("-password");
    }

    const users = await User.find().select("-password");
    const posts = await Post.find().populate("user", "username profilePic").sort({ timestamp: -1 });
    const stories = await Story.find({ expiresAt: { $gt: Date.now() } })
      .populate("userId", "username profilePic")
      .sort({ createdAt: -1 });

    const notifications = currentUser
      ? await Notification.find({ recipient: currentUser._id })
          .populate("sender", "username profilePic")
          .sort({ timestamp: -1 })
      : [];

    // Build chats list in the shape frontend expects
    const chats = currentUser
      ? await buildChatsForUser(currentUser._id, Message)
      : [];

    const normalizedPosts = posts.map((p) => ({
      id: p._id,
      author: {
        id: p.user?._id,
        name: p.user?.username || "User",
        username: p.user?.username || "user",
      tags: p.tags || [],
      likes: (p.likes || []).map(String),
      savedBy: (p.savedBy || []).map(String),
      comments: (p.comments || []).map((c) => ({
        authorId: c.user?.toString?.() || c.user,
        author: {
          id: c.user?._id || c.user,
          name: c.user?.username || "User",
          username: c.user?.username || "user",
          avatar: c.user?.profilePic,
        },
        body: c.body,

        createdAt: c.timestamp,
      })),
      createdAt: p.timestamp,
    }));

    const normalizedStories = stories.map((s) => ({
      id: s._id,
      accent: "#2563eb",
      author: {
        id: s.userId?._id,
        name: s.userId?.username || "User",
        username: s.userId?.username || "user",
      avatar: s.userId?.profilePic,
      },
      text: s.content,
      mediaUrl: s.mediaUrl,
      createdAt: s.createdAt,
    }));

    const normalizedUsers = users.map((u) => ({
      id: u._id,
      name: u.username,
      username: u.username,
      avatar: u.profilePic,
      cover: "#0ea5e9",
      location: "",
      bio: u.bio || "",
      following: (u.following || []).map(String),
      followers: (u.followers || []).map(String),
    }));

    const normalizedNotifications = notifications.map((n) => ({
      id: n._id,
      text: n.message || n.type,
      read: n.isRead,
      createdAt: n.timestamp,
    }));

    const state = {
      currentUser: currentUser
        ? {
            id: currentUser._id,
            name: currentUser.username,
            username: currentUser.username,
            avatar: currentUser.profilePic,
            cover: "#0f9f6e",
            location: "",
            bio: currentUser.bio || "",
            following: (currentUser.following || []).map(String),
            followers: (currentUser.followers || []).map(String),
          }
        : null,
      users: normalizedUsers,
      posts: normalizedPosts,
      stories: normalizedStories,
      chats,
      notifications: normalizedNotifications,
    };

    res.json(state);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

async function buildChatsForUser(userId, Message) {
  // Simple: group messages by counterpart.
  const msgs = await Message.find({ $or: [{ sender: userId }, { receiver: userId }] })
    .sort({ timestamp: -1 })
    .lean();

  // Build map by other user
  const map = new Map();
  for (const m of msgs) {
    const otherId = String(m.sender) === String(userId) ? m.receiver : m.sender;
    if (!map.has(otherId)) {
      map.set(otherId, {
        id: `dm_${otherId}`,
        title: `Chat ${otherId.toString().slice(-4)}`,
        kind: "dm",
        participants: [String(userId), otherId],
        messages: [],
      });
    }
    map.get(otherId).messages.push({
      id: m._id,
      authorId: String(m.sender),
      author: { id: String(m.sender), name: "User", username: "user", avatar: null },
      text: m.content,
      createdAt: m.timestamp,
    });
  }
  return Array.from(map.values());
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));