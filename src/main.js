import { login, logout, getSession, onChange, SPID_PROVIDERS } from './auth.js';

/* ---------------------------------------------------------------------------
 * Dati e persistenza (demo su localStorage — in produzione API + PostgreSQL)
 * ------------------------------------------------------------------------- */
const STORAGE_KEY = 'faro-canicatti-reports';

const CATEGORIES = [
  { id: 'strade', label: 'Strade e marciapiedi', icon: '🛣️', office: 'Manutenzioni', subs: ['Buca stradale', 'Marciapiede dissestato', 'Tombino / caditoia', 'Cantiere non segnalato'] },
  { id: 'pulizia', label: 'Rifiuti e pulizia', icon: '🧹', office: 'Ambiente', subs: ['Rifiuti abbandonati', 'Cestino stracolmo', 'Discarica abusiva', 'Spazzamento strade'] },
  { id: 'illuminazione', label: 'Illuminazione pubblica', icon: '💡', office: 'Manutenzioni', subs: ['Lampione spento', 'Lampione sempre acceso', 'Palo danneggiato'] },
  { id: 'verde', label: 'Verde pubblico', icon: '🌳', office: 'Ambiente', subs: ['Albero pericolante', 'Sfalcio erba', 'Area gioco danneggiata', 'Parco da manutenere'] },
  { id: 'arredo', label: 'Arredo urbano', icon: '🚏', office: 'Manutenzioni', subs: ['Panchina rotta', 'Fermata bus', 'Fontanella', 'Segnaletica turistica'] },
  { id: 'segnaletica', label: 'Segnaletica stradale', icon: '🚸', office: 'Polizia Municipale', subs: ['Segnale mancante', 'Segnale danneggiato', 'Strisce pedonali sbiadite'] },
  { id: 'veicoli', label: 'Veicoli abbandonati', icon: '🚗', office: 'Polizia Municipale', subs: ['Auto abbandonata', 'Relitto', 'Sosta pericolosa'] },
  { id: 'cimiteri', label: 'Cimiteri', icon: '🕯️', office: 'Servizi cimiteriali', subs: ['Manutenzione loculi', 'Pulizia aree', 'Illuminazione votiva'] },
  { id: 'acqua', label: 'Acqua e fognature', icon: '💧', office: 'Ambiente', subs: ['Perdita idrica', 'Tombino otturato', 'Allagamento'] }
];

const defaultReports = [
  {
    id: 'FARO-2026-001', ownerId: null, name: 'Maria Licata', email: 'maria.licata@example.it',
    category: 'Strade e marciapiedi', subcategory: 'Buca stradale', address: 'Corso Umberto I, 42',
    lat: 37.3639, lng: 13.8496, description: 'Buca pericolosa vicino alle strisce pedonali, serve messa in sicurezza urgente.',
    priority: 'Alta', status: 'In lavorazione', office: 'Manutenzioni', createdAt: '2026-07-12T09:00:00.000Z', attachmentName: 'buca.jpg'
  },
  {
    id: 'FARO-2026-002', ownerId: null, name: 'Giuseppe Alaimo', email: 'g.alaimo@example.it',
    category: 'Illuminazione pubblica', subcategory: 'Lampione spento', address: 'Via Nazionale, 8',
    lat: 37.3701, lng: 13.8455, description: 'Tre lampioni consecutivi spenti da una settimana, strada al buio la sera.',
    priority: 'Ordinaria', status: 'Ricevuta', office: 'Manutenzioni', createdAt: '2026-07-13T20:30:00.000Z', attachmentName: ''
  },
  {
    id: 'FARO-2026-003', ownerId: null, name: 'Rosa Cammarata', email: 'rosa.cammarata@example.it',
    category: 'Rifiuti e pulizia', subcategory: 'Discarica abusiva', address: 'Contrada Giarre',
    lat: 37.3555, lng: 13.8600, description: 'Cumulo di rifiuti ingombranti abbandonati ai margini della strada.',
    priority: 'Urgente', status: 'Risolta', office: 'Ambiente', createdAt: '2026-07-08T07:15:00.000Z', attachmentName: 'rifiuti.jpg'
  }
];

