// public/script.js
// Frontend for the JWT-secured Student Notes API.
//
// The token is stored in localStorage (this is a real standalone app served
// by our own Express server, not a sandboxed embed, so that's fine here).
// Every notes API call attaches it as "Authorization: Bearer <token>".

const API = '/api';
const TOKEN_KEY = 'notes_app_token';

let currentUser = null;

/* ================= Auth screen <-> main app switching ================= */
const authScreen = document.getElementById('authScreen');
const mainApp = document.getElementById('mainApp');

function showAuthScreen() {
  authScreen.classList.remove('hidden');
  mainApp.classList.add('hidden');
}

function showMainApp(user) {
  currentUser = user;
  document.getElementById('currentUserName').textContent = user.name;
  authScreen.classList.add('hidden');
  mainApp.classList.remove('hidden');
  loadAllNotes();
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/* ================= Generic API helper (adds the auth header) ================= */
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { headers, ...options });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    // Token missing/invalid/expired -> bounce back to the login screen
    clearToken();
    showAuthScreen();
  }

  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

/* ================= On page load: try to resume a session ================= */
(async function init() {
  const token = getToken();
  if (!token) {
    showAuthScreen();
    return;
  }
  try {
    const user = await api('/auth/me');
    showMainApp(user);
  } catch (err) {
    clearToken();
    showAuthScreen();
  }
})();

/* ================= Auth screen: Login / Register tab switching ================= */
document.querySelectorAll('[data-authtab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-authtab]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#authScreen .tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.authtab).classList.add('active');
  });
});

/* ================= Login ================= */
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const result = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(result.token);
    showMessage(loginMessage, '', '');
    loginForm.reset();
    showMainApp(result.user);
  } catch (err) {
    showMessage(loginMessage, `❌ ${err.message}`, 'error');
  }
});

/* ================= Register ================= */
const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');

registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  try {
    const result = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    setToken(result.token);
    showMessage(registerMessage, '', '');
    registerForm.reset();
    showMainApp(result.user);
  } catch (err) {
    showMessage(registerMessage, `❌ ${err.message}`, 'error');
  }
});

/* ================= Logout ================= */
document.getElementById('logoutBtn').addEventListener('click', () => {
  clearToken();
  currentUser = null;
  showAuthScreen();
});

/* ================= Main app: tab switching ================= */
const tabButtons = document.querySelectorAll('#mainApp .tab-btn[data-tab]');
const tabPanels = document.querySelectorAll('#mainApp .tab-panel');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');

    if (btn.dataset.tab === 'view') loadAllNotes();
    if (btn.dataset.tab === 'stats') loadStats();
  });
});

