import ExcelJS from 'exceljs';
import { randomUUID } from 'node:crypto';
import { getDb } from './db/index';

type ImportedLine = {
  designation: string;
  reference: string;
  quantity: number;
  price: number;
  vat: number;
};

export type FieldDiff = {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
};

export type LineDiff = {
  index: number;
  lineLabel: string;
  changes: FieldDiff[];
};

export type PreviewResult = {
  success: boolean;
  error?: string;
  diffs: LineDiff[];
  totalChanges: number;
  linesAdded: number;
  linesRemoved: number;
};

function formatMoney(v: number): string {
  return new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 2 })
    .format(v).replace(/[\u00a0\u202f]/g, ' ') + ' DA';
}

function formatQty(v: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(v);
}

function approxEq(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.0001;
}

async function readExcelLines(filePath: string): Promise<ImportedLine[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error('Aucune feuille trouvée dans le fichier.');

  // Trouver la ligne d'en-tête (contient "Désignation" en colonne B)
  let headerRow = 0;
  ws.eachRow((row, rowNumber) => {
    const b = row.getCell(2).value;
    if (typeof b === 'string' && b.toLowerCase().includes('désignation')) {
      headerRow = rowNumber;
    }
  });
  if (!headerRow) throw new Error("Ligne d'en-tête introuvable.");

  const lines: ImportedLine[] = [];
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const labelCol = row.getCell(5).value;
    if (typeof labelCol === 'string' && labelCol.toLowerCase().includes('sous-total')) break;

    const designationCell = row.getCell(2).value;
    if (!designationCell) continue;

    // Ignorer les lignes sans désignation ET sans quantité (lignes vides)
    const quantity = Number(row.getCell(4).value ?? 0);
    const price = Number(row.getCell(5).value ?? 0);

    const designation = String(designationCell).trim();
    if (!designation && !quantity && !price) continue;

    const reference = String(row.getCell(3).value ?? '');
    const vatRaw = Number(row.getCell(6).value ?? 0);
    const vat = vatRaw <= 1 ? vatRaw * 100 : vatRaw;

    lines.push({ designation, reference, quantity, price, vat });
  }

  return lines;
}

