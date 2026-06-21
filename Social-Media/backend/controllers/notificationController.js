// notificationController.js
const Notification = require("../models/Notification");
const User = require("../models/User");

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { recipientId, senderId, type, message } = req.body;

    if (!recipientId || !senderId || !type) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type, // e.g., "like", "comment", "follow", "message"
      message,
      isRead: false,
      timestamp: Date.now(),
    });

    await notification.save();

    res.status(201).json({ message: "Notification created", data: notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "username email") // include sender details
      .sort({ timestamp: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    notification.isRead = true;
    await notification.save();

    res.json({ message: "Notification marked as read", data: notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    await Notification.updateMany({ recipient: userId }, { $set: { isRead: true } });
    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};