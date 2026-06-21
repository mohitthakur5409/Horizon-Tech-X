// authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // assuming you have a User model

// Register new user
exports.register = async (req, res) => {
  // Legacy endpoint; alias of signup
  return exports.signup(req, res);
};

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      profilePic: "",
      bio: "",
    });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, state: await buildMinimalState(user._id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, state: await buildMinimalState(user._id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (_req, res) => {
  res.json({ message: "Logged out" });
};

async function buildMinimalState(userId) {
  // Frontend after login uses applyState(data.state); state must include:
  // currentUser, users, posts, stories, chats, notifications.
  // For performance, keep minimal; /api/state will fill more on reload.
  return {
    currentUser: {
      id: userId,
      name: "",
      username: "",
      avatar: "",
      cover: "",
      location: "",
      bio: "",
      following: [],
      followers: [],
    },
    users: [],
    posts: [],
    stories: [],
    chats: [],
    notifications: [],
  };
}


// Protected route example
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};