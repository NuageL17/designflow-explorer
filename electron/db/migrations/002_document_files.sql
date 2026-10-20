-- Migration 002 : traçabilité des fichiers exportés (PDF/Excel)
-- Permet de détecter les modifications externes des fichiers Excel.

CREATE TABLE IF NOT EXISTS document_files (
  id              TEXT PRIMARY KEY,
  document_id     TEXT NOT NULL,
  format          TEXT NOT NULL,
  path            TEXT NOT NULL,
  hash            TEXT NOT NULL,
  size_bytes      INTEGER,
  version         INTEGER NOT NULL DEFAULT 1,
  exported_at     TEXT NOT NULL DEFAULT (datetime('now')),
  last_checked_at TEXT,
  status          TEXT NOT NULL DEFAULT 'synced',
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_files_document ON document_files(document_id);
CREATE INDEX IF NOT EXISTS idx_files_status   ON document_files(status);

CREATE TABLE IF NOT EXISTS external_file_checks (
  id           TEXT PRIMARY KEY,
  file_id      TEXT NOT NULL,
  document_id  TEXT NOT NULL,
  detected_at  TEXT NOT NULL DEFAULT (datetime('now')),
  old_hash     TEXT,
  new_hash     TEXT,
  decision     TEXT,
  decision_at  TEXT,
  FOREIGN KEY (file_id) REFERENCES document_files(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_checks_file ON external_file_checks(file_id);