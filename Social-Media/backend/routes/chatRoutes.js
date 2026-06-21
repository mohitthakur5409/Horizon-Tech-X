// chatRoutes.js
const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware"); // optional if you want protected routes

// Frontend expects: POST /api/chats/:chatId/messages
router.post("/:chatId/messages", authMiddleware, chatController.sendMessage);

// Optional
router.get("/conversation/:userId1/:userId2", authMiddleware, chatController.getConversation);
router.get("/user/:userId", authMiddleware, chatController.getUserChats);


module.exports = router;