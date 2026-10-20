import { randomUUID } from 'node:crypto';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { getDb } from './index';

export function computeFileHash(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function recordExportedFile(opts: {
  documentId: string;
  format: 'pdf' | 'xlsx';
  path: string;
  hash: string;
  sizeBytes: number;
}): string {
  const db = getDb();
  const id = randomUUID();
  db.prepare(`
    INSERT INTO document_files (id, document_id, format, path, hash, size_bytes, version, status, last_checked_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'synced', datetime('now'))
  `).run(id, opts.documentId, opts.format, opts.path, opts.hash, opts.sizeBytes);
  return id;
}

export type WatchedFile = {
  id: string;
  document_id: string;
  format: string;
  path: string;
  hash: string;
  status: string;
};

export function getWatchedFiles(): WatchedFile[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, document_id, format, path, hash, status
    FROM document_files
    WHERE status IN ('synced', 'external_change')
  `).all() as WatchedFile[];
}

export function markExternalChange(fileId: string, newHash: string): string | null {
  const db = getDb();
  const file = db.prepare('SELECT id, document_id, hash FROM document_files WHERE id = ?').get(fileId) as
    | { id: string; document_id: string; hash: string }
    | undefined;
  if (!file) return null;
  if (file.hash === newHash) return null;

  const checkId = randomUUID();
  db.prepare(`
    INSERT INTO external_file_checks (id, file_id, document_id, old_hash, new_hash, decision)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(checkId, fileId, file.document_id, file.hash, newHash);

  db.prepare(`
    UPDATE document_files
    SET status = 'external_change', last_checked_at = datetime('now')
    WHERE id = ?
  `).run(fileId);

  return checkId;
}

export function markFileMissing(fileId: string): void {
  const db = getDb();
  db.prepare(`UPDATE document_files SET status = 'missing', last_checked_at = datetime('now') WHERE id = ?`).run(fileId);
}

export function getFileById(fileId: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM document_files WHERE id = ?').get(fileId);
}

export function setFileDecision(fileId: string, decision: 'imported' | 'ignored' | 'kept_internal', newHash?: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE external_file_checks
    SET decision = ?, decision_at = datetime('now')
    WHERE file_id = ? AND decision = 'pending'
  `).run(decision, fileId);

  if (newHash) {
    db.prepare(`UPDATE document_files SET hash = ?, status = 'synced', last_checked_at = datetime('now') WHERE id = ?`).run(newHash, fileId);
  } else {
    db.prepare(`UPDATE document_files SET status = 'synced', last_checked_at = datetime('now') WHERE id = ?`).run(fileId);
  }
}