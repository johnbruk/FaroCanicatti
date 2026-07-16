/**
 * Test di integrazione dell'API su PostgreSQL reale.
 * Richiede l'API in ascolto (default http://127.0.0.1:4000) e il DB migrato+seed.
 * Uso: node test.mjs   (vedi package.json → "npm test")
 */
import assert from 'node:assert/strict';

const BASE = process.env.API_BASE || 'http://127.0.0.1:4000';
let passed = 0;
const check = (name, cond) => { assert.ok(cond, name); console.log('  ✓ ' + name); passed++; };
const j = (path, opts) => fetch(BASE + path, opts).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

// health
let r = await j('/api/health');
check('health risponde ok', r.status === 200 && r.body.ok === true);

// categorie
r = await j('/api/categories');
check('categorie = 9', r.status === 200 && r.body.length === 9);
check('categoria ha campi label/office/subs', r.body[0].label && r.body[0].office && Array.isArray(r.body[0].subs));

// elenco iniziale
r = await j('/api/reports');
const initial = r.body.length;
check('elenco segnalazioni (>=3 seed)', r.status === 200 && initial >= 3);
check('ogni report ha lo storico', Array.isArray(r.body[0].history));

// creazione
r = await j('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
  category: 'Rifiuti e pulizia', subcategory: 'Rifiuti abbandonati', address: 'Via Test 1',
  description: 'Descrizione di test sufficientemente lunga per la validazione.', priority: 'Alta', name: 'Tester', email: 't@e.it', lat: 37.36, lng: 13.84
}) });
const code = r.body.id;
check('creazione → 201 con codice FARO', r.status === 201 && /^FARO-\d{4}-\d{3}$/.test(code));
check('creazione → ufficio derivato dalla categoria', r.body.office === 'Ambiente');
check('creazione → stato iniziale Ricevuta + storico', r.body.status === 'Ricevuta' && r.body.history.length === 1);

// validazione: campi mancanti
r = await j('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: 'X' }) });
check('creazione senza campi obbligatori → 400', r.status === 400);

// tracking
r = await j(`/api/reports/${code}`);
check('tracking pratica esistente → trovata', r.status === 200 && r.body.id === code);
r = await j('/api/reports/FARO-9999-999');
check('tracking pratica inesistente → 404', r.status === 404);

// aggiornamento stato
r = await j(`/api/reports/${code}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'In lavorazione', by: 'Ambiente' }) });
check('aggiorna stato → In lavorazione + storico cresciuto', r.body.status === 'In lavorazione' && r.body.history.length === 2);
r = await j(`/api/reports/${code}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Stato invalido' }) });
check('stato non valido → 400', r.status === 400);

// assegnazione
r = await j(`/api/reports/${code}/assign`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ office: 'Manutenzioni' }) });
check('assegnazione ufficio → aggiornato', r.body.office === 'Manutenzioni');

// filtro per stato
r = await j('/api/reports?status=Risolta');
check('filtro per stato Risolta', r.status === 200 && r.body.every((x) => x.status === 'Risolta'));

// sessione utente estesa (SPID)
r = await j('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
  id: 'RSSMRA80A01B602K', displayName: 'Mario Rossi', method: 'spid', provider: 'Poste ID', verified: true,
  name: 'Mario', familyName: 'Rossi', email: 'm@r.it', fiscalNumber: 'RSSMRA80A01B602K'
}) });
check('sessione SPID salvata', r.status === 200 && r.body.id === 'RSSMRA80A01B602K');

// sessione social con carta d'identità
r = await j('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
  id: 'google:demo@gmail.com', displayName: 'Demo Utente', method: 'google', provider: 'Google', verified: false,
  idCardNumber: 'CA1234567', address: 'Via Roma 1', city: 'Canicattì', cap: '92024', phone: '3331234567', email: 'demo@gmail.com', pec: ''
}) });
check('sessione social con carta identità salvata', r.status === 200 && r.body.method === 'google');

// il fascicolo utente ritorna le sue segnalazioni (nessuna per questo utente)
r = await j('/api/users/RSSMRA80A01B602K/reports');
check('fascicolo utente risponde (array)', r.status === 200 && Array.isArray(r.body));

console.log(`\n  API: ${passed} test superati ✓`);
