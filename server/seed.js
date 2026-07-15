import { pool } from './db.js';

// Categorie di segnalazione (allineate al frontend).
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

const REPORTS = [
  { id: 'FARO-2026-001', name: 'Maria Licata', email: 'maria.licata@example.it', category: 'Strade e marciapiedi', subcategory: 'Buca stradale', address: 'Corso Umberto I, 42', lat: 37.3639, lng: 13.8496, description: 'Buca pericolosa vicino alle strisce pedonali, serve messa in sicurezza urgente.', priority: 'Alta', status: 'In lavorazione', office: 'Manutenzioni' },
  { id: 'FARO-2026-002', name: 'Giuseppe Alaimo', email: 'g.alaimo@example.it', category: 'Illuminazione pubblica', subcategory: 'Lampione spento', address: 'Via Nazionale, 8', lat: 37.3701, lng: 13.8455, description: 'Tre lampioni consecutivi spenti da una settimana, strada al buio la sera.', priority: 'Ordinaria', status: 'Ricevuta', office: 'Manutenzioni' },
  { id: 'FARO-2026-003', name: 'Rosa Cammarata', email: 'rosa.cammarata@example.it', category: 'Rifiuti e pulizia', subcategory: 'Discarica abusiva', address: 'Contrada Giarre', lat: 37.3555, lng: 13.8600, description: 'Cumulo di rifiuti ingombranti abbandonati ai margini della strada.', priority: 'Urgente', status: 'Risolta', office: 'Ambiente' }
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const c of CATEGORIES) {
      await client.query(
        `INSERT INTO categories (id, label, icon, office, subs) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO UPDATE SET label=EXCLUDED.label, icon=EXCLUDED.icon, office=EXCLUDED.office, subs=EXCLUDED.subs`,
        [c.id, c.label, c.icon, c.office, c.subs]
      );
    }
    for (const r of REPORTS) {
      await client.query(
        `INSERT INTO reports (id, name, email, category, subcategory, address, lat, lng, description, priority, status, office)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO NOTHING`,
        [r.id, r.name, r.email, r.category, r.subcategory, r.address, r.lat, r.lng, r.description, r.priority, r.status, r.office]
      );
      await client.query(
        `INSERT INTO report_status_history (report_id, status, note)
         SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT 1 FROM report_status_history WHERE report_id=$1)`,
        [r.id, r.status, 'Segnalazione acquisita dal portale.']
      );
    }
    await client.query('COMMIT');
    console.log(`✓ Seed completato: ${CATEGORIES.length} categorie, ${REPORTS.length} segnalazioni demo.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('✗ Seed fallito:', err.message);
  process.exit(1);
});
