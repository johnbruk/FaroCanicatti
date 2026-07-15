-- Schema del database — Il Faro 1 di Canicattì
-- PostgreSQL. Modello dati MVP (vedi docs/ARCHITECTURE.md per il target completo).

CREATE TABLE IF NOT EXISTS categories (
  id          text PRIMARY KEY,
  label       text NOT NULL,
  icon        text,
  office      text NOT NULL,
  subs        text[] NOT NULL DEFAULT '{}'
);

-- Utenti autenticati via SPID/CIE. La chiave è il codice fiscale.
CREATE TABLE IF NOT EXISTS users (
  id           text PRIMARY KEY,          -- codice fiscale
  display_name text NOT NULL,
  email        text,
  method       text,                       -- 'spid' | 'cie'
  provider     text,
  created_at   timestamptz NOT NULL DEFAULT now()
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
