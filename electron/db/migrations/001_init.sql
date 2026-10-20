-- Migration 001 : schéma initial Flow Master
-- Version : 1

CREATE TABLE IF NOT EXISTS schema_migrations (
  version    INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  checksum   TEXT
);

CREATE TABLE IF NOT EXISTS company_profile (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  name       TEXT NOT NULL DEFAULT '',
  address    TEXT DEFAULT '',
  phone      TEXT DEFAULT '',
  email      TEXT DEFAULT '',
  rc         TEXT DEFAULT '',
  nif        TEXT DEFAULT '',
  ai         TEXT DEFAULT '',
  rib        TEXT DEFAULT '',
  logo_path  TEXT,
  stamp_path TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clients (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  initials   TEXT,
  city       TEXT,
  sector     TEXT,
  address    TEXT,
  contact    TEXT,
  phone      TEXT,
  email      TEXT,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(active);
CREATE INDEX IF NOT EXISTS idx_clients_name   ON clients(name);

CREATE TABLE IF NOT EXISTS catalog_items (
  reference    TEXT PRIMARY KEY,
  designation  TEXT NOT NULL,
  price_cents  INTEGER NOT NULL DEFAULT 0,
  category     TEXT,
  unit         TEXT,
  description  TEXT,
  active       INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id                 TEXT PRIMARY KEY,
  type               TEXT NOT NULL,
  reference          TEXT UNIQUE,
  status             TEXT NOT NULL DEFAULT 'brouillon',
  client_id          TEXT,
  client_snapshot    TEXT,
  company_snapshot   TEXT,
  object             TEXT,
  project            TEXT,
  proforma_ref       TEXT,
  bc_ref             TEXT,
  date               TEXT,
  validity_days      INTEGER DEFAULT 30,
  vat_mode           TEXT NOT NULL DEFAULT 'line',
  vat_rate           REAL,
  total_ht_cents     INTEGER NOT NULL DEFAULT 0,
  total_vat_cents    INTEGER NOT NULL DEFAULT 0,
  total_ttc_cents    INTEGER NOT NULL DEFAULT 0,
  notes              TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_client       ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_type_status  ON documents(type, status);
CREATE INDEX IF NOT EXISTS idx_documents_reference    ON documents(reference);

CREATE TABLE IF NOT EXISTS document_lines (
  id                  TEXT PRIMARY KEY,
  document_id         TEXT NOT NULL,
  position            INTEGER NOT NULL DEFAULT 0,
  item_ref            TEXT,
  designation         TEXT NOT NULL DEFAULT '',
  details             TEXT,
  unit                TEXT,
  quantity            REAL NOT NULL DEFAULT 1,
  unit_price_cents    INTEGER NOT NULL DEFAULT 0,
  vat_rate            REAL NOT NULL DEFAULT 0,
  line_total_ht_cents INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lines_document ON document_lines(document_id);

CREATE TABLE IF NOT EXISTS document_counters (
  type         TEXT NOT NULL,
  year         INTEGER NOT NULL,
  next_number  INTEGER NOT NULL DEFAULT 1,
  prefix       TEXT,
  PRIMARY KEY (type, year)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id          TEXT PRIMARY KEY,
  document_id TEXT,
  action      TEXT NOT NULL,
  details     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_document ON audit_events(document_id);