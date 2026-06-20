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

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2200);
}

function timeAgo(value) {
  const diff = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function avatar(user, extraClass = "") {
  return `<div class="avatar ${extraClass}">${escapeHtml(user?.avatar || "?")}</div>`;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

function applyState(nextState) {
  Object.assign(state, nextState);
  state.activeChatId = state.activeChatId || state.chats[0]?.id || "";
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
    applyState(await api("/api/state"));
    setAuthenticated(true);
  } catch {
    localStorage.removeItem("socialSphereToken");
    state.token = "";
    setAuthenticated(false);
  }
}

function renderStories() {
  const current = state.currentUser;
  $("#storiesStrip").innerHTML = [
    `<form class="story-card" id="storyForm" style="background: linear-gradient(135deg, #172033, #2563eb)">
      <strong>Your story</strong>
      <input name="text" placeholder="Add story" maxlength="64">
      <button class="primary-button" type="submit">Share</button>
    </form>`,
    ...state.stories.map((story) => `
      <article class="story-card" style="background: linear-gradient(135deg, ${story.accent}, #172033)">
        ${avatar(story.author, "small-avatar")}
        <div>
          <strong>${escapeHtml(story.author.name)}</strong>
          <p>${escapeHtml(story.text)}</p>
        </div>
      </article>`)
  ].join("");

  $("#composerAvatar").textContent = current?.avatar || "?";
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

function renderFeed() {
  $("#feed").innerHTML = filteredPosts().map((post) => {
    const liked = post.likes.includes(state.currentUser.id);
    const saved = post.savedBy.includes(state.currentUser.id);
    const media = post.media ? `<img class="post-media" src="${escapeHtml(post.media)}" alt="${escapeHtml(post.type)} post media">` : "";
    return `
      <article class="post-card" data-post-id="${post.id}">
        ${media}
        <div class="post-body">
          <header class="post-header">
            ${avatar(post.author)}
            <div>
              <strong>${escapeHtml(post.author.name)}</strong>
              <span class="muted">@${escapeHtml(post.author.username)} · ${timeAgo(post.createdAt)} · ${escapeHtml(post.type)}</span>
            </div>
          </header>
          <p class="post-text">${escapeHtml(post.body)}</p>
          <div class="tag-row">${post.tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join("")}</div>
          <div class="post-actions">
            <button class="post-action ${liked ? "active" : ""}" data-action="like">${liked ? "Liked" : "Like"} · ${post.likes.length}</button>
            <button class="post-action" data-action="focus-comment">Comment · ${post.comments.length}</button>
            <button class="post-action ${saved ? "active" : ""}" data-action="save">${saved ? "Saved" : "Save"}</button>
            <button class="post-action" data-action="share">Share</button>
          </div>
          <div class="comments">
            ${post.comments.slice(-3).map((comment) => `
              <div><strong>${escapeHtml(comment.author.name)}:</strong> ${escapeHtml(comment.body)}</div>
            `).join("")}
          </div>
          <form class="comment-form">
            <input name="body" placeholder="Write a comment">
            <button class="ghost-button" type="submit">Send</button>
          </form>
        </div>
      </article>
    `;
  }).join("") || `<div class="mini-panel">No posts match your search.</div>`;

  $$(".post-card").forEach((card) => {
    const postId = card.dataset.postId;
    card.querySelector('[data-action="like"]').addEventListener("click", () => togglePost(postId, "like"));
    card.querySelector('[data-action="save"]').addEventListener("click", () => togglePost(postId, "save"));
    card.querySelector('[data-action="share"]').addEventListener("click", () => toast("Share link copied for demo."));
    card.querySelector('[data-action="focus-comment"]').addEventListener("click", () => card.querySelector("input").focus());
    card.querySelector(".comment-form").addEventListener("submit", (event) => submitComment(event, postId));
  });
}

function renderSuggestions() {
  $("#suggestionsList").innerHTML = state.users
    .filter((user) => user.id !== state.currentUser.id)
    .map((user) => {
      const following = state.currentUser.following.includes(user.id);
      return `
        <div class="person-row">
          ${avatar(user, "small-avatar")}
          <div>
            <strong>${escapeHtml(user.name)}</strong>
            <span class="muted">@${escapeHtml(user.username)}</span>
          </div>
          <button class="ghost-button" data-follow="${user.id}">${following ? "Following" : "Follow"}</button>
        </div>
      `;
    }).join("");

  $$("[data-follow]").forEach((button) => {
    button.addEventListener("click", () => followUser(button.dataset.follow));
  });
}

function renderNotifications() {
  $("#notificationsList").innerHTML = state.notifications.length
    ? state.notifications.map((notification) => `
      <div class="notification-row">
        <span>${notification.read ? "○" : "●"}</span>
        <div>
          <strong>${escapeHtml(notification.text)}</strong>
          <div class="muted">${timeAgo(notification.createdAt)} ago</div>
        </div>
      </div>
    `).join("")
    : `<p class="muted">No notifications yet.</p>`;
}

function renderTrends() {
  const counts = {};
  state.posts.flatMap((post) => post.tags).forEach((tag) => {
    counts[tag] = (counts[tag] || 0) + 1;
  });
  $("#trendingList").innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => `<span class="trend">#${escapeHtml(tag)} ${count}</span>`)
    .join("") || `<span class="muted">No tags yet.</span>`;
}

function renderExplore() {
  const photoPosts = state.posts.filter((post) => post.media);
  $("#exploreGrid").innerHTML = [
    ...photoPosts.map((post) => `
      <article class="explore-card">
        <img src="${escapeHtml(post.media)}" alt="Explore media">
        <strong>${escapeHtml(post.author.name)}</strong>
        <p>${escapeHtml(post.body)}</p>
      </article>
    `),
    `<article class="explore-card">
      <h3>Twitter/X style</h3>
      <p>Fast short-form posts, hashtags, likes, comments, saves, and share actions.</p>
    </article>`,
    `<article class="explore-card">
      <h3>Instagram style</h3>
      <p>Stories, photo cards, reels, creator profiles, and saved posts.</p>
    </article>`,
    `<article class="explore-card">
      <h3>Facebook style</h3>
      <p>Rich timeline, friend suggestions, notifications, communities, and comments.</p>
    </article>`
  ].join("");
}

function renderMessages() {
  $("#chatList").innerHTML = state.chats.map((chat) => `
    <button class="chat-row ${chat.id === state.activeChatId ? "active" : ""}" data-chat-id="${chat.id}">
      <div>
        <strong>${escapeHtml(chat.title)}</strong>
        <div class="muted">${chat.kind === "group" ? "Telegram group" : "WhatsApp chat"} · ${chat.messages.length} messages</div>
      </div>
    </button>
  `).join("");

  $$(".chat-row").forEach((row) => {
    row.addEventListener("click", () => {
      state.activeChatId = row.dataset.chatId;
      renderMessages();
    });
  });

  const chat = state.chats.find((item) => item.id === state.activeChatId) || state.chats[0];
  if (!chat) {
    $("#chatHeader").textContent = "No chats yet";
    $("#messageList").innerHTML = "";
    return;
  }

  $("#chatHeader").innerHTML = `${escapeHtml(chat.title)} <span class="muted">${chat.participants.length} members</span>`;
  $("#messageList").innerHTML = chat.messages.map((message) => `
    <div class="bubble ${message.authorId === state.currentUser.id ? "mine" : ""}">
      <strong>${escapeHtml(message.author.name)}</strong>
      <div>${escapeHtml(message.text)}</div>
      <span class="muted">${timeAgo(message.createdAt)} ago</span>
    </div>
  `).join("");
  $("#messageList").scrollTop = $("#messageList").scrollHeight;
}

function renderGroups() {
  const groups = state.chats.filter((chat) => chat.kind === "group");
  $("#groupsGrid").innerHTML = groups.map((group) => `
    <article class="group-card">
      <h3>${escapeHtml(group.title)}</h3>
      <p>${group.participants.length} members · ${group.messages.length} messages</p>
      <p class="muted">Channel tools, group chat, community updates, and creator coordination.</p>
      <button class="primary-button" data-open-chat="${group.id}">Open</button>
    </article>
  `).join("");
  $$("[data-open-chat]").forEach((button) => {
    button.addEventListener("click", () => {
      switchView("messages");
      state.activeChatId = button.dataset.openChat;
      renderMessages();
    });
  });
}

function renderProfile() {
  const user = state.currentUser;
  const myPosts = state.posts.filter((post) => post.authorId === user.id);
  $("#profilePanel").innerHTML = `
    <div class="profile-cover" style="background: ${user.cover}"></div>
    <div class="profile-body">
      ${avatar(user, "profile-avatar")}
      <h2>${escapeHtml(user.name)}</h2>
      <p class="muted">@${escapeHtml(user.username)} · ${escapeHtml(user.location)}</p>
      <p>${escapeHtml(user.bio)}</p>
      <div class="stats">
        <div class="stat"><strong>${myPosts.length}</strong><span class="muted">Posts</span></div>
        <div class="stat"><strong>${user.followers.length}</strong><span class="muted">Followers</span></div>
        <div class="stat"><strong>${user.following.length}</strong><span class="muted">Following</span></div>
      </div>
      <h3>Your latest posts</h3>
      ${myPosts.slice(0, 3).map((post) => `<p><strong>${escapeHtml(post.type)}</strong> · ${escapeHtml(post.body)}</p>`).join("") || `<p class="muted">Create your first post from Home.</p>`}
    </div>
  `;
}

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

function switchView(viewName) {
  $$(".nav-button").forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
  $$(".view").forEach((view) => view.classList.remove("active-view"));
  $(`#${viewName}View`).classList.add("active-view");
  const labels = {
    home: ["Home", "Your combined social feed"],
    explore: ["Explore", "Photos, reels, hashtags, and notifications"],
    messages: ["Messages", "WhatsApp-style direct chats and Telegram-style groups"],
    groups: ["Groups", "Communities and broadcast channels"],
    profile: ["Profile", "Your public social identity"]
  };
  $("#viewTitle").textContent = labels[viewName][0];
  $("#viewSubtitle").textContent = labels[viewName][1];
}

async function submitPost(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  try {
    const post = await api("/api/posts", { method: "POST", body: JSON.stringify(payload) });
    state.posts.unshift(post);
    form.reset();
    render();
    toast("Post published.");
  } catch (error) {
    toast(error.message);
  }
}

async function submitStory(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const text = new FormData(form).get("text");
  try {
    const story = await api("/api/stories", {
      method: "POST",
      body: JSON.stringify({ text, accent: "#2563eb" })
    });
    state.stories.unshift(story);
    renderStories();
    toast("Story shared.");
  } catch (error) {
    toast(error.message);
  }
}

async function togglePost(postId, action) {
  try {
    const post = await api(`/api/posts/${postId}/${action}`, { method: "POST" });
    state.posts = state.posts.map((item) => item.id === post.id ? post : item);
    renderFeed();
    renderProfile();
  } catch (error) {
    toast(error.message);
  }
}

async function submitComment(event, postId) {
  event.preventDefault();
  const form = event.currentTarget;
  const body = new FormData(form).get("body");
  try {
    const post = await api(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body })
    });
    state.posts = state.posts.map((item) => item.id === post.id ? post : item);
    form.reset();
    renderFeed();
  } catch (error) {
    toast(error.message);
  }
}