function getReports() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultReports));
    return [...defaultReports];
  }
  try { return JSON.parse(stored); } catch { return [...defaultReports]; }
}
function saveReports(reports) { localStorage.setItem(STORAGE_KEY, JSON.stringify(reports)); }

function buildPracticeCode() {
  const year = new Date().getFullYear();
  const seq = String(getReports().length + 1).padStart(3, '0');
  return `FARO-${year}-${seq}`;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function statusClass(status) { return status.toLowerCase().replaceAll(' ', '-'); }
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ---------------------------------------------------------------------------
 * Riferimenti DOM
 * ------------------------------------------------------------------------- */
const $ = (sel) => document.querySelector(sel);
const form = $('#reportForm');
const formMessage = $('#formMessage');
const categoryGrid = $('#categoryGrid');
const categoryValue = $('#categoryValue');
const subWrap = $('.sub-wrap');
const subcategory = $('#subcategory');
const identityBox = $('#identityBox');
const summary = $('#summary');
const wizardSteps = $('#wizardSteps');
const panels = [...document.querySelectorAll('.wizard-panel')];
const prevBtn = $('#prevBtn');
const nextBtn = $('#nextBtn');
const submitBtn = $('#submitBtn');

/* ---------------------------------------------------------------------------
 * Step 1 — categorie
 * ------------------------------------------------------------------------- */
categoryGrid.innerHTML = CATEGORIES.map((c) => `
  <button class="category-card" type="button" role="radio" aria-checked="false" data-category="${c.id}">
    <span aria-hidden="true">${c.icon}</span>
    <strong>${c.label}</strong>
    <small>${c.subs.slice(0, 2).join(' • ')}…</small>
  </button>`).join('');

categoryGrid.addEventListener('click', (event) => {
  const card = event.target.closest('[data-category]');
  if (!card) return;
  const cat = CATEGORIES.find((c) => c.id === card.dataset.category);
  categoryGrid.querySelectorAll('.category-card').forEach((el) => {
    const on = el === card;
    el.classList.toggle('is-selected', on);
    el.setAttribute('aria-checked', String(on));
  });
  categoryValue.value = cat.label;
  subcategory.innerHTML = cat.subs.map((s) => `<option>${s}</option>`).join('');
  subWrap.hidden = false;
});

/* ---------------------------------------------------------------------------
 * Step 2 — posizione / geolocalizzazione
 * ------------------------------------------------------------------------- */
const address = $('#address');
const latEl = $('#lat');
const lngEl = $('#lng');
const mapPin = $('#mapPin');
const mapHint = $('#mapHint');

function placePin(text) {
  mapPin.hidden = false;
  mapPin.style.left = `${25 + Math.random() * 50}%`;
  mapPin.style.top = `${25 + Math.random() * 50}%`;
  mapHint.textContent = text;
}

$('#geoBtn').addEventListener('click', () => {
  if (!navigator.geolocation) { mapHint.textContent = 'Geolocalizzazione non disponibile su questo dispositivo.'; return; }
  mapHint.textContent = 'Rilevamento posizione in corso…';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      latEl.value = pos.coords.latitude.toFixed(6);
      lngEl.value = pos.coords.longitude.toFixed(6);
      if (!address.value) address.value = `Posizione rilevata (${latEl.value}, ${lngEl.value})`;
      placePin(`Posizione acquisita: ${latEl.value}, ${lngEl.value}`);
    },
    () => { mapHint.textContent = 'Permesso di geolocalizzazione negato. Inserisci l\'indirizzo manualmente.'; }
  );
});

address.addEventListener('input', () => {
  if (address.value.trim().length > 3) placePin(`Riferimento: ${address.value}`);
});

/* ---------------------------------------------------------------------------
 * Step 4 — box identità in base al login
 * ------------------------------------------------------------------------- */
