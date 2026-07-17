const FALLBACK_EVENTS_URL = '/events-data.json';
const API_EVENTS_URL = '/api/events';
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

const bureauMembers = [
  { role: 'Présidente', name: 'Poste à compléter', initials: 'PR' },
  { role: '1er vice président', name: 'Poste à compléter', initials: 'VP' },
  { role: '2ème vice président', name: 'Poste à compléter', initials: 'VV' },
  { role: 'Secrétaire général', name: 'Poste à compléter', initials: 'SG' },
  { role: 'Secrétaire général adjoint', name: 'Poste à compléter', initials: 'SA' },
  { role: 'Trésorier', name: 'Poste à compléter', initials: 'TR' },
  { role: 'Trésorier adjoint', name: 'Poste à compléter', initials: 'TA' },
  { role: 'Assesseur', name: 'Poste à compléter', initials: 'AS' },
  { role: 'Assesseur', name: 'Poste à compléter', initials: 'AS' },
  { role: 'Assesseur', name: 'Poste à compléter', initials: 'AS' },
  { role: 'Assesseur', name: 'Poste à compléter', initials: 'AS' },
];

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80';

const state = {
  events: [],
  activePanel: 'home',
  selectedEventIndex: 0,
  filter: 'Tous',
  modalIndex: 0
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
  const fallback = event.image ? [event.image] : [];
  const finalImages = images.length ? images : fallback;
  return {
    id: event.id || crypto.randomUUID(),
    date: event.date || '',
    badge: event.badge || formatDate(event.date),
    category: event.category || 'Événement',
    title: event.title || '',
    description: event.description || '',
    images: finalImages.length ? finalImages : [DEFAULT_IMAGE]
  };
}

