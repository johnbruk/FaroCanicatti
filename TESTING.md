# Test — Il Faro 1 di Canicattì

Batteria di test per UAT, stabilità e regressione. Da eseguire prima di ogni rilascio.

## Frontend — E2E / UAT / accessibilità (`apps/web`)

Suite Playwright che guida il browser come un utente reale (viewport mobile),
con geolocalizzazione simulata. Copre: home e sezioni, accessibilità di base,
validazioni del wizard, invio completo come ospite, login SPID, login social
con obbligo carta d'identità, tracciamento, back office, e stabilità con invii
ripetuti. Fallisce se compare un solo errore in console.

```bash
cd apps/web
npm run build
# servire apps/web/out sotto /FaroCanicatti/ (es. su http://127.0.0.1:5291/FaroCanicatti/)
BASE=http://127.0.0.1:5291/FaroCanicatti/ npm run test:e2e
```

Variabili: `BASE` (URL del sito), `PW_CHROME` (percorso del binario Chromium).

## Backend — integrazione API (`apps/api`)

Test di integrazione contro un PostgreSQL reale: health, categorie, CRUD
segnalazioni, tracking, stati con storico, assegnazione, sessione utente
(SPID e social con carta d'identità).

```bash
docker compose up -d db      # oppure un PostgreSQL locale
cd apps/api
npm run setup                # migrate + seed
npm start &                  # avvia l'API
npm test                     # esegue i test
```

## Esito atteso

- Backend: **18/18** test superati.
- Frontend: **19/19** test superati.
- Build statico Next: **OK**, nessun errore in console.
