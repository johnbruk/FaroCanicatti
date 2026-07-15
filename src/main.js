const STORAGE_KEY = 'faro-canicatti-reports';
const defaultReports = [
  {
    id: 'FARO-2026-001',
    name: 'Demo cittadino',
    email: 'demo@canicatti.it',
    category: 'Manutenzione strade',
    address: 'Corso Umberto I',
    description: 'Buca pericolosa vicino alle strisce pedonali, serve intervento di messa in sicurezza.',
    priority: 'Alta',
    status: 'Ricevuta',
    owner: 'Ufficio Relazioni con il Pubblico',
    createdAt: '2026-07-14T09:00:00.000Z',
    attachmentName: 'foto-buca.jpg'
  }
];

const form = document.querySelector('#reportForm');
const formMessage = document.querySelector('#formMessage');
const reportsList = document.querySelector('#reportsList');
const statusFilter = document.querySelector('#statusFilter');
const adminRole = document.querySelector('#adminRole');
const totalReports = document.querySelector('#totalReports');
const categoryGrid = document.querySelector('#categoryGrid');
const categorySelect = form.elements.category;

function getReports() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultReports));
    return defaultReports;
  }
  return JSON.parse(stored);
}

function saveReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function buildPracticeCode() {
  const year = new Date().getFullYear();
  const sequence = String(getReports().length + 1).padStart(3, '0');
  return `FARO-${year}-${sequence}`;
}

function renderReports() {
  const reports = getReports();
  const selectedStatus = statusFilter.value;
  const visibleReports = selectedStatus ? reports.filter((report) => report.status === selectedStatus) : reports;
  totalReports.textContent = reports.length;

  if (!visibleReports.length) {
    reportsList.innerHTML = '<p class="empty-state">Nessuna segnalazione corrisponde al filtro selezionato.</p>';
    return;
  }

  reportsList.innerHTML = visibleReports
    .map((report) => `
      <article class="report-card" data-id="${report.id}">
        <div>
          <span class="code">${report.id}</span>
          <h3>${report.category}</h3>
          <p>${report.description}</p>
          <dl>
            <div><dt>Luogo</dt><dd>${report.address}</dd></div>
            <div><dt>Priorità</dt><dd>${report.priority}</dd></div>
            <div><dt>Assegnata a</dt><dd>${report.owner}</dd></div>
            <div><dt>Allegato</dt><dd>${report.attachmentName || 'Non presente'}</dd></div>
          </dl>
        </div>
        <div class="report-actions">
          <span class="badge ${report.status.toLowerCase().replaceAll(' ', '-')}">${report.status}</span>
          <select aria-label="Aggiorna stato ${report.id}" data-action="status">
            ${['Ricevuta', 'In lavorazione', 'Risolta'].map((status) => `<option ${status === report.status ? 'selected' : ''}>${status}</option>`).join('')}
          </select>
          <button class="secondary-action" data-action="assign" type="button">Assegna al ruolo</button>
        </div>
      </article>
    `)
    .join('');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const reports = getReports();
  const report = {
    id: buildPracticeCode(),
    name: data.get('name'),
    email: data.get('email'),
    category: data.get('category'),
    address: data.get('address'),
    description: data.get('description'),
    priority: data.get('priority'),
    status: 'Ricevuta',
    owner: 'Ufficio Relazioni con il Pubblico',
    createdAt: new Date().toISOString(),
    attachmentName: data.get('attachment')?.name || ''
  };
  reports.unshift(report);
  saveReports(reports);
  form.reset();
  formMessage.textContent = `Segnalazione inviata correttamente. Codice pratica: ${report.id}`;
  renderReports();
});

reportsList.addEventListener('change', (event) => {
  if (event.target.dataset.action !== 'status') return;
  const card = event.target.closest('.report-card');
  const reports = getReports().map((report) =>
    report.id === card.dataset.id ? { ...report, status: event.target.value } : report
  );
  saveReports(reports);
  renderReports();
});

reportsList.addEventListener('click', (event) => {
  if (event.target.dataset.action !== 'assign') return;
  const card = event.target.closest('.report-card');
  const reports = getReports().map((report) =>
    report.id === card.dataset.id ? { ...report, owner: adminRole.value, status: 'In lavorazione' } : report
  );
  saveReports(reports);
  renderReports();
});

categoryGrid.addEventListener('click', (event) => {
  const card = event.target.closest('[data-category]');
  if (!card) return;
  categorySelect.value = card.dataset.category;
  document.querySelector('#segnala').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

statusFilter.addEventListener('change', renderReports);
renderReports();

if ('serviceWorker' in navigator && ['http:', 'https:'].includes(window.location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js'));
}