async function loadEvents() {
  try {
    const res = await fetch(API_EVENTS_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    if (Array.isArray(data)) return data.map(normalizeEvent);
  } catch {}
  try {
    const res = await fetch(FALLBACK_EVENTS_URL, { cache: 'no-store' });
    const data = await res.json();
    if (Array.isArray(data)) return data.map(normalizeEvent);
  } catch {}
  return [];
}

function showPanel(name) {
  state.activePanel = name;
  $$('.panel').forEach(panel => panel.classList.toggle('is-visible', panel.dataset.panel === name));
  $$('.nav-btn[data-panel-btn]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.panelBtn === name));
}

function renderHero() {
  const featured = state.events[0];
  $('#featuredEventTitle').textContent = featured ? featured.title : 'Aucun événement';
  $('#featuredEventDescription').textContent = featured ? `${featured.badge || formatDate(featured.date)} · ${featured.description}` : 'Ajoute un premier événement depuis l’admin.';
}

function renderDocs() {
  const docs = [
    ['Bureau', 'Invitation réunion du Bureau', 'Invitation de réunion du Bureau CFN', '/docs/invitation-reunion-bureau.doc'],
    ['Bureau', 'Procès-verbal de réunion', 'PV de réunion du Bureau CFN', '/docs/pv-reunion-bureau.doc'],
    ['Base légale', 'Statuts du Club', 'Statuts actualisés du Club', '/docs/statuts-cfn.pdf'],
    ['Gouvernance', 'Charte du Club', 'Charte et principes de fonctionnement', '/docs/charte-cfn.pdf'],
    ['Adhésion', 'Demande d’adhésion', 'Formulaire d’adhésion au CFN', '/docs/demande-adhesion-cfn.doc'],
    ['Adhésion', 'Renouvellement d’adhésion', 'Demande de renouvellement 2024', '/docs/renouvellement-adhesion-cfn.doc'],
    ['Paiement', 'RIB du Club', 'Coordonnées bancaires du CFN', '/docs/rib-cfn.pdf'],
  ];
  const grid = $('#docGrid');
  grid.innerHTML = docs.map(([tag, title, desc, href]) => `
    <article class="doc-card glass-card">
      <span class="doc-tag">${escapeHTML(tag)}</span>
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(desc)}</p>
      <div class="doc-links">
        <a class="doc-link" href="${href}" target="_blank" rel="noreferrer">Ouvrir</a>
        <a class="doc-link" href="${href}" download>Télécharger</a>
      </div>
    </article>
  `).join('');
}

function renderBureau() {
  const grid = $('#bureauGrid');
  grid.innerHTML = bureauMembers.map(member => `
    <article class="bureau-card glass-card">
      <div class="member-photo">
        <div class="avatar-initials">${escapeHTML(member.initials)}</div>
        <div class="photo-note">Photo à fournir</div>
      </div>
      <span class="role-badge">${escapeHTML(member.role)}</span>
      <h3>${escapeHTML(member.name)}</h3>
      <p>Carte au même style que les autres blocs du site.</p>
    </article>
  `).join('');
}

function buildCategoryFilters() {
  const categories = ['Tous', ...new Set(state.events.map(e => e.category).filter(Boolean))];
  const bar = $('#eventFilters');
  bar.innerHTML = categories.map(cat => `
    <button class="filter-pill ${cat === state.filter ? 'is-active' : ''}" type="button" data-filter="${escapeHTML(cat)}">${escapeHTML(cat)}</button>
  `).join('');
  $$('.filter-pill', bar).forEach(btn => {
    btn.addEventListener('click', () => {
      state.filter = btn.dataset.filter;
      buildCategoryFilters();
      renderEvents();
    });
  });
}

function renderEvents() {
  buildCategoryFilters();
  const grid = $('#eventsGrid');
  const filtered = state.filter === 'Tous'
    ? state.events
    : state.events.filter(event => event.category === state.filter);

  grid.innerHTML = filtered.map((event, index) => {
    const image = event.images?.[0] || DEFAULT_IMAGE;
    const count = event.images?.length || 0;
    const photoBadge = count > 1 ? `<span class="photo-count">${count} photos</span>` : '';
    return `
      <article class="event-card glass-card" data-event-index="${index}">
        <div class="event-media">
          <img src="${escapeHTML(image)}" alt="${escapeHTML(event.title)}" loading="lazy">
        </div>
        <span class="event-category">${escapeHTML(event.category)}</span>
        <h3>${escapeHTML(event.title)}</h3>
        <div class="event-body">
          <p>${escapeHTML(event.description)}</p>
        </div>
        <div class="event-meta">
          <span class="pill">${escapeHTML(event.badge || formatDate(event.date))}</span>
          ${photoBadge}
        </div>
      </article>
    `;
  }).join('');

  $$('.event-card', grid).forEach(card => {
    card.addEventListener('click', () => {
      const indexInFiltered = Number(card.dataset.eventIndex);
      const event = filtered[indexInFiltered];
      const realIndex = state.events.findIndex(e => e.id === event.id);
      openModal(realIndex);
    });
  });
}

function renderModal() {
  const event = state.events[state.modalIndex];
  if (!event) return;
  const images = event.images?.length ? event.images : [DEFAULT_IMAGE];
  $('#modalTitle').textContent = event.title;
  $('#modalDescription').textContent = event.description;
  $('#modalDate').textContent = event.badge || formatDate(event.date);
  $('#modalCategory').textContent = event.category;
  $('#modalImage').src = images[state.modalImageIndex || 0];
  $('#modalImage').alt = event.title;

  const strip = $('#thumbStrip');
  strip.innerHTML = images.map((src, idx) => `
    <button class="thumb ${idx === (state.modalImageIndex || 0) ? 'is-active' : ''}" type="button" data-thumb="${idx}">
      <img src="${src}" alt="miniature ${idx + 1}">
    </button>
  `).join('');

  $$('.thumb', strip).forEach(btn => btn.addEventListener('click', () => {
    state.modalImageIndex = Number(btn.dataset.thumb);
    renderModal();
  }));
}

function openModal(index) {
  state.modalIndex = index;
  state.modalImageIndex = 0;
  renderModal();
  $('#galleryModal').classList.remove('hidden');
  $('#galleryModal').setAttribute('aria-hidden', 'false');
}

function closeModal() {
  $('#galleryModal').classList.add('hidden');
  $('#galleryModal').setAttribute('aria-hidden', 'true');
}

function nextImage() {
  const event = state.events[state.modalIndex];
  const images = event?.images?.length ? event.images : [DEFAULT_IMAGE];
  state.modalImageIndex = ((state.modalImageIndex || 0) + 1) % images.length;
  renderModal();
}

function prevImage() {
  const event = state.events[state.modalIndex];
  const images = event?.images?.length ? event.images : [DEFAULT_IMAGE];
  state.modalImageIndex = ((state.modalImageIndex || 0) - 1 + images.length) % images.length;
  renderModal();
}

async function init() {
  state.events = await loadEvents();
  renderHero();
  renderDocs();
  renderBureau();
  renderEvents();
  showPanel('home');

  $$('.nav-btn[data-panel-btn]').forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.panelBtn));
  });

  $$('.nav-link[data-panel-btn], .hero-actions [data-panel-btn]').forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.panelBtn));
  });

  $$('.nav-link[data-panel-btn]').forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.panelBtn));
  });

  $('#galleryModal').addEventListener('click', (e) => {
    if (e.target.matches('[data-close-modal]')) closeModal();
  });
  $('#nextImageBtn').addEventListener('click', nextImage);
  $('#prevImageBtn').addEventListener('click', prevImage);
  document.addEventListener('keydown', (e) => {
    if ($('#galleryModal').classList.contains('hidden')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  });

  $('#joinButton').addEventListener('click', () => {
    window.location.href = 'https://www.linkedin.com/company/club-des-financiers-du-nord/?fbclid=PAT01DUATDGJRleHRuA2FlbQIxMABzcnRjBmFwcF9pZA81NjcwNjczNDMzNTI0MjcAAacIBU5fa7sb9PNmEZy7SnSqJekSygrWPdZMbk8kovWJCOJE4JSoJqD3U6lMpg_aem_FFeb60f4M5kuLTG7HB0Y_w';
  });
}

document.addEventListener('DOMContentLoaded', init);
