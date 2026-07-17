const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80';
const FALLBACK_EVENTS_URL = '/events-data.json';

const state = {
  events: [],
  selectedIndex: -1,
  loggedIn: false
};

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

function normalizeEvent(event) {
  const images = Array.isArray(event.images) ? event.images.filter(Boolean) : [];
  return {
    id: event.id || crypto.randomUUID(),
    date: event.date || '',
    badge: event.badge || formatDate(event.date),
    category: event.category || 'Événement',
    title: event.title || '',
    description: event.description || '',
    images: images.length ? images : [DEFAULT_IMAGE]
  };
}

async function fetchEvents() {
  try {
    const res = await fetch('/api/events', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data.map(normalizeEvent);
    }
  } catch {}
  try {
    const res = await fetch(FALLBACK_EVENTS_URL, { cache: 'no-store' });
    const data = await res.json();
    if (Array.isArray(data)) return data.map(normalizeEvent);
  } catch {}
  return [];
}

async function api(path, method, body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur API');
  return data;
}

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    if (res.ok) {
      state.loggedIn = true;
      return true;
    }
  } catch {}
  state.loggedIn = false;
  return false;
}

function showEditor(show) {
  $('#authBox').classList.toggle('hidden', show);
  $('#editorBox').classList.toggle('hidden', !show);
}

function clearForm() {
  $('#eventDate').value = '';
  $('#eventBadge').value = '';
  $('#eventCategory').value = '';
  $('#eventTitle').value = '';
  $('#eventDescription').value = '';
  $('#eventImages').value = '';
  $('#formTitle').textContent = 'Ajouter un événement';
  $('#saveBtn').textContent = 'Ajouter';
  state.selectedIndex = -1;
  renderPreview();
}

function loadToForm(index) {
  const event = state.events[index];
  if (!event) return;
  state.selectedIndex = index;
  $('#eventDate').value = event.date || '';
  $('#eventBadge').value = event.badge || '';
  $('#eventCategory').value = event.category || '';
  $('#eventTitle').value = event.title || '';
  $('#eventDescription').value = event.description || '';
  $('#eventImages').value = '';
  $('#formTitle').textContent = 'Modifier un événement';
  $('#saveBtn').textContent = 'Enregistrer';
  renderPreview();
}

async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function readImages() {
  const files = Array.from($('#eventImages').files || []);
  if (!files.length) return [];
  return Promise.all(files.map(fileToDataURL));
}

function renderPreview() {
  const list = $('#previewList');
  if (!state.events.length) {
    list.innerHTML = '<div class="preview-item"><h4>Aucun événement</h4><p>Commence par ajouter un événement.</p></div>';
    return;
  }

  list.innerHTML = state.events.map((event, index) => `
    <article class="preview-item ${index === state.selectedIndex ? 'is-selected' : ''}">
      <div class="preview-head">
        <div>
          <h4>${index + 1}. ${escapeHTML(event.title)}</h4>
          <p><strong>${escapeHTML(event.badge || formatDate(event.date))}</strong> · ${escapeHTML(event.category)}</p>
        </div>
        <div class="preview-actions-inline">
          <button class="mini-btn" type="button" data-edit="${index}">Modifier</button>
          <button class="mini-btn danger" type="button" data-delete="${index}">Supprimer</button>
        </div>
      </div>
      <p>${escapeHTML(event.description)}</p>
      <div class="thumb-row">${event.images.slice(0, 4).map(src => `<img src="${src}" alt="miniature">`).join('')}</div>
    </article>
  `).join('');

  $$('[data-delete]', list).forEach(btn => {
    btn.addEventListener('click', async () => {
      const index = Number(btn.dataset.delete);
      if (!confirm('Supprimer cet événement ?')) return;
      try {
        const result = await api('/api/events', 'DELETE', { id: state.events[index].id });
        state.events = result.events.map(normalizeEvent);
        state.selectedIndex = -1;
        clearForm();
        renderPreview();
      } catch (error) {
        alert(error.message);
      }
    });
  });

  $$('[data-edit]', list).forEach(btn => {
    btn.addEventListener('click', () => loadToForm(Number(btn.dataset.edit)));
  });
}

async function saveCurrent() {
  const payload = {
    date: $('#eventDate').value,
    badge: $('#eventBadge').value.trim(),
    category: $('#eventCategory').value.trim(),
    title: $('#eventTitle').value.trim(),
    description: $('#eventDescription').value.trim(),
    images: await readImages()
  };

  if (!payload.date || !payload.title || !payload.description) {
    alert('Remplis au minimum la date, le titre et la description.');
    return;
  }

  try {
    const method = state.selectedIndex >= 0 ? 'PUT' : 'POST';
    if (state.selectedIndex >= 0) payload.id = state.events[state.selectedIndex].id;
    const result = await api('/api/events', method, payload);
    state.events = result.events.map(normalizeEvent);
    clearForm();
    renderPreview();
  } catch (error) {
    alert(error.message);
  }
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(state.events, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'events-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function copyJSON() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(state.events, null, 2));
    alert('JSON copié.');
  } catch {
    alert('Copie impossible sur ce navigateur.');
  }
}

async function login() {
  try {
    await api('/api/auth/login', 'POST', {
      username: $('#username').value.trim(),
      password: $('#password').value
    });
    state.loggedIn = true;
    showEditor(true);
    state.events = await fetchEvents();
    renderPreview();
  } catch (error) {
    alert(error.message);
  }
}

async function logout() {
  try { await api('/api/auth/logout', 'POST'); } catch {}
  state.loggedIn = false;
  showEditor(false);
}

async function init() {
  state.events = await fetchEvents();
  renderPreview();
  const authed = await checkAuth();
  showEditor(authed);
  if (authed) renderPreview();

  $('#loginBtn').addEventListener('click', login);
  $('#saveBtn').addEventListener('click', saveCurrent);
  $('#resetBtn').addEventListener('click', clearForm);
  $('#newBtn').addEventListener('click', clearForm);
  $('#exportBtn').addEventListener('click', exportJSON);
  $('#copyBtn').addEventListener('click', copyJSON);
  $('#refreshBtn').addEventListener('click', async () => {
    state.events = await fetchEvents();
    renderPreview();
  });

  $('#password').addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });

  $('#logoutBtn')?.addEventListener('click', logout);
}

document.addEventListener('DOMContentLoaded', init);
