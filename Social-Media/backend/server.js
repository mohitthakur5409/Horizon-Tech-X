const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 5000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SESSION_TTL = 1000 * 60 * 60 * 24 * 7;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const sessions = new Map();

function nowIso() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword || !storedPassword.includes(":")) return false;
  const [salt, hash] = storedPassword.split(":");
  const candidate = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}

function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

function seedDatabase() {
  const passwordHash = hashPassword("password123");
  const users = [
    {
      id: "u_mohit",
      name: "Mohit Sharma",
      username: "mohit",
      email: "mohit@example.com",
      passwordHash,
      avatar: "MS",
      bio: "Building a creator-first social universe.",
      location: "India",
      cover: "linear-gradient(135deg, #1d4ed8, #0f766e)",
      followers: ["u_ananya", "u_rahul", "u_zara"],
      following: ["u_ananya", "u_rahul", "u_zara", "u_omar"],
      createdAt: nowIso()
    },
    {
      id: "u_ananya",
      name: "Ananya Rao",
      username: "ananya",
      email: "ananya@example.com",
      passwordHash,
      avatar: "AR",
      bio: "Photo essays, travel, and slow mornings.",
      location: "Bengaluru",
      cover: "linear-gradient(135deg, #e11d48, #f59e0b)",
      followers: ["u_mohit", "u_rahul"],
      following: ["u_mohit", "u_zara"],
      createdAt: nowIso()
    },
    {
      id: "u_rahul",
      name: "Rahul Mehta",
      username: "rahul",
      email: "rahul@example.com",
      passwordHash,
      avatar: "RM",
      bio: "Product designer. Tiny details, big systems.",
      location: "Mumbai",
      cover: "linear-gradient(135deg, #111827, #7c3aed)",
      followers: ["u_mohit", "u_ananya"],
      following: ["u_mohit", "u_ananya"],
      createdAt: nowIso()
    },
    {
      id: "u_zara",
      name: "Zara Khan",
      username: "zara",
      email: "zara@example.com",
      passwordHash,
      avatar: "ZK",
      bio: "Short videos, music drops, and creator tools.",
      location: "Delhi",
      cover: "linear-gradient(135deg, #059669, #0284c7)",
      followers: ["u_mohit"],
      following: ["u_mohit", "u_ananya"],
      createdAt: nowIso()
    },
    {
      id: "u_omar",
      name: "Omar Ali",
      username: "omar",
      email: "omar@example.com",
      passwordHash,
      avatar: "OA",
      bio: "Communities, channels, and open web experiments.",
      location: "Hyderabad",
      cover: "linear-gradient(135deg, #b45309, #be123c)",
      followers: ["u_mohit"],
      following: ["u_mohit"],
      createdAt: nowIso()
    }
  ];

  return {
    users,
    posts: [
      {
        id: "p_1",
        authorId: "u_ananya",
        type: "photo",
        body: "Golden hour from the new cafe terrace. The city looked like it was holding its breath.",
        media: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=80",
        tags: ["instagram", "travel"],
        likes: ["u_mohit", "u_rahul", "u_zara"],
        savedBy: ["u_mohit"],
        comments: [
          { id: "c_1", authorId: "u_mohit", body: "This frame is gorgeous.", createdAt: nowIso() }
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString()
      },
      {
        id: "p_2",
        authorId: "u_rahul",
        type: "tweet",
        body: "Tiny UX note: people forgive one extra click when the destination is clear. They do not forgive mystery.",
        media: "",
        tags: ["twitter", "design"],
        likes: ["u_mohit", "u_ananya"],
        savedBy: [],
        comments: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      },
      {
        id: "p_3",
        authorId: "u_zara",
        type: "reel",
        body: "New 18 second music loop. Remix it, duet it, break it beautifully.",
        media: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
        tags: ["reels", "music"],
        likes: ["u_mohit", "u_ananya", "u_omar"],
        savedBy: ["u_ananya"],
        comments: [
          { id: "c_2", authorId: "u_omar", body: "Channel drop when?", createdAt: nowIso() }
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
      }
    ],
    stories: [
      { id: "s_1", authorId: "u_mohit", text: "Shipping the first build", accent: "#2563eb", createdAt: nowIso() },
      { id: "s_2", authorId: "u_ananya", text: "Coffee walk", accent: "#e11d48", createdAt: nowIso() },
      { id: "s_3", authorId: "u_zara", text: "Studio day", accent: "#059669", createdAt: nowIso() }
    ],
    chats: [
      {
        id: "chat_1",
        kind: "direct",
        title: "Ananya Rao",
        participants: ["u_mohit", "u_ananya"],
        messages: [
          { id: "m_1", authorId: "u_ananya", text: "Did you see the new story composer?", createdAt: new Date(Date.now() - 1000 * 60 * 11).toISOString() },
          { id: "m_2", authorId: "u_mohit", text: "Yes, testing it now. It feels quick.", createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString() }
        ]
      },
      {
        id: "chat_2",
        kind: "group",
        title: "Creator Lab",
        participants: ["u_mohit", "u_ananya", "u_rahul", "u_zara", "u_omar"],
        messages: [
          { id: "m_3", authorId: "u_omar", text: "Pinned a launch checklist in the channel.", createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
          { id: "m_4", authorId: "u_rahul", text: "Feed cards are ready for review.", createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() }
        ]
      }
    ],
    notifications: [
      { id: "n_1", userId: "u_mohit", text: "Ananya liked your story.", read: false, createdAt: nowIso() },
      { id: "n_2", userId: "u_mohit", text: "Rahul followed you.", read: false, createdAt: nowIso() }
    ]
  };
}

function ensureDatabase() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(seedDatabase(), null, 2));
  }
}

