export const documentTypes = ['Devis', 'Facture', 'Bon de livraison'] as const;
export const statuses = ['Brouillon', 'En cours', 'À valider', 'Finalisé', 'Archivé'] as const;
export type DocumentType = typeof documentTypes[number];
export type Status = typeof statuses[number];
export type Line = { id: string; designation: string; reference: string; quantity: number; price: number; vat: number };
export type CommercialDocument = { id: string; reference: string; type: DocumentType; clientId: string; date: string; validity: number; status: Status; lines: Line[]; notes: string; modified: string };
export type DemoEvent = { id: string; documentId: string; reference: string; action: string; date: string };
export type Client = { id: string; name: string; initials: string; city: string; sector: string; address: string; contact: string; phone?: string; email?: string };
export type Product = { reference: string; designation: string; price: number; category: string; unit: string; description: string; stock: number; minStock: number };
export type DemoState = { version: 1; documents: CommercialDocument[]; events: DemoEvent[]; clients?: Client[]; products?: Product[] };
const seedClients: Client[] = [
  { id: 'c1', name: 'Hydro Atlas Démo', initials: 'HA', city: 'Alger', sector: 'Hydraulique industrielle', address: 'Zone technique fictive A · Alger', contact: 'Service des achats (démo)' },
  { id: 'c2', name: 'Agripôle Démo', initials: 'AG', city: 'Blida', sector: 'Irrigation agricole', address: 'Zone agricole fictive B · Blida', contact: 'Service des achats (démo)' },
  { id: 'c3', name: 'Eaux du Tell Démo', initials: 'ET', city: 'Sétif', sector: 'Traitement des eaux', address: 'Zone technique fictive C · Sétif', contact: 'Service des achats (démo)' },
  { id: 'c4', name: 'Bâtitech Démo', initials: 'BT', city: 'Oran', sector: 'Bâtiment et travaux publics', address: 'Zone industrielle fictive D · Oran', contact: 'Service des achats (démo)' },
  { id: 'c5', name: 'Oasis Équipements Démo', initials: 'OE', city: 'Biskra', sector: 'Équipements agricoles', address: 'Zone agricole fictive E · Biskra', contact: 'Service des achats (démo)' },
  { id: 'c6', name: 'Industries Horizon Démo', initials: 'IH', city: 'Constantine', sector: 'Industrie et maintenance', address: 'Zone industrielle fictive F · Constantine', contact: 'Service des achats (démo)' },
];
const seedCatalog: Product[] = [
  { reference: 'PMP-SUB-075', designation: 'Pompe submersible 7,5 kW', price: 185000, category: 'Pompes', unit: 'Unité', description: 'Débit 18 m³/h · HMT 85 m · Triphasée' , stock: 12, minStock: 3 },
  { reference: 'PMP-CEN-055', designation: 'Pompe centrifuge 5,5 kW', price: 128000, category: 'Pompes', unit: 'Unité', description: 'Débit 30 m³/h · HMT 42 m · Fonte' , stock: 8, minStock: 2 },
  { reference: 'COF-CMD-075', designation: 'Coffret de commande 7,5 kW', price: 45000, category: 'Électricité', unit: 'Unité', description: 'Protection thermique · Démarrage direct' , stock: 20, minStock: 5 },
  { reference: 'TUB-PEHD-63', designation: 'Tuyauterie PEHD Ø 63 mm', price: 850, category: 'Tuyauterie', unit: 'Mètre', description: 'PN16 · Eau potable · Diamètre 63 mm' , stock: 1500, minStock: 300 },
  { reference: 'ACC-CLP-50', designation: 'Clapet anti-retour DN50', price: 12500, category: 'Accessoires', unit: 'Unité', description: 'Corps laiton · Raccord fileté' , stock: 45, minStock: 10 },
  { reference: 'SRV-INST', designation: 'Installation et mise en service', price: 35000, category: 'Services', unit: 'Forfait', description: 'Montage · Raccordement · Essais de fonctionnement' , stock: 99, minStock: 0 },
];
export const clients: Client[] = seedClients.map(c => ({ ...c }));
export const catalog: Product[] = seedCatalog.map(p => ({ ...p }));
/** Keeps the shared lookup arrays aligned with the session state (clients and stock added during the demo). */
export function syncReferences(state: Partial<DemoState>) {
  const c = Array.isArray(state.clients) && state.clients.length ? state.clients : seedClients; if (c !== clients) clients.splice(0, clients.length, ...c);
  const p = Array.isArray(state.products) && state.products.length ? state.products : seedCatalog; if (p !== catalog) catalog.splice(0, catalog.length, ...p);
}
export function initialsFor(name: string) { return name.split(/\s+/).filter(w => w && !/^d[eu]s?$/i.test(w)).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'CL'; }
export function money(value: number) { return new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 2 }).format(value).replace(/[\u00a0\u202f]/g, ' ') + ' DA'; }
export function shortDate(value: string) { return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)); }
export function totals(lines: Line[]) { const subtotal = lines.reduce((a, l) => a + l.quantity * l.price, 0); const vat = lines.reduce((a, l) => a + l.quantity * l.price * l.vat / 100, 0); return { subtotal, vat, total: subtotal + vat }; }
export function clientName(id: string) { return clients.find(c => c.id === id)?.name ?? 'Client de démonstration'; }
export function makeLine(index = 0): Line { const p = catalog[index] ?? catalog[0]; if (!p) throw new Error('Catalogue de démonstration vide'); return { id: crypto.randomUUID(), designation: p.designation, reference: p.reference, quantity: 1, price: p.price, vat: 19 }; }
export function referenceFor(type: DocumentType, documents: CommercialDocument[]) { const prefix = type === 'Devis' ? 'DEV' : type === 'Facture' ? 'FAC' : 'BL'; const max = documents.filter(d => d.reference.startsWith(prefix + '-2026-')).reduce((n, d) => Math.max(n, Number(d.reference.split('-').at(-1)) || 0), 0); return `${prefix}-2026-${String(max + 1).padStart(3, '0')}`; }
export function initialState(): DemoState {
  const seed: [string, DocumentType, string, string, Status, number, number][] = [
    ['DEV-2026-024', 'Devis', 'c1', '2026-10-12', 'À valider', 0, 2],
    ['FAC-2026-018', 'Facture', 'c2', '2026-10-11', 'Finalisé', 0, 3],
    ['DEV-2026-023', 'Devis', 'c3', '2026-10-10', 'En cours', 1, 2],
    ['BL-2026-012', 'Bon de livraison', 'c4', '2026-10-09', 'Finalisé', 0, 1],
    ['DEV-2026-022', 'Devis', 'c5', '2026-10-08', 'Brouillon', 0, 4],
    ['FAC-2026-017', 'Facture', 'c6', '2026-10-07', 'En cours', 1, 3],
    ['DEV-2026-021', 'Devis', 'c2', '2026-10-06', 'Finalisé', 0, 2],
    ['BL-2026-011', 'Bon de livraison', 'c1', '2026-10-05', 'À valider', 1, 1],
    ['DEV-2026-020', 'Devis', 'c4', '2026-10-03', 'Archivé', 0, 1],
    ['FAC-2026-016', 'Facture', 'c3', '2026-10-02', 'Finalisé', 1, 4],
  ];
  const documents = seed.map((s, i): CommercialDocument => ({ id: `doc-${i + 1}`, reference: s[0], type: s[1], clientId: s[2], date: s[3], status: s[4], validity: 30, lines: [{ ...makeLine(s[5]), quantity: s[6] }, { ...makeLine(2), quantity: s[6] }, { ...makeLine(5), quantity: 1 }], notes: 'Fourniture et équipement de pompage. Données de démonstration uniquement.', modified: `${s[3]}T09:30:00` }));
  return { version: 1, clients: seedClients.map(c => ({ ...c })), products: seedCatalog.map(p => ({ ...p })), documents, events: documents.map((d, i) => ({ id: `event-${i}`, documentId: d.id, reference: d.reference, action: d.status === 'Finalisé' ? 'Document finalisé' : d.status === 'Archivé' ? 'Document archivé' : d.status === 'À valider' ? 'Document à valider' : 'Document créé', date: d.modified })) };
}
export function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<DemoState>;
  return v.version === 1 && Array.isArray(v.documents) && Array.isArray(v.events) && v.documents.every(d => d && typeof d.id === 'string' && typeof d.reference === 'string' && documentTypes.includes(d.type) && statuses.includes(d.status) && clients.some(c => c.id === d.clientId) && !Number.isNaN(Date.parse(d.date)) && !Number.isNaN(Date.parse(d.modified)) && Array.isArray(d.lines) && d.lines.every(l => typeof l.designation === 'string' && typeof l.reference === 'string' && Number.isFinite(l.quantity) && Number.isFinite(l.price) && Number.isFinite(l.vat))) && v.events.every(e => e && typeof e.id === 'string' && typeof e.action === 'string' && !Number.isNaN(Date.parse(e.date)));
}