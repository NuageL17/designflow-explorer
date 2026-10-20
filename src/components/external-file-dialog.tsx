import { useEffect, useState } from 'react';
import { AlertTriangle, FileSpreadsheet, FolderOpen, Download, X, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useDemo } from '@/components/demo-provider';
import { api } from '@/lib/api';

type PendingChange = {
  fileId: string;
  documentId: string;
  path: string;
};

export function ExternalFileDialog() {
  const { state, refreshFromDb } = useDemo();
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  // Écouter les modifications externes
  useEffect(() => {
    api.externalFiles.onChange((payload) => {
      setPending({
        fileId: payload.fileId,
        documentId: payload.documentId,
        path: payload.path,
      });
      setPreview(null);
    });
    api.externalFiles.onMissing(() => {
      toast.warning('Un fichier exporté a été déplacé ou supprimé.');
    });
    return () => {
      api.externalFiles.removeAllListeners();
    };
  }, []);

  // Charger le diff dès qu'une modification est détectée
  useEffect(() => {
    if (!pending) return;
    let cancelled = false;
    setLoadingPreview(true);
    (async () => {
      const result = await api.externalFiles.previewImport({
        fileId: pending.fileId,
        documentId: pending.documentId,
      });
      if (!cancelled) {
        setPreview(result);
        setLoadingPreview(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pending]);

  if (!pending) return null;

  const doc = state.documents.find(d => d.id === pending.documentId);
  const fileName = pending.path.split(/[/\\]/).pop() ?? pending.path;

  async function handleOpen() {
    const r = await api.externalFiles.openFile(pending!.path);
    if (!r.success) toast.error(`Impossible d'ouvrir le fichier : ${r.error ?? 'erreur inconnue'}`);
  }

  async function handleKeep() {
    setBusy(true);
    try {
      await api.externalFiles.resolve({ fileId: pending!.fileId, decision: 'kept_internal' });
      toast.info('Version de l\'application conservée.');
      setPending(null);
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    setBusy(true);
    try {
      const r = await api.externalFiles.importExcel({
        fileId: pending!.fileId,
        documentId: pending!.documentId,
      });
      if (!r.success) {
        toast.error(`Import impossible : ${r.error ?? 'erreur inconnue'}`);
        return;
      }
      toast.success(`Import réussi : ${r.linesImported ?? 0} ligne(s) mise(s) à jour.`);
      if (refreshFromDb) await refreshFromDb();
      setPending(null);
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleIgnore() {
    setBusy(true);
    try {
      await api.externalFiles.resolve({ fileId: pending!.fileId, decision: 'ignored' });
      setPending(null);
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  const hasChanges = preview?.success && preview.totalChanges > 0;
  const noChanges = preview?.success && preview.totalChanges === 0;

  return (
    <Dialog open onOpenChange={open => { if (!open && !busy) handleIgnore(); }}>
      <DialogContent className="max-w-2xl">
        <div className="flex items-start gap-3 mb-2">
          <span className="icon-tile warning h-11 w-11 shrink-0">
            <AlertTriangle size={22} />
          </span>
          <div className="min-w-0">
            <DialogTitle>Modification externe détectée</DialogTitle>
            <DialogDescription className="mt-1">
              Un fichier exporté a été modifié en dehors de l'application.
            </DialogDescription>
          </div>
        </div>

        <div className="border-y py-3 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <FileSpreadsheet size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="font-medium break-all">{fileName}</div>
              <div className="text-[10px] text-muted-foreground break-all mt-1">{pending.path}</div>
            </div>
          </div>
          {doc && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Document concerné</span>
              <span className="font-medium">{doc.reference} · {doc.type}</span>
            </div>
          )}
        </div>

        {/* Zone diff */}
        <div className="min-h-[80px]">
          {loadingPreview && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-6 justify-center">
              <Loader2 className="animate-spin" size={16} />
              Analyse des changements…
            </div>
          )}

          {!loadingPreview && preview && !preview.success && (
            <div className="text-xs text-destructive py-4 px-3 border rounded bg-destructive/5">
              Impossible d'analyser le fichier : {preview.error}
            </div>
          )}

          {!loadingPreview && noChanges && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 justify-center">
              <CheckCircle2 className="text-success" size={16} />
              Aucun changement métier détecté (seule la mise en forme a peut-être changé).
            </div>
          )}

          {!loadingPreview && hasChanges && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {preview!.totalChanges} changement{preview!.totalChanges > 1 ? 's' : ''} détecté{preview!.totalChanges > 1 ? 's' : ''}
                </span>
                <span className="text-muted-foreground">
                  {preview!.linesAdded > 0 && `+${preview!.linesAdded} ligne(s)`}
                  {preview!.linesAdded > 0 && preview!.linesRemoved > 0 && ' · '}
                  {preview!.linesRemoved > 0 && `-${preview!.linesRemoved} ligne(s)`}
                </span>
              </div>

              <div className="max-h-[320px] overflow-y-auto border rounded divide-y">
                {preview!.diffs.map((line) => (
                  <div key={line.index} className="p-3">
                    <div className="text-[11px] font-medium text-muted-foreground mb-2">
                      Ligne {line.index} · <span className="text-foreground">{line.lineLabel}</span>
                    </div>
                    <div className="space-y-1.5">
                      {line.changes.map((change, ci) => (
                        <div key={ci} className="grid grid-cols-[110px_1fr_auto_1fr] items-center gap-2 text-[11px]">
                          <span className="text-muted-foreground">{change.label}</span>
                          <span className="text-destructive/90 line-through truncate">{change.oldValue}</span>
                          <ArrowRight size={12} className="text-muted-foreground shrink-0" />
                          <span className="text-success font-medium truncate">{change.newValue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          La version de l'application ne sera <strong>jamais modifiée automatiquement</strong>.
        </p>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={handleOpen} disabled={busy}>
            <FolderOpen />Ouvrir le fichier
          </Button>
          <Button variant="outline" size="sm" onClick={handleIgnore} disabled={busy}>
            <X />Ignorer
          </Button>
          <Button variant="outline" size="sm" onClick={handleKeep} disabled={busy}>
            Conserver ma version
          </Button>
          <Button size="sm" onClick={handleImport} disabled={busy || !hasChanges}>
            <Download />Importer les changements
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}