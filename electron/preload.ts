import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  ping: () => ipcRenderer.invoke("ping"),

  clients: {
    list: () => ipcRenderer.invoke("clients:list"),
    create: (payload: unknown) => ipcRenderer.invoke("clients:create", payload),
  },

  documents: {
    list: () => ipcRenderer.invoke("documents:list"),
    get: (id: string) => ipcRenderer.invoke("documents:get", id),
    save: (payload: unknown) => ipcRenderer.invoke("documents:save", payload),
    generatePdf: (payload: { html: string; fileName: string; documentId?: string }) =>
      ipcRenderer.invoke("documents:generatePdf", payload),
    generateExcel: (payload: { doc: unknown; client: unknown; documentId?: string }) =>
      ipcRenderer.invoke("documents:generateExcel", payload),
  },

  externalFiles: {
    onChange: (
      cb: (payload: {
        fileId: string;
        documentId: string;
        path: string;
        oldHash: string;
        newHash: string;
      }) => void,
    ) => {
      ipcRenderer.on("external-file:changed", (_event, payload) => cb(payload));
    },
    onMissing: (cb: (payload: { fileId: string; documentId: string; path: string }) => void) => {
      ipcRenderer.on("external-file:missing", (_event, payload) => cb(payload));
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners("external-file:changed");
      ipcRenderer.removeAllListeners("external-file:missing");
    },
    resolve: (payload: { fileId: string; decision: "imported" | "ignored" | "kept_internal" }) =>
      ipcRenderer.invoke("externalFiles:resolve", payload),
    openFile: (filePath: string) => ipcRenderer.invoke("externalFiles:openFile", filePath),
    previewImport: (payload: { fileId: string; documentId: string }) =>
      ipcRenderer.invoke("externalFiles:previewImport", payload),
    importExcel: (payload: { fileId: string; documentId: string }) =>
      ipcRenderer.invoke("externalFiles:importExcel", payload),
  },
});
