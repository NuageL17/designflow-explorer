import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Search, Zap, Cable, Wrench, Settings2, ArrowRight, Plus, Minus, PackagePlus, Pencil, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { catalog, money, makeLine, referenceFor, type Product } from '@/lib/demo-data';
import { useDemo } from '@/components/demo-provider';
import { pageHead } from '@/lib/page-head';
import equipment from '@/assets/pumping-equipment.jpg';

export const Route = createFileRoute('/catalogue')({ head: () => pageHead('Matériel et stock', 'Catalogue de pompes, coffrets, tuyauterie et prestations avec suivi du stock FLOW MASTER.'), component: CatalogPage });

const categories = ['Pompes', 'Électricité', 'Tuyauterie', 'Accessoires', 'Services'];
const blank: Product = { reference: '', designation: '', price: 0, category: 'Pompes', unit: 'Unité', description: '', stock: 0, minStock: 0 };

function CatalogPage() {
  const { setEditor, state, saveProduct, adjustStock } = useDemo();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [form, setForm] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [error, setError] = useState('');
  function createWithProduct(index: number) { setEditor({ id: crypto.randomUUID(), reference: referenceFor('Devis', state.documents), type: 'Devis', clientId: '', date: '2026-10-12', validity: 30, status: 'Brouillon', lines: [makeLine(index)], notes: '', modified: new Date().toISOString() }); }
  const low = (p: Product) => p.category !== 'Services' && p.stock <= p.minStock;
  const filtered = catalog.map((p, index) => ({ ...p, index })).filter(p => (!category || category === p.category) && (!lowOnly || low(p)) && `${p.reference} ${p.designation}`.toLowerCase().includes(search.toLowerCase()));
  const stockValue = catalog.filter(p => p.category !== 'Services').reduce((a, p) => a + p.stock * p.price, 0);
  function submit(e: React.FormEvent) {
    e.preventDefault(); if (!form) return;
    if (!form.designation.trim() || !form.reference.trim()) { setError('La désignation et la référence sont obligatoires.'); return; }
    if (isNew && catalog.some(p => p.reference.toLowerCase() === form.reference.trim().toLowerCase())) { setError('Cette référence existe déjà.'); return; }
    if (form.price < 0 || form.stock < 0) { setError('Le prix et le stock doivent être positifs.'); return; }
    saveProduct({ ...form, reference: form.reference.trim().toUpperCase(), designation: form.designation.trim() }, isNew); setForm(null); setError('');
  }
  const set = <K extends keyof Product>(k: K, v: Product[K]) => form && setForm({ ...form, [k]: v });
  return <>
    <div className="page-heading"><div><h1>Matériel et stock</h1><p>Vos équipements et prestations, avec les quantités disponibles.</p></div><Button size="sm" onClick={() => { setForm(blank); setIsNew(true); setError(''); }}><PackagePlus />Ajouter du matériel</Button></div>
    <div className="stats-grid mb-6">
      <div className="surface p-4"><p className="text-[11px] text-muted-foreground">Articles</p><p className="text-lg font-semibold mt-1">{catalog.length}</p></div>
      <div className="surface p-4"><p className="text-[11px] text-muted-foreground">Unités en stock</p><p className="text-lg font-semibold mt-1">{catalog.filter(p => p.category !== 'Services').reduce((a, p) => a + p.stock, 0).toLocaleString('fr-FR')}</p></div>
      <div className="surface p-4"><p className="text-[11px] text-muted-foreground">Valeur du stock (HT)</p><p className="text-lg font-semibold mt-1">{money(stockValue)}</p></div>
      <button className="surface p-4 text-left" onClick={() => setLowOnly(!lowOnly)}><p className="text-[11px] text-muted-foreground">Stock faible {lowOnly && '· filtré'}</p><p className="text-lg font-semibold mt-1 text-warning">{catalog.filter(low).length}</p></button>
    </div>
    <div className="flex flex-wrap gap-3 mb-6"><div className="search-field flex-1 max-w-sm min-w-48"><Search /><input aria-label="Rechercher du matériel" placeholder="Désignation ou référence…" value={search} onChange={e => setSearch(e.target.value)} /></div><select className="field filter-select" aria-label="Filtrer par catégorie" value={category} onChange={e => setCategory(e.target.value)}><option value="">Toutes les catégories</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
    <div className="catalog-grid">{filtered.map(p => <article className="catalog-card" key={p.reference}>
      <div className="catalog-visual">{p.category === 'Pompes' ? <img src={equipment} alt={p.designation} loading="lazy" width={1024} height={768} /> : p.category === 'Électricité' ? <Zap /> : p.category === 'Tuyauterie' ? <Cable /> : p.category === 'Services' ? <Wrench /> : <Settings2 />}</div>
      <div className="catalog-copy">
        <div className="flex justify-between items-center"><span className="eyebrow">{p.category}</span><span className="text-[9px] text-muted-foreground">{p.reference}</span></div>
        <h3>{p.designation}</h3><p>{p.description}</p>
        <div className="catalog-price">{money(p.price)} <span className="text-[10px] text-muted-foreground font-normal">HT / {p.unit.toLowerCase()}</span></div>
        {p.category !== 'Services' ? <div className="flex items-center justify-between mt-3 border rounded-md px-2 py-1.5">
          <span className="text-[11px] flex items-center gap-1">{low(p) && <AlertTriangle size={12} className="text-warning" />}Stock : <strong>{p.stock}</strong> <span className="text-muted-foreground">{p.unit.toLowerCase()}{p.stock > 1 ? 's' : ''}</span></span>
          <span className="flex gap-1"><Button variant="ghost" size="icon" className="h-6 w-6" aria-label={`Retirer du stock ${p.designation}`} onClick={() => adjustStock(p.reference, -1)}><Minus /></Button><Button variant="ghost" size="icon" className="h-6 w-6" aria-label={`Ajouter au stock ${p.designation}`} onClick={() => adjustStock(p.reference, 1)}><Plus /></Button></span>
        </div> : <p className="mt-3 text-[11px]">Prestation · pas de stock</p>}
        <div className="flex justify-between mt-4"><Button variant="ghost" size="sm" className="text-muted-foreground text-[10px] px-0" onClick={() => { setForm(catalog[p.index] ?? blank); setIsNew(false); setError(''); }}><Pencil className="!size-3" />Modifier</Button><Button variant="outline" size="sm" className="text-[10px]" onClick={() => createWithProduct(p.index)}>Créer un devis<ArrowRight className="!size-3" /></Button></div>
      </div>
    </article>)}</div>
    {!filtered.length && <div className="empty-state"><Search size={30} /><h3>Aucun article trouvé</h3><p>Modifiez votre recherche ou ajoutez du matériel.</p></div>}
    <Dialog open={Boolean(form)} onOpenChange={o => { if (!o) setForm(null); }}><DialogContent>
      <DialogTitle>{isNew ? 'Ajouter du matériel' : 'Modifier le matériel'}</DialogTitle><DialogDescription>Les quantités sont enregistrées dans la démonstration.</DialogDescription>
      {form && <form onSubmit={submit} className="grid gap-3">
        <label className="form-label">Désignation *<input className="field" value={form.designation} placeholder="Ex. Pompe immergée 11 kW" onChange={e => set('designation', e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3"><label className="form-label">Référence *<input className="field" disabled={!isNew} value={form.reference} placeholder="PMP-SUB-110" onChange={e => set('reference', e.target.value)} /></label><label className="form-label">Catégorie<select className="field" value={form.category} onChange={e => set('category', e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label></div>
        <div className="grid grid-cols-2 gap-3"><label className="form-label">Prix unitaire HT (DA)<input type="number" min={0} className="field" value={form.price} onChange={e => set('price', Number(e.target.value))} /></label><label className="form-label">Unité<select className="field" value={form.unit} onChange={e => set('unit', e.target.value)}>{['Unité', 'Mètre', 'Forfait', 'Lot'].map(u => <option key={u}>{u}</option>)}</select></label></div>
        <div className="grid grid-cols-2 gap-3"><label className="form-label">Quantité en stock<input type="number" min={0} className="field" value={form.stock} onChange={e => set('stock', Number(e.target.value))} /></label><label className="form-label">Seuil d’alerte<input type="number" min={0} className="field" value={form.minStock} onChange={e => set('minStock', Number(e.target.value))} /></label></div>
        <label className="form-label">Description<input className="field" value={form.description} placeholder="Débit, HMT, caractéristiques…" onChange={e => set('description', e.target.value)} /></label>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setForm(null)}>Annuler</Button><Button type="submit">Enregistrer</Button></div>
      </form>}
    </DialogContent></Dialog>
  </>;
}
