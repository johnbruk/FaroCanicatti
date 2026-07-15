# API — Il Faro 1 di Canicattì

Backend REST del portale civico: **Node.js + Express + PostgreSQL**.
Gestisce categorie, segnalazioni, storico stati e la sessione utente da SPID/CIE.

> Il frontend statico (cartella principale del repo) funziona da solo con
> `localStorage`. Quando questa API è disponibile e configurata, il frontend
> la usa come sorgente dati (vedi `src/api.js`).

## Avvio rapido (locale)

Serve **Docker** (per PostgreSQL) e **Node.js 18+**.

```bash
# 1. Avvia il database
docker compose up -d db

# 2. Installa le dipendenze dell'API
cd apps/api && npm install

# 3. Crea le tabelle e i dati demo
npm run setup        # = migrate + seed

# 4. Avvia l'API
npm start            # http://127.0.0.1:4000
```

Configurazione tramite variabili d'ambiente: copia `.env.example` in `.env`.

## Endpoint principali

| Metodo | Rotta | Descrizione |
|---|---|---|
| GET | `/api/health` | Stato del servizio |
| GET | `/api/categories` | Elenco categorie |
| GET | `/api/reports?status=` | Elenco segnalazioni (filtro stato) |
| POST | `/api/reports` | Crea una segnalazione (genera il codice pratica) |
| GET | `/api/reports/:code` | Traccia una pratica per codice |
| GET | `/api/users/:id/reports` | Fascicolo del cittadino |
| PATCH | `/api/reports/:id/status` | Aggiorna lo stato (back office) |
| PATCH | `/api/reports/:id/assign` | Assegna a un ufficio |
| POST | `/api/auth/session` | Registra la sessione da SPID/CIE |

## Modello dati

Tabelle: `categories`, `users`, `reports`, `report_status_history`
(schema completo in `schema.sql`; roadmap in `../docs/ARCHITECTURE.md`).

## Note per la produzione

- **Allegati**: le foto vanno salvate su object storage S3-compatibile con URL
  firmati; in questa versione MVP si conserva solo il nome file.
- **SPID/CIE reale**: sostituire la sessione simulata con il flusso SAML
  accreditato AgID.
- **Deploy**: l'API richiede un host che esegua Node + PostgreSQL
  (Render, Railway, Fly.io, VPS…). GitHub Pages ospita solo il frontend statico.
