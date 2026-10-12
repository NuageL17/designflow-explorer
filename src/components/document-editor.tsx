import { useState } from 'react';
import { Plus, Trash2, Save, Check, ArrowRight, FileText, Info, FileSpreadsheet, Files, CheckCircle2, RotateCcw, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useDemo } from '@/components/demo-provider';
import { catalog, clients, documentTypes, referenceFor, makeLine, totals, money, type CommercialDocument, type DocumentType, type Line, type Status } from '@/lib/demo-data';

export function DocumentEditor({ document }: { document: CommercialDocument }) {
  const { state, save, setEditor, setFinalize } = useDemo();
  const [doc, setDoc] = useState<CommercialDocument>(() => ({ ...document, lines: document.lines.map(l => ({ ...l })) }));
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const amounts = totals(doc.lines);
  const update = <K extends keyof CommercialDocument>(key: K, value: CommercialDocument[K]) => setDoc(p => ({ ...p, [key]: value }));
  function updateLine(id: string, patch: Partial<Line>) { setDoc(p => ({ ...p, lines: p.lines.map(l => l.id === id ? { ...l, ...patch } : l) })); }
  function commit(status: Status) {
    if (!doc.clientId || !doc.reference.trim() || !doc.date || (doc.type === 'Devis' && (!Number.isFinite(doc.validity) || doc.validity < 1))) { toast.error('Renseignez le client, la référence, la date et une validité correcte.'); return; }
    if (state.documents.some(d => d.id !== doc.id && d.reference.toLowerCase() === doc.reference.trim().toLowerCase())) { toast.error('Cette référence existe déjà. Choisissez une référence unique.'); return; }
    if (!doc.lines.length || doc.lines.some(l => !l.designation.trim() || !l.reference.trim() || !Number.isFinite(l.quantity) || l.quantity <= 0 || !Number.isFinite(l.price) || l.price < 0 || !Number.isFinite(l.vat) || l.vat < 0 || l.vat > 100)) { toast.error('Chaque ligne doit avoir une désignation, une référence, une quantité positive et des montants valides.'); return; }
    const cleaned = { ...doc, reference: doc.reference.trim() };
    if (status === 'Finalisé') setFinalize(cleaned); else save(cleaned, status);
  }
  return <>
    <Dialog open onOpenChange={open => { if (!open) setCancelConfirm(true); }}>
      <DialogContent className="editor-content">
        <div className="editor-top"><div className="flex items-center gap-3 mb-2"><span className="icon-tile"><FileText size={20} /></span><div><DialogTitle>{state.documents.some(d => d.id === doc.id) ? 'Modifier le document' : 'Nouveau document'}</DialogTitle><DialogDescription className="mt-2">{doc.reference} · Données de démonstration</DialogDescription></div></div></div>
        <div className="editor-body">
          <section className="editor-section"><h3>Informations du document</h3><div className="form-grid">
            <label className="form-label">Type de document<select aria-label="Type de document" className="field" value={doc.type} onChange={e => { const type = e.target.value as DocumentType; setDoc(p => ({ ...p, type, reference: referenceFor(type, state.documents) })); }}>{documentTypes.map(t => <option key={t}>{t}</option>)}</select></label>
            <label className="form-label">Référence *<input className="field" value={doc.reference} onChange={e => update('reference', e.target.value)} required /></label>
            <label className="form-label">Date *<input type="date" className="field" value={doc.date} onChange={e => update('date', e.target.value)} required /></label>
            <label className="form-label">Client *<select aria-label="Client *" className="field" value={doc.clientId} onChange={e => update('clientId', e.target.value)} required><option value="">Sélectionner un client</option>{clients.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
            {doc.type === 'Devis' && <label className="form-label">Validité (jours)<input type="number" min="1" max="365" className="field" value={doc.validity} onChange={e => update('validity', e.target.valueAsNumber)} /></label>}
            <div className="flex items-end pb-2 text-[11px] text-muted-foreground"><Info size={14} className="mr-2 shrink-0" />Tous les clients sont fictifs.</div>
          </div></section>
          <section className="editor-section"><div className="section-heading"><h3 className="!mb-0">Articles et prestations</h3><select aria-label="Ajouter depuis le catalogue" className="field filter-select" value="" onChange={e => { if (e.target.value) update('lines', [...doc.lines, makeLine(Number(e.target.value))]); }}><option value="">Ajouter du catalogue</option>{catalog.map((p, i) => <option key={p.reference} value={i}>{p.designation}</option>)}</select></div>
            <div className="surface table-scroll"><table className="document-table line-table"><thead><tr><th>Désignation *</th><th>Référence *</th><th>Qté</th><th>Prix unitaire HT</th><th>TVA %</th><th className="text-right">Total HT</th><th /></tr></thead><tbody>{doc.lines.map((line, i) => <tr key={line.id}>
              <td className="w-[29%]"><input aria-label={`Désignation ligne ${i + 1}`} className="field" value={line.designation} onChange={e => updateLine(line.id, { designation: e.target.value })} /></td>
              <td className="w-[17%]"><input aria-label={`Référence ligne ${i + 1}`} className="field" value={line.reference} onChange={e => updateLine(line.id, { reference: e.target.value })} /></td>
              <td className="w-[8%]"><input type="number" min="0.01" step="any" aria-label={`Quantité ligne ${i + 1}`} className="field" value={Number.isFinite(line.quantity) ? line.quantity : ''} onChange={e => updateLine(line.id, { quantity: e.target.valueAsNumber })} /></td>
              <td className="w-[16%]"><input type="number" min="0" step="any" aria-label={`Prix ligne ${i + 1}`} className="field" value={Number.isFinite(line.price) ? line.price : ''} onChange={e => updateLine(line.id, { price: e.target.valueAsNumber })} /></td>
              <td className="w-[9%]"><select aria-label={`TVA ligne ${i + 1}`} className="field" value={line.vat} onChange={e => updateLine(line.id, { vat: Number(e.target.value) })}>{[0, 9, 19].map(v => <option key={v} value={v}>{v} %</option>)}</select></td>
              <td className="text-right font-medium">{money(Number.isFinite(line.quantity * line.price) ? line.quantity * line.price : 0)}</td>
              <td><Button variant="ghost" size="icon" title="Supprimer la ligne" aria-label={`Supprimer ligne ${i + 1}`} onClick={() => update('lines', doc.lines.filter(l => l.id !== line.id))}><Trash2 className="text-muted-foreground" /></Button></td>
            </tr>)}</tbody></table></div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => update('lines', [...doc.lines, { ...makeLine(), designation: '', reference: '', price: 0 }])}><Plus />Ajouter une ligne</Button>
            <div className="total-summary"><div><span className="text-muted-foreground">Sous-total HT</span><span>{money(Number.isFinite(amounts.subtotal) ? amounts.subtotal : 0)}</span></div><div><span className="text-muted-foreground">TVA</span><span>{money(Number.isFinite(amounts.vat) ? amounts.vat : 0)}</span></div><div className="grand-total"><span>Total TTC</span><span className="text-primary">{money(Number.isFinite(amounts.total) ? amounts.total : 0)}</span></div></div>
          </section>
          <label className="form-label">Notes et conditions<textarea className="field h-20 py-3 resize-y" placeholder="Conditions de fourniture, remarques…" value={doc.notes} onChange={e => update('notes', e.target.value)} /></label>
        </div>
        <div className="editor-bottom"><Button variant="ghost" onClick={() => setCancelConfirm(true)}>Annuler</Button><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => commit('Brouillon')}><Save />Enregistrer comme brouillon</Button><Button variant="outline" size="sm" onClick={() => commit('En cours')}><ArrowRight />Marquer comme en cours</Button><Button size="sm" onClick={() => commit('Finalisé')}><Check />Finaliser</Button></div></div>
      </DialogContent>
    </Dialog>
    <Dialog open={cancelConfirm} onOpenChange={setCancelConfirm}><DialogContent><DialogTitle>Annuler les modifications ?</DialogTitle><DialogDescription>Les modifications non enregistrées de ce document seront perdues.</DialogDescription><div className="flex justify-end gap-2 mt-2"><Button variant="outline" onClick={() => setCancelConfirm(false)}>Continuer l’édition</Button><Button variant="destructive" onClick={() => { setCancelConfirm(false); setEditor(null); }}>Abandonner</Button></div></DialogContent></Dialog>
  </>;
}

