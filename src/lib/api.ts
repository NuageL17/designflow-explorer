function getApi() {
  if (typeof window !== 'undefined' && window.api) return window.api;
  return null;
}

export const api = {
  ping: async () => {
    const a = getApi();
    if (!a) return 'pong (browser)';
    return a.ping();
  },

  clients: {
    list: async (): Promise<unknown[]> => {
      const a = getApi();
      if (!a) return [];
      return a.clients.list();
    },
    create: async (payload: unknown): Promise<unknown> => {
      const a = getApi();
      if (!a) throw new Error('API clients non disponible.');
      return a.clients.create(payload);
    },
  },

  documents: {
    list: async (): Promise<unknown[]> => {
      const a = getApi();
      if (!a) return [];
      return a.documents.list();
    },
    get: async (id: string): Promise<unknown> => {
      const a = getApi();
      if (!a) return null;
      return a.documents.get(id);
    },
    save: async (payload: unknown): Promise<unknown> => {
      const a = getApi();
      if (!a) throw new Error('API documents non disponible.');
      return a.documents.save(payload);
    },
    generatePdf: async (payload: { html: string; fileName: string; documentId?: string }) => {
      const a = getApi();
      if (!a) throw new Error('API PDF non disponible.');
      return a.documents.generatePdf(payload);
    },
    generateExcel: async (payload: { doc: unknown; client: unknown; documentId?: string }) => {
      const a = getApi();
      if (!a) throw new Error('API Excel non disponible.');
      return a.documents.generateExcel(payload);
    },
  },

  externalFiles: {
    onChange: (cb: (payload: ExternalChangePayload) => void) => {
      const a = getApi();
      if (!a) return;
      a.externalFiles.onChange(cb);
    },
    onMissing: (cb: (payload: ExternalMissingPayload) => void) => {
      const a = getApi();
      if (!a) return;
      a.externalFiles.onMissing(cb);
    },
    removeAllListeners: () => {
      const a = getApi();
      if (!a) return;
      a.externalFiles.removeAllListeners();
    },
    resolve: async (payload: { fileId: string; decision: 'imported' | 'ignored' | 'kept_internal' }) => {
      const a = getApi();
      if (!a) return { success: false };
      return a.externalFiles.resolve(payload);
    },
    openFile: async (filePath: string) => {
      const a = getApi();
      if (!a) return { success: false };
      return a.externalFiles.openFile(filePath);
    },
    previewImport: async (payload: { fileId: string; documentId: string }): Promise<PreviewResult> => {
      const a = getApi();
      if (!a) return { success: false, error: 'API non disponible.', diffs: [], totalChanges: 0, linesAdded: 0, linesRemoved: 0 };
      return a.externalFiles.previewImport(payload);
    },
    importExcel: async (payload: { fileId: string; documentId: string }) => {
      const a = getApi();
      if (!a) return { success: false, error: 'API non disponible.' };
      return a.externalFiles.importExcel(payload);
    },
  },
};