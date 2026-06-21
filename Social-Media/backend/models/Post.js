// models/Post.js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // UI expects { body, type, media }
  body: { type: String, required: false, default: "" },
  type: {
    type: String,
    enum: ["text", "photo", "reel", "tweet"],
    default: "text",
  },
  media: { type: String },

  tags: { type: [String], default: [] },

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      body: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],

  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", postSchema);