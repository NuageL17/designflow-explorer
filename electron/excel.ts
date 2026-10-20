import { dialog } from 'electron';
import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';

type LineData = {
  designation: string;
  reference: string;
  quantity: number;
  price: number;
  vat: number;
};

type ClientData = {
  name: string;
  address?: string;
  city?: string;
  contact?: string;
  phone?: string;
  email?: string;
} | null;

type DocumentData = {
  type: string;
  reference: string;
  date: string;
  validity: number;
  notes: string;
  lines: LineData[];
  amounts: { subtotal: number; vat: number; total: number };
};

export async function generateExcel(
  doc: DocumentData,
  client: ClientData,
): Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }> {
  try {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Flow Master';
    wb.created = new Date();

    const ws = wb.addWorksheet('Document', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    // Colonnes — H = colonne technique cachée (montant TVA par ligne)
    ws.columns = [
      { width: 6 },    // A: #
      { width: 45 },   // B: Désignation
      { width: 18 },   // C: Référence
      { width: 8 },    // D: Qté
      { width: 16 },   // E: Prix unitaire
      { width: 8 },    // F: TVA %
      { width: 18 },   // G: Total HT
      { width: 16 },   // H: Montant TVA (cachée)
    ];

    // ---- En-tête ----
    ws.mergeCells('A1:H1');
    const brandCell = ws.getCell('A1');
    brandCell.value = 'FLOW MASTER.';
    brandCell.font = { bold: true, size: 20, color: { argb: 'FF0D6EFD' } };
    brandCell.alignment = { vertical: 'middle' };

    ws.mergeCells('A2:H2');
    ws.getCell('A2').value = "Bureau d'études de pompage et systèmes fluides";
    ws.getCell('A2').font = { size: 10, color: { argb: 'FF666666' } };

    ws.mergeCells('A3:H3');
    ws.getCell('A3').value = doc.type.toUpperCase();
    ws.getCell('A3').font = { bold: true, size: 14 };
    ws.getCell('A3').alignment = { horizontal: 'right' };

    ws.mergeCells('A4:H4');
    ws.getCell('A4').value = `Référence : ${doc.reference}`;
    ws.getCell('A4').font = { size: 11, bold: true };
    ws.getCell('A4').alignment = { horizontal: 'right' };

    ws.addRow([]);

    // ---- Bloc Client / Infos ----
    ws.getCell('A6').value = 'CLIENT';
    ws.getCell('A6').font = { bold: true, size: 10, color: { argb: 'FF666666' } };
    ws.getCell('E6').value = 'INFORMATIONS';
    ws.getCell('E6').font = { bold: true, size: 10, color: { argb: 'FF666666' } };

    ws.getCell('A7').value = client?.name ?? '—';
    ws.getCell('A7').font = { bold: true, size: 12 };
    ws.getCell('E7').value = `Date : ${doc.date}`;
    ws.getCell('E8').value = doc.type === 'Devis' ? `Validité : ${doc.validity} jours` : '';
    ws.getCell('E9').value = 'Devise : Dinar algérien (DA)';

    ws.getCell('A8').value = client?.address ?? '';
    ws.getCell('A9').value = client?.city ?? '';
    ws.getCell('A10').value = client?.contact ? `Contact : ${client.contact}` : '';
    ws.getCell('A11').value = client?.phone ? `Tél. : ${client.phone}` : '';
    ws.getCell('A12').value = client?.email ?? '';

    ws.addRow([]);

    // ---- Tableau ----
    const headerRow = ws.addRow(['#', 'Désignation', 'Référence', 'Qté', 'Prix unit. HT', 'TVA', 'Total HT', '']);
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      cell.font = { bold: true, size: 10, color: { argb: 'FF0D6EFD' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F6FC' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF0D6EFD' } } };
    });

    // ---- Lignes avec FORMULES Excel ----
    const lineRows: number[] = [];
    doc.lines.forEach((line, i) => {
      const row = ws.addRow([
        i + 1,
        line.designation,
        line.reference,
        line.quantity,
        line.price,
        line.vat / 100,
        null, // G : formule
        null, // H : formule
      ]);
      lineRows.push(row.number);

      // Total HT = Qté × Prix unitaire
      row.getCell(7).value = {
        formula: `D${row.number}*E${row.number}`,
        result: line.quantity * line.price,
      };
      // Montant TVA = Total HT × Taux TVA
      row.getCell(8).value = {
        formula: `G${row.number}*F${row.number}`,
        result: line.quantity * line.price * (line.vat / 100),
      };

      row.getCell(4).alignment = { horizontal: 'right' };
      row.getCell(5).numFmt = '#,##0.00" DA"';
      row.getCell(5).alignment = { horizontal: 'right' };
      row.getCell(6).numFmt = '0.00%';
      row.getCell(6).alignment = { horizontal: 'right' };
      row.getCell(7).numFmt = '#,##0.00" DA"';
      row.getCell(7).alignment = { horizontal: 'right' };
      row.getCell(8).numFmt = '#,##0.00" DA"';
      row.getCell(8).alignment = { horizontal: 'right' };
    });

    // ---- Totaux avec FORMULES ----
    ws.addRow([]);
    const firstLineRow = lineRows[0];
    const lastLineRow = lineRows[lineRows.length - 1];
    const totalStartRow = ws.rowCount + 1;

    // Sous-total HT = SUM(colonne G)
    ws.mergeCells(`E${totalStartRow}:F${totalStartRow}`);
    ws.getCell(`E${totalStartRow}`).value = 'Sous-total HT';
    ws.getCell(`E${totalStartRow}`).alignment = { horizontal: 'right' };
    ws.getCell(`G${totalStartRow}`).value = {
      formula: `SUM(G${firstLineRow}:G${lastLineRow})`,
      result: doc.amounts.subtotal,
    };
    ws.getCell(`G${totalStartRow}`).numFmt = '#,##0.00" DA"';
    ws.getCell(`G${totalStartRow}`).alignment = { horizontal: 'right' };

    // TVA = SUM(colonne H)
    ws.mergeCells(`E${totalStartRow + 1}:F${totalStartRow + 1}`);
    ws.getCell(`E${totalStartRow + 1}`).value = 'TVA';
    ws.getCell(`E${totalStartRow + 1}`).alignment = { horizontal: 'right' };
    ws.getCell(`G${totalStartRow + 1}`).value = {
      formula: `SUM(H${firstLineRow}:H${lastLineRow})`,
      result: doc.amounts.vat,
    };
    ws.getCell(`G${totalStartRow + 1}`).numFmt = '#,##0.00" DA"';
    ws.getCell(`G${totalStartRow + 1}`).alignment = { horizontal: 'right' };

    // Total TTC = Sous-total + TVA
    ws.mergeCells(`E${totalStartRow + 2}:F${totalStartRow + 2}`);
    ws.getCell(`E${totalStartRow + 2}`).value = 'Total TTC';
    ws.getCell(`E${totalStartRow + 2}`).font = { bold: true, size: 12 };
    ws.getCell(`E${totalStartRow + 2}`).alignment = { horizontal: 'right' };
    ws.getCell(`G${totalStartRow + 2}`).value = {
      formula: `G${totalStartRow}+G${totalStartRow + 1}`,
      result: doc.amounts.total,
    };
    ws.getCell(`G${totalStartRow + 2}`).numFmt = '#,##0.00" DA"';
    ws.getCell(`G${totalStartRow + 2}`).font = { bold: true, size: 12, color: { argb: 'FF0D6EFD' } };
    ws.getCell(`G${totalStartRow + 2}`).alignment = { horizontal: 'right' };

    // ---- Masquer la colonne technique H ----
    ws.getColumn(8).hidden = true;

    // ---- Notes ----
    if (doc.notes) {
      ws.addRow([]);
      const notesRow = ws.rowCount + 1;
      ws.getCell(`A${notesRow}`).value = 'Notes et conditions';
      ws.getCell(`A${notesRow}`).font = { bold: true, size: 10 };
      ws.mergeCells(`A${notesRow + 1}:G${notesRow + 1}`);
      ws.getCell(`A${notesRow + 1}`).value = doc.notes;
      ws.getCell(`A${notesRow + 1}`).alignment = { wrapText: true, vertical: 'top' };
    }

    // ---- Pied de page ----
    ws.addRow([]);
    const footerRow = ws.rowCount + 2;
    ws.mergeCells(`A${footerRow}:G${footerRow}`);
    ws.getCell(`A${footerRow}`).value = 'FLOW MASTER - Gestion commerciale';
    ws.getCell(`A${footerRow}`).font = { size: 9, color: { argb: 'FF888888' } };
    ws.getCell(`A${footerRow}`).alignment = { horizontal: 'center' };

    // ---- Sauvegarde ----
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Enregistrer le fichier Excel',
      defaultPath: `${doc.reference}.xlsx`,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    const buffer = await wb.xlsx.writeBuffer();
    await fs.writeFile(filePath, Buffer.from(buffer));
    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}