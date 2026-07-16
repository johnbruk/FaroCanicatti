-- Schema del database — Il Faro 1 di Canicattì
-- PostgreSQL. Modello dati MVP (vedi docs/ARCHITECTURE.md per il target completo).

CREATE TABLE IF NOT EXISTS categories (
  id          text PRIMARY KEY,
  label       text NOT NULL,
  icon        text,
  office      text NOT NULL,
  subs        text[] NOT NULL DEFAULT '{}'
);

-- Cittadini autenticati. Livelli di identità:
--   verified = true  → SPID/CIE (identità garantita dallo Stato)
--   verified = false → accesso social (Google/Apple/Facebook) con dati carta
--                      d'identità dichiarati dall'utente, oppure ospite.
CREATE TABLE IF NOT EXISTS users (
  id             text PRIMARY KEY,          -- codice fiscale (SPID/CIE) o id social/ospite
  auth_method    text,                       -- spid | cie | google | apple | facebook | guest
  verified       boolean NOT NULL DEFAULT false,
  provider       text,                       -- IdP SPID o provider social
  display_name   text NOT NULL,
  first_name     text,
  last_name      text,
  fiscal_number  text,                       -- codice fiscale (da SPID/CIE)
  id_card_number text,                       -- numero carta d'identità (accesso social/ospite)
  address        text,                       -- via e civico di residenza
  city           text,
  cap            text,
  phone          text,
  email          text,
  pec            text,                        -- facoltativa
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Segnalazioni (pratiche).
CREATE TABLE IF NOT EXISTS reports (
  id              text PRIMARY KEY,        -- codice pratica: FARO-YYYY-NNN
  owner_id        text REFERENCES users(id) ON DELETE SET NULL,
  name            text NOT NULL,
  email           text,
  category        text NOT NULL,
  subcategory     text,
  address         text NOT NULL,
  lat             double precision,
  lng             double precision,
  description     text NOT NULL,
  priority        text NOT NULL DEFAULT 'Ordinaria',
  status          text NOT NULL DEFAULT 'Ricevuta',
  office          text NOT NULL,
  attachment_name text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Storico dei cambi di stato di una pratica.
CREATE TABLE IF NOT EXISTS report_status_history (
  id         serial PRIMARY KEY,
  report_id  text NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  status     text NOT NULL,
  note       text,
  at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_owner  ON reports(owner_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_history_report ON report_status_history(report_id);
