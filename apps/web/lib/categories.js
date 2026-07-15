// Categorie di segnalazione e dati demo (condivisi con il backend/seed).
export const CATEGORIES = [
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

export const OFFICE_BY_CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.label, c.office]));

export const DEFAULT_REPORTS = [
  { id: 'FARO-2026-001', ownerId: null, name: 'Maria Licata', email: 'maria.licata@example.it', category: 'Strade e marciapiedi', subcategory: 'Buca stradale', address: 'Corso Umberto I, 42', lat: 37.3639, lng: 13.8496, description: 'Buca pericolosa vicino alle strisce pedonali, serve messa in sicurezza urgente.', priority: 'Alta', status: 'In lavorazione', office: 'Manutenzioni', createdAt: '2026-07-12T09:00:00.000Z', attachmentName: 'buca.jpg', history: [{ status: 'Ricevuta', note: 'Segnalazione acquisita dal portale.', at: '2026-07-12T09:00:00.000Z' }, { status: 'In lavorazione', note: 'Presa in carico da Manutenzioni.', at: '2026-07-13T08:00:00.000Z' }] },
  { id: 'FARO-2026-002', ownerId: null, name: 'Giuseppe Alaimo', email: 'g.alaimo@example.it', category: 'Illuminazione pubblica', subcategory: 'Lampione spento', address: 'Via Nazionale, 8', lat: 37.3701, lng: 13.8455, description: 'Tre lampioni consecutivi spenti da una settimana, strada al buio la sera.', priority: 'Ordinaria', status: 'Ricevuta', office: 'Manutenzioni', createdAt: '2026-07-13T20:30:00.000Z', attachmentName: '', history: [{ status: 'Ricevuta', note: 'Segnalazione acquisita dal portale.', at: '2026-07-13T20:30:00.000Z' }] },
  { id: 'FARO-2026-003', ownerId: null, name: 'Rosa Cammarata', email: 'rosa.cammarata@example.it', category: 'Rifiuti e pulizia', subcategory: 'Discarica abusiva', address: 'Contrada Giarre', lat: 37.3555, lng: 13.8600, description: 'Cumulo di rifiuti ingombranti abbandonati ai margini della strada.', priority: 'Urgente', status: 'Risolta', office: 'Ambiente', createdAt: '2026-07-08T07:15:00.000Z', attachmentName: 'rifiuti.jpg', history: [{ status: 'Ricevuta', note: 'Segnalazione acquisita dal portale.', at: '2026-07-08T07:15:00.000Z' }, { status: 'Risolta', note: 'Area bonificata.', at: '2026-07-10T11:00:00.000Z' }] }
];
