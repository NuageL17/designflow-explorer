import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight, ArrowRight, CalendarDays, FileText, Receipt, Truck, Clock3, CircleCheck, Wallet, ListTodo, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/components/demo-provider';
import { DocumentTable } from '@/components/document-table';
import { ActivityList } from '@/components/activity';
import { totals, money } from '@/lib/demo-data';
import { pageHead } from '@/lib/page-head';
import equipment from '@/assets/pumping-equipment.jpg';
export const Route = createFileRoute('/')({ head: () => pageHead('Vue d’ensemble', 'FLOW MASTER, prototype de gestion commerciale pour les bureaux d’études de pompage. Documents et données entièrement fictifs.'), component: Overview });
function Overview() {
  const { state, create } = useDemo();
  const active = state.documents.filter(d => d.status !== 'Archivé');
  const month = active.filter(d => d.date.startsWith('2026-10'));
  const quotes = month.filter(d => d.type === 'Devis' && ['En cours', 'À valider', 'Brouillon'].includes(d.status)).length;
  const finalized = month.filter(d => d.status === 'Finalisé').length;
  const amount = month.filter(d => d.type === 'Facture').reduce((a, d) => a + totals(d.lines).total, 0);
  const pending = month.filter(d => ['À valider', 'Brouillon'].includes(d.status)).length;
  const recent = [...active].sort((a, b) => b.modified.localeCompare(a.modified)).slice(0, 5);
  return <>
    <div className="page-heading"><div><h1>Votre activité, en un coup d’œil<span className="text-primary">.</span></h1><p>Bonjour, Voici l’essentiel de votre activité commerciale.</p></div><span className="date-label"><CalendarDays size={14} />Lundi 12 octobre 2026</span></div>
    <div className="section-heading"><h2>Que souhaitez-vous créer ?</h2><span className="text-[10px] text-muted-foreground">Un nouveau document en quelques étapes</span></div>
    <div className="quick-actions">{[{ type: 'Devis' as const, icon: FileText, subtitle: 'Préparer une offre commerciale', color: '' }, { type: 'Facture' as const, icon: Receipt, subtitle: 'Facturer vos équipements et services', color: 'cyan' }, { type: 'Bon de livraison' as const, icon: Truck, subtitle: 'Accompagner une livraison', color: 'green' }].map(a => <Button key={a.type} variant="outline" className="quick-action" onClick={() => create(a.type)}><span className={`icon-tile ${a.color}`}><a.icon className="!size-20 !w-5 !h-5" /></span><span><strong>Créer {a.type === 'Facture' ? 'une facture' : a.type === 'Devis' ? 'un devis' : 'un bon de livraison'}</strong><small>{a.subtitle}</small></span><ArrowUpRight className="action-arrow" /></Button>)}</div>
    <div className="section-heading"><h2>Ce mois-ci <span className="text-muted-foreground text-[11px] font-normal ml-2">Octobre 2026</span></h2></div>
    <div className="stats-grid"><div className="stat"><div className="stat-top">Devis en cours<Clock3 /></div><div className="stat-value">{String(quotes).padStart(2, '0')}</div><div className="stat-note"><span className="text-primary">{month.filter(d => d.type === 'Devis').length} devis</span> au total ce mois-ci</div></div><div className="stat"><div className="stat-top">Documents finalisés<CircleCheck /></div><div className="stat-value">{String(finalized).padStart(2, '0')}</div><div className="stat-note"><CircleCheck className="text-success" /><span className="text-success">Prêts à être transmis</span></div></div><div className="stat"><div className="stat-top">Montant facturé<Wallet /></div><div className="stat-value money-stat">{money(amount)}</div><div className="stat-note">Total TTC des factures du mois</div></div><div className="stat"><div className="stat-top">Documents à traiter<ListTodo /></div><div className="stat-value">{String(pending).padStart(2, '0')}</div><div className="stat-note"><span className="text-warning">{month.filter(d => d.status === 'À valider').length} à valider</span> · {month.filter(d => d.status === 'Brouillon').length} brouillon(s)</div></div></div>
    <section className="surface"><div className="table-header"><div><h2>Documents récents</h2><p>Vos derniers devis, factures et bons de livraison.</p></div><Button variant="ghost" size="sm" className="text-primary text-[10px]" asChild><Link to="/documents">Tous les documents<ArrowRight className="!size-3" /></Link></Button></div><DocumentTable documents={recent} /><div className="table-footer"><span>{recent.length} documents récents sur {state.documents.length}</span><span>Mise à jour pendant votre session</span></div></section>
    <div className="dashboard-bottom"><section><div className="section-heading"><h2>Activité récente</h2><Button variant="ghost" size="sm" className="text-muted-foreground text-[10px]" asChild><Link to="/historique">Voir l’historique<ChevronRight className="!size-3" /></Link></Button></div><ActivityList events={state.events.slice(0, 3)} /></section><section className="catalog-feature"><img src={equipment} alt="Pompe submersible et pompe centrifuge de démonstration" width={1024} height={768} loading="lazy" /><div className="catalog-feature-copy"><span className="eyebrow">Votre catalogue technique</span><h3>L’équipement juste.<br />Le devis précis.</h3><p>Pompes, accessoires et prestations réunis au même endroit.</p><Button variant="link" className="p-0 mt-3 h-7 text-[11px]" asChild><Link to="/catalogue">Consulter le catalogue<ArrowRight className="!size-3" /></Link></Button></div></section></div>
  </>;
}
