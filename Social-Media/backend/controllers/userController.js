// userController.js
const User = require("../models/User");

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // exclude password
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single user profile
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated successfully", data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const { userId, targetId } = req.body;

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!user || !targetUser) return res.status(404).json({ message: "User not found" });

    if (user.following.includes(targetId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    user.following.push(targetId);
    targetUser.followers.push(userId);

    await user.save();
    await targetUser.save();

    res.json({ message: "User followed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const { userId, targetId } = req.body;

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!user || !targetUser) return res.status(404).json({ message: "User not found" });

    user.following = user.following.filter(id => id.toString() !== targetId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);

    await user.save();
    await targetUser.save();

    res.json({ message: "User unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete user account
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};