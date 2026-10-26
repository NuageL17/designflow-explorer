import { app, BrowserWindow, ipcMain, dialog, shell, Menu, protocol, net } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { getDb, runMigrations, closeDb } from './db/index';
import { computeFileHash, recordExportedFile, getFileById, setFileDecision, markFileMissing } from './db/files';
import { fileWatcher } from './watcher';
import { generatePdf } from './pdf';
import { generateExcel } from './excel';
import { importExcelFile, previewExcelChanges } from './excel-import';
import { createTray, destroyTray, showMainWindow } from './tray';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
let isQuitting = false;

// 1. DÉCLARATION DU PROTOCOLE (doit être fait avant app.whenReady)
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }
]);

function createWindow(startHidden = false) {
  // Supprime la barre de menu
  Menu.setApplicationMenu(null);

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Flow Master · Gestion commerciale',
    show: !startHidden,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:8080');
    if (process.env.FLOW_DEVTOOLS === '1') win.webContents.openDevTools();
    win.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        win.webContents.toggleDevTools();
        event.preventDefault();
      }
    });
  } else {
    // CHARGEMENT VIA LE PROTOCOLE (corrige l'écran blanc)
    win.loadURL('app://./');
    // On ouvre les DevTools pour vérifier qu'il n'y a plus d'erreurs
  }

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });

  return win;
}

function quitApp() {
  isQuitting = true;
  app.quit();
}

