// Data layer del portale.
// Usa l'API REST se configurata (vedi lib/api.js), altrimenti localStorage.
// Interfaccia asincrona uniforme così il passaggio all'API non cambia la UI.
import { api, isEnabled } from './api.js';
import { DEFAULT_REPORTS, OFFICE_BY_CATEGORY } from './categories.js';

const KEY = 'faro-canicatti-reports';

function local() {
  if (typeof localStorage === 'undefined') return [...DEFAULT_REPORTS];
  const raw = localStorage.getItem(KEY);
  if (!raw) { localStorage.setItem(KEY, JSON.stringify(DEFAULT_REPORTS)); return [...DEFAULT_REPORTS]; }
  try { return JSON.parse(raw); } catch { return [...DEFAULT_REPORTS]; }
}
function saveLocal(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

function nextCode(list) {
  const year = new Date().getFullYear();
  const seq = String(list.length + 1).padStart(3, '0');
  return `FARO-${year}-${seq}`;
}

// Normalizza una riga dell'API (snake_case) nella forma usata dalla UI.
const fromApi = (r) => r && ({
  id: r.id, ownerId: r.owner_id ?? null, name: r.name, email: r.email,
  category: r.category, subcategory: r.subcategory, address: r.address,
  lat: r.lat, lng: r.lng, description: r.description, priority: r.priority,
  status: r.status, office: r.office, attachmentName: r.attachment_name || '',
  createdAt: r.created_at, history: r.history || []
});
const listFromApi = (rows) => (rows || []).map(fromApi);

export const store = {
  async listReports(status) {
    if (isEnabled()) return listFromApi(await api.getReports(status));
    const all = local();
    return status ? all.filter((r) => r.status === status) : all;
  },
  async userReports(userId) {
    if (isEnabled()) return listFromApi(await api.getUserReports(userId));
    return local().filter((r) => r.ownerId === userId);
  },
  async getReport(code) {
    if (isEnabled()) return fromApi(await api.getReport(code));
    return local().find((r) => r.id.toUpperCase() === code.toUpperCase()) || null;
  },
  async createReport(data) {
    if (isEnabled()) return fromApi(await api.createReport(data));
    const list = local();
    const now = new Date().toISOString();
    const report = {
      id: nextCode(list), ...data,
      office: OFFICE_BY_CATEGORY[data.category] || 'URP - Il Faro',
      status: 'Ricevuta', createdAt: now,
      history: [{ status: 'Ricevuta', note: 'Segnalazione acquisita dal portale.', at: now }]
    };
    list.unshift(report); saveLocal(list);
    return report;
  },
  async updateStatus(id, status, by) {
    if (isEnabled()) return fromApi(await api.updateStatus(id, status, by));
    const now = new Date().toISOString();
    const list = local().map((r) => r.id === id
      ? { ...r, status, history: [...(r.history || []), { status, note: `Stato aggiornato da ${by}.`, at: now }] } : r);
    saveLocal(list);
    return list.find((r) => r.id === id);
  },
  async assign(id, office) {
    if (isEnabled()) return fromApi(await api.assign(id, office));
    const now = new Date().toISOString();
    const list = local().map((r) => {
      if (r.id !== id) return r;
      const status = r.status === 'Ricevuta' ? 'In lavorazione' : r.status;
      return { ...r, office, status, history: [...(r.history || []), { status, note: `Assegnata a ${office}.`, at: now }] };
    });
    saveLocal(list);
    return list.find((r) => r.id === id);
  }
};