function readDb() {
  ensureDatabase();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function send(res, statusCode, payload, headers = {}) {
  const isBuffer = Buffer.isBuffer(payload);
  res.writeHead(statusCode, {
    "Content-Type": isBuffer ? "application/octet-stream" : "application/json; charset=utf-8",
    ...headers
  });
  res.end(isBuffer ? payload : JSON.stringify(payload));
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, part) => {
    const [key, ...value] = part.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(value.join("="));
    return cookies;
  }, {});
}

function createSession(userId) {
  const token = id("sess");
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL });
  return token;
}

function getSessionUser(req, db) {
  const auth = req.headers.authorization || "";
  const cookieToken = parseCookies(req.headers.cookie).session;
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : cookieToken;
  if (!token || !sessions.has(token)) return null;
  const session = sessions.get(token);
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return db.users.find((user) => user.id === session.userId) || null;
}

function requireUser(req, res, db) {
  const user = getSessionUser(req, db);
  if (!user) {
    send(res, 401, { message: "Please log in first." });
    return null;
  }
  return user;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });
  });
}

function enrichPost(post, db) {
  const author = db.users.find((user) => user.id === post.authorId);
  return {
    ...post,
    author: author ? publicUser(author) : null,
    comments: post.comments.map((comment) => ({
      ...comment,
      author: publicUser(db.users.find((user) => user.id === comment.authorId) || db.users[0])
    }))
  };
}

