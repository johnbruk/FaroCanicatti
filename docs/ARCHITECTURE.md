# Architettura target - Il Faro di Canicattì

Questo documento descrive l'architettura consigliata per trasformare il prototipo statico in un portale cittadino completo, accessibile a cittadini registrati, operatori comunali e amministratori multiufficio.

## Stato attuale (implementato)

Il progetto non è più "solo HTML": ha già tre livelli.

```text
Frontend (PWA statica)            Backend API                 Database
─────────────────────            ─────────────               ────────
index.html, src/*.js/css   ──►   server/ (Express)   ──►   PostgreSQL
- wizard segnalazione            - /api/reports              - categories
- foto da fotocamera             - /api/categories           - users
- posizione Google Maps          - /api/auth/session         - reports
- SPID/CIE (simulato)            - storico stati             - report_status_history
- src/api.js (client)            CORS per il frontend
```

- **Frontend**: PWA statica (nessun framework), installabile e mobile-first,
  pensata per l'uso in strada (fotocamera + Google Maps + GPS). Funziona con
  `localStorage` e, quando l'API è configurata, tramite `src/api.js`.
- **Backend**: API REST Node.js/Express in `server/`, testata end-to-end.
- **Database**: PostgreSQL con schema versionato (`server/schema.sql`), migrazione e seed.
- **Deploy**: il frontend è su GitHub Pages (solo statico); l'API+DB richiedono un host dedicato.

### Decisioni aperte (da concordare)

1. **Framework frontend**: restare su HTML/JS vanilla (zero build, ottimo per
   Pages) oppure evolvere verso **Next.js/React** o **Astro/Svelte** per un repo
   grande e componenti riutilizzabili. Impatta hosting e complessità.
2. **Hosting backend**: dove pubblicare API + PostgreSQL (Render, Railway,
   Fly.io, Supabase, VPS). Necessario per attivare registrazione utenti reale.
3. **SPID/CIE reale**: accreditamento AgID + flusso SAML (sostituisce la sessione simulata).
4. **Allegati**: object storage S3-compatibile con URL firmati per le foto.

## Identità e livelli di accesso

Il portale distingue tre livelli di identità, con implicazioni diverse.

| Accesso | Verifica | Dati richiesti | Fiducia |
|---|---|---|---|
| **SPID / CIE** | Verificata dallo Stato (SAML/AgID) | Nessuno: anagrafica e codice fiscale dall'IdP | Alta |
| **Social** (Google/Apple/Facebook) | Solo account, non l'identità | Obbligatori i dati della carta d'identità | Media |
| **Ospite** | Nessuna | Anagrafica completa nel form | Base |

**Cosa comporta SPID/CIE in produzione:**