export function DemoDialogs() {
  const { editor, finalize, setFinalize, save, archiveId, setArchiveId, state, settings, setSettings, reset } = useDemo();
  const [format, setFormat] = useState('both');
  const [version, setVersion] = useState('new');
  const [resetConfirm, setResetConfirm] = useState(false);
  return <>
    {editor && <DocumentEditor key={editor.id} document={editor} />}
    <Dialog open={Boolean(finalize)} onOpenChange={open => { if (!open) setFinalize(null); }}><DialogContent>
      <span className="icon-tile green h-12 w-12"><CheckCircle2 size={26} /></span><DialogTitle className="text-xl">Document prêt</DialogTitle><DialogDescription>{finalize?.reference} est prêt à être finalisé. Choisissez les options d’export simulé.</DialogDescription>
      <div className="mt-2"><p className="text-xs font-medium mb-3">Format de sortie</p><div className="choice-grid">{[{ value: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet }, { value: 'pdf', label: 'PDF', icon: FileText }, { value: 'both', label: 'Les deux', icon: Files }].map(f => <label className="choice" key={f.value}><input type="radio" name="export-format" value={f.value} checked={format === f.value} onChange={() => setFormat(f.value)} /><f.icon size={25} strokeWidth={1.5} />{f.label}</label>)}</div></div>
      <div className="grid gap-3 py-2 text-xs"><p className="font-medium">Gestion des fichiers simulés</p><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="version" checked={version === 'replace'} onChange={() => setVersion('replace')} />Remplacer les fichiers</label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="version" checked={version === 'new'} onChange={() => setVersion('new')} />Créer une nouvelle version</label></div>
      <div className="simulation-notice"><Info /><div><strong>Simulation uniquement</strong><br />Aucun fichier Excel ou PDF ne sera généré. Seul l’état du document passera à « Finalisé ».</div></div>
      <div className="flex justify-end gap-2 mt-2"><Button variant="outline" onClick={() => setFinalize(null)}>Annuler</Button><Button onClick={() => { if (finalize) save(finalize, 'Finalisé'); setFinalize(null); }}><Check />Confirmer la finalisation</Button></div>
    </DialogContent></Dialog>
    <Dialog open={Boolean(archiveId)} onOpenChange={open => { if (!open) setArchiveId(null); }}><DialogContent><span className="icon-tile"><Files /></span><DialogTitle>Archiver le document ?</DialogTitle><DialogDescription>{state.documents.find(d => d.id === archiveId)?.reference} restera consultable avec le filtre « Archivé ». Cette action ne supprime aucune donnée.</DialogDescription><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setArchiveId(null)}>Annuler</Button><Button onClick={() => { const doc = state.documents.find(d => d.id === archiveId); if (doc) save(doc, 'Archivé'); setArchiveId(null); }}>Confirmer l’archivage</Button></div></DialogContent></Dialog>
    <Dialog open={settings} onOpenChange={setSettings}><DialogContent><span className="icon-tile"><Settings2 /></span><DialogTitle>Paramètres de démonstration</DialogTitle><DialogDescription>FLOW MASTER · Prototype de présentation</DialogDescription><div className="border-y py-4 text-xs space-y-3"><div className="flex justify-between"><span className="text-muted-foreground">Profil</span><span>Administrateur (fictif)</span></div><div className="flex justify-between"><span className="text-muted-foreground">Devise</span><span>Dinar algérien · DA</span></div><div className="flex justify-between"><span className="text-muted-foreground">Stockage</span><span>Local à ce navigateur</span></div></div><div className="simulation-notice"><Info /><span>Données fictives uniquement. Aucune connexion externe, authentification ou export réel.</span></div><Button variant="outline" onClick={() => setResetConfirm(true)}><RotateCcw />Réinitialiser la démo</Button></DialogContent></Dialog>
    <Dialog open={resetConfirm} onOpenChange={setResetConfirm}><DialogContent><DialogTitle>Réinitialiser la démonstration ?</DialogTitle><DialogDescription>Tous les documents et événements ajoutés ou modifiés seront remplacés par les données fictives initiales.</DialogDescription><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setResetConfirm(false)}>Annuler</Button><Button variant="destructive" onClick={() => { reset(); setResetConfirm(false); setSettings(false); }}>Réinitialiser la démo</Button></div></DialogContent></Dialog>
  </>;
}
