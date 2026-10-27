import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { dbClientToReact, dbDocumentToReact, reactDocumentToDb } from "@/lib/mappers";
import {
  initialState,
  syncReferences,
  initialsFor,
  clients as clientsRef,
  makeLine,
  referenceFor,
  type Client,
  type Product,
  type CommercialDocument,
  type DemoState,
  type DocumentType,
  type Status,
} from "@/lib/demo-data";

type DemoContextValue = {
  state: DemoState;
  loading: boolean;
  refreshFromDb: () => Promise<void>;
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
  addClient: (client: Omit<Client, "id" | "initials">) => Promise<string>;
  saveProduct: (product: Product, isNew: boolean) => void;
  adjustStock: (reference: string, delta: number) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(initialState);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<CommercialDocument | null>(null);
  const [finalize, setFinalize] = useState<CommercialDocument | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);

  async function loadFromDb() {
    try {
      const [clientsRaw, docsRaw] = await Promise.all([api.clients.list(), api.documents.list()]);
      const reactClients = (clientsRaw as never[]).map(dbClientToReact);
      const fullDocs = await Promise.all(
        (docsRaw as { id: string }[]).map((d) => api.documents.get(d.id)),
      );
      const reactDocs = fullDocs.filter(Boolean).map((d) => dbDocumentToReact(d as never));

      clientsRef.splice(0, clientsRef.length, ...reactClients);
      syncReferences({ clients: reactClients, documents: reactDocs, events: [] });

      const events = reactDocs.map((d) => ({
        id: `evt-${d.id}`,
        documentId: d.id,
        reference: d.reference,
        action: "Document enregistré",
        date: d.modified,
      }));

      setState({
        version: 1,
        clients: reactClients,
        products: [],
        documents: reactDocs,
        events,
      });
    } catch (err) {
      console.error("Erreur de chargement :", err);
      toast.error("Impossible de charger les données.");
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadFromDb();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function refreshFromDb() {
    await loadFromDb();
  }

  async function save(doc: CommercialDocument, status: Status) {
    const now = new Date().toISOString();
    const next = { ...doc, status, modified: now };
    const clientSnapshot = (state.clients ?? []).find((c) => c.id === doc.clientId) ?? null;
    const payload = reactDocumentToDb(next, clientSnapshot);

    try {
      await api.documents.save(payload);
    } catch (err) {
      console.error("Erreur enregistrement :", err);
      toast.error("Échec de l'enregistrement.");
      return;
    }

    setState((prev) => {
      const existing = prev.documents.find((d) => d.id === doc.id);
      return {
        ...prev,
        documents: existing
          ? prev.documents.map((d) => (d.id === doc.id ? next : d))
          : [next, ...prev.documents],
        events: [
          {
            id: crypto.randomUUID(),
            documentId: doc.id,
            reference: doc.reference,
            action: existing ? "Document modifié" : "Document créé",
            date: now,
          },
          ...prev.events,
        ],
      };
    });

    setEditor(null);
    toast.success(status === "Finalisé" ? "Document finalisé." : `Document enregistré · ${status}`);
  }

  function create(type: DocumentType = "Devis", clientId = "") {
    setEditor({
      id: crypto.randomUUID(),
      reference: referenceFor(type, state.documents),
      type,
      clientId,
      date: new Date().toISOString().slice(0, 10),
      validity: 30,
      status: "Brouillon",
      lines: [makeLine()],
      notes: "",
      modified: new Date().toISOString(),
    });
  }

  function changeStatus(id: string, status: Status) {
    const doc = state.documents.find((d) => d.id === id);
    if (!doc) return;
    if (status === "Finalisé") setFinalize(doc);
    else if (status === "Archivé") setArchiveId(id);
    else save(doc, status);
  }

  function duplicate(doc: CommercialDocument) {
    setEditor({
      ...doc,
      id: crypto.randomUUID(),
      reference: referenceFor(doc.type, state.documents),
      status: "Brouillon",
      date: new Date().toISOString().slice(0, 10),
      lines: doc.lines.map((l) => ({ ...l, id: crypto.randomUUID() })),
    });
    toast.info("Copie préparée.");
  }

  function reset() {
    setState(initialState());
    clientsRef.splice(0, clientsRef.length);
    setEditor(null);
    setFinalize(null);
    setArchiveId(null);
    window.location.reload();
  }

  async function addClient(data: Omit<Client, "id" | "initials">): Promise<string> {
    const payload = {
      name: data.name,
      initials: initialsFor(data.name),
      city: data.city,
      sector: data.sector,
      address: data.address,
      contact: data.contact,
      phone: data.phone,
      email: data.email,
    };
    const raw = await api.clients.create(payload);
    const client = dbClientToReact(raw as never);
    clientsRef.push(client);
    setState((prev) => ({ ...prev, clients: [...(prev.clients ?? []), client] }));
    toast.success(`Client ajouté · ${client.name}`);
    return client.id;
  }

  function saveProduct(_product: Product, _isNew: boolean) {
    toast.info("Catalogue non connecté en V1.");
  }

  function adjustStock(_reference: string, _delta: number) {
    /* non connecté */
  }

  return (
    <DemoContext.Provider
      value={{
        state,
        loading,
        refreshFromDb,
        editor,
        setEditor,
        create,
        save,
        changeStatus,
        duplicate,
        finalize,
        setFinalize,
        archiveId,
        setArchiveId,
        settings,
        setSettings,
        reset,
        addClient,
        saveProduct,
        adjustStock,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("DemoProvider is required");
  return ctx;
}
