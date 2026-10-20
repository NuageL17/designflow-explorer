import { useState } from 'react';
import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { LayoutDashboard, Files, UsersRound, Package, History, Search, Plus, Settings2, PanelLeftClose, PanelLeftOpen, SlidersHorizontal, ChevronDown, Waves, FileText, Receipt, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useDemo } from '@/components/demo-provider';
import { DemoDialogs } from '@/components/document-editor';
import { ExternalFileDialog } from '@/components/external-file-dialog';
import type { ReactNode } from 'react';

const nav = [
  { to: '/' as const, label: 'Vue d\u2019ensemble', icon: LayoutDashboard },
  { to: '/documents' as const, label: 'Documents', icon: Files },
  { to: '/clients' as const, label: 'Clients', icon: UsersRound },
  { to: '/catalogue' as const, label: 'Matériel et stock', icon: Package },
  { to: '/historique' as const, label: 'Historique', icon: History },
];

export function Workspace({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const { state, create, setSettings } = useDemo();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const active = nav.find(n => n.to === pathname || n.to !== '/' && pathname.startsWith(n.to));
  return <div className="workspace">
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <Link to="/" className="brand" aria-label="FLOW MASTER, accueil"><span className="brand-icon"><Waves size={23} strokeWidth={2.5} /></span><div className="brand-copy"><div className="brand-name">FLOW MASTER<span className="text-primary">.</span></div><div className="brand-subtitle">Gestion commerciale</div></div></Link>
      <div className="nav-label">ESPACE DE TRAVAIL</div>
      <nav aria-label="Navigation principale">{nav.map(n => <Link key={n.to} to={n.to} title={n.label} className={`nav-link ${active?.to === n.to ? 'active' : ''}`}><n.icon /><span className="nav-text">{n.label}</span>{n.to === '/documents' && <span className="nav-count">{state.documents.length}</span>}</Link>)}</nav>
      <div className="sidebar-bottom"><Button variant="ghost" className="w-full justify-start px-2 text-muted-foreground text-[11px]" title="Paramètres" onClick={() => setSettings(true)}><Settings2 /><span className="nav-text">Paramètres</span></Button><div className="sidebar-version mt-4 pt-4 border-t text-[9px] text-muted-foreground flex justify-between"><span>FLOW MASTER</span><span>v1.0</span></div></div>
    </aside>
    <div className={`main-area ${collapsed ? 'collapsed' : ''}`}>
      <header className="topbar"><Button variant="ghost" size="icon" className="collapse-trigger text-muted-foreground -ml-2" aria-label={collapsed ? 'Développer la navigation' : 'Réduire la navigation'} title={collapsed ? 'Développer la navigation' : 'Réduire la navigation'} onClick={() => setCollapsed(p => !p)}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button><div className="topbar-title">{active?.label ?? 'Document'}</div>
        <form className="search-field global-search" onSubmit={e => { e.preventDefault(); navigate({ to: '/documents', search: { q: search } }); }}><Search /><input aria-label="Recherche globale" placeholder="Rechercher un document…" value={search} onChange={e => setSearch(e.target.value)} /><span className="text-[9px] text-muted-foreground border rounded px-1">↵</span></form>
        <DropdownMenu><DropdownMenuTrigger asChild><Button className="topbar-create text-[11px]"><Plus />Nouveau document<ChevronDown className="!size-3" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{[{ type: 'Devis' as const, icon: FileText }, { type: 'Facture' as const, icon: Receipt }, { type: 'Bon de livraison' as const, icon: Truck }].map(item => <DropdownMenuItem key={item.type} onSelect={() => create(item.type)}><item.icon />{item.type}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
        <Button variant="ghost" size="icon" className="desktop-settings text-muted-foreground" title="Paramètres" aria-label="Paramètres" onClick={() => setSettings(true)}><SlidersHorizontal /></Button>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="profile h-auto px-0"><span className="avatar">AD</span><span className="profile-copy text-left"><strong className="text-[10px] block font-medium">Administrateur</strong><span className="text-[9px] text-muted-foreground block mt-1">Bureau d\u2019études</span></span><ChevronDown className="!size-3 text-muted-foreground" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setSettings(true)}><Settings2 />Profil</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setSettings(true)}>Paramètres</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      </header>
      <main className="page-content">{children}<footer className="app-footer"><span>© 2026 FLOW MASTER · Gestion commerciale</span><span>Version 1.0</span></footer></main>
    </div>
    <DemoDialogs />
    <ExternalFileDialog />
  </div>;
}