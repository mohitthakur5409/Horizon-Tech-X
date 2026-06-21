 // chatController.js
const Message = require("../models/Message"); // your Message model
const User = require("../models/User");       // your User model

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user?.id;
    const { text } = req.body;

    // Minimal: chatId format is dm_<otherId>
    const { chatId } = req.params;
    const receiverId = String(chatId || "").startsWith("dm_")
      ? String(chatId).slice(3)
      : req.body.receiverId;

    if (!senderId || !receiverId || !text) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: text,
      timestamp: Date.now(),
    });

    res.status(201).json({
      id: message._id,
      authorId: String(message.sender),
      author: { id: String(message.sender), name: "User", username: "user", avatar: null },
      text: message.content,
      createdAt: message.timestamp,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get conversation between two users
exports.getConversation = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 },
      ],
    }).sort({ timestamp: 1 }); // oldest to newest

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all chats for a user
exports.getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;

    const chats = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    }).sort({ timestamp: -1 }); // newest first

    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};