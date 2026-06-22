const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. Connection Engine Setup
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/social_sphere';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[MONGO DATABASE] Successfully linked to remote cloud instance.');
    await seedDB();
  } catch (err) {
    console.error('[MONGO ERROR] Connection crashed:', err.message);
    process.exit(1);
  }
};

// 2. Database Schemas
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '?' },
  cover: { type: String, default: 'linear-gradient(90deg, #1877f2, #00a884)' },
  bio: { type: String, default: '' },
  location: { type: String, default: 'Remote Node' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notifications: [{
    text: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
});

const PostSchema = new mongoose.Schema({
  type: { type: String, default: 'tweet' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  media: { type: String, default: '' },
  tags: [String],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const StorySchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  accent: { type: String, default: '#1877f2' },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-deletes after 24 hours!
});

const ChatSchema = new mongoose.Schema({
  title: String,
  kind: { type: String, default: 'group' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [{
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
});

const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);
const Story = mongoose.model('Story', StorySchema);
const Chat = mongoose.model('Chat', ChatSchema);

// 3. Automated Seeding Script
async function seedDB() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('password123', salt);

    const mohit = await User.create({
      name: "Mohit", username: "mohit_net", email: "mohit@sphere.com", password: demoPasswordHash,
      avatar: "M", bio: "Full Stack Interface Engineer", location: "New Delhi, IN", followers: [], following: []
    });

    const alex = await User.create({
      name: "Alex Mercer", username: "mercer_dev", email: "alex@sphere.com", password: demoPasswordHash,
      avatar: "A", bio: "Platform micro-blogging architecture evaluator.", location: "Silicon Valley", followers: [mohit._id], following: [mohit._id]
    });

    mohit.followers.push(alex._id);
    mohit.following.push(alex._id);
    await mohit.save();

    await Post.create([
      { type: "tweet", authorId: alex._id, body: "Testing the newly unified framework configuration on MongoDB. Feels smooth!", tags: ["web3", "vibe"], likes: [mohit._id] },
      { type: "reel", authorId: alex._id, body: "Look at this high-fidelity video landscape compile stream! 🎬", tags: ["reels", "cinematic"], media: "https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-4659-large.mp4" }
    ]);

    await Story.create({ authorId: alex._id, text: "Coding from the mountains today!", accent: "#00a884" });
    await Chat.create({ title: "Social Sphere Dev Group", kind: "group", participants: [mohit._id, alex._id], messages: [{ authorId: alex._id, text: "Hey! Let me know when the UI integration completes." }] });

    console.log('[MONGO DATABASE] Demo cluster accounts seeded safely.');
  }
}

module.exports = { connectDB, User, Post, Story, Chat };