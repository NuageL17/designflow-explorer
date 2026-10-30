import { Tray, Menu, BrowserWindow, nativeImage, app } from "electron";
import path from "node:path";

let tray: Tray | null = null;

function buildIcon(): Electron.NativeImage {
  // Déterminer le chemin de l'icône selon si on est en dev ou en production
  const isDev = !app.isPackaged;
  const iconPath = isDev
    ? path.join(process.cwd(), "public", "icon.ico")
    : path.join(__dirname, "../dist/icon.ico");

  try {
    const img = nativeImage.createFromPath(iconPath);
    if (!img.isEmpty()) {
      // On redimensionne pour que ça rentre bien dans la barre des tâches
      return img.resize({ width: 32, height: 32 });
    }
  } catch (err) {
    console.error("Impossible de charger l'icône .ico pour le tray :", err);
  }

  // --- FALLBACK (Si le fichier icon.ico est introuvable) ---
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="6" fill="#0d6efd"/>
    <text x="16" y="23" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">F</text>
  </svg>`;
  const dataUrl = "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
  return nativeImage.createFromDataURL(dataUrl);
}

function buildMenu(opts: { onShowWindow: () => void; onQuit: () => void }): Menu {
  const autoLaunch = app.getLoginItemSettings().openAtLogin;
  return Menu.buildFromTemplate([
    { label: "Ouvrir Flow Master", click: () => opts.onShowWindow() },
    { type: "separator" },
    {
      label: "Démarrer avec Windows",
      type: "checkbox",
      checked: autoLaunch,
      click: (item) => {
        app.setLoginItemSettings({
          openAtLogin: item.checked,
          path: process.execPath,
          args: ["--hidden"],
        });
        if (tray) tray.setContextMenu(buildMenu(opts));
      },
    },
    { type: "separator" },
    { label: "Quitter Flow Master", click: () => opts.onQuit() },
  ]);
}

export function createTray(opts: { onShowWindow: () => void; onQuit: () => void }): Tray {
  if (tray) return tray;
  tray = new Tray(buildIcon());
  tray.setToolTip("Flow Master · Gestion commerciale");
  tray.setContextMenu(buildMenu(opts));
  tray.on("double-click", () => opts.onShowWindow());
  tray.on("click", () => opts.onShowWindow());
  return tray;
}

export function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

export function showMainWindow() {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length === 0) return;
  const win = windows[0];
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}