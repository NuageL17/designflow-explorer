import { useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Search, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/components/demo-provider';
import { DocumentTable } from '@/components/document-table';
import { statuses, documentTypes, clientName, totals } from '@/lib/demo-data';
import { pageHead } from '@/lib/page-head';
export const Route = createFileRoute('/documents/')({ validateSearch: (s: Record<string, unknown>): { q?: string } => ({ q: typeof s['q'] === 'string' ? s['q'] : undefined }), head: () => pageHead('Documents', 'Consultez, filtrez et modifiez vos documents commerciaux fictifs dans FLOW MASTER.'), component: Documents });
function Documents() {
  const { state, create } = useDemo();
  const { q } = Route.useSearch();
  const [search, setSearch] = useState(q ?? '');
  const [tab, setTab] = useState('Tous');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('modified');
  const [ascending, setAscending] = useState(false);
  const [page, setPage] = useState(1);
  useEffect(() => { setSearch(q ?? ''); setPage(1); }, [q]);
  const filtered = useMemo(() => state.documents.filter(d => (!type || d.type === type) && (!status || d.status === status) && (tab === 'Tous' || tab === 'Brouillons' && d.status === 'Brouillon' || tab === 'En cours' && ['En cours', 'À valider'].includes(d.status) || tab === 'Finalisés' && d.status === 'Finalisé') && `${d.reference} ${clientName(d.clientId)} ${d.type}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => { const v = sort === 'amount' ? totals(a.lines).total - totals(b.lines).total : sort === 'client' ? clientName(a.clientId).localeCompare(clientName(b.clientId)) : sort === 'date' ? a.date.localeCompare(b.date) : sort === 'reference' ? a.reference.localeCompare(b.reference) : a.modified.localeCompare(b.modified); return ascending ? v : -v; }), [state.documents, type, status, tab, search, sort, ascending]);
  const maxPage = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, maxPage);
  function count(t: string) { return state.documents.filter(d => t === 'Tous' || t === 'Brouillons' && d.status === 'Brouillon' || t === 'En cours' && ['En cours', 'À valider'].includes(d.status) || t === 'Finalisés' && d.status === 'Finalisé').length; }
  return <><div className="page-heading"><div><h1>Documents</h1><p>Tous vos documents commerciaux, organisés et à jour.</p></div><Button size="sm" onClick={() => create()}><Plus />Créer un document</Button></div><section className="surface"><div className="tabs" role="tablist" aria-label="État des documents">{['Tous', 'Brouillons', 'En cours', 'Finalisés'].map(t => <Button role="tab" aria-selected={tab === t} key={t} variant="ghost" className={`tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setStatus(''); setPage(1); }}>{t}<span className="tab-count">{count(t)}</span></Button>)}</div><div className="filters"><div className="search-field"><Search /><input aria-label="Rechercher les documents" placeholder="Référence, client ou type…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div><select aria-label="Filtrer par type" className="field filter-select" value={type} onChange={e => { setType(e.target.value); setPage(1); }}><option value="">Tous les types</option>{documentTypes.map(t => <option key={t}>{t}</option>)}</select><select aria-label="Filtrer par état" className="field filter-select" value={status} onChange={e => { setStatus(e.target.value); setTab('Tous'); setPage(1); }}><option value="">Tous les états</option>{statuses.map(s => <option key={s}>{s}</option>)}</select>{(search || type || status || tab !== 'Tous') && <Button variant="ghost" size="sm" title="Effacer les filtres" aria-label="Effacer les filtres" onClick={() => { setSearch(''); setType(''); setStatus(''); setTab('Tous'); setPage(1); }}><X /></Button>}</div><DocumentTable documents={filtered.slice((currentPage - 1) * 8, currentPage * 8)} detailed sort={sort} onSort={s => { setAscending(sort === s ? !ascending : true); setSort(s); }} /><div className="table-footer"><span>{filtered.length} document{filtered.length !== 1 ? 's' : ''} · {state.documents.length} au total</span><div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="h-6 w-6" title="Page précédente" aria-label="Page précédente" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft /></Button><span>Page {currentPage} sur {maxPage}</span><Button variant="ghost" size="icon" className="h-6 w-6" title="Page suivante" aria-label="Page suivante" disabled={currentPage >= maxPage} onClick={() => setPage(currentPage + 1)}><ChevronRight /></Button></div></div></section></>;
}
