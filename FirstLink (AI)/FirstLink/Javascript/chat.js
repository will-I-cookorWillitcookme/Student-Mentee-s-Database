/*
 * chat.js
 * ----------------------------------------------------------------------
 * Talks to chat_server.py so mentors and mentees can send and receive
 * real messages. Include this file (after Authetication.js) on both
 * MentorsPage.html and mentees_message.html -- it detects which page
 * it's on and wires up the right one.
 *
 * Refreshing is MANUAL: a conversation loads once when you open the
 * page or pick a student, again right after you send a message, and
 * again if the person clicks the "Refresh" button. It does not poll.
 *
 * IMPORTANT - ADJUST getCurrentUser() FOR YOUR REAL LOGIN SYSTEM
 * This assumes Authetication.js stores the logged-in user's username
 * and role ("mentor" or "mentee") in localStorage under the keys
 * "username" and "role". If your Authetication.js stores identity
 * differently (a different key, a cookie, a session lookup, etc.),
 * this is the only function you need to change.
 * ----------------------------------------------------------------------
 */

const CHAT_API = "/api";

function getCurrentUser() {
  return {
    username: localStorage.getItem("username"),
    role: localStorage.getItem("role"), // "mentor" or "mentee"
  };
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}

function renderMessages(chatbody, messages, myUsername) {
  chatbody.innerHTML = "";

  if (messages.length === 0) {
    const empty = document.createElement("p");
    empty.className = "msg-sender";
    empty.textContent = "No messages yet. Say hello!";
    chatbody.appendChild(empty);
    return;
  }

  messages.forEach((msg) => {
    const isMine = msg.sender === myUsername;

    const row = document.createElement("div");
    row.className = "msg-row " + (isMine ? "you-row" : "mentor-row");

    const senderLabel = document.createElement("span");
    senderLabel.className = "msg-sender";
    senderLabel.textContent = isMine ? "You" : msg.sender;

    const bubble = document.createElement("p");
    bubble.className = "msg-bubble " + (isMine ? "you-bubble" : "mentor-bubble");
    bubble.textContent = msg.content;

    const timestamp = document.createElement("span");
    timestamp.className = "msg-timestamp";
    timestamp.textContent = formatTimestamp(msg.timestamp);

    row.appendChild(senderLabel);
    row.appendChild(bubble);
    row.appendChild(timestamp);
    chatbody.appendChild(row);
  });

  chatbody.scrollTop = chatbody.scrollHeight;
}

async function loadConversation(chatbody, myUsername, otherUsername) {
  if (!otherUsername) return;
  try {
    const res = await fetch(
      `${CHAT_API}/messages?user_a=${encodeURIComponent(myUsername)}&user_b=${encodeURIComponent(
        otherUsername
      )}`
    );
    if (!res.ok) throw new Error(await res.text());
    const messages = await res.json();
    renderMessages(chatbody, messages, myUsername);
  } catch (err) {
    console.error("Failed to load messages:", err);
  }
}

