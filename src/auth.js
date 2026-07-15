/**
 * Autenticazione SPID / CIE — Il Faro di Canicattì
 * ------------------------------------------------
 * ATTENZIONE: questo modulo è una SIMULAZIONE pensata per la demo/PWA.
 * SPID e CIE reali richiedono un backend accreditato AgID che gestisca il
 * protocollo SAML 2.0 (AuthnRequest/Response, metadata, firma XML).
 *
 * L'interfaccia pubblica di questo modulo (login, logout, getSession,
 * onChange) è volutamente identica a quella che avrà l'integrazione reale:
 * quando ci sarà il backend basterà sostituire il corpo di `simulateLogin`
 * con la redirect verso l'Identity Provider e la verifica dell'assertion,
 * senza toccare il resto dell'applicazione.
 */

const SESSION_KEY = 'faro-canicatti-session';

// Identity Provider SPID accreditati (elenco reale AgID) — nella demo servono
// solo a rendere fedele la schermata di scelta dell'IdP.
export const SPID_PROVIDERS = [
  { id: 'poste', name: 'Poste ID', mark: 'P' },
  { id: 'aruba', name: 'Aruba ID', mark: 'A' },
  { id: 'infocert', name: 'InfoCert ID', mark: 'I' },
  { id: 'lepida', name: 'Lepida ID', mark: 'L' },
  { id: 'namirial', name: 'Namirial ID', mark: 'N' },
  { id: 'sielte', name: 'Sielte ID', mark: 'S' },
  { id: 'tim', name: 'TIM id', mark: 'T' },
  { id: 'teamsystem', name: 'TeamSystem ID', mark: 'TS' }
];

const listeners = new Set();

function notify(session) {
  listeners.forEach((fn) => fn(session));
}

/** Registra un callback invocato ad ogni cambio di sessione. Ritorna un unsubscribe. */
export function onChange(fn) {
  listeners.add(fn);
  fn(getSession());
  return () => listeners.delete(fn);
}

/** Ritorna la sessione corrente o null. */
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persist(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  notify(session);
  return session;
}

// Anagrafica dimostrativa: in produzione arriva dagli attributi dell'assertion
// SPID/CIE (spidCode, name, familyName, fiscalNumber, email...).
const DEMO_PEOPLE = [
  { name: 'Maria', familyName: 'Licata', fiscalNumber: 'LCTMRA85R41B602K', email: 'maria.licata@example.it' },
  { name: 'Giuseppe', familyName: 'Alaimo', fiscalNumber: 'LMAGpp78M12B602V', email: 'g.alaimo@example.it' },
  { name: 'Rosa', familyName: 'Cammarata', fiscalNumber: 'CMMRSO90T55B602P', email: 'rosa.cammarata@example.it' }
];

function pickPerson() {
  return DEMO_PEOPLE[Math.floor(Math.random() * DEMO_PEOPLE.length)];
}

/**
 * Simula l'autenticazione con l'IdP scelto.
 * @param {'spid'|'cie'} method
 * @param {string} [providerId] id dell'IdP SPID (ignorato per CIE)
 * @returns {Promise<object>} la sessione creata
 */
export function login(method, providerId) {
  const person = pickPerson();
  const provider = method === 'cie'
    ? { id: 'cie', name: 'Carta di Identità Elettronica' }
    : SPID_PROVIDERS.find((p) => p.id === providerId) || SPID_PROVIDERS[0];

  const session = {
    id: `${person.fiscalNumber}`,
    method,
    provider: provider.name,
    displayName: `${person.name} ${person.familyName}`,
    name: person.name,
    familyName: person.familyName,
    fiscalNumber: person.fiscalNumber,
    email: person.email,
    level: method === 'cie' ? 'CIE - livello 3' : 'SPID - livello 2',
    loginAt: new Date().toISOString(),
    // marcatore esplicito: questa NON è un'autenticazione reale.
    simulated: true
  };

  // Piccola latenza per imitare il round-trip verso l'IdP.
  return new Promise((resolve) => setTimeout(() => resolve(persist(session)), 650));
}

/** Chiude la sessione corrente. */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
  notify(null);
}
