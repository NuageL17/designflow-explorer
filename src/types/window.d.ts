export {};

declare global {
  interface ExternalChangePayload {
    fileId: string;
    documentId: string;
    path: string;
    oldHash: string;
    newHash: string;
  }

  interface ExternalMissingPayload {
    fileId: string;
    documentId: string;
    path: string;
  }

  interface FieldDiff {
    field: string;
    label: string;
    oldValue: string;
    newValue: string;
  }

  interface LineDiff {
    index: number;
    lineLabel: string;
    changes: FieldDiff[];
  }

  interface PreviewResult {
    success: boolean;
    error?: string;
    diffs: LineDiff[];
    totalChanges: number;
    linesAdded: number;
    linesRemoved: number;
  }

  interface Window {
    api?: {
      ping: () => Promise<string>;
      clients: {
        list: () => Promise<unknown[]>;
        create: (payload: unknown) => Promise<unknown>;
      };
      documents: {
        list: () => Promise<unknown[]>;
        get: (id: string) => Promise<unknown>;
        save: (payload: unknown) => Promise<unknown>;
        generatePdf: (payload: { html: string; fileName: string; documentId?: string }) => Promise<{
          success: boolean; path?: string; error?: string; canceled?: boolean;
        }>;
        generateExcel: (payload: { doc: unknown; client: unknown; documentId?: string }) => Promise<{
          success: boolean; path?: string; error?: string; canceled?: boolean;
        }>;
      };
      externalFiles: {
        onChange: (cb: (payload: ExternalChangePayload) => void) => void;
        onMissing: (cb: (payload: ExternalMissingPayload) => void) => void;
        removeAllListeners: () => void;
        resolve: (payload: { fileId: string; decision: 'imported' | 'ignored' | 'kept_internal' }) => Promise<{ success: boolean; error?: string }>;
        openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
        previewImport: (payload: { fileId: string; documentId: string }) => Promise<PreviewResult>;
        importExcel: (payload: { fileId: string; documentId: string }) => Promise<{ success: boolean; linesImported?: number; error?: string }>;
      };
    };
  }
}