function renderIdentityBox() {
  const s = getSession();
  if (s) {
    identityBox.innerHTML = `
      <div class="identity-card">
        <span class="identity-badge">${s.method === 'cie' ? '🪪 CIE' : '✦ SPID'}</span>
        <div>
          <strong>${escapeHtml(s.displayName)}</strong>
          <small>${escapeHtml(s.fiscalNumber)} • ${escapeHtml(s.email)}</small>
          <small class="identity-provider">Autenticato con ${escapeHtml(s.provider)} • ${escapeHtml(s.level)}</small>
        </div>
      </div>
      <p class="identity-note">La segnalazione sarà firmata con la tua identità digitale e la ritroverai nel tuo fascicolo.</p>`;
  } else {
    identityBox.innerHTML = `
      <div class="identity-guest">
        <p>Accedi con <strong>SPID</strong> o <strong>CIE</strong> per firmare la segnalazione e seguirla nel tuo fascicolo, oppure prosegui come ospite.</p>
        <button class="button button-spid" type="button" data-action="login"><span class="spid-glyph" aria-hidden="true">✦</span> Accedi con SPID / CIE</button>
      </div>
      <div class="two-col">
        <label>Nome e cognome<input name="name" autocomplete="name" placeholder="Mario Rossi" /></label>
        <label>Email<input name="email" type="email" autocomplete="email" placeholder="nome@email.it" /></label>
      </div>`;
  }
}

/* ---------------------------------------------------------------------------
 * Step 5 — riepilogo
 * ------------------------------------------------------------------------- */
function collect() {
  const data = new FormData(form);
  const s = getSession();
  return {
    category: categoryValue.value,
    subcategory: subcategory.value || '',
    address: address.value,
    lat: latEl.value, lng: lngEl.value,
    description: data.get('description') || '',
    priority: data.get('priority') || 'Ordinaria',
    attachmentName: data.get('attachment')?.name || '',
    name: s ? s.displayName : (data.get('name') || 'Cittadino'),
    email: s ? s.email : (data.get('email') || ''),
    ownerId: s ? s.id : null
  };
}

