import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { initialState, isDemoState, syncReferences, initialsFor, clients as clientList, catalog as productList, type Client, type Product, makeLine, referenceFor, type CommercialDocument, type DemoState, type DocumentType, type Status } from '@/lib/demo-data';

type DemoContextValue = {
  state: DemoState;
  editor: CommercialDocument | null;
  setEditor: (doc: CommercialDocument | null) => void;
  create: (type?: DocumentType, clientId?: string) => void;
  save: (doc: CommercialDocument, status: Status) => void;
  changeStatus: (id: string, status: Status) => void;
  duplicate: (doc: CommercialDocument) => void;
  finalize: CommercialDocument | null;
  setFinalize: (doc: CommercialDocument | null) => void;
  archiveId: string | null;
  setArchiveId: (id: string | null) => void;
  settings: boolean;
  setSettings: (open: boolean) => void;
  reset: () => void;
  addClient: (client: Omit<Client, 'id' | 'initials'>) => string;
  saveProduct: (product: Product, isNew: boolean) => void;
  adjustStock: (reference: string, delta: number) => void;
};
const DemoContext = createContext<DemoContextValue | null>(null);
const storageKey = 'flow-master-demo-v1';
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [editor, setEditor] = useState<CommercialDocument | null>(null);
  const [finalize, setFinalize] = useState<CommercialDocument | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  syncReferences(state);
  useEffect(() => {
    try { const saved = localStorage.getItem(storageKey); if (saved) { const parsed: unknown = JSON.parse(saved); if (parsed && typeof parsed === 'object') syncReferences(parsed as Partial<DemoState>); if (isDemoState(parsed)) setState(parsed); else { syncReferences(initialState()); toast.info('Les données de démonstration ont été restaurées.'); } } } catch { toast.info('Stockage indisponible : les changements restent disponibles pendant cette session.'); }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* Session state remains usable without browser storage. */ } } }, [state, loaded]);
  function save(doc: CommercialDocument, status: Status) {
    const now = new Date().toISOString();
    const next = { ...doc, status, modified: now };
    setState(prev => { const existing = prev.documents.find(d => d.id === doc.id); return { ...prev, documents: existing ? prev.documents.map(d => d.id === doc.id ? next : d) : [next, ...prev.documents], events: [{ id: crypto.randomUUID(), documentId: doc.id, reference: doc.reference, action: existing ? existing.status !== status ? `État changé : ${status}` : 'Document modifié' : `Document créé · ${status}`, date: now }, ...prev.events] }; });
    setEditor(null); toast.success(status === 'Finalisé' ? 'Document finalisé · Export simulé, aucun fichier généré.' : `Document enregistré · ${status}`);
  }
  function create(type: DocumentType = 'Devis', clientId = '') { setEditor({ id: crypto.randomUUID(), reference: referenceFor(type, state.documents), type, clientId, date: '2026-10-12', validity: 30, status: 'Brouillon', lines: [makeLine()], notes: '', modified: new Date().toISOString() }); }
  function changeStatus(id: string, status: Status) { const doc = state.documents.find(d => d.id === id); if (!doc) return; if (status === 'Finalisé') setFinalize(doc); else if (status === 'Archivé') setArchiveId(id); else save(doc, status); }
  function duplicate(doc: CommercialDocument) { setEditor({ ...doc, id: crypto.randomUUID(), reference: referenceFor(doc.type, state.documents), status: 'Brouillon', date: '2026-10-12', lines: doc.lines.map(l => ({ ...l, id: crypto.randomUUID() })) }); toast.info('Copie préparée. Enregistrez-la pour créer le document.'); }
  function reset() { setState(initialState()); setEditor(null); setFinalize(null); setArchiveId(null); toast.success('La démonstration a été réinitialisée.'); }
  function addClient(data: Omit<Client, 'id' | 'initials'>) {
    const id = `c-${crypto.randomUUID().slice(0, 8)}`;
    const client: Client = { ...data, id, initials: initialsFor(data.name) };
    setState(prev => ({ ...prev, clients: [...(prev.clients ?? clientList), client] }));
    toast.success(`Client ajouté · ${client.name}`); return id;
  }
  function saveProduct(product: Product, isNew: boolean) {
    setState(prev => { const list = prev.products ?? productList; return { ...prev, products: isNew ? [...list, product] : list.map(p => p.reference === product.reference ? product : p) }; });
    toast.success(isNew ? `Matériel ajouté · ${product.designation}` : `Matériel mis à jour · ${product.designation}`);
  }
  function adjustStock(reference: string, delta: number) {
    setState(prev => ({ ...prev, products: (prev.products ?? productList).map(p => p.reference === reference ? { ...p, stock: Math.max(0, p.stock + delta) } : p) }));
  }
  return <DemoContext.Provider value={{ addClient, saveProduct, adjustStock, state, editor, setEditor, create, save, changeStatus, duplicate, finalize, setFinalize, archiveId, setArchiveId, settings, setSettings, reset }}>{children}</DemoContext.Provider>;
}
export function useDemo() { const context = useContext(DemoContext); if (!context) throw new Error('DemoProvider is required'); return context; }
