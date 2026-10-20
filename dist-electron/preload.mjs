let electron = require("electron");
//#region electron/preload.ts
electron.contextBridge.exposeInMainWorld("api", {
	ping: () => electron.ipcRenderer.invoke("ping"),
	clients: {
		list: () => electron.ipcRenderer.invoke("clients:list"),
		create: (payload) => electron.ipcRenderer.invoke("clients:create", payload)
	},
	documents: {
		list: () => electron.ipcRenderer.invoke("documents:list"),
		get: (id) => electron.ipcRenderer.invoke("documents:get", id),
		save: (payload) => electron.ipcRenderer.invoke("documents:save", payload),
		generatePdf: (payload) => electron.ipcRenderer.invoke("documents:generatePdf", payload),
		generateExcel: (payload) => electron.ipcRenderer.invoke("documents:generateExcel", payload)
	},
	externalFiles: {
		onChange: (cb) => {
			electron.ipcRenderer.on("external-file:changed", (_event, payload) => cb(payload));
		},
		onMissing: (cb) => {
			electron.ipcRenderer.on("external-file:missing", (_event, payload) => cb(payload));
		},
		removeAllListeners: () => {
			electron.ipcRenderer.removeAllListeners("external-file:changed");
			electron.ipcRenderer.removeAllListeners("external-file:missing");
		},
		resolve: (payload) => electron.ipcRenderer.invoke("externalFiles:resolve", payload),
		openFile: (filePath) => electron.ipcRenderer.invoke("externalFiles:openFile", filePath),
		previewImport: (payload) => electron.ipcRenderer.invoke("externalFiles:previewImport", payload),
		importExcel: (payload) => electron.ipcRenderer.invoke("externalFiles:importExcel", payload)
	}
});
//#endregion