function renderSummary() {
  const d = collect();
  const rows = [
    ['Categoria', d.category + (d.subcategory ? ` — ${d.subcategory}` : '')],
    ['Indirizzo', d.address],
    ['Coordinate', d.lat && d.lng ? `${d.lat}, ${d.lng}` : 'Non indicate'],
    ['Descrizione', d.description],
    ['Priorità', d.priority],
    ['Allegato', d.attachmentName || 'Nessuno'],
    ['Segnalante', `${d.name}${d.email ? ` • ${d.email}` : ''}`]
  ];
  summary.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`).join('');
}

/* ---------------------------------------------------------------------------
 * Navigazione wizard
 * ------------------------------------------------------------------------- */
let step = 1;
function showStep(n, scroll = false) {
  step = n;
  panels.forEach((p) => p.classList.toggle('is-active', Number(p.dataset.panel) === n));
  wizardSteps.querySelectorAll('li').forEach((li) => {
    const idx = Number(li.dataset.step);
    li.classList.toggle('is-active', idx === n);
    li.classList.toggle('is-done', idx < n);
  });
  prevBtn.hidden = n === 1;
  nextBtn.hidden = n === panels.length;
  submitBtn.hidden = n !== panels.length;
  if (n === 4) renderIdentityBox();
  if (n === 5) renderSummary();
  if (scroll) document.querySelector('#segnala').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function validateStep(n) {
  formMessage.textContent = '';
  if (n === 1 && !categoryValue.value) { formMessage.textContent = 'Seleziona una categoria per continuare.'; return false; }
  if (n === 2 && address.value.trim().length < 4) { formMessage.textContent = 'Indica un indirizzo o usa la geolocalizzazione.'; return false; }
  if (n === 3 && (form.elements.description.value.trim().length < 20)) { formMessage.textContent = 'La descrizione deve avere almeno 20 caratteri.'; return false; }
  if (n === 4) {
    if (!getSession()) {
      const email = form.querySelector('input[name="email"]');
      if (email && email.value && !email.checkValidity()) { formMessage.textContent = 'Inserisci un indirizzo email valido.'; return false; }
    }
    if (!form.elements.privacy.checked) { formMessage.textContent = 'È necessario accettare l\'informativa privacy.'; return false; }
  }
  return true;
}

nextBtn.addEventListener('click', () => { if (validateStep(step)) showStep(Math.min(step + 1, panels.length), true); });
prevBtn.addEventListener('click', () => showStep(Math.max(step - 1, 1), true));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!validateStep(4)) { showStep(4); return; }
  const d = collect();
  const office = (CATEGORIES.find((c) => c.label === d.category) || {}).office || 'URP - Il Faro';
  const report = {
    id: buildPracticeCode(), ...d, status: 'Ricevuta', office,
    createdAt: new Date().toISOString(),
    history: [{ at: new Date().toISOString(), status: 'Ricevuta', note: 'Segnalazione acquisita dal portale.' }]
  };
  const reports = getReports();
  reports.unshift(report);
  saveReports(reports);
  form.reset();
  categoryValue.value = ''; subcategory.innerHTML = ''; subWrap.hidden = true;
  latEl.value = ''; lngEl.value = ''; mapPin.hidden = true;
  categoryGrid.querySelectorAll('.category-card').forEach((el) => { el.classList.remove('is-selected'); el.setAttribute('aria-checked', 'false'); });
  formMessage.textContent = `✅ Segnalazione inviata. Codice pratica: ${report.id}`;
  showStep(1);
  refreshAll();
});

/* ---------------------------------------------------------------------------
 * Back office
 * ------------------------------------------------------------------------- */
const reportsList = $('#reportsList');
const statusFilter = $('#statusFilter');
const adminRole = $('#adminRole');
const totalReports = $('#totalReports');

function renderReports() {
  const reports = getReports();
  const sel = statusFilter.value;
  const visible = sel ? reports.filter((r) => r.status === sel) : reports;
  totalReports.textContent = reports.length;
  if (!visible.length) { reportsList.innerHTML = '<p class="empty-state">Nessuna segnalazione corrisponde al filtro selezionato.</p>'; return; }
  reportsList.innerHTML = visible.map((r) => `
    <article class="report-card" data-id="${r.id}">
      <div>
        <span class="code">${r.id}</span>
        <h3>${escapeHtml(r.category)}</h3>
        <p>${escapeHtml(r.description)}</p>
        <dl>
          <div><dt>Luogo</dt><dd>${escapeHtml(r.address)}</dd></div>
          <div><dt>Priorità</dt><dd>${escapeHtml(r.priority)}</dd></div>
          <div><dt>Ufficio</dt><dd>${escapeHtml(r.office)}</dd></div>
          <div><dt>Allegato</dt><dd>${escapeHtml(r.attachmentName || 'Non presente')}</dd></div>
        </dl>
      </div>
      <div class="report-actions">
        <span class="badge ${statusClass(r.status)}">${r.status}</span>
        <select aria-label="Aggiorna stato ${r.id}" data-action="status">
          ${['Ricevuta', 'In lavorazione', 'Risolta'].map((s) => `<option ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <button class="secondary-action" data-action="assign" type="button">Assegna a ${escapeHtml(adminRole.value)}</button>
      </div>
    </article>`).join('');
}

reportsList.addEventListener('change', (event) => {
  if (event.target.dataset.action !== 'status') return;
  const id = event.target.closest('.report-card').dataset.id;
  const reports = getReports().map((r) => r.id === id
    ? { ...r, status: event.target.value, history: [...(r.history || []), { at: new Date().toISOString(), status: event.target.value, note: `Stato aggiornato da ${adminRole.value}.` }] }
    : r);
  saveReports(reports); refreshAll();
});
reportsList.addEventListener('click', (event) => {
  if (event.target.dataset.action !== 'assign') return;
  const id = event.target.closest('.report-card').dataset.id;
  const reports = getReports().map((r) => r.id === id ? { ...r, office: adminRole.value, status: r.status === 'Ricevuta' ? 'In lavorazione' : r.status } : r);
  saveReports(reports); refreshAll();
});
statusFilter.addEventListener('change', renderReports);
adminRole.addEventListener('change', renderReports);

/* ---------------------------------------------------------------------------
 * Mappa città (board per categoria) + statistiche hero
 * ------------------------------------------------------------------------- */
function renderCityBoard() {
  const reports = getReports();
  const board = $('#cityBoard');
  const byCat = {};
  reports.forEach((r) => { (byCat[r.category] = byCat[r.category] || []).push(r); });
  const entries = Object.entries(byCat);
  board.innerHTML = entries.length ? entries.map(([cat, list]) => {
    const cfg = CATEGORIES.find((c) => c.label === cat) || { icon: '📌' };
    const open = list.filter((r) => r.status !== 'Risolta').length;
    return `<article class="board-card">
      <span class="board-icon" aria-hidden="true">${cfg.icon}</span>
      <strong>${escapeHtml(cat)}</strong>
      <span class="board-count">${list.length}</span>
      <small>${open} aperte • ${list.length - open} risolte</small>
    </article>`;
  }).join('') : '<p class="empty-state light">Ancora nessuna segnalazione.</p>';
}

function renderStats() {
  const reports = getReports();
  $('#statTotal').textContent = reports.length;
  $('#statResolved').textContent = reports.filter((r) => r.status === 'Risolta').length;
}

/* ---------------------------------------------------------------------------
 * Le mie segnalazioni (richiede login)
 * ------------------------------------------------------------------------- */
function timeline(r) {
  const steps = r.history && r.history.length ? r.history : [{ at: r.createdAt, status: r.status, note: '' }];
  return `<ol class="timeline">${steps.map((h) => `
    <li class="tl-${statusClass(h.status)}"><span>${h.status}</span><small>${formatDate(h.at)}${h.note ? ' — ' + escapeHtml(h.note) : ''}</small></li>`).join('')}</ol>`;
}

function renderMine() {
  const mineList = $('#mineList');
  const s = getSession();
  if (!s) {
    mineList.innerHTML = `<div class="gate">
      <p>Accedi per consultare le tue segnalazioni.</p>
      <button class="button button-spid" type="button" data-action="login"><span class="spid-glyph" aria-hidden="true">✦</span> Accedi con SPID / CIE</button>
    </div>`;
    return;
  }
  const mine = getReports().filter((r) => r.ownerId === s.id);
  if (!mine.length) {
    mineList.innerHTML = `<p class="empty-state light">Ciao ${escapeHtml(s.name)}, non hai ancora inviato segnalazioni. <a href="#segnala">Aprine una ora</a>.</p>`;
    return;
  }
  mineList.innerHTML = mine.map((r) => `
    <article class="mine-card">
      <header><span class="code">${r.id}</span><span class="badge ${statusClass(r.status)}">${r.status}</span></header>
      <h3>${escapeHtml(r.category)}${r.subcategory ? ` — ${escapeHtml(r.subcategory)}` : ''}</h3>
      <p>${escapeHtml(r.description)}</p>
      <small class="mine-meta">${escapeHtml(r.address)} • inviata il ${formatDate(r.createdAt)}</small>
      ${timeline(r)}
    </article>`).join('');
}

/* ---------------------------------------------------------------------------
 * Traccia pratica
 * ------------------------------------------------------------------------- */
$('#trackForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const code = new FormData(event.target).get('code').trim().toUpperCase();
  const result = $('#trackResult');
  const r = getReports().find((x) => x.id.toUpperCase() === code);
  if (!r) { result.innerHTML = `<p class="track-miss">Nessuna pratica trovata con il codice <strong>${escapeHtml(code)}</strong>. Controlla e riprova.</p>`; return; }
  result.innerHTML = `
    <article class="mine-card">
      <header><span class="code">${r.id}</span><span class="badge ${statusClass(r.status)}">${r.status}</span></header>
      <h3>${escapeHtml(r.category)}${r.subcategory ? ` — ${escapeHtml(r.subcategory)}` : ''}</h3>
      <p>${escapeHtml(r.description)}</p>
      <small class="mine-meta">${escapeHtml(r.address)} • ${escapeHtml(r.office)} • inviata il ${formatDate(r.createdAt)}</small>
      ${timeline(r)}
    </article>`;
});