export async function previewExcelChanges(
  filePath: string,
  documentId: string,
): Promise<PreviewResult> {
  try {
    const newLines = await readExcelLines(filePath);
    const db = getDb();
    const currentRows = db
      .prepare('SELECT * FROM document_lines WHERE document_id = ? ORDER BY position ASC')
      .all(documentId) as Array<{
        designation: string | null;
        item_ref: string | null;
        quantity: number;
        unit_price_cents: number;
        vat_rate: number;
      }>;

    const currentLines: ImportedLine[] = currentRows.map(r => ({
      designation: r.designation ?? '',
      reference: r.item_ref ?? '',
      quantity: r.quantity ?? 1,
      price: (r.unit_price_cents ?? 0) / 100,
      vat: r.vat_rate ?? 0,
    }));

    const diffs: LineDiff[] = [];
    let totalChanges = 0;

    const maxLen = Math.max(currentLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      const oldLine = currentLines[i];
      const newLine = newLines[i];

      // Ligne ajoutée côté Excel
      if (!oldLine && newLine) {
        diffs.push({
          index: i + 1,
          lineLabel: newLine.designation || `Ligne ${i + 1}`,
          changes: [{
            field: 'added',
            label: 'Ligne ajoutée',
            oldValue: '—',
            newValue: `${newLine.designation} · Qté ${formatQty(newLine.quantity)} · ${formatMoney(newLine.price)} · TVA ${newLine.vat} %`,
          }],
        });
        totalChanges++;
        continue;
      }

      // Ligne supprimée côté Excel
      if (oldLine && !newLine) {
        diffs.push({
          index: i + 1,
          lineLabel: oldLine.designation || `Ligne ${i + 1}`,
          changes: [{
            field: 'removed',
            label: 'Ligne supprimée',
            oldValue: `${oldLine.designation} · Qté ${formatQty(oldLine.quantity)} · ${formatMoney(oldLine.price)} · TVA ${oldLine.vat} %`,
            newValue: '—',
          }],
        });
        totalChanges++;
        continue;
      }

      // Ligne modifiée
      const changes: FieldDiff[] = [];
      if (oldLine.designation !== newLine.designation) {
        changes.push({
          field: 'designation',
          label: 'Désignation',
          oldValue: oldLine.designation || '—',
          newValue: newLine.designation || '—',
        });
      }
      if (oldLine.reference !== newLine.reference) {
        changes.push({
          field: 'reference',
          label: 'Référence',
          oldValue: oldLine.reference || '—',
          newValue: newLine.reference || '—',
        });
      }
      if (!approxEq(oldLine.quantity, newLine.quantity)) {
        changes.push({
          field: 'quantity',
          label: 'Quantité',
          oldValue: formatQty(oldLine.quantity),
          newValue: formatQty(newLine.quantity),
        });
      }
      if (!approxEq(oldLine.price, newLine.price)) {
        changes.push({
          field: 'price',
          label: 'Prix unitaire',
          oldValue: formatMoney(oldLine.price),
          newValue: formatMoney(newLine.price),
        });
      }
      if (!approxEq(oldLine.vat, newLine.vat)) {
        changes.push({
          field: 'vat',
          label: 'TVA',
          oldValue: `${oldLine.vat} %`,
          newValue: `${newLine.vat} %`,
        });
      }

      if (changes.length) {
        diffs.push({
          index: i + 1,
          lineLabel: newLine.designation || oldLine.designation || `Ligne ${i + 1}`,
          changes,
        });
        totalChanges += changes.length;
      }
    }

    return {
      success: true,
      diffs,
      totalChanges,
      linesAdded: Math.max(0, newLines.length - currentLines.length),
      linesRemoved: Math.max(0, currentLines.length - newLines.length),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      diffs: [],
      totalChanges: 0,
      linesAdded: 0,
      linesRemoved: 0,
    };
  }
}

export async function importExcelFile(
  filePath: string,
  documentId: string,
): Promise<{ success: boolean; linesImported?: number; error?: string }> {
  try {
    const lines = await readExcelLines(filePath);
    if (!lines.length) throw new Error('Aucune ligne valide trouvée dans le fichier.');

    const db = getDb();
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      db.prepare('DELETE FROM document_lines WHERE document_id = ?').run(documentId);

      const insert = db.prepare(`
        INSERT INTO document_lines (
          id, document_id, position, item_ref, designation, details, unit,
          quantity, unit_price_cents, vat_rate, line_total_ht_cents
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      lines.forEach((l, i) => {
        insert.run(
          randomUUID(), documentId, i,
          l.reference || null, l.designation, null, null,
          l.quantity, Math.round(l.price * 100), l.vat,
          Math.round(l.quantity * l.price * 100),
        );
      });

      const totalHt = lines.reduce((a, l) => a + l.quantity * l.price, 0);
      const totalVat = lines.reduce((a, l) => a + l.quantity * l.price * (l.vat / 100), 0);
      const totalTtc = totalHt + totalVat;

      db.prepare(`
        UPDATE documents
        SET total_ht_cents = ?, total_vat_cents = ?, total_ttc_cents = ?, updated_at = ?
        WHERE id = ?
      `).run(
        Math.round(totalHt * 100),
        Math.round(totalVat * 100),
        Math.round(totalTtc * 100),
        now, documentId,
      );

      db.prepare('INSERT INTO audit_events (id, document_id, action, details) VALUES (?, ?, ?, ?)')
        .run(randomUUID(), documentId, 'Import Excel externe', filePath);
    });
    tx();

    return { success: true, linesImported: lines.length };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}