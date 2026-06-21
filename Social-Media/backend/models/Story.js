// story.js
// Mongoose model for user stories

const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: true
  },
  content: {
    type: String,
    trim: true,
    maxLength: 500 // optional limit for text content
  },
  mediaUrl: {
    type: String, // Path or URL to uploaded media
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  views: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      viewedAt: { type: Date, default: Date.now }
    }
  ],
  reactions: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      type: { type: String, enum: ['like', 'love', 'laugh', 'sad', 'angry'] },
      reactedAt: { type: Date, default: Date.now }
    }
  ]
});

// Automatically set expiry (24 hours) if not provided
storySchema.pre('save', function (next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('Story', storySchema);