- Backend accreditato AgID che implementa **SAML 2.0** (metadata, `AuthnRequest`
  firmata, verifica dell'`assertion`) e la registrazione come Service Provider.
- Gli attributi (spidCode, nome, cognome, codice fiscale, email) arrivano
  firmati dall'Identity Provider: **nessun inserimento manuale**.
- Livelli SPID (1/2/3) e CIE livello 3; per le segnalazioni è sufficiente il livello 2.

**Accesso social:** OAuth 2.0 / OpenID Connect autentica solo l'account, non
l'identità reale. Il portale quindi **obbliga a inserire i dati della carta
d'identità** (numero, anagrafica, residenza, telefono, email, PEC facoltativa)
→ identità "dichiarata". Il flag `verified` sulla tabella `users` distingue i
due livelli.

## Obiettivi

- Gestire registrazione e autenticazione degli utenti con ruoli differenziati.
- Raccogliere segnalazioni con categorie, posizione, allegati, cronologia e stati di avanzamento.
- Supportare un back office multiutente con assegnazioni, SLA, commenti interni e notifiche.
- Restare scalabile per un repository grande, con separazione chiara tra frontend, backend, database e infrastruttura.
- Preparare integrazioni future con SPID/CIE, protocollo comunale, mappe GIS e sistemi di notifica.

## Architettura applicativa consigliata

```text
apps/
  web/                Frontend pubblico e PWA per cittadini
  admin/              Back office operatori e amministratori
  api/                API REST/GraphQL e logica applicativa
packages/
  ui/                 Design system condiviso Il Faro/Controcorrente
  config/             Configurazioni condivise lint/test/build
  domain/             Tipi, validazioni e regole di dominio condivise
infra/
  docker/             Container locali e ambienti di sviluppo
  migrations/         Migrazioni database versionate
  deploy/             Configurazioni cloud, reverse proxy e CI/CD
docs/
  ARCHITECTURE.md     Decisioni tecniche e modello dati
```

Per il frontend è consigliabile usare un framework moderno come Next.js o Remix per accessibilità, SEO, routing, PWA e separazione tra area pubblica e area amministrativa. Per il backend è adatto un servizio API in Node.js/NestJS, Fastify o Django, con validazioni centralizzate e autorizzazioni basate su ruoli.

## Database consigliato

La scelta primaria consigliata è **PostgreSQL** con estensione **PostGIS**.

### Perché PostgreSQL + PostGIS

- È robusto per dati relazionali complessi come utenti, ruoli, segnalazioni, uffici, commenti e audit log.
- Supporta transazioni affidabili e vincoli forti, essenziali per pratiche amministrative.
- Con PostGIS gestisce coordinate geografiche, ricerche per area, quartiere, strada e mappe.
- Scala bene con indici, partizionamento, repliche di lettura e backup continui.
- È compatibile con strumenti ORM maturi come Prisma, Drizzle, TypeORM, SQLAlchemy o Django ORM.

### Servizi dati complementari

- **Object storage S3-compatible** per foto, PDF e allegati, evitando di salvare file pesanti nel database.
- **Redis** per cache, rate limit, sessioni temporanee e code leggere.
- **Search engine** come OpenSearch/Elasticsearch solo quando serviranno ricerche full-text avanzate su descrizioni, indirizzi e note interne.
- **Message queue** come RabbitMQ, BullMQ o SQS per notifiche email, protocollazione, generazione PDF e integrazioni asincrone.

## Modello dati iniziale

### Tabelle principali

- `users`: cittadini, operatori e amministratori registrati.
- `roles`: ruoli applicativi come cittadino, operatore, responsabile ufficio, amministratore.
- `offices`: uffici o reparti competenti, ad esempio manutenzioni, ambiente, polizia municipale.
- `report_categories`: categorie e sottocategorie configurabili.
- `reports`: segnalazioni con codice pratica, descrizione, posizione, stato e priorità.
- `report_attachments`: metadati degli allegati salvati su object storage.
- `report_comments`: commenti pubblici e note interne.
- `report_status_history`: storico completo dei cambi di stato.
- `report_assignments`: assegnazioni a uffici o singoli operatori.
- `audit_logs`: tracciamento delle azioni rilevanti per sicurezza e trasparenza.
- `notifications`: email, push e messaggi in-app inviati agli utenti.

### Stati pratica consigliati

1. `draft`: bozza non inviata.
2. `submitted`: inviata dal cittadino.
3. `triaged`: presa in carico dall'URP o dal primo livello.
4. `assigned`: assegnata a un ufficio competente.
5. `in_progress`: in lavorazione.
6. `waiting_for_citizen`: in attesa di integrazione dal cittadino.
7. `resolved`: risolta.
8. `closed`: chiusa definitivamente.
9. `rejected`: non accoglibile o duplicata.

## Sicurezza e accessibilità

- Autenticazione con email/password iniziale, predisposta per SPID/CIE in produzione.
- RBAC, cioè controllo accessi basato sui ruoli.
- Audit log immutabile per operazioni amministrative.
- Rate limiting per prevenire spam sulle segnalazioni pubbliche.
- Cifratura degli allegati sensibili e URL firmati a scadenza.
- Conformità WCAG 2.2 AA per rendere il portale accessibile a tutti.
- Privacy by design con retention configurabile e consenso informato.

## Scalabilità operativa

- Deploy containerizzato con Docker.
- API stateless dietro reverse proxy e load balancer.
- Database PostgreSQL gestito con backup automatici, replica e monitoraggio.
- Storage allegati separato e CDN per asset pubblici.
- Pipeline CI/CD con test unitari, integrazione, lint, migrazioni e scansioni sicurezza.
- Osservabilità con log strutturati, metriche, tracing e alert.

## Roadmap tecnica

### Fase 1 - MVP reale

- Frontend cittadino e back office in applicazioni separate.
- API autenticata con registrazione utenti e ruoli.
- PostgreSQL con migrazioni e modello dati iniziale.
- Upload allegati su object storage.
- Notifiche email per codice pratica e aggiornamenti.

### Fase 2 - Portale comunale avanzato

- Integrazione SPID/CIE.
- Mappa georeferenziata con PostGIS.
- SLA per uffici e dashboard statistiche.
- Workflow di assegnazione e escalation.
- Ricerca full-text e filtri avanzati.

### Fase 3 - Ecosistema scalabile

- App mobile nativa o wrapper PWA avanzato.
- Integrazione protocollo comunale e open data.
- Notifiche push.
- Analisi predittive su zone critiche e categorie ricorrenti.