function registerIpcHandlers() {
  ipcMain.handle('ping', () => 'pong');

  ipcMain.handle('clients:list', () => {
    const db = getDb();
    return db.prepare('SELECT * FROM clients WHERE active = 1 ORDER BY name ASC').all();
  });

  ipcMain.handle('clients:create', (_event, payload) => {
    const db = getDb();
    const id = payload.id ?? randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO clients (id, name, initials, city, sector, address, contact, phone, email, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      id, payload.name ?? '', payload.initials ?? '', payload.city ?? '',
      payload.sector ?? '', payload.address ?? '', payload.contact ?? '',
      payload.phone ?? '', payload.email ?? '', now, now,
    );
    return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  });

  ipcMain.handle('documents:list', () => {
    const db = getDb();
    return db.prepare(`
      SELECT d.*, (SELECT COUNT(*) FROM document_lines l WHERE l.document_id = d.id) AS lines_count
      FROM documents d ORDER BY d.created_at DESC
    `).all();
  });

  ipcMain.handle('documents:get', (_event, id: string) => {
    const db = getDb();
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    if (!doc) return null;
    const lines = db.prepare('SELECT * FROM document_lines WHERE document_id = ? ORDER BY position ASC').all(id);
    return { ...doc, lines };
  });

  ipcMain.handle('documents:save', (_event, payload) => {
    const db = getDb();
    const now = new Date().toISOString();
    const docId = payload.id ?? randomUUID();

    const tx = db.transaction(() => {
      const existing = db.prepare('SELECT id FROM documents WHERE id = ?').get(docId);

      if (existing) {
        db.prepare(`
          UPDATE documents SET
            type = ?, reference = ?, status = ?, client_id = ?, client_snapshot = ?,
            object = ?, project = ?, proforma_ref = ?, bc_ref = ?, date = ?, validity_days = ?,
            vat_mode = ?, vat_rate = ?, total_ht_cents = ?, total_vat_cents = ?, total_ttc_cents = ?,
            notes = ?, updated_at = ?
          WHERE id = ?
        `).run(
          payload.type, payload.reference ?? null, payload.status ?? 'brouillon',
          payload.client_id ?? null, JSON.stringify(payload.client_snapshot ?? {}),
          payload.object ?? null, payload.project ?? null, payload.proforma_ref ?? null,
          payload.bc_ref ?? null, payload.date ?? null, payload.validity_days ?? 30,
          payload.vat_mode ?? 'line', payload.vat_rate ?? null,
          payload.total_ht_cents ?? 0, payload.total_vat_cents ?? 0, payload.total_ttc_cents ?? 0,
          payload.notes ?? null, now, docId,
        );
        db.prepare('DELETE FROM document_lines WHERE document_id = ?').run(docId);
      } else {
        db.prepare(`
          INSERT INTO documents (
            id, type, reference, status, client_id, client_snapshot, company_snapshot,
            object, project, proforma_ref, bc_ref, date, validity_days,
            vat_mode, vat_rate, total_ht_cents, total_vat_cents, total_ttc_cents,
            notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          docId, payload.type, payload.reference ?? null, payload.status ?? 'brouillon',
          payload.client_id ?? null, JSON.stringify(payload.client_snapshot ?? {}),
          JSON.stringify(payload.company_snapshot ?? {}),
          payload.object ?? null, payload.project ?? null, payload.proforma_ref ?? null,
          payload.bc_ref ?? null, payload.date ?? null, payload.validity_days ?? 30,
          payload.vat_mode ?? 'line', payload.vat_rate ?? null,
          payload.total_ht_cents ?? 0, payload.total_vat_cents ?? 0, payload.total_ttc_cents ?? 0,
          payload.notes ?? null, now, now,
        );
      }

      const insertLine = db.prepare(`
        INSERT INTO document_lines (
          id, document_id, position, item_ref, designation, details, unit,
          quantity, unit_price_cents, vat_rate, line_total_ht_cents
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const lines = payload.lines ?? [];
      lines.forEach((line: any, index: number) => {
        insertLine.run(
          line.id ?? randomUUID(), docId, index,
          line.item_ref ?? null, line.designation ?? '', line.details ?? null,
          line.unit ?? null, line.quantity ?? 1, line.unit_price_cents ?? 0,
          line.vat_rate ?? 0, line.line_total_ht_cents ?? 0,
        );
      });

      db.prepare('INSERT INTO audit_events (id, document_id, action, details) VALUES (?, ?, ?, ?)')
        .run(randomUUID(), docId, existing ? 'updated' : 'created', null);
    });

    tx();
    return db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  });

  ipcMain.handle('documents:generatePdf', async (_event, payload: { html: string; fileName: string; documentId?: string }) => {
    const result = await generatePdf(payload.html, payload.fileName);
    if (result.success && result.path && payload.documentId) {
      try {
        const stat = fs.statSync(result.path);
        recordExportedFile({
          documentId: payload.documentId, format: 'pdf', path: result.path,
          hash: computeFileHash(result.path), sizeBytes: stat.size,
        });
        fileWatcher.refresh();
      } catch (err) { console.error('Erreur suivi PDF :', err); }
    }
    return result;
  });

  ipcMain.handle('documents:generateExcel', async (_event, payload: { doc: any; client: any; documentId?: string }) => {
    const result = await generateExcel(payload.doc, payload.client);
    if (result.success && result.path && payload.documentId) {
      try {
        const stat = fs.statSync(result.path);
        recordExportedFile({
          documentId: payload.documentId, format: 'xlsx', path: result.path,
          hash: computeFileHash(result.path), sizeBytes: stat.size,
        });
        fileWatcher.refresh();
      } catch (err) { console.error('Erreur suivi Excel :', err); }
    }
    return result;
  });

  ipcMain.handle('externalFiles:resolve', (_event, payload: { fileId: string; decision: 'imported' | 'ignored' | 'kept_internal' }) => {
    const file = getFileById(payload.fileId) as { path: string } | undefined;
    if (!file) return { success: false, error: 'Fichier introuvable.' };
    try {
      const newHash = fs.existsSync(file.path) ? computeFileHash(file.path) : undefined;
      setFileDecision(payload.fileId, payload.decision, newHash);
      if (newHash) fileWatcher.syncFile(payload.fileId, newHash);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('externalFiles:openFile', async (_event, filePath: string) => {
    try {
      const error = await shell.openPath(filePath);
      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('externalFiles:previewImport', async (_event, payload: { fileId: string; documentId: string }) => {
    const file = getFileById(payload.fileId) as { path: string } | undefined;
    if (!file) return { success: false, error: 'Fichier introuvable.', diffs: [], totalChanges: 0, linesAdded: 0, linesRemoved: 0 };
    if (!fs.existsSync(file.path)) {
      markFileMissing(payload.fileId);
      return { success: false, error: 'Le fichier a été déplacé ou supprimé.', diffs: [], totalChanges: 0, linesAdded: 0, linesRemoved: 0 };
    }
    return previewExcelChanges(file.path, payload.documentId);
  });

  ipcMain.handle('externalFiles:importExcel', async (_event, payload: { fileId: string; documentId: string }) => {
    const file = getFileById(payload.fileId) as { path: string } | undefined;
    if (!file) return { success: false, error: 'Fichier introuvable.' };
    if (!fs.existsSync(file.path)) {
      markFileMissing(payload.fileId);
      return { success: false, error: 'Le fichier a été déplacé ou supprimé.' };
    }
    const result = await importExcelFile(file.path, payload.documentId);
    if (result.success) {
      try {
        const newHash = computeFileHash(file.path);
        setFileDecision(payload.fileId, 'imported', newHash);
        fileWatcher.syncFile(payload.fileId, newHash);
      } catch { /* ignore */ }
    }
    return result;
  });
}

app.whenReady().then(() => {
  // 2. ENREGISTREMENT DU PROTOCOLE POUR SERVIR LES FICHIERS LOCAUX
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    let pathName = url.pathname;
    if (pathName === '/' || pathName === '/index.html') {
      pathName = '/_shell.html';
    }
    // On pointe vers le dossier dist/client généré par Vite
    const filePath = path.join(__dirname, '../dist/client', pathName);
    return net.fetch(pathToFileURL(filePath).toString());
  });

  try {
    runMigrations();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    dialog.showErrorBox('Erreur critique — Flow Master', `Impossible d'initialiser la base.\n\n${message}`);
    app.exit(1);
    return;
  }

  try {
    registerIpcHandlers();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    dialog.showErrorBox('Erreur critique — Flow Master', `Impossible de démarrer les services.\n\n${message}`);
    app.exit(1);
    return;
  }

  const shouldStartHidden = process.argv.includes('--hidden');
  createWindow(shouldStartHidden);

  createTray({
    onShowWindow: () => showMainWindow(),
    onQuit: () => quitApp(),
  });

  fileWatcher.start(() => BrowserWindow.getAllWindows());

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => { isQuitting = true; });

app.on('will-quit', () => {
  fileWatcher.stop();
  destroyTray();
  closeDb();
});