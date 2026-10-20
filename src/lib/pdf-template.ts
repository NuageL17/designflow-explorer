import type { Client, CommercialDocument } from '@/lib/demo-data';
import { totals, money, shortDate } from '@/lib/demo-data';

function escapeHtml(s: string | undefined | null): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildDocumentHtml(
  doc: CommercialDocument,
  client: Client | null | undefined,
): string {
  const amounts = totals(doc.lines);
  const totalTtc = amounts.total;

  const linesRows = doc.lines
    .map(
      (l, i) => `
      <tr>
        <td class="col-num">${i + 1}</td>
        <td>
          <div class="line-designation">${escapeHtml(l.designation)}</div>
          ${l.reference ? `<div class="line-ref">Réf. ${escapeHtml(l.reference)}</div>` : ''}
        </td>
        <td class="col-num">${l.quantity}</td>
        <td class="col-money">${money(l.price)}</td>
        <td class="col-num">${l.vat} %</td>
        <td class="col-money">${money(l.quantity * l.price)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(doc.reference)}</title>
<style>
  /* Marge inférieure large pour laisser la place au footer fixe */
  @page { size: A4; margin: 12mm 12mm 22mm 12mm; }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #1a1a1a;
    font-size: 11px;
    margin: 0;
    padding: 0;
  }
  .doc { max-width: 100%; padding-bottom: 30mm; /* espace réservé au footer */ }

  /* ---- Pied de page fixé en bas de la page A4 ---- */
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 10px 0 0 0;
    border-top: 1px solid #e5e5e5;
    font-size: 9px;
    color: #888;
    display: flex;
    justify-content: space-between;
    background: #ffffff;
  }

  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0d6efd; padding-bottom: 14px; margin-bottom: 24px; }
  .brand { font-size: 22px; font-weight: 800; color: #0d6efd; letter-spacing: 0.5px; }
  .brand-sub { font-size: 10px; color: #666; margin-top: 2px; }
  .doc-info { text-align: right; }
  .doc-type { font-size: 18px; font-weight: 700; text-transform: uppercase; margin: 0 0 6px 0; }
  .doc-ref { font-size: 12px; font-weight: 600; color: #333; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .meta-block h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin: 0 0 6px 0; font-weight: 600; }
  .meta-block p { margin: 1px 0; line-height: 1.5; }
  .meta-block strong { font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead th { background: #f2f6fc; text-align: left; padding: 8px 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; color: #333; border-bottom: 1.5px solid #0d6efd; }
  tbody td { padding: 8px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
  .col-num { text-align: right; white-space: nowrap; }
  .col-money { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .line-designation { font-weight: 500; }
  .line-ref { font-size: 9px; color: #888; margin-top: 2px; }
  .total-wrap { display: flex; justify-content: flex-end; margin-top: 10px; }
  .totals { width: 280px; }
  .totals div { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; }
  .totals .grand { border-top: 2px solid #0d6efd; margin-top: 6px; padding-top: 8px; font-size: 13px; font-weight: 700; color: #0d6efd; }
  .notes { margin-top: 24px; border-top: 1px solid #e5e5e5; padding-top: 12px; }
  .notes h3 { font-size: 10px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; margin: 0 0 6px 0; }
  .notes p { margin: 0; line-height: 1.6; white-space: pre-wrap; }
</style>
</head>
<body>
<div class="doc">
  <div class="header">
    <div>
      <div class="brand">FLOW MASTER<span style="color:#000">.</span></div>
      <div class="brand-sub">Bureau d'études de pompage et systèmes fluides</div>
    </div>
    <div class="doc-info">
      <div class="doc-type">${escapeHtml(doc.type)}</div>
      <div class="doc-ref">${escapeHtml(doc.reference)}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-block">
      <h3>Client</h3>
      <p><strong>${escapeHtml(client?.name ?? '—')}</strong></p>
      ${client?.address ? `<p>${escapeHtml(client.address)}</p>` : ''}
      ${client?.city ? `<p>${escapeHtml(client.city)}</p>` : ''}
      ${client?.contact ? `<p>Contact : ${escapeHtml(client.contact)}</p>` : ''}
      ${client?.phone ? `<p>Tél. : ${escapeHtml(client.phone)}</p>` : ''}
      ${client?.email ? `<p>${escapeHtml(client.email)}</p>` : ''}
    </div>
    <div class="meta-block">
      <h3>Informations</h3>
      <p><strong>Date :</strong> ${shortDate(doc.date)}</p>
      ${doc.type === 'Devis' ? `<p><strong>Validité :</strong> ${doc.validity} jours</p>` : ''}
      <p><strong>Devise :</strong> Dinar algérien (DA)</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px">#</th>
        <th>Désignation</th>
        <th style="width:60px" class="col-num">Qté</th>
        <th style="width:100px" class="col-money">Prix unit. HT</th>
        <th style="width:60px" class="col-num">TVA</th>
        <th style="width:110px" class="col-money">Total HT</th>
      </tr>
    </thead>
    <tbody>${linesRows}</tbody>
  </table>

  <div class="total-wrap">
    <div class="totals">
      <div><span>Sous-total HT</span><span>${money(amounts.subtotal)}</span></div>
      <div><span>TVA</span><span>${money(amounts.vat)}</span></div>
      <div class="grand"><span>Total TTC</span><span>${money(totalTtc)}</span></div>
    </div>
  </div>

  ${doc.notes ? `<div class="notes"><h3>Notes et conditions</h3><p>${escapeHtml(doc.notes)}</p></div>` : ''}
</div>

<div class="footer">
  <span>FLOW MASTER - Gestion commerciale</span>
  <span>${escapeHtml(doc.reference)} - ${shortDate(doc.date)}</span>
</div>
</body>
</html>`;
}