function appState(db, user) {
  return {
    currentUser: publicUser(user),
    users: db.users.map(publicUser),
    posts: db.posts.map((post) => enrichPost(post, db)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    stories: db.stories.map((story) => ({
      ...story,
      author: publicUser(db.users.find((userItem) => userItem.id === story.authorId) || db.users[0])
    })),
    chats: db.chats
      .filter((chat) => chat.participants.includes(user.id))
      .map((chat) => ({
        ...chat,
        participants: chat.participants.map((idValue) => publicUser(db.users.find((userItem) => userItem.id === idValue))).filter(Boolean),
        messages: chat.messages.map((message) => ({
          ...message,
          author: publicUser(db.users.find((userItem) => userItem.id === message.authorId) || db.users[0])
        }))
      })),
    notifications: db.notifications.filter((notification) => notification.userId === user.id)
  };
}

function routeParts(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  return { pathname: decodeURIComponent(url.pathname), searchParams: url.searchParams };
}

async function handleApi(req, res) {
  const db = readDb();
  const { pathname } = routeParts(req);

  try {
    if (req.method === "POST" && pathname === "/api/signup") {
      const body = await readBody(req);
      const name = String(body.name || "").trim();
      const username = String(body.username || "").trim().toLowerCase();
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!name || !username || !email || password.length < 6) {
        return send(res, 400, { message: "Name, username, email, and a 6+ character password are required." });
      }
      if (db.users.some((user) => user.username === username || user.email === email)) {
        return send(res, 409, { message: "Username or email already exists." });
      }
      const user = {
        id: id("u"),
        name,
        username,
        email,
        passwordHash: hashPassword(password),
        avatar: name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
        bio: "New here and ready to connect.",
        location: "Online",
        cover: "linear-gradient(135deg, #0f766e, #2563eb)",
        followers: [],
        following: [],
        createdAt: nowIso()
      };
      db.users.push(user);
      writeDb(db);
      const token = createSession(user.id);
      return send(res, 201, { token, user: publicUser(user), state: appState(db, user) }, {
        "Set-Cookie": `session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL / 1000}`
      });
    }

    if (req.method === "POST" && pathname === "/api/login") {
      const body = await readBody(req);
      const usernameOrEmail = String(body.username || "").trim().toLowerCase();
      const password = String(body.password || "");
      const user = db.users.find((item) => item.username === usernameOrEmail || item.email === usernameOrEmail);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return send(res, 401, { message: "Invalid username or password." });
      }
      const token = createSession(user.id);
      return send(res, 200, { token, user: publicUser(user), state: appState(db, user) }, {
        "Set-Cookie": `session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL / 1000}`
      });
    }

    if (req.method === "POST" && pathname === "/api/logout") {
      const cookieToken = parseCookies(req.headers.cookie).session;
      if (cookieToken) sessions.delete(cookieToken);
      return send(res, 200, { message: "Logged out." }, {
        "Set-Cookie": "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
      });
    }

    if (req.method === "GET" && pathname === "/api/state") {
      const user = requireUser(req, res, db);
      if (!user) return;
      return send(res, 200, appState(db, user));
    }

    if (req.method === "POST" && pathname === "/api/posts") {
      const user = requireUser(req, res, db);
      if (!user) return;
      const body = await readBody(req);
      const post = {
        id: id("p"),
        authorId: user.id,
        type: ["photo", "reel", "tweet", "text"].includes(body.type) ? body.type : "text",
        body: String(body.body || "").trim(),
        media: String(body.media || "").trim(),
        tags: String(body.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 5),
        likes: [],
        savedBy: [],
        comments: [],
        createdAt: nowIso()
      };
      if (!post.body && !post.media) {
        return send(res, 400, { message: "Write a caption or add an image URL." });
      }
      db.posts.push(post);
      db.notifications.push({ id: id("n"), userId: user.id, text: "Your post is live on the feed.", read: false, createdAt: nowIso() });
      writeDb(db);
      return send(res, 201, enrichPost(post, db));
    }

    const likeMatch = pathname.match(/^\/api\/posts\/([^/]+)\/like$/);
    if (req.method === "POST" && likeMatch) {
      const user = requireUser(req, res, db);
      if (!user) return;
      const post = db.posts.find((item) => item.id === likeMatch[1]);
      if (!post) return send(res, 404, { message: "Post not found." });
      if (post.likes.includes(user.id)) {
        post.likes = post.likes.filter((idValue) => idValue !== user.id);
      } else {
        post.likes.push(user.id);
        if (post.authorId !== user.id) {
          db.notifications.push({ id: id("n"), userId: post.authorId, text: `${user.name} liked your post.`, read: false, createdAt: nowIso() });
        }
      }
      writeDb(db);
      return send(res, 200, enrichPost(post, db));
    }

    const saveMatch = pathname.match(/^\/api\/posts\/([^/]+)\/save$/);
    if (req.method === "POST" && saveMatch) {
      const user = requireUser(req, res, db);
      if (!user) return;
      const post = db.posts.find((item) => item.id === saveMatch[1]);
      if (!post) return send(res, 404, { message: "Post not found." });
      post.savedBy = post.savedBy.includes(user.id) ? post.savedBy.filter((idValue) => idValue !== user.id) : [...post.savedBy, user.id];
      writeDb(db);
      return send(res, 200, enrichPost(post, db));
    }

    const commentMatch = pathname.match(/^\/api\/posts\/([^/]+)\/comments$/);
    if (req.method === "POST" && commentMatch) {
      const user = requireUser(req, res, db);
      if (!user) return;
      const body = await readBody(req);
      const post = db.posts.find((item) => item.id === commentMatch[1]);
      if (!post) return send(res, 404, { message: "Post not found." });
      const comment = { id: id("c"), authorId: user.id, body: String(body.body || "").trim(), createdAt: nowIso() };
      if (!comment.body) return send(res, 400, { message: "Comment cannot be empty." });
      post.comments.push(comment);
      if (post.authorId !== user.id) {
        db.notifications.push({ id: id("n"), userId: post.authorId, text: `${user.name} commented on your post.`, read: false, createdAt: nowIso() });
      }
      writeDb(db);
      return send(res, 201, enrichPost(post, db));
    }

    if (req.method === "POST" && pathname === "/api/stories") {
      const user = requireUser(req, res, db);
      if (!user) return;
      const body = await readBody(req);
      const story = {
        id: id("s"),
        authorId: user.id,
        text: String(body.text || "").trim(),
        accent: String(body.accent || "#2563eb").trim(),
        createdAt: nowIso()
      };
      if (!story.text) return send(res, 400, { message: "Story text is required." });
      db.stories.unshift(story);
      writeDb(db);
      return send(res, 201, { ...story, author: publicUser(user) });
    }

    const followMatch = pathname.match(/^\/api\/users\/([^/]+)\/follow$/);
    if (req.method === "POST" && followMatch) {
      const user = requireUser(req, res, db);
      if (!user) return;
      const target = db.users.find((item) => item.id === followMatch[1]);
      if (!target || target.id === user.id) return send(res, 404, { message: "User not found." });
      if (user.following.includes(target.id)) {
        user.following = user.following.filter((idValue) => idValue !== target.id);
        target.followers = target.followers.filter((idValue) => idValue !== user.id);
      } else {
        user.following.push(target.id);
        target.followers.push(user.id);
        db.notifications.push({ id: id("n"), userId: target.id, text: `${user.name} followed you.`, read: false, createdAt: nowIso() });
      }
      writeDb(db);
      return send(res, 200, { currentUser: publicUser(user), target: publicUser(target) });
    }

    const chatMatch = pathname.match(/^\/api\/chats\/([^/]+)\/messages$/);
    if (req.method === "POST" && chatMatch) {
      const user = requireUser(req, res, db);
      if (!user) return;
      const chat = db.chats.find((item) => item.id === chatMatch[1] && item.participants.includes(user.id));
      if (!chat) return send(res, 404, { message: "Chat not found." });
      const body = await readBody(req);
      const message = { id: id("m"), authorId: user.id, text: String(body.text || "").trim(), createdAt: nowIso() };
      if (!message.text) return send(res, 400, { message: "Message cannot be empty." });
      chat.messages.push(message);
      chat.participants
        .filter((participantId) => participantId !== user.id)
        .forEach((participantId) => db.notifications.push({ id: id("n"), userId: participantId, text: `${user.name} sent a message in ${chat.title}.`, read: false, createdAt: nowIso() }));
      writeDb(db);
      return send(res, 201, {
        ...message,
        author: publicUser(user)
      });
    }

    if (req.method === "POST" && pathname === "/api/notifications/read") {
      const user = requireUser(req, res, db);
      if (!user) return;
      db.notifications.forEach((notification) => {
        if (notification.userId === user.id) notification.read = true;
      });
      writeDb(db);
      return send(res, 200, { ok: true });
    }

    return send(res, 404, { message: "API route not found." });
  } catch (error) {
    return send(res, 500, { message: error.message || "Server error." });
  }
}

function serveStatic(req, res) {
  const { pathname } = routeParts(req);
  const requested = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      fs.readFile(path.join(PUBLIC_DIR, "index.html"), (fallbackError, fallback) => {
        if (fallbackError) {
          res.writeHead(404);
          return res.end("Not found");
        }
        res.writeHead(200, { "Content-Type": mimeTypes[".html"] });
        res.end(fallback);
      });
      return;
    }
    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[extension] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res);
  } else {
    serveStatic(req, res);
  }
});

ensureDatabase();
server.listen(PORT, () => {
  console.log(`Social Sphere running at http://localhost:${PORT}`);
  console.log("Demo login: username mohit, password password123");
});
