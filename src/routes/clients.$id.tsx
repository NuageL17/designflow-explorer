import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, FileText, Receipt, Truck, MapPin, Phone, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clients, totals, money, shortDate } from '@/lib/demo-data';
import { useDemo } from '@/components/demo-provider';
import { DocumentTable } from '@/components/document-table';
import { pageHead } from '@/lib/page-head';

export const Route = createFileRoute('/clients/$id')({ head: () => pageHead('Fiche client', 'Achats, factures, devis et bons de livraison d’un client FLOW MASTER.'), component: ClientDetail });

function ClientDetail() {
  const { id } = Route.useParams();
  const { state, create } = useDemo();
  const client = clients.find(c => c.id === id);
  if (!client) return <div className="empty-state"><h3>Client introuvable</h3><Button asChild size="sm"><Link to="/clients">Retour aux clients</Link></Button></div>;
  const docs = state.documents.filter(d => d.clientId === id).sort((a, b) => b.date.localeCompare(a.date));
  const invoices = docs.filter(d => d.type === 'Facture' && d.status !== 'Brouillon');
  const spent = invoices.reduce((a, d) => a + totals(d.lines).total, 0);
  const paid = invoices.filter(d => d.status === 'Finalisé' || d.status === 'Archivé').reduce((a, d) => a + totals(d.lines).total, 0);
  const quotes = docs.filter(d => d.type === 'Devis');
  const quoted = quotes.reduce((a, d) => a + totals(d.lines).total, 0);
  const items = new Map<string, { designation: string; qty: number; amount: number }>();
  invoices.forEach(d => d.lines.forEach(l => { const k = l.reference || l.designation; const cur = items.get(k) ?? { designation: l.designation, qty: 0, amount: 0 }; cur.qty += l.quantity; cur.amount += l.quantity * l.price; items.set(k, cur); }));
  const top = [...items.values()].sort((a, b) => b.amount - a.amount);
  const stats = [
    ['Total dépensé (TTC)', money(spent), `${invoices.length} facture${invoices.length > 1 ? 's' : ''}`],
    ['Factures finalisées', money(paid), `Reste en cours : ${money(spent - paid)}`],
    ['Devis émis', money(quoted), `${quotes.length} devis`],
    ['Dernier document', docs[0] ? shortDate(docs[0].date) : '—', docs[0]?.reference ?? 'Aucun'],
  ];
  return <>
    <Link to="/clients" className="text-xs text-muted-foreground flex items-center gap-1 mb-4 hover:text-foreground"><ArrowLeft size={14} />Tous les clients</Link>
    <div className="page-heading"><div className="flex items-center gap-4"><span className="avatar rounded-md w-12 h-12 text-sm">{client.initials}</span><div><h1>{client.name}</h1><p>{client.sector} · {client.city}, Algérie</p></div></div>
      <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => create('Bon de livraison', id)}><Truck />Bon de livraison</Button><Button size="sm" variant="outline" onClick={() => create('Facture', id)}><Receipt />Facture</Button><Button size="sm" onClick={() => create('Devis', id)}><FileText />Nouveau devis</Button></div></div>
    <div className="stats-grid mb-6">{stats.map(([l, v, s]) => <div className="surface p-4" key={l}><p className="text-[11px] text-muted-foreground">{l}</p><p className="text-lg font-semibold mt-1">{v}</p><p className="text-[10px] text-muted-foreground mt-1">{s}</p></div>)}</div>
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <section className="surface p-4 min-w-0"><div className="section-heading"><h2>Tous les documents ({docs.length})</h2></div><DocumentTable documents={docs} /></section>
      <aside className="grid gap-6 content-start">
        <section className="surface p-4 text-xs space-y-3"><h2 className="text-sm font-semibold">Coordonnées</h2>
          <p className="flex gap-2"><MapPin size={14} className="text-muted-foreground shrink-0" />{client.address}</p>
          <p className="flex gap-2"><User size={14} className="text-muted-foreground shrink-0" />{client.contact}</p>
          <p className="flex gap-2"><Phone size={14} className="text-muted-foreground shrink-0" />{client.phone || 'Non renseigné'}</p>
          <p className="flex gap-2"><Mail size={14} className="text-muted-foreground shrink-0" />{client.email || 'Non renseigné'}</p></section>
        <section className="surface p-4 text-xs"><h2 className="text-sm font-semibold mb-3">Matériel acheté</h2>
          {top.length ? <ul className="space-y-2">{top.map(t => <li key={t.designation} className="flex justify-between gap-2 border-b pb-2 last:border-0"><span>{t.designation}<span className="block text-[10px] text-muted-foreground">Qté {t.qty}</span></span><strong className="whitespace-nowrap">{money(t.amount)}</strong></li>)}</ul> : <p className="text-muted-foreground">Aucune facture pour l’instant.</p>}</section>
      </aside>
    </div>
  </>;
}
