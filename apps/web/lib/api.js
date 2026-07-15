/**
 * Client dell'API del portale — Il Faro 1 di Canicattì
 * ----------------------------------------------------
 * Interfaccia verso il backend REST (cartella server/).
 *
 * L'API è attiva solo se è configurata una base URL, tramite:
 *   - <meta name="faro-api" content="https://api.tuo-host.it">  nell'index.html
 *   - oppure window.__FARO_API_BASE__ = 'https://api.tuo-host.it'
 *
 * Se non è configurata, isEnabled() restituisce false e il frontend continua
 * a funzionare con i dati locali (localStorage). Questo permette di pubblicare
 * la demo su GitHub Pages e, quando l'API sarà online su un host adatto,
 * di attivarla senza modificare il resto dell'app.
 */

function baseUrl() {
  if (typeof document === 'undefined') return '';
  const meta = document.querySelector('meta[name="faro-api"]');
  return (window.__FARO_API_BASE__ || (meta && meta.content) || '').replace(/\/$/, '');
}

export function isEnabled() {
  return Boolean(baseUrl());
}

async function request(path, options = {}) {
  const res = await fetch(baseUrl() + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!res.ok) {
    let msg = `Errore ${res.status}`;
    try { msg = (await res.json()).error || msg; } catch { /* noop */ }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  health: () => request('/api/health'),
  getCategories: () => request('/api/categories'),
  getReports: (status) => request(`/api/reports${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  getReport: (code) => request(`/api/reports/${encodeURIComponent(code)}`),
  getUserReports: (userId) => request(`/api/users/${encodeURIComponent(userId)}/reports`),
  createReport: (data) => request('/api/reports', { method: 'POST', body: data }),
  updateStatus: (id, status, by) => request(`/api/reports/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status, by } }),
  assign: (id, office) => request(`/api/reports/${encodeURIComponent(id)}/assign`, { method: 'PATCH', body: { office } }),
  saveSession: (session) => request('/api/auth/session', { method: 'POST', body: session })
};