/* ---------------------------------------------------------------------------
 * Login SPID / CIE (modale)
 * ------------------------------------------------------------------------- */
const loginModal = $('#loginModal');
const idpList = $('#idpList');
const authArea = $('#authArea');

idpList.innerHTML = SPID_PROVIDERS.map((p) => `
  <button class="idp" type="button" data-idp="${p.id}"><span class="idp-mark">${p.mark}</span>${p.name}</button>`).join('');

function openLogin() { loginModal.hidden = false; idpList.hidden = true; document.body.style.overflow = 'hidden'; }
function closeLogin() { loginModal.hidden = true; document.body.style.overflow = ''; }

document.addEventListener('click', (event) => {
  const t = event.target.closest('[data-action]');
  if (t && t.dataset.action === 'login') { openLogin(); return; }
  if (t && t.dataset.action === 'close-login') { closeLogin(); return; }
  if (t && t.dataset.action === 'logout') { logout(); return; }
});
loginModal.addEventListener('click', (event) => { if (event.target === loginModal) closeLogin(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !loginModal.hidden) closeLogin(); });

loginModal.querySelector('[data-method="spid"]').addEventListener('click', () => { idpList.hidden = !idpList.hidden; });
loginModal.querySelector('[data-method="cie"]').addEventListener('click', () => doLogin('cie'));
idpList.addEventListener('click', (event) => {
  const b = event.target.closest('[data-idp]');
  if (b) doLogin('spid', b.dataset.idp);
});