/* ================= Helpers ================= */
function showMessage(el, text, type) {
  el.textContent = text;
  el.className = `message ${type}`;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function tagsToArray(tagString) {
  if (!tagString) return [];
  return tagString.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function noteCardHtml(note) {
  const tags = (note.tags || []).map(t => `<span>${escapeHtml(t)}</span>`).join('');
  return `
    <div class="note-card">
      <div class="note-id">ID: ${note.id || note._id}</div>
      <h3>${escapeHtml(note.title)}</h3>
      <div class="meta">${escapeHtml(note.subject)} • Created ${formatDate(note.createdAt)}</div>
      ${note.description ? `<p>${escapeHtml(note.description)}</p>` : ''}
      <div class="tags">${tags}</div>
    </div>
  `;
}

function renderNoteList(container, notes, emptyText) {
  if (!notes || notes.length === 0) {
    container.innerHTML = `<p class="empty-state">${emptyText}</p>`;
    return;
  }
  container.innerHTML = notes.map(noteCardHtml).join('');
}

/* ================= Add Note ================= */
const addForm = document.getElementById('addForm');
const addMessage = document.getElementById('addMessage');

addForm.addEventListener('submit', async e => {
  e.preventDefault();
  const payload = {
    title: document.getElementById('addTitle').value,
    subject: document.getElementById('addSubject').value,
    description: document.getElementById('addDescription').value,
    tags: tagsToArray(document.getElementById('addTags').value)
  };

  try {
    const note = await api('/notes', { method: 'POST', body: JSON.stringify(payload) });
    showMessage(addMessage, `✅ Note "${note.title}" saved with ID ${note.id}.`, 'success');
    addForm.reset();
  } catch (err) {
    showMessage(addMessage, `❌ ${err.message}`, 'error');
  }
});

/* ================= View Notes ================= */
const viewList = document.getElementById('viewList');
document.getElementById('refreshViewBtn').addEventListener('click', loadAllNotes);

async function loadAllNotes() {
  if (!getToken()) return;
  viewList.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const notes = await api('/notes');
    renderNoteList(viewList, notes, 'No notes found. Add your first note in the "Add Note" tab.');
  } catch (err) {
    viewList.innerHTML = `<p class="empty-state">❌ ${err.message}</p>`;
  }
}

/* ================= Search ================= */
const searchForm = document.getElementById('searchForm');
const searchList = document.getElementById('searchList');

searchForm.addEventListener('submit', async e => {
  e.preventDefault();
  const field = document.getElementById('searchField').value; // title | subject | tag
  const term = document.getElementById('searchInput').value.trim();

  if (!term) {
    searchList.innerHTML = '<p class="empty-state">❌ Search term cannot be empty.</p>';
    return;
  }

  searchList.innerHTML = '<p class="empty-state">Searching...</p>';
  try {
    const notes = await api(`/notes/search?${field}=${encodeURIComponent(term)}`);
    renderNoteList(searchList, notes, `No notes matched "${term}".`);
  } catch (err) {
    searchList.innerHTML = `<p class="empty-state">❌ ${err.message}</p>`;
  }
});

/* ================= Update ================= */
const findForm = document.getElementById('findForm');
const updateForm = document.getElementById('updateForm');
const updateMessage = document.getElementById('updateMessage');
let currentEditId = null;

findForm.addEventListener('submit', async e => {
  e.preventDefault();
  const id = document.getElementById('updateFindId').value.trim();
  showMessage(updateMessage, '', '');

  try {
    const note = await api(`/notes/${id}`);
    currentEditId = note.id;
    document.getElementById('updateTitle').value = note.title;
    document.getElementById('updateSubject').value = note.subject;
    document.getElementById('updateDescription').value = note.description || '';
    document.getElementById('updateTags').value = (note.tags || []).join(',');
    updateForm.classList.remove('hidden');
  } catch (err) {
    updateForm.classList.add('hidden');
    showMessage(updateMessage, `❌ ${err.message}`, 'error');
  }
});

updateForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!currentEditId) return;

  const payload = {
    title: document.getElementById('updateTitle').value,
    subject: document.getElementById('updateSubject').value,
    description: document.getElementById('updateDescription').value,
    tags: tagsToArray(document.getElementById('updateTags').value)
  };

  try {
    const note = await api(`/notes/${currentEditId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    showMessage(updateMessage, `✅ Note ${note.id} updated successfully.`, 'success');
  } catch (err) {
    showMessage(updateMessage, `❌ ${err.message}`, 'error');
  }
});

/* ================= Delete (with confirm dialog) ================= */
const deleteForm = document.getElementById('deleteForm');
const deleteMessage = document.getElementById('deleteMessage');
const overlay = document.getElementById('confirmOverlay');
const confirmText = document.getElementById('confirmText');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');
let pendingDeleteId = null;

deleteForm.addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('deleteId').value.trim();
  if (!id) return;
  pendingDeleteId = id;
  confirmText.textContent = `Are you sure you want to delete note ID ${id}?`;
  overlay.classList.remove('hidden');
});

confirmNo.addEventListener('click', () => {
  overlay.classList.add('hidden');
  showMessage(deleteMessage, '🚫 Delete cancelled.', 'error');
  pendingDeleteId = null;
});

confirmYes.addEventListener('click', async () => {
  overlay.classList.add('hidden');
  if (!pendingDeleteId) return;
  try {
    const result = await api(`/notes/${pendingDeleteId}`, { method: 'DELETE' });
    showMessage(deleteMessage, `🗑️ Note "${result.note.title}" (ID ${result.note.id}) deleted.`, 'success');
    deleteForm.reset();
  } catch (err) {
    showMessage(deleteMessage, `❌ ${err.message}`, 'error');
  }
  pendingDeleteId = null;
});

/* ================= Statistics ================= */
const statsBox = document.getElementById('statsBox');
document.getElementById('refreshStatsBtn').addEventListener('click', loadStats);

async function loadStats() {
  if (!getToken()) return;
  statsBox.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const stats = await api('/notes/stats');
    if (stats.totalNotes === 0) {
      statsBox.innerHTML = '<p class="empty-state">No notes found. Add some notes to see statistics.</p>';
      return;
    }

    statsBox.innerHTML = `
      <div class="stats-row"><span>Total Notes</span><strong>${stats.totalNotes}</strong></div>
      <div class="stats-row"><span>Unique Subjects</span><strong>${stats.subjects}</strong></div>
      <div class="stats-row"><span>Most Used Tag</span><strong>${stats.mostUsedTag || 'N/A'}</strong></div>
      <div class="stats-row"><span>Latest Note</span><strong>${escapeHtml(stats.latestNote || 'N/A')}</strong></div>
    `;
  } catch (err) {
    statsBox.innerHTML = `<p class="empty-state">❌ ${err.message}</p>`;
  }
}
