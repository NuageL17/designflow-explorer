import type { Client, CommercialDocument, Line, Status, DocumentType } from "@/lib/demo-data";

// =====================================================================
// SQLite → React
// =====================================================================
type DbClient = {
  id: string;
  name: string;
  initials: string | null;
  city: string | null;
  sector: string | null;
  address: string | null;
  contact: string | null;
  phone: string | null;
  email: string | null;
};

type DbLine = {
  id: string;
  item_ref: string | null;
  designation: string | null;
  details: string | null;
  unit: string | null;
  quantity: number;
  unit_price_cents: number;
  vat_rate: number;
  line_total_ht_cents: number;
};

type DbDocument = {
  id: string;
  type: string;
  reference: string | null;
  status: string;
  client_id: string | null;
  date: string | null;
  validity_days: number | null;
  notes: string | null;
  updated_at: string | null;
  lines?: DbLine[];
};

export function dbClientToReact(row: DbClient): Client {
  return {
    id: row.id,
    name: row.name ?? "",
    initials: row.initials ?? "",
    city: row.city ?? "",
    sector: row.sector ?? "",
    address: row.address ?? "",
    contact: row.contact ?? "",
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
  };
}

export function dbDocumentToReact(row: DbDocument): CommercialDocument {
  return {
    id: row.id,
    reference: row.reference ?? "",
    type: row.type as DocumentType,
    clientId: row.client_id ?? "",
    date: row.date ?? new Date().toISOString().slice(0, 10),
    validity: row.validity_days ?? 30,
    status: row.status as Status,
    notes: row.notes ?? "",
    modified: row.updated_at ?? new Date().toISOString(),
    lines: (row.lines ?? []).map(dbLineToReact),
  };
}

function dbLineToReact(row: DbLine): Line {
  return {
    id: row.id,
    designation: row.designation ?? "",
    reference: row.item_ref ?? "",
    quantity: row.quantity ?? 1,
    price: (row.unit_price_cents ?? 0) / 100,
    vat: row.vat_rate ?? 0,
  };
}

// =====================================================================
// React → SQLite
// =====================================================================
export function reactDocumentToDb(doc: CommercialDocument, clientSnapshot: Client | null) {
  const linesTotalHt = doc.lines.reduce((a, l) => a + l.quantity * l.price, 0);
  const linesTotalVat = doc.lines.reduce((a, l) => a + (l.quantity * l.price * l.vat) / 100, 0);

  return {
    id: doc.id,
    type: doc.type,
    reference: doc.reference,
    status: doc.status,
    client_id: doc.clientId || null,
    client_snapshot: clientSnapshot ? JSON.stringify(clientSnapshot) : null,
    company_snapshot: null,
    object: null,
    project: null,
    proforma_ref: null,
    bc_ref: null,
    date: doc.date,
    validity_days: doc.validity,
    vat_mode: "line",
    vat_rate: null,
    total_ht_cents: Math.round(linesTotalHt * 100),
    total_vat_cents: Math.round(linesTotalVat * 100),
    total_ttc_cents: Math.round((linesTotalHt + linesTotalVat) * 100),
    notes: doc.notes,
    lines: doc.lines.map((l, index) => ({
      id: l.id,
      position: index,
      item_ref: l.reference,
      designation: l.designation,
      details: null,
      unit: null,
      quantity: l.quantity,
      unit_price_cents: Math.round(l.price * 100),
      vat_rate: l.vat,
      line_total_ht_cents: Math.round(l.quantity * l.price * 100),
    })),
  };
}