async function followUser(userId) {
  try {
    const result = await api(`/api/users/${userId}/follow`, { method: "POST" });
    state.currentUser = result.currentUser;
    state.users = state.users.map((user) => user.id === result.target.id ? result.target : user);
    renderSuggestions();
    renderProfile();
  } catch (error) {
    toast(error.message);
  }
}

async function submitMessage(event) {
  event.preventDefault();
  const chat = state.chats.find((item) => item.id === state.activeChatId);
  if (!chat) return;
  const form = event.currentTarget;
  const text = new FormData(form).get("text");
  try {
    const message = await api(`/api/chats/${chat.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ text })
    });
    chat.messages.push(message);
    form.reset();
    renderMessages();
    renderGroups();
  } catch (error) {
    toast(error.message);
  }
}

function wireEvents() {
  $$("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      $$("[data-auth-tab]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      $("#loginForm").classList.toggle("hidden", button.dataset.authTab !== "login");
      $("#signupForm").classList.toggle("hidden", button.dataset.authTab !== "signup");
      $("#authMessage").textContent = "";
    });
  });

  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const data = await api("/api/login", { method: "POST", body: JSON.stringify(payload) });
      state.token = data.token;
      localStorage.setItem("socialSphereToken", data.token);
      applyState(data.state);
      setAuthenticated(true);
    } catch (error) {
      $("#authMessage").textContent = error.message;
    }
  });

  $("#signupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const data = await api("/api/signup", { method: "POST", body: JSON.stringify(payload) });
      state.token = data.token;
      localStorage.setItem("socialSphereToken", data.token);
      applyState(data.state);
      setAuthenticated(true);
    } catch (error) {
      $("#authMessage").textContent = error.message;
    }
  });

  $("#logoutButton").addEventListener("click", async () => {
    await api("/api/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("socialSphereToken");
    Object.assign(state, { token: "", currentUser: null });
    setAuthenticated(false);
  });

  $$(".nav-button").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  $("#postForm").addEventListener("submit", submitPost);
  $("#messageForm").addEventListener("submit", submitMessage);
  $("#searchInput").addEventListener("input", (event) => {
    state.search = event.target.value;
    renderFeed();
  });
  $("#markReadButton").addEventListener("click", async () => {
    await api("/api/notifications/read", { method: "POST" });
    state.notifications = state.notifications.map((notification) => ({ ...notification, read: true }));
    renderNotifications();
    toast("Notifications marked read.");
  });
}

wireEvents();
loadState();
