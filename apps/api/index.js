import express from 'express';
import 'dotenv/config';
import { query, pool } from './db.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

// CORS — consente al frontend statico (anche GitHub Pages) di chiamare l'API.
const ORIGIN = process.env.FRONTEND_ORIGIN || '*';
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const OFFICES = {
  'Strade e marciapiedi': 'Manutenzioni', 'Rifiuti e pulizia': 'Ambiente',
  'Illuminazione pubblica': 'Manutenzioni', 'Verde pubblico': 'Ambiente',
  'Arredo urbano': 'Manutenzioni', 'Segnaletica stradale': 'Polizia Municipale',
  'Veicoli abbandonati': 'Polizia Municipale', 'Cimiteri': 'Servizi cimiteriali',
  'Acqua e fognature': 'Ambiente'
};

// Restituisce una segnalazione (o più) con lo storico stati come array JSON.
const REPORT_SELECT = `
  SELECT r.*, COALESCE(json_agg(json_build_object('status', h.status, 'note', h.note, 'at', h.at)
           ORDER BY h.at) FILTER (WHERE h.id IS NOT NULL), '[]') AS history
  FROM reports r LEFT JOIN report_status_history h ON h.report_id = r.id`;

const wrap = (fn) => (req, res) => fn(req, res).catch((err) => {
  console.error(err);
  res.status(500).json({ error: 'Errore interno del server.' });
});

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'faro-canicatti-api' }));

app.get('/api/categories', wrap(async (_req, res) => {
  const { rows } = await query('SELECT id, label, icon, office, subs FROM categories ORDER BY label');
  res.json(rows);
}));

// Elenco segnalazioni (filtrabili per stato).
app.get('/api/reports', wrap(async (req, res) => {
  const { status } = req.query;
  const params = [];
  let where = '';
  if (status) { params.push(status); where = 'WHERE r.status = $1'; }
  const { rows } = await query(`${REPORT_SELECT} ${where} GROUP BY r.id ORDER BY r.created_at DESC`, params);
  res.json(rows);
}));

// Segnalazioni di un cittadino (fascicolo).
app.get('/api/users/:id/reports', wrap(async (req, res) => {
  const { rows } = await query(`${REPORT_SELECT} WHERE r.owner_id = $1 GROUP BY r.id ORDER BY r.created_at DESC`, [req.params.id]);
  res.json(rows);
}));

// Tracciamento pratica per codice.
app.get('/api/reports/:code', wrap(async (req, res) => {
  const { rows } = await query(`${REPORT_SELECT} WHERE upper(r.id) = upper($1) GROUP BY r.id`, [req.params.code]);
  if (!rows.length) return res.status(404).json({ error: 'Pratica non trovata.' });
  res.json(rows[0]);
}));

// Creazione di una nuova segnalazione.
app.post('/api/reports', wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.category || !b.address || !b.description) {
    return res.status(400).json({ error: 'Categoria, indirizzo e descrizione sono obbligatori.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const year = new Date().getFullYear();
    const { rows: [{ n }] } = await client.query(
      `SELECT count(*)::int + 1 AS n FROM reports WHERE id LIKE $1`, [`FARO-${year}-%`]
    );
    const id = `FARO-${year}-${String(n).padStart(3, '0')}`;
    const office = OFFICES[b.category] || 'URP - Il Faro';
    await client.query(
      `INSERT INTO reports (id, owner_id, name, email, category, subcategory, address, lat, lng, description, priority, status, office, attachment_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Ricevuta',$12,$13)`,
      [id, b.ownerId || null, b.name || 'Cittadino', b.email || null, b.category, b.subcategory || null,
       b.address, b.lat || null, b.lng || null, b.description, b.priority || 'Ordinaria', office, b.attachmentName || null]
    );
    await client.query(
      `INSERT INTO report_status_history (report_id, status, note) VALUES ($1, 'Ricevuta', 'Segnalazione acquisita dal portale.')`, [id]
    );
    await client.query('COMMIT');
    const { rows } = await query(`${REPORT_SELECT} WHERE r.id = $1 GROUP BY r.id`, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// Aggiornamento stato pratica (back office).
app.patch('/api/reports/:id/status', wrap(async (req, res) => {
  const { status, note, by } = req.body || {};
  if (!['Ricevuta', 'In lavorazione', 'Risolta'].includes(status)) {
    return res.status(400).json({ error: 'Stato non valido.' });
  }
  const upd = await query('UPDATE reports SET status = $1 WHERE id = $2', [status, req.params.id]);
  if (!upd.rowCount) return res.status(404).json({ error: 'Pratica non trovata.' });
  await query('INSERT INTO report_status_history (report_id, status, note) VALUES ($1,$2,$3)',
    [req.params.id, status, note || (by ? `Stato aggiornato da ${by}.` : 'Stato aggiornato.')]);
  const { rows } = await query(`${REPORT_SELECT} WHERE r.id = $1 GROUP BY r.id`, [req.params.id]);
  res.json(rows[0]);
}));

// Assegnazione a un ufficio (back office).
app.patch('/api/reports/:id/assign', wrap(async (req, res) => {
  const { office } = req.body || {};
  if (!office) return res.status(400).json({ error: 'Ufficio mancante.' });
  const { rows: [current] } = await query('SELECT status FROM reports WHERE id = $1', [req.params.id]);
  if (!current) return res.status(404).json({ error: 'Pratica non trovata.' });
  const newStatus = current.status === 'Ricevuta' ? 'In lavorazione' : current.status;
  await query('UPDATE reports SET office = $1, status = $2 WHERE id = $3', [office, newStatus, req.params.id]);
  await query('INSERT INTO report_status_history (report_id, status, note) VALUES ($1,$2,$3)',
    [req.params.id, newStatus, `Assegnata a ${office}.`]);
  const { rows } = await query(`${REPORT_SELECT} WHERE r.id = $1 GROUP BY r.id`, [req.params.id]);
  res.json(rows[0]);
}));

// Sessione da SPID/CIE: registra/aggiorna l'utente autenticato.
app.post('/api/auth/session', wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.id || !b.displayName) return res.status(400).json({ error: 'Dati identità incompleti.' });
  await query(
    `INSERT INTO users (id, auth_method, verified, provider, display_name, first_name, last_name,
       fiscal_number, id_card_number, address, city, cap, phone, email, pec)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     ON CONFLICT (id) DO UPDATE SET auth_method=EXCLUDED.auth_method, verified=EXCLUDED.verified,
       provider=EXCLUDED.provider, display_name=EXCLUDED.display_name, first_name=EXCLUDED.first_name,
       last_name=EXCLUDED.last_name, fiscal_number=EXCLUDED.fiscal_number, id_card_number=EXCLUDED.id_card_number,
       address=EXCLUDED.address, city=EXCLUDED.city, cap=EXCLUDED.cap, phone=EXCLUDED.phone,
       email=EXCLUDED.email, pec=EXCLUDED.pec`,
    [b.id, b.method || null, !!b.verified, b.provider || null, b.displayName, b.name || null, b.familyName || null,
     b.fiscalNumber || null, b.idCardNumber || null, b.address || null, b.city || null, b.cap || null,
     b.phone || null, b.email || null, b.pec || null]
  );
  res.json(b);
}));

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`API Il Faro 1 in ascolto su http://127.0.0.1:${PORT}`));
