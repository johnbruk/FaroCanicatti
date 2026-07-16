/**
 * Autenticazione e identità — Il Faro 1 di Canicattì
 * --------------------------------------------------
 * SIMULAZIONE per la demo/PWA. Livelli di identità:
 *
 *  - SPID / CIE  → identità VERIFICATA dallo Stato (SAML/AgID in produzione).
 *                  Anagrafica e codice fiscale arrivano dall'Identity Provider:
 *                  nessun dato da inserire a mano.
 *  - Apple / Google / Facebook (social) → autenticano solo l'account, NON
 *                  l'identità reale. Per usarli il cittadino DEVE completare i
 *                  dati della carta d'identità (obbligatorio) → identità
 *                  "dichiarata", non verificata.
 *  - Ospite (nessun accesso) → i dati si inseriscono nel form della segnalazione.
 *
 * L'interfaccia (login/logout/getSession/onChange/completeIdentity) è pronta a
 * essere sostituita dai flussi reali (SAML per SPID/CIE, OAuth per i social).
 */

const SESSION_KEY = 'faro-canicatti-session';

// Identity Provider SPID accreditati AgID (nella demo servono alla schermata IdP).
export const SPID_PROVIDERS = [
  { id: 'poste', name: 'Poste ID' },
  { id: 'aruba', name: 'Aruba ID' },
  { id: 'lepida', name: 'Lepida ID' },
  { id: 'infocert', name: 'InfoCert ID' },
  { id: 'intesa', name: 'Intesa ID' },
  { id: 'namirial', name: 'Namirial ID' },
  { id: 'sielte', name: 'Sielte ID' },
  { id: 'spiditalia', name: 'SpidItalia' },
  { id: 'tim', name: 'TIM id' },
  { id: 'teamsystem', name: 'TeamSystem ID' }
];

// Accesso alternativo tramite social (identità da completare con la carta).
export const SOCIAL_PROVIDERS = [
  { id: 'google', name: 'Google', mark: 'G' },
  { id: 'apple', name: 'Apple', mark: '' },
  { id: 'facebook', name: 'Facebook', mark: 'f' }
];

const listeners = new Set();
const notify = (s) => listeners.forEach((fn) => fn(s));

export function onChange(fn) {
  listeners.add(fn);
  fn(getSession());
  return () => listeners.delete(fn);
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function persist(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  notify(session);
  return session;
}

const DEMO_PEOPLE = [
  { name: 'Maria', familyName: 'Licata', fiscalNumber: 'LCTMRA85R41B602K', email: 'maria.licata@example.it' },
  { name: 'Giuseppe', familyName: 'Alaimo', fiscalNumber: 'LMAGpp78M12B602V', email: 'g.alaimo@example.it' },
  { name: 'Rosa', familyName: 'Cammarata', fiscalNumber: 'CMMRSO90T55B602P', email: 'rosa.cammarata@example.it' }
];
const pickPerson = () => DEMO_PEOPLE[Math.floor(Math.random() * DEMO_PEOPLE.length)];

/**
 * Avvia l'accesso.
 * @param {'spid'|'cie'|'google'|'apple'|'facebook'} method
 * @param {string} [providerId] id IdP SPID
 */
export function login(method, providerId) {
  const person = pickPerson();
  const isSocial = ['google', 'apple', 'facebook'].includes(method);
  let session;

  if (isSocial) {
    const prov = SOCIAL_PROVIDERS.find((p) => p.id === method);
    session = {
      id: `${method}:${person.email}`,
      method, provider: prov.name,
      displayName: `${person.name} ${person.familyName}`,
      name: person.name, familyName: person.familyName,
      email: person.email,
      level: `Account ${prov.name}`,
      verified: false,      // il social non verifica l'identità reale
      needsIdCard: true,    // obbligatorio completare la carta d'identità
      loginAt: new Date().toISOString(), simulated: true
    };
  } else {
    const provider = method === 'cie'
      ? { name: 'Carta di Identità Elettronica' }
      : (SPID_PROVIDERS.find((p) => p.id === providerId) || SPID_PROVIDERS[0]);
    session = {
      id: person.fiscalNumber,
      method, provider: provider.name,
      displayName: `${person.name} ${person.familyName}`,
      name: person.name, familyName: person.familyName,
      fiscalNumber: person.fiscalNumber, email: person.email,
      level: method === 'cie' ? 'CIE - livello 3' : 'SPID - livello 2',
      verified: true, needsIdCard: false,
      loginAt: new Date().toISOString(), simulated: true
    };
  }
  return new Promise((resolve) => setTimeout(() => resolve(persist(session)), 650));
}

/**
 * Completa l'identità dopo l'accesso social con i dati della carta d'identità.
 * @param {object} data { firstName, lastName, idCardNumber, address, city, cap, phone, email, pec }
 */
export function completeIdentity(data) {
  const s = getSession();
  if (!s) return null;
  const merged = {
    ...s,
    name: data.firstName || s.name,
    familyName: data.lastName || s.familyName,
    displayName: `${data.firstName} ${data.lastName}`.trim() || s.displayName,
    idCardNumber: data.idCardNumber,
    address: data.address, city: data.city, cap: data.cap,
    phone: data.phone, email: data.email || s.email, pec: data.pec || '',
    needsIdCard: false, identified: true
  };
  return persist(merged);
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  notify(null);
}
