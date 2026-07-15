# Il Faro 1 di Canicattì — Centro Segnalazioni

Portale civico (web + web app installabile) del movimento **Controcorrente** per
raccogliere e gestire le segnalazioni dei cittadini di Canicattì. Pensato per
l'uso **in strada**: foto dalla fotocamera, posizione su **Google Maps**,
accesso **SPID / CIE**, tracciamento delle pratiche.

🌐 **Online:** https://johnbruk.github.io/FaroCanicatti/ (deploy automatico da `main`)

## Struttura (monorepo)

```
apps/
  web/    Frontend — Next.js + React (App Router), export statico per GitHub Pages
  api/    Backend  — Node.js + Express + PostgreSQL (REST)
docs/
  ARCHITECTURE.md   Architettura, modello dati e roadmap
docker-compose.yml  PostgreSQL per lo sviluppo locale
```

## Frontend (`apps/web`)

```bash
cd apps/web
npm install
npm run dev        # sviluppo su http://127.0.0.1:5173
npm run build      # export statico in apps/web/out (pubblicato su Pages)
```

Funziona con `localStorage`; se configuri l'API (meta `faro-api` o
`window.__FARO_API_BASE__`) usa il backend reale — vedi `apps/web/lib/api.js`.

## Backend (`apps/api`)

```bash
docker compose up -d db      # PostgreSQL
cd apps/api
npm install
npm run setup                # crea tabelle + dati demo
npm start                    # API su http://127.0.0.1:4000
```

Dettagli, endpoint e modello dati in [`apps/api/README.md`](apps/api/README.md).

## Deploy

- **Frontend**: GitHub Pages compila `apps/web` e pubblica l'export statico
  (`.github/workflows/pages.yml`). Nessun passaggio manuale.
- **Backend + PostgreSQL**: richiedono un host Node (Render, Railway, Fly.io,
  VPS). GitHub Pages ospita solo il frontend statico.

## Stato e roadmap

Login SPID/CIE oggi **simulato** (interfaccia pronta per l'integrazione SAML
accreditata AgID). Prossimi passi in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md):
deploy del backend, allegati su object storage, mappa georeferenziata PostGIS.
