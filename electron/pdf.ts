import { BrowserWindow, dialog } from "electron";
import fs from "node:fs/promises";

export async function generatePdf(
  html: string,
  defaultFileName: string,
): Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }> {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { offscreen: true },
  });

  try {
    const dataUrl = "data:text/html;charset=utf-8," + encodeURIComponent(html);
    await win.loadURL(dataUrl);

    // Laisse le temps au rendu (polices, mise en page) de se stabiliser
    await new Promise((r) => setTimeout(r, 400));

    const pdfBuffer = await win.webContents.printToPDF({
      pageSize: "A4",
      printBackground: true,
      margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
    });

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Enregistrer le PDF",
      defaultPath: defaultFileName,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    await fs.writeFile(filePath, pdfBuffer);
    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    win.destroy();
  }
}
