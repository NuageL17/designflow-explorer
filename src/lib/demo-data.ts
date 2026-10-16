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

// Plus de fausses données ! On part de tableaux vides.
export const clients: Client[] = [];
export const catalog: Product[] = [];

/** Garde les tableaux de recherche synchronisés avec l'état de la session. */
export function syncReferences(state: Partial<DemoState>) {
  const c = Array.isArray(state.clients) && state.clients.length ? state.clients : [];
  if (c !== clients) clients.splice(0, clients.length, ...c);
  const p = Array.isArray(state.products) && state.products.length ? state.products : [];
  if (p !== catalog) catalog.splice(0, catalog.length, ...p);
}

export function initialsFor(name: string) { 
  return name.split(/\s+/).filter(w => w).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'CL'; 
}

export function money(value: number) { 
  return new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 2 }).format(value).replace(/[\u00a0\u202f]/g, ' ') + ' DA'; 
}

export function shortDate(value: string) { 
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)); 
}

export function totals(lines: Line[]) { 
  const subtotal = lines.reduce((a, l) => a + l.quantity * l.price, 0); 
  const vat = lines.reduce((a, l) => a + l.quantity * l.price * l.vat / 100, 0); 
  return { subtotal, vat, total: subtotal + vat }; 
}

export function clientName(id: string) { 
  return clients.find(c => c.id === id)?.name ?? 'Client inconnu'; 
}

export function makeLine(index = 0): Line { 
  const p = catalog[index] ?? catalog[0]; 
  if (!p) throw new Error('Catalogue vide'); 
  return { id: crypto.randomUUID(), designation: p.designation, reference: p.reference, quantity: 1, price: p.price, vat: 19 }; 
}

export function referenceFor(type: DocumentType, documents: CommercialDocument[]) { 
  const prefix = type === 'Devis' ? 'DEV' : type === 'Facture' ? 'FAC' : 'BL'; 
  const max = documents.filter(d => d.reference.startsWith(prefix + '-2026-')).reduce((n, d) => Math.max(n, Number(d.reference.split('-').at(-1)) || 0), 0); 
  return `${prefix}-2026-${String(max + 1).padStart(3, '0')}`; 
}

// L'état initial est maintenant complètement vide.
export function initialState(): DemoState {
  return { 
    version: 1, 
    clients: [], 
    products: [], 
    documents: [], 
    events: [] 
  };
}

export function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<DemoState>;
  return v.version === 1 && Array.isArray(v.documents) && Array.isArray(v.events);
}