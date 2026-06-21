// userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware"); // protect routes with JWT

// Get all users
router.get("/all", authMiddleware, userController.getAllUsers);

// Get single user profile
router.get("/:userId", authMiddleware, userController.getUserProfile);

// Update user profile
router.put("/update/:userId", authMiddleware, userController.updateUserProfile);

// Follow a user
router.post("/follow", authMiddleware, userController.followUser);

// Unfollow a user
router.post("/unfollow", authMiddleware, userController.unfollowUser);

// Delete user account
router.delete("/delete/:userId", authMiddleware, userController.deleteUser);

module.exports = router;