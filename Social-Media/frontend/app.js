/**
 * Global App Engine State
 */
const state = {
  token: localStorage.getItem("socialSphereToken") || "",
  currentUser: null,
  users: [],
  posts: [],
  stories: [],
  chats: [],
  notifications: [],
  activeChatId: "",
  search: ""
};

// Global Selectors Shortcut
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

/**
 * Toast Pipeline Component
 */
function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2500);
}

/**
 * Parsing Timestamps into relative text strings
 */
function timeAgo(value) {
  const diff = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

/**
 * Security Sanitize Utility to mitigate XSS injections
 */
function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Injecting User Profile Avatars
 */
function avatar(user, extraClass = "") {
  if (user?.avatar && (user.avatar.startsWith('http') || user.avatar.length > 4)) {
    return `<img src="${escapeHtml(user.avatar)}" class="avatar ${extraClass}" alt="User Avatar" />`;
  }
  return `<div class="avatar ${extraClass}">${escapeHtml(user?.avatar || user?.name?.charAt(0) || "?")}</div>`;
}

/**
 * Unified Backend API Pipeline Fetch Wrapper
 */
async function api(path, options = {}) {
  // Mock fallback logic to ensure application usability without active database backends
  if (window.location.protocol === 'file:' || !window.location.hostname.includes('localhost') && !window.location.origin.includes('api')) {
    return mockApiHandler(path, options);
  }

  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Network Error occurred.");
  return data;
}

/**
 * Dynamic Core UI Mutation Engine Tracker
 */
function applyState(nextState) {
  Object.assign(state, nextState);
  if (state.chats.length && !state.activeChatId) {
    state.activeChatId = state.chats[0].id;
  }
  render();
}

function setAuthenticated(isAuthed) {
  $("#authScreen").classList.toggle("hidden", isAuthed);
  $("#appShell").classList.toggle("hidden", !isAuthed);
}

async function loadState() {
  if (!state.token) {
    setAuthenticated(false);
    return;
  }
  try {
    const data = await api("/api/state");
    applyState(data);
    setAuthenticated(true);
  } catch {
    localStorage.removeItem("socialSphereToken");
    state.token = "";
    setAuthenticated(false);
  }
}

/**
 * Render Layer 1: WhatsApp-style Story Components
 */
function renderStories() {
  const current = state.currentUser;
  $("#storiesStrip").innerHTML = [
    `<form class="story-card" id="storyForm" style="background: linear-gradient(135deg, #101828, #1877f2)">
      <strong>Your status</strong>
      <input name="text" placeholder="What's new?" maxlength="64" required />
      <button type="submit">Update</button>
    </form>`,
    ...state.stories.map((story) => `
      <article class="story-card" style="background: linear-gradient(135deg, ${story.accent || '#dc2743'}, #1c1e21)">
        ${avatar(story.author, "small-avatar")}
        <div>
          <strong>${escapeHtml(story.author.name)}</strong>
          <p>${escapeHtml(story.text)}</p>
        </div>
        <div class="story-progress"><div class="progress-fill active"></div></div>
      </article>`)
  ].join("");

  $("#composerAvatar").innerHTML = current ? (current.avatar || current.name.charAt(0)) : "?";
  $("#storyForm").addEventListener("submit", submitStory);
}

function filteredPosts() {
  const query = state.search.toLowerCase().trim();
  if (!query) return state.posts;
  return state.posts.filter((post) => {
    const haystack = [
      post.body,
      post.author?.name,
      post.author?.username,
      post.type,
      ...(post.tags || [])
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

/**
 * Render Layer 2: Facebook & Instagram Style Posts / Interactive Reels
 */
function renderFeed() {
  $("#feed").innerHTML = filteredPosts().map((post) => {
    const liked = post.likes.includes(state.currentUser?.id);
    const saved = post.savedBy?.includes(state.currentUser?.id) || false;
    
    // Check if item is designated as an Instagram Vertical Cinematic Video Reel
    if (post.type === 'reel') {
      return `
        <article class="reel-card" data-post-id="${post.id}">
          <div class="story-progress"><div class="progress-fill active"></div></div>
          <video src="${escapeHtml(post.media || 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-4659-large.mp4')}" autoplay muted loop playsinline></video>
          <div class="reel-overlay-info">
            <strong>@${escapeHtml(post.author.username)}</strong>
            <p>${escapeHtml(post.body)}</p>
          </div>
          <div class="reel-actions">
            <button data-action="like">❤️ <span>${post.likes.length}</span></button>
            <button data-action="focus-comment">💬 <span>${post.comments.length}</span></button>
            <button data-action="share">🔄</button>
          </div>
        </article>
      `;
    }

    const media = post.media ? `<img class="post-media" src="${escapeHtml(post.media)}" alt="Media">` : "";
    return `
      <article class="post-card" data-post-id="${post.id}">
        ${media}
        <div class="post-body">
          <header class="post-header">
            ${avatar(post.author)}
            <div>
              <strong>${escapeHtml(post.author.name)} <span class="verified">✔</span></strong>
              <span class="muted">@${escapeHtml(post.author.username)} · ${timeAgo(post.createdAt)} · Content via ${post.type.toUpperCase()}</span>
            </div>
          </header>
          <p class="post-text">${escapeHtml(post.body)}</p>
          <div class="tag-row">${post.tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join("")}</div>
          <div class="post-actions">
            <button class="post-action ${liked ? "active" : ""}" data-action="like">${liked ? "❤️ Liked" : "👍 Like"} (${post.likes.length})</button>
            <button class="post-action" data-action="focus-comment">💬 Comment (${post.comments.length})</button>
            <button class="post-action ${saved ? "active" : ""}" data-action="save">🔖 ${saved ? "Saved" : "Save"}</button>
            <button class="post-action" data-action="share">🔗 Share</button>
          </div>
          <div class="comments">
            ${post.comments.slice(-3).map((comment) => `
              <div><strong>${escapeHtml(comment.author.name)}:</strong> ${escapeHtml(comment.body)}</div>
            `).join("")}
          </div>
          <form class="comment-form">
            <input name="body" placeholder="Write a constructive response..." required />
            <button class="ghost-button" type="submit">Send</button>
          </form>
        </div>
      </article>
    `;
  }).join("") || `<div class="mini-panel">No platform contents match your search criteria.</div>`;

  // Attach Click Handlers to UI actions
  $$(".post-card, .reel-card").forEach((card) => {
    const postId = card.dataset.postId;
    card.querySelector('[data-action="like"]').addEventListener("click", () => togglePost(postId, "like"));
    card.querySelector('[data-action="share"]').addEventListener("click", () => {
      navigator.clipboard?.writeText(window.location.href);
      toast("Link copied to clipboard!");
    });
    card.querySelector('[data-action="focus-comment"]').addEventListener("click", () => card.querySelector("input")?.focus());
    
    if(card.querySelector(".comment-form")) {
      card.querySelector(".comment-form").addEventListener("submit", (event) => submitComment(event, postId));
    }
    if(card.querySelector('[data-action="save"]')) {
      card.querySelector('[data-action="save"]').addEventListener("click", () => togglePost(postId, "save"));
    }
  });
}

/**
 * Render Layer 3: Left/Right Context Widgets (Suggestions & Trends Engine)
 */
function renderSuggestions() {
  $("#suggestionsList").innerHTML = state.users
    .filter((user) => user.id !== state.currentUser?.id)
    .map((user) => {
      const following = state.currentUser?.following.includes(user.id);
      return `
        <div class="person-row">
          ${avatar(user, "small-avatar")}
          <div>
            <strong>${escapeHtml(user.name)}</strong>
            <span class="muted">@${escapeHtml(user.username)}</span>
          </div>
          <button class="ghost-button" data-follow="${user.id}">${following ? "Following" : "＋ Follow"}</button>
        </div>
      `;
    }).join("") || `<p class="muted">No new users detected.</p>`;

  $$("[data-follow]").forEach((button) => {
    button.addEventListener("click", () => followUser(button.dataset.follow));
  });
}

function renderNotifications() {
  $("#notificationsList").innerHTML = state.notifications.length
    ? state.notifications.map((n) => `
      <div class="notification-row">
        <span style="color:${n.read ? 'var(--muted)' : 'var(--blue)'}">${n.read ? "○" : "●"}</span>
        <div>
          <strong>${escapeHtml(n.text)}</strong>
          <div class="muted">${timeAgo(n.createdAt)}</div>
        </div>
      </div>
    `).join("")
    : `<p class="muted">No platform alerts found.</p>`;
}

function renderTrends() {
  const counts = {};
  state.posts.flatMap((post) => post.tags || []).forEach((tag) => { counts[tag] = (counts[tag] || 0) + 1; });
  $("#trendingList").innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => `<span class="trend">#${escapeHtml(tag)}</span>`)
    .join("") || `<span class="muted">No topics trending.</span>`;
}

function renderExplore() {
  const photoPosts = state.posts.filter((post) => post.media);
  $("#exploreGrid").innerHTML = [
    ...photoPosts.map((post) => `
      <article class="explore-card">
        <img src="${escapeHtml(post.media)}" alt="Explore">
        <h3>Shared by ${escapeHtml(post.author.name)}</h3>
        <p>${escapeHtml(post.body)}</p>
      </article>
    `),
    `<article class="explore-card">
      <h3>🐦 Twitter Timeline Architecture</h3>
      <p>Micro-structured statuses tracking verified account tags, relative timestamp counters, and search matrices.</p>
    </article>`,
    `<article class="explore-card">
      <h3>💬 Telegram Hyper-Channels</h3>
      <p>Multi-participant global chat systems operating inside customized asynchronous view scopes.</p>
    </article>`
  ].join("");
}

/**
 * Render Layer 4: Telegram-style Encrypted Live-Chat System Layout
 */
function renderMessages() {
  $("#chatList").innerHTML = state.chats.map((chat) => `
    <button class="chat-row ${chat.id === state.activeChatId ? "active" : ""}" data-chat-id="${chat.id}">
      <div>
        <strong>${escapeHtml(chat.title)}</strong>
        <div class="muted">${chat.kind === "group" ? "👥 Public Channel" : "🔒 Private Chat"} · ${chat.messages.length} messages</div>
      </div>
    </button>
  `).join("");

  $$(".chat-row").forEach((row) => {
    row.addEventListener("click", () => {
      state.activeChatId = row.dataset.chatId;
      renderMessages();
    });
  });

  const chat = state.chats.find((item) => item.id === state.activeChatId);
  if (!chat) {
    $("#chatHeader").textContent = "No messaging instances active.";
    $("#messageList").innerHTML = "";
    return;
  }

  $("#chatHeader").innerHTML = `<span>${escapeHtml(chat.title)}</span> <span class="muted" style="font-size:12px">${chat.participants.length} online</span>`;
  $("#messageList").innerHTML = chat.messages.map((m) => `
    <div class="bubble ${m.authorId === state.currentUser?.id ? "mine" : ""}">
      <strong>${escapeHtml(m.author.name)}</strong>
      <div>${escapeHtml(m.text)}</div>
      <span class="muted">${timeAgo(m.createdAt)}</span>
    </div>
  `).join("");
  
  const msgListElement = $("#messageList");
  msgListElement.scrollTop = msgListElement.scrollHeight;
}

function renderGroups() {
  const groups = state.chats.filter((chat) => chat.kind === "group");
  $("#groupsGrid").innerHTML = groups.map((group) => `
    <article class="group-card">
      <div>
        <h3>${escapeHtml(group.title)}</h3>
        <p>${group.participants.length} Active Subscribers · ${group.messages.length} Broadcast Dispatches</p>
      </div>
      <button class="primary-button" data-open-chat="${group.id}">Enter Broadcast Channel</button>
    </article>
  `).join("");

  $$("[data-open-chat]").forEach((b) => {
    b.addEventListener("click", () => {
      switchView("messages");
      state.activeChatId = b.dataset.openChat;
      renderMessages();
    });
  });
}

/**
 * Render Layer 5: Twitter-style Micro-Dashboard User Profile View Layout
 */
function renderProfile() {
  const user = state.currentUser;
  if (!user) return;
  const myPosts = state.posts.filter((post) => post.authorId === user.id);
  
  $("#profilePanel").innerHTML = `
    <div class="profile-cover" style="background: ${user.cover || 'linear-gradient(90deg, #1877f2, #00a884)'}"></div>
    <div class="profile-body">
      ${avatar(user, "profile-avatar")}
      <h2>${escapeHtml(user.name)} <span class="verified">✔</span></h2>
      <p class="muted">@${escapeHtml(user.username)} · 📍 ${escapeHtml(user.location || "Global Mesh Network")}</p>
      <p>${escapeHtml(user.bio || "Building alternative digital networks via Social Sphere interface protocols.")}</p>
      
      <div class="stats">
        <div class="stat"><strong>${myPosts.length}</strong>Posts</div>
        <div class="stat"><strong>${user.followers?.length || 102}</strong>Followers</div>
        <div class="stat"><strong>${user.following?.length || 56}</strong>Following</div>
      </div>
      
      <h3 style="font-size:16px; font-weight:800; margin-bottom:12px;">Your Micro-Timeline</h3>
      <div class="feed">
        ${myPosts.map(p => `
          <div style="padding:14px; background:var(--bg); border-radius:8px; margin-bottom:10px;">
            <span class="tag">#${p.type}</span> — ${escapeHtml(p.body)}
          </div>
        `).join("") || '<p class="muted">No personal micro-posts deployed yet.</p>'}
      </div>
    </div>
  `;
}

/**
 * Render Coordinator Pipeline
 */
function render() {
  if (!state.currentUser) return;
  renderStories();
  renderFeed();
  renderSuggestions();
  renderNotifications();
  renderTrends();
  renderExplore();
  renderMessages();
  renderGroups();
  renderProfile();
}

/**
 * View Navigation Manager Router
 */
function switchView(viewName) {
  $$(".nav-button").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === viewName));
  $$(".view").forEach((v) => v.classList.remove("active-view"));
  $(`#${viewName}View`).classList.add("active-view");
  
  const headings = {
    home: ["Home", "Dynamic Combined System Feeds"],
    explore: ["Explore", "Visual Multimedia Grid Matrices"],
    messages: ["Secure Messaging", "Asynchronous Direct & Group Pipelines"],
    groups: ["Broadcast Channels", "Mass Communication Communities"],
    profile: ["User Dashboard", "Personalized Profile Analytics"]
  };
  
  $("#viewTitle").textContent = headings[viewName][0];
  $("#viewSubtitle").textContent = headings[viewName][1];
}

/**
 * Event-Driven Dynamic Form Actions
 */
async function submitPost(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = {
    body: formData.get("body"),
    type: formData.get("type"),
    media: formData.get("media"),
    tags: formData.get("tags") ? formData.get("tags").split(",").map(t => t.trim()) : []
  };

  try {
    const freshPost = await api("/api/posts", { method: "POST", body: JSON.stringify(payload) });
    state.posts.unshift(freshPost);
    form.reset();
    render();
    toast("Post shared successfully.");
  } catch (err) {
    toast(err.message);
  }
}

async function submitStory(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const text = new FormData(form).get("text");
  try {
    const story = await api("/api/stories", { method: "POST", body: JSON.stringify({ text, accent: "#1877f2" }) });
    state.stories.unshift(story);
    form.reset();
    renderStories();
    toast("Status updated.");
  } catch (err) {
    toast(err.message);
  }
}

async function togglePost(postId, action) {
  try {
    const mutatedPost = await api(`/api/posts/${postId}/${action}`, { method: "POST" });
    state.posts = state.posts.map((item) => item.id === mutatedPost.id ? mutatedPost : item);
    renderFeed();
  } catch (err) {
    toast(err.message);
  }
}

async function submitComment(event, postId) {
  event.preventDefault();
  const form = event.currentTarget;
  const body = new FormData(form).get("body");
  try {
    const post = await api(`/api/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ body }) });
    state.posts = state.posts.map((item) => item.id === post.id ? post : item);
    form.reset();
    renderFeed();
  } catch (err) {
    toast(err.message);
  }
}

async function followUser(userId) {
  try {
    const res = await api(`/api/users/${userId}/follow`, { method: "POST" });
    state.currentUser = res.currentUser;
    state.users = state.users.map((u) => u.id === res.target.id ? res.target : u);
    renderSuggestions();
    renderProfile();
  } catch (err) {
    toast(err.message);
  }
}

async function submitMessage(event) {
  event.preventDefault();
  const chat = state.chats.find((item) => item.id === state.activeChatId);
  if (!chat) return;
  const form = event.currentTarget;
  const text = new FormData(form).get("text");
  try {
    const msg = await api(`/api/chats/${chat.id}/messages`, { method: "POST", body: JSON.stringify({ text }) });
    chat.messages.push(msg);
    form.reset();
    renderMessages();
  } catch (err) {
    toast(err.message);
  }
}

/**
 * Document Event Binding Lifecycle Management
 */
function wireEvents() {
  $$("[data-auth-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$("[data-auth-tab]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      $("#loginForm").classList.toggle("hidden", btn.dataset.authTab !== "login");
      $("#signupForm").classList.toggle("hidden", btn.dataset.authTab !== "signup");
    });
  });

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const data = await api("/api/login", { method: "POST", body: JSON.stringify(payload) });
      state.token = data.token;
      localStorage.setItem("socialSphereToken", data.token);
      applyState(data.state);
      setAuthenticated(true);
    } catch (err) {
      $("#authMessage").textContent = err.message;
    }
  });

  $("#signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const data = await api("/api/signup", { method: "POST", body: JSON.stringify(payload) });
      state.token = data.token;
      localStorage.setItem("socialSphereToken", data.token);
      applyState(data.state);
      setAuthenticated(true);
    } catch (err) {
      $("#authMessage").textContent = err.message;
    }
  });

  $("#logoutButton").addEventListener("click", () => {
    localStorage.removeItem("socialSphereToken");
    state.token = "";
    state.currentUser = null;
    setAuthenticated(false);
    toast("Session discarded safely.");
  });

  $$(".nav-button").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  $("#postForm").addEventListener("submit", submitPost);
  $("#messageForm").addEventListener("submit", submitMessage);
  
  $("#searchInput").addEventListener("input", (e) => {
    state.search = e.target.value;
    renderFeed();
  });

  $("#markReadButton").addEventListener("click", () => {
    state.notifications = state.notifications.map(n => ({...n, read: true}));
    renderNotifications();
    toast("All interactions updated.");
  });

  // Simulation Typing Pipeline (Telegram style indicator)
  const msgInput = $("#messageForm input");
  if(msgInput){
     msgInput.addEventListener("input", () => {
        const indicator = $("#typingIndicator");
        indicator.classList.remove("hidden");
        clearTimeout(window.typingTimer);
        window.typingTimer = setTimeout(() => indicator.classList.add("hidden"), 1200);
     });
  }
}

/**
 * ==========================================================================
 * ENVIRONMENT FALLBACK MOCK DATA ENGINE SUB-SYSTEM
 * ==========================================================================
 */
function mockApiHandler(path, options) {
  const mockUser = { id: "u1", name: "Mohit", username: "mohit_net", avatar: "M", location: "New Delhi, IN", bio: "Full Stack Interface Engineer", following: ["u2"], followers: ["u3"] };
  const targetUser = { id: "u2", name: "Alex Mercer", username: "mercer_dev", avatar: "A", following: [], followers: [] };

  if (path.includes("/api/state") || path.includes("/api/login") || path.includes("/api/signup")) {
    return Promise.resolve({
      token: "mock_token_112233",
      currentUser: mockUser,
      users: [mockUser, targetUser],
      posts: [
        { id: "p1", type: "tweet", authorId: "u1", author: mockUser, body: "Testing the newly unified framework configuration. Feels smooth!", tags: ["web3", "vibe"], likes: [], savedBy: [], comments: [], createdAt: new Date() },
        { id: "p2", type: "reel", authorId: "u2", author: targetUser, body: "Look at this high-fidelity video landscape compile stream!", tags: ["reels", "cinematic"], likes: ["u1"], savedBy: [], comments: [], media: "https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-4659-large.mp4", createdAt: new Date(Date.now() - 60000) }
      ],
      stories: [{ id: "s1", author: targetUser, text: "Coding from the mountains today!", accent: "#00a884" }],
      chats: [
        { id: "c1", title: "Social Sphere Dev Group", kind: "group", participants: ["u1", "u2"], messages: [{ authorId: "u2", author: targetUser, text: "Hey! Let me know when the UI integration completes.", createdAt: new Date() }] }
      ],
      notifications: [{ id: "n1", text: "Alex Mercer liked your unified interface status update", read: false, createdAt: new Date() }]
    });
  }
  if (path.includes("/posts") && options.method === "POST") {
    const bodyArgs = JSON.parse(options.body);
    return Promise.resolve({ id: Math.random().toString(), type: bodyArgs.type || "text", authorId: "u1", author: mockUser, body: bodyArgs.body, tags: bodyArgs.tags || [], likes: [], comments: [], media: bodyArgs.media, createdAt: new Date() });
  }
  if (path.includes("/comments")) {
    return Promise.resolve({ id: "p1", type: "tweet", authorId: "u1", author: mockUser, body: "Updated with comments array tracking parameters.", tags: ["vibe"], likes: [], savedBy: [], comments: [{author: mockUser, body: "Self commentary track added."}], createdAt: new Date() });
  }
  if (path.includes("/like") || path.includes("/save")) {
    return Promise.resolve({ id: "p1", type: "tweet", authorId: "u1", author: mockUser, body: "Interactions simulated.", tags: ["vibe"], likes: ["u1"], savedBy: ["u1"], comments: [], createdAt: new Date() });
  }
  return Promise.resolve({});
}

// System Boot Initialization
document.addEventListener("DOMContentLoaded", () => {
  wireEvents();
  loadState();
});