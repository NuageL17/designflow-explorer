import fs from "node:fs";
import { BrowserWindow } from "electron";
import { computeFileHash, getWatchedFiles, markExternalChange, markFileMissing } from "./db/files";

const POLL_INTERVAL_MS = 5000;

class FileWatcher {
  private timer: NodeJS.Timeout | null = null;
  private knownHashes = new Map<string, string>();

  start(getWindows: () => BrowserWindow[]) {
    if (this.timer) return;
    this.snapshot();
    this.tick(getWindows);
    this.timer = setInterval(() => this.tick(getWindows), POLL_INTERVAL_MS);
    console.log(
      `👁️  Watcher démarré · ${this.knownHashes.size} fichier(s) sous surveillance · intervalle ${POLL_INTERVAL_MS} ms`,
    );
    if (this.knownHashes.size === 0) {
      console.log(
        "ℹ️  Aucun fichier à surveiller. Exportez un PDF ou un Excel depuis un document pour les activer.",
      );
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.knownHashes.clear();
  }

  refresh() {
    const files = getWatchedFiles();
    for (const f of files) {
      if (!this.knownHashes.has(f.id)) {
        this.knownHashes.set(f.id, f.hash);
        console.log(`👁️  Nouveau fichier sous surveillance : ${f.path}`);
      }
    }
  }

  syncFile(fileId: string, newHash: string) {
    this.knownHashes.set(fileId, newHash);
  }

  private snapshot() {
    const files = getWatchedFiles();
    for (const f of files) this.knownHashes.set(f.id, f.hash);
  }

  private tick(getWindows: () => BrowserWindow[]) {
    const files = getWatchedFiles();
    for (const f of files) {
      try {
        if (!fs.existsSync(f.path)) {
          if (f.status !== "missing") {
            markFileMissing(f.id);
            console.log(`⚠️  Fichier disparu : ${f.path}`);
            this.emit(
              getWindows,
              "external-file:missing",
              {
                fileId: f.id,
                documentId: f.document_id,
                path: f.path,
              },
              false,
            );
          }
          continue;
        }

        const currentHash = computeFileHash(f.path);
        const knownHash = this.knownHashes.get(f.id);

        if (!knownHash) {
          this.knownHashes.set(f.id, currentHash);
          continue;
        }

        if (currentHash !== knownHash) {
          console.log(`🔍 Modification externe détectée : ${f.path}`);
          markExternalChange(f.id, currentHash);
          this.knownHashes.set(f.id, currentHash);
          this.emit(
            getWindows,
            "external-file:changed",
            {
              fileId: f.id,
              documentId: f.document_id,
              path: f.path,
              oldHash: knownHash,
              newHash: currentHash,
            },
            true,
          );
        }
      } catch (err) {
        console.error("Watcher erreur :", err);
      }
    }
  }

  private emit(
    getWindows: () => BrowserWindow[],
    channel: string,
    payload: unknown,
    forceShow: boolean,
  ) {
    for (const win of getWindows()) {
      if (win.isDestroyed()) continue;
      if (forceShow) {
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
      }
      win.webContents.send(channel, payload);
    }
  }
}

export const fileWatcher = new FileWatcher();
