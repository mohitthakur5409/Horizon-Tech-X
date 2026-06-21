// storyRoutes.js
const express = require("express");
const router = express.Router();
const storyController = require("../controllers/storyController");
const authMiddleware = require("../middleware/authMiddleware"); // optional for protected routes

router.post("/", authMiddleware, storyController.createStory);

// Frontend calls
router.get("/all", authMiddleware, storyController.getAllStories);
router.get("/user/:userId", authMiddleware, storyController.getUserStories);

router.delete("/:storyId", authMiddleware, storyController.deleteStory);


module.exports = router;