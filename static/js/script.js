// Shared UI toggles
function showNewUserForm() {
  document.getElementById('new-user-form').classList.remove('hidden');
  document.getElementById('login-form').classList.add('hidden');
}

function showLoginForm() {
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('new-user-form').classList.add('hidden');
  const ct = document.getElementById('countdown-text');
  if (ct) ct.innerText = '';
}

function hash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

function registerUser() {
  const username = document.getElementById('new-username').value.trim();
  const password = document.getElementById('new-password').value;
  const timer = parseInt(document.getElementById('new-timer').value);
  if (!username) { alert('Enter username'); return; }

  const now = Date.now();

  localStorage.setItem('user_' + username, JSON.stringify({
    password: hash(password || ''),
    expiry: timer,
    created: now
  }));
  localStorage.setItem('current_user', username);
  localStorage.setItem('login_time', now.toString());

  window.location.href = 'notes.html';
}

function loginUser() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const newTimer = parseInt(document.getElementById('login-timer').value);
  const userKey = 'user_' + username;
  const userDataRaw = localStorage.getItem(userKey);
  const now = Date.now();
  const messageEl = document.getElementById('message');

  if (!userDataRaw) {
    if (messageEl) messageEl.innerText = 'User not found.';
    return;
  }

  const userData = JSON.parse(userDataRaw);
  const remaining = userData.created + userData.expiry - now;

  // If expired → remove password protection and allow username-only login
  if (remaining <= 0) {
    localStorage.removeItem(userKey); // remove stored password expiry
    localStorage.setItem('current_user', username);
    if (messageEl) messageEl.innerText = '✅ Password expired. Logging in with username only.';
    setTimeout(() => window.location.href = 'notes.html', 800);
    return;
  }

  // If password blank → show remaining timer
  if (!password) {
    const d = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const h = Math.floor((remaining / (1000 * 60 * 60)) % 24);
    const m = Math.floor((remaining / (1000 * 60)) % 60);
    const s = Math.floor((remaining / 1000) % 60);
    if (messageEl) messageEl.innerText =
      `❌ Password still required. Time left: ${d}d ${h}h ${m}m ${s}s`;
    return;
  }

  // Correct password → reset timer and login
  if (userData.password === hash(password)) {
    const updatedData = {
      password: userData.password,
      expiry: newTimer,
      created: now
    };
    localStorage.setItem(userKey, JSON.stringify(updatedData));
    localStorage.setItem('current_user', username);
    localStorage.setItem('login_time', now.toString());
    window.location.href = 'notes.html';
  } else {
    if (messageEl) messageEl.innerText = '❌ Incorrect password.';
  }
}

function saveNote() {
  const user = localStorage.getItem('current_user');
  if (!user) { alert('No user logged in'); return; }

  const title = document.getElementById('note-title').value.trim() || 'Untitled';
  const content = document.getElementById('note-content').value;
  const date = new Date().toLocaleString();

  const note = { title, content, date };
  const noteKey = `note_${user}_${Date.now()}`;
  localStorage.setItem(noteKey, JSON.stringify(note));
  document.getElementById('note-title').value = '';
  document.getElementById('note-content').value = '';
  loadNotes();
}

function loadNotes() {
  const user = localStorage.getItem('current_user');
  if (!user) return;

  const notesList = document.getElementById('notes-list');
  if (!notesList) return;

  notesList.innerHTML = '';
  const keys = Object.keys(localStorage).filter(k => k.startsWith(`note_${user}_`)).sort().reverse();

  keys.forEach(key => {
    const note = JSON.parse(localStorage.getItem(key));
    const li = document.createElement('li');
    li.textContent = `${note.title} (${note.date})`;
    li.onclick = () => {
      // simple view/edit modal replacement: prompt to view/edit
      const action = confirm('View note? OK = view, Cancel = delete this note');
      if (action) {
        alert(note.content);
      } else {
        if (confirm('Delete this note permanently?')) {
          localStorage.removeItem(key);
          loadNotes();
        }
      }
    };
    notesList.appendChild(li);
  });
}

function showCountdown() {
  const user = localStorage.getItem('current_user');
  if (!user) return;

  const userDataRaw = localStorage.getItem('user_' + user);
  if (!userDataRaw) {
    const display = document.getElementById('countdown-display');
    if (display) display.textContent = '🔓 Password protection expired.';
    return;
  }

  const userData = JSON.parse(userDataRaw);
  const endTime = userData.created + userData.expiry;

  const display = document.getElementById('countdown-display');
  if (!display) return;

  function update() {
    const now = Date.now();
    const remaining = endTime - now;

    if (remaining <= 0) {
      display.textContent = '🔓 Password protection expired.';
      return;
    }

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((remaining / (1000 * 60)) % 60);
    const seconds = Math.floor((remaining / 1000) % 60);
    display.textContent = `⏳ Password protection ends in: ${days}d ${hours}h ${minutes}m ${seconds}s`;

    requestAnimationFrame(update);
  }

  update();
}

function logout() {
  localStorage.removeItem('current_user');
  window.location.href = 'index.html';
}
