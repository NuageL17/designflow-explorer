import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Search, History } from 'lucide-react';
import { useDemo } from '@/components/demo-provider';
import { ActivityList } from '@/components/activity';
import { pageHead } from '@/lib/page-head';
export const Route = createFileRoute('/historique')({ head: () => pageHead('Historique', 'Journal des créations, modifications et changements d’état de la démonstration FLOW MASTER.'), component: HistoryPage });
function HistoryPage() {
  const { state } = useDemo();
  const [search, setSearch] = useState(''); const [action, setAction] = useState('');
  const events = state.events.filter(e => `${e.reference} ${e.action}`.toLowerCase().includes(search.toLowerCase()) && (!action || e.action.toLowerCase().includes(action)));
  return <><div className="page-heading"><div><h1>Historique</h1><p>Chaque étape de votre activité commerciale, en toute transparence.</p></div><span className="date-label"><History size={15} />{state.events.length} événements</span></div><section className="surface"><div className="filters"><div className="search-field"><Search /><input aria-label="Rechercher dans l’historique" placeholder="Rechercher une référence ou un événement…" value={search} onChange={e => setSearch(e.target.value)} /></div><select className="field filter-select" aria-label="Filtrer les événements" value={action} onChange={e => setAction(e.target.value)}><option value="">Tous les événements</option><option value="créé">Créations</option><option value="modifié">Modifications</option><option value="état">Changements d’état</option><option value="finalis">Finalisations</option><option value="archiv">Archivages</option></select></div><div className="px-5 border-t"><ActivityList events={events} detailed /></div><div className="table-footer"><span>{events.length} événements · Données fictives et actions de cette session</span></div></section></>;
}