async function doLogin(method, idp) {
  loginModal.querySelector('.modal-card').classList.add('is-loading');
  await login(method, idp);
  loginModal.querySelector('.modal-card').classList.remove('is-loading');
  closeLogin();
}

function renderAuthArea(session) {
  if (session) {
    authArea.innerHTML = `
      <div class="user-chip">
        <span class="user-avatar" aria-hidden="true">${escapeHtml(session.name[0])}${escapeHtml(session.familyName[0])}</span>
        <span class="user-name">${escapeHtml(session.displayName)}</span>
        <button class="user-logout" type="button" data-action="logout" aria-label="Esci">Esci</button>
      </div>`;
  } else {
    authArea.innerHTML = `<button class="button button-spid" type="button" data-action="login"><span class="spid-glyph" aria-hidden="true">✦</span> Accedi con SPID / CIE</button>`;
  }
}

/* ---------------------------------------------------------------------------
 * Menu mobile
 * ------------------------------------------------------------------------- */
const menuBtn = document.querySelector('.cc-menu');
menuBtn.addEventListener('click', () => {
  const open = document.body.classList.toggle('nav-open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.cc-nav a').forEach((a) => a.addEventListener('click', () => {
  document.body.classList.remove('nav-open');
  menuBtn.setAttribute('aria-expanded', 'false');
}));

/* ---------------------------------------------------------------------------
 * Bootstrap
 * ------------------------------------------------------------------------- */
function refreshAll() {
  renderReports();
  renderCityBoard();
  renderStats();
  renderMine();
}

onChange((session) => {
  renderAuthArea(session);
  renderMine();
  if (step === 4) renderIdentityBox();
});

showStep(1);
refreshAll();

if ('serviceWorker' in navigator && ['http:', 'https:'].includes(window.location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
}
