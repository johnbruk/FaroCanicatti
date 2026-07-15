# Il Faro 1 di Canicattì — Centro Segnalazioni

Portale civico (web + web app installabile) del movimento **Controcorrente** per
raccogliere e gestire le segnalazioni dei cittadini di Canicattì: disservizi,
anomalie e proposte. Design chiaro e istituzionale su pagine bianche, con
accesso **SPID / CIE** e tracciamento delle pratiche.

🌐 **Online:** https://johnbruk.github.io/FaroCanicatti/ (deploy automatico da `main` via GitHub Pages)

---

## Struttura del portale

### Struttura dei file

```
FaroCanicatti/
├── index.html                 # Pagina unica del portale (struttura + sezioni)
├── manifest.webmanifest       # Configurazione PWA (nome, icona, tema, installabilità)
├── service-worker.js          # Cache offline degli asset → app installabile
├── icons/
│   └── controcorrente.svg     # Logo Controcorrente "Il Faro 1" (header, hero, icona app)
├── src/
│   ├── main.js                # Logica dell'app: wizard, fascicolo, tracciamento, back office
│   ├── auth.js                # Autenticazione SPID/CIE (simulata, pronta per l'integrazione reale)
│   └── styles.css             # Design system chiaro/istituzionale (identità Controcorrente)
├── scripts/
│   ├── serve-static-app.js    # Server statico locale (npm start)
│   └── validate-static-app.js # Validazione/test dei file (npm test / npm run build)
├── docs/
│   └── ARCHITECTURE.md        # Architettura target: backend, database, roadmap
└── .github/workflows/pages.yml# CI: deploy su GitHub Pages ad ogni push su main
```

### Struttura funzionale (sezioni della pagina)

| Sezione | Ancora | A cosa serve |
|---|---|---|
| **Home / Hero** | `#home` | Presentazione, statistiche, accesso rapido a "Segnala" e "Traccia" |
| **Come funziona** | — | I 3 passi: accedi → descrivi e localizza → segui la pratica |
| **Nuova segnalazione** | `#segnala` | Wizard guidato in 5 passi (vedi sotto) |
| **Mappa / Città** | `#mappa` | Board delle segnalazioni per categoria |
| **Le mie segnalazioni** | `#pratiche` | Fascicolo del cittadino autenticato, con timeline degli stati |
| **Traccia pratica** | `#traccia` | Ricerca di una pratica per codice, senza login |
| **Back office** | `#fascicolo` | Gestione operatori: filtro stato, assegnazione ufficio, avanzamento |
| **Login SPID/CIE** | modale | Scelta Identity Provider e autenticazione |

### Flusso di segnalazione (wizard a 5 passi)

1. **Categoria** — scelta tra 9 categorie (strade, rifiuti, illuminazione, verde, arredo, segnaletica, veicoli, cimiteri, acqua) con sotto-categoria.
2. **Dove** — indirizzo + geolocalizzazione, con anteprima del punto.
3. **Cosa** — descrizione, priorità, foto/allegato.
4. **Chi** — dati da SPID/CIE (se autenticato) oppure come ospite; consenso privacy.
5. **Riepilogo** — controllo finale e invio → **codice pratica** + timeline degli stati.

### Moduli JavaScript

- **`src/auth.js`** — interfaccia di autenticazione: `login()`, `logout()`, `getSession()`, `onChange()`, elenco `SPID_PROVIDERS`. Oggi simula il login SPID/CIE; l'interfaccia pubblica è identica a quella dell'integrazione reale, così il passaggio al backend accreditato AgID non tocca il resto dell'app.
- **`src/main.js`** — stato dell'app e rendering: categorie, navigazione wizard, geolocalizzazione, fascicolo cittadino, tracciamento, board città, statistiche, back office. Persistenza demo su `localStorage` (in produzione: API + database).

> ⚠️ **Stato attuale:** prototipo front-end. Login SPID/CIE **simulato** e dati salvati in `localStorage` del browser. L'architettura reale (API, PostgreSQL/PostGIS, storage allegati, SPID/CIE via SAML) è descritta in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Avvio locale

Metodo più semplice: apri `index.html` con doppio click.

Con Node.js installato (consigliato, per il service worker/PWA):

```bash
npm start        # server statico su http://127.0.0.1:5173/
```

## Test / validazione

```bash
npm test         # verifica presenza file, manifest valido, sintassi dei moduli JS
```

## Pubblicazione

Il sito è pubblicato automaticamente su **GitHub Pages** ad ogni push su `main`
(workflow `.github/workflows/pages.yml`). Nessun passaggio manuale.

---

## Design

Identità **Controcorrente** (rosso, giallo, arancio, logo "Il Faro 1") declinata
in chiave **istituzionale**: pagine bianche, molto spazio, accenti rossi, blu
SPID ufficiale per l'accesso. Mobile-first e installabile come web app.
