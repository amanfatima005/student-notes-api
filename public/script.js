// public/script.js
// Frontend for Version 1's UI, wired up to the Version 2 Express REST API.
// Key differences from the old CLI-backed frontend:
//   - Notes are identified by a numeric `id`, not by title.
//   - Search uses ?title=, ?subject=, or ?tag= (one field at a time).
//   - Stats response shape is different: { totalNotes, subjects, latestNote, mostUsedTag }.
//   - Tags must be sent to the API as an array, not a comma string.

const API = '/api';

/* ---------------- Tab switching ---------------- */
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

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

/* ---------------- Helpers ---------------- */
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
      <div class="note-id">ID: ${note.id}</div>
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

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

/* ---------------- Add Note ---------------- */
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

/* ---------------- View Notes ---------------- */
const viewList = document.getElementById('viewList');
document.getElementById('refreshViewBtn').addEventListener('click', loadAllNotes);

async function loadAllNotes() {
  viewList.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const notes = await api('/notes');
    renderNoteList(viewList, notes, 'No notes found. Add your first note in the "Add Note" tab.');
  } catch (err) {
    viewList.innerHTML = `<p class="empty-state">❌ ${err.message}</p>`;
  }
}

/* ---------------- Search ---------------- */
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

/* ---------------- Update ---------------- */
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

/* ---------------- Delete (with confirm dialog) ---------------- */
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

/* ---------------- Statistics ---------------- */
const statsBox = document.getElementById('statsBox');
document.getElementById('refreshStatsBtn').addEventListener('click', loadStats);

async function loadStats() {
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

/* Pre-load the view list so the tab is instant on first click */
loadAllNotes();
