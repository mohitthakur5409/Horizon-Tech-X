// postRoutes.js
const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middleware/authMiddleware"); // optional if you want protected routes

// Frontend expects these exact paths
router.post("/", authMiddleware, postController.createPost);

// Optional (not used by current frontend)
router.get("/all", authMiddleware, postController.getAllPosts);
router.get("/user/:userId", authMiddleware, postController.getUserPosts);

router.post("/:postId/like", authMiddleware, postController.likePost);
router.post("/:postId/save", authMiddleware, postController.savePost);
router.post("/:postId/comments", authMiddleware, postController.commentOnPost);


module.exports = router;