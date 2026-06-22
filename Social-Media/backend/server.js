require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectDB, User, Post, Story, Chat } = require('./db');
const auth = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_social_sphere_token_mesh_key_2026';

// Helper: Formulates state payload from MongoDB documents
async function compileStatePayload(userId) {
  const currentUserObj = await User.findById(userId).lean();
  const allRawUsers = await User.find({}).lean();
  
  // Transform ObjectIds into clean strings for frontend evaluation compatibility
  const safeUsers = allRawUsers.map(({ password, email, ...rest }) => ({
    ...rest,
    id: rest._id.toString(),
    followers: (rest.followers || []).map(id => id.toString()),
    following: (rest.following || []).map(id => id.toString())
  }));

  currentUserObj.id = currentUserObj._id.toString();
  currentUserObj.followers = (currentUserObj.followers || []).map(id => id.toString());
  currentUserObj.following = (currentUserObj.following || []).map(id => id.toString());

  const rawPosts = await Post.find({}).sort({ createdAt: -1 }).lean();
  const hydratedPosts = rawPosts.map(post => ({
    ...post,
    id: post._id.toString(),
    author: safeUsers.find(u => u.id === post.authorId.toString()),
    likes: (post.likes || []).map(id => id.toString()),
    savedBy: (post.savedBy || []).map(id => id.toString()),
    comments: (post.comments || []).map(c => ({
      ...c,
      id: c._id.toString(),
      author: safeUsers.find(u => u.id === c.authorId.toString())
    }))
  }));

  const rawStories = await Story.find({}).lean();
  const hydratedStories = rawStories.map(s => ({
    ...s,
    id: s._id.toString(),
    author: safeUsers.find(u => u.id === s.authorId.toString())
  }));

  const rawChats = await Chat.find({ participants: userId }).lean();
  const hydratedChats = rawChats.map(c => ({
    ...c,
    id: c._id.toString(),
    participants: c.participants.map(id => id.toString()),
    messages: (c.messages || []).map(m => ({
      ...m,
      id: m._id.toString(),
      author: safeUsers.find(u => u.id === m.authorId.toString())
    }))
  }));

  return {
    currentUser: currentUserObj,
    users: safeUsers,
    posts: hydratedPosts,
    stories: hydratedStories,
    chats: hydratedChats,
    notifications: currentUserObj.notifications || []
  };
}

/* ==========================================================================
   ROUTERS & CONTROLLERS
   ========================================================================== */
app.post('/api/signup', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) return res.status(400).json({ message: 'All inputs are mandatory.' });

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) return res.status(400).json({ message: 'Identity parameters already recorded.' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await User.create({ name, username, email, password: hashedPassword, avatar: name.charAt(0).toUpperCase() });

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, state: await compileStatePayload(newUser._id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: 'Identity credentials fail.' });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, state: await compileStatePayload(user._id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/state', auth, async (req, res) => {
  res.json(await compileStatePayload(req.user.id));
});

app.post('/api/posts', auth, async (req, res) => {
  try {
    const { body, type, media, tags } = req.body;
    const post = await Post.create({ type, authorId: req.user.id, body, media, tags });
    const fullState = await compileStatePayload(req.user.id);
    res.json(fullState.posts.find(p => p.id === post._id.toString()));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post absent.' });

    const idx = post.likes.indexOf(req.user.id);
    if (idx === -1) {
      post.likes.push(req.user.id);
      if (post.authorId.toString() !== req.user.id) {
        const actor = await User.findById(req.user.id);
        await User.findByIdAndUpdate(post.authorId, {
          $push: { notifications: { $each: [{ text: `${actor.name} liked your timeline post update.` }], $position: 0 } }
        });
      }
    } else { post.likes.splice(idx, 1); }
    await post.save();
    const fullState = await compileStatePayload(req.user.id);
    res.json(fullState.posts.find(p => p.id === post._id.toString()));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/posts/:id/save', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const idx = post.savedBy.indexOf(req.user.id);
    if (idx === -1) post.savedBy.push(req.user.id); else post.savedBy.splice(idx, 1);
    await post.save();
    const fullState = await compileStatePayload(req.user.id);
    res.json(fullState.posts.find(p => p.id === post._id.toString()));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/posts/:id/comments', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    post.comments.push({ authorId: req.user.id, body: req.body.body });
    await post.save();
    const fullState = await compileStatePayload(req.user.id);
    res.json(fullState.posts.find(p => p.id === post._id.toString()));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/stories', auth, async (req, res) => {
  try {
    const story = await Story.create({ authorId: req.user.id, text: req.body.text, accent: req.body.accent });
    const fullState = await compileStatePayload(req.user.id);
    res.json(fullState.stories.find(s => s.id === story._id.toString()));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/chats/:id/messages', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, participants: req.user.id });
    const msg = { authorId: req.user.id, text: req.body.text };
    chat.messages.push(msg);
    await chat.save();
    const updatedChat = await Chat.findById(req.params.id).lean();
    const userObj = await User.findById(req.user.id).lean();
    userObj.id = userObj._id.toString();
    res.json({ ...updatedChat.messages.pop(), author: userObj });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/users/:id/follow', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: 'Self reference mesh linking blocked.' });
    const target = await User.findById(req.params.id);
    const actor = await User.findById(req.user.id);

    const idx = actor.following.indexOf(target._id);
    if (idx === -1) {
      actor.following.push(target._id);
      target.followers.push(actor._id);
      target.notifications.unshift({ text: `${actor.name} (@${actor.username}) started tracking your timeline.` });
    } else {
      actor.following.splice(idx, 1);
      const tIdx = target.followers.indexOf(actor._id);
      if (tIdx !== -1) target.followers.splice(tIdx, 1);
    }
    await actor.save();
    await target.save();
    const fullState = await compileStatePayload(req.user.id);
    res.json({ currentUser: fullState.currentUser, target: fullState.users.find(u => u.id === target._id.toString()) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/notifications/read', auth, async (req, res) => {
  await User.updateOne({ _id: req.user.id }, { $set: { "notifications.$[].read": true } });
  res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`[SOCIAL SPHERE MONGO ENGINE] Running natively over: http://localhost:${PORT}`));
});