async function sendMessage(myUsername, myRole, otherUsername, content) {
  try {
    const res = await fetch(`${CHAT_API}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: myUsername,
        receiver: otherUsername,
        sender_role: myRole,
        content,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (err) {
    console.error("Failed to send message:", err);
    return false;
  }
}

/* -------------------------------------------------------------------- *
 *  MENTOR page (MentorsPage.html)
 * -------------------------------------------------------------------- */
function initMentorChat() {
  const chatbody = document.querySelector(".chatbody");
  const input = document.querySelector("#message-input input");
  const sendBtn = document.querySelector("#message-input button");
  const studentListEl = document.querySelector("#student-list ul");
  const searchInput = document.querySelector("#student-search");
  const refreshBtn = document.querySelector("#refresh-chat");
  const headerTitle = document.querySelector("#current-student-name");
  
  if (!chatbody || !studentListEl) return; // not on the mentor page

  const me = getCurrentUser();
  if (!me.username) {
    chatbody.innerHTML = "<p class='msg-sender'>Please log in to chat.</p>";
    return;
  }

  let activeMentee = null;
  let allMentees = [];

  function selectMentee(name, liEl) {
    activeMentee = name;
    studentListEl
      .querySelectorAll("li")
      .forEach((li) => li.classList.remove("active-student"));
    if (liEl) liEl.classList.add("active-student");
    
    // Update header
    if (headerTitle) {
      headerTitle.textContent = name;
    }
    
    loadConversation(chatbody, me.username, activeMentee);
  }

  async function refreshStudentList() {
    try {
      const res = await fetch(`${CHAT_API}/mentees/${encodeURIComponent(me.username)}`);
      allMentees = res.ok ? await res.json() : [];
      renderStudentList(allMentees);
      
      if (allMentees.length > 0 && !activeMentee) {
        const firstLi = studentListEl.querySelector("li");
        selectMentee(allMentees[0], firstLi);
      }
    } catch (err) {
      console.error("Failed to load student list:", err);
    }
  }

  function renderStudentList(students) {
    studentListEl.innerHTML = "";
    students.forEach((name) => {
      const li = document.createElement("li");
      li.textContent = name;
      li.dataset.username = name;
      li.addEventListener("click", () => selectMentee(name, li));
      studentListEl.appendChild(li);
    });
  }

  function filterStudents(query) {
    const filtered = allMentees.filter(name =>
      name.toLowerCase().includes(query.toLowerCase())
    );
    renderStudentList(filtered);
  }

  async function handleSend() {
    const content = input.value.trim();
    if (!content || !activeMentee) return;
    const ok = await sendMessage(me.username, "mentor", activeMentee, content);
    if (ok) {
      input.value = "";
      loadConversation(chatbody, me.username, activeMentee);
    }
  }

  sendBtn.addEventListener("click", handleSend);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });
  
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filterStudents(e.target.value);
    });
  }
  
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      if (activeMentee) loadConversation(chatbody, me.username, activeMentee);
    });
  }

  refreshStudentList();
}

/* -------------------------------------------------------------------- *
 *  MENTEE page (mentees_message.html)
 * -------------------------------------------------------------------- */
function initMenteeChat() {
  const chatbody = document.querySelector(".chatbody");
  const input = document.querySelector("#message");
  const sendBtn = document.querySelector(".send-button");
  const refreshBtn = document.querySelector("#refresh-chat");
  const mentorNameEl = document.querySelector("#mentor-name");
  const statusEl = document.querySelector("#mentor-status");
  
  if (!chatbody || !input || !sendBtn) return; // not on the mentee page

  const me = getCurrentUser();
  if (!me.username) {
    chatbody.innerHTML = "<p class='msg-sender'>Please log in to chat.</p>";
    return;
  }

  let myMentor = null;

  async function findMentor() {
    try {
      const res = await fetch(`${CHAT_API}/mentors/${encodeURIComponent(me.username)}`);
      const mentors = res.ok ? await res.json() : [];
      myMentor = mentors[0] || null;
      
      if (myMentor) {
        if (mentorNameEl) {
          mentorNameEl.textContent = myMentor;
        }
        if (statusEl) {
          statusEl.classList.add("online");
        }
        loadConversation(chatbody, me.username, myMentor);
      } else {
        chatbody.innerHTML = "<p class='msg-sender'>No mentor assigned yet.</p>";
        if (mentorNameEl) {
          mentorNameEl.textContent = "No Mentor";
        }
      }
    } catch (err) {
      console.error("Failed to find mentor:", err);
      chatbody.innerHTML = "<p class='msg-sender'>Error loading mentor info.</p>";
    }
  }

  async function handleSend() {
    const content = input.value.trim();
    if (!content || !myMentor) return;
    const ok = await sendMessage(me.username, "mentee", myMentor, content);
    if (ok) {
      input.value = "";
      loadConversation(chatbody, me.username, myMentor);
    }
  }

  sendBtn.addEventListener("click", handleSend);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });
  
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      if (myMentor) loadConversation(chatbody, me.username, myMentor);
    });
  }

  findMentor();
}

document.addEventListener("DOMContentLoaded", () => {
  initMentorChat();
  initMenteeChat();
});
