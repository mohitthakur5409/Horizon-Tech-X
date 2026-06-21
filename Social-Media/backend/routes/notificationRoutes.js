// notificationRoutes.js
const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware"); // optional if you want protected routes

// Frontend expects: POST /api/notifications/read
router.post("/read", authMiddleware, notificationController.markAllAsRead);

// Extra endpoints
router.post("/create", authMiddleware, notificationController.createNotification);
router.get("/user/:userId", authMiddleware, notificationController.getUserNotifications);
router.put("/read/:notificationId", authMiddleware, notificationController.markAsRead);
router.delete("/delete/:notificationId", authMiddleware, notificationController.deleteNotification);


module.exports = router;