import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, MapPin, ArrowRight, Building2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { totals, money } from "@/lib/demo-data";
import { useDemo } from "@/components/demo-provider";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/clients/")({
  head: () => pageHead("Clients", "Portefeuille clients FLOW MASTER."),
  component: ClientsPage,
});

const empty = { name: "", city: "", sector: "", address: "", contact: "", phone: "", email: "" };

function ClientsPage() {
  const { state, addClient } = useDemo();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const allClients = state.clients ?? [];
  const list = allClients.filter((c) =>
    `${c.name} ${c.city} ${c.sector}`.toLowerCase().includes(search.toLowerCase()),
  );
  const spent = (id: string) =>
    state.documents
      .filter((d) => d.clientId === id && d.type === "Facture" && d.status !== "Brouillon")
      .reduce((a, d) => a + totals(d.lines).total, 0);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim()) {
      setError("Le nom et la ville sont obligatoires.");
      return;
    }
    const id = await addClient({
      ...form,
      name: form.name.trim(),
      city: form.city.trim(),
      sector: form.sector.trim() || "Non renseigné",
      address: form.address.trim() || form.city.trim(),
      contact: form.contact.trim() || "Non renseigné",
    });
    setOpen(false);
    setForm(empty);
    setError("");
    navigate({ to: "/clients/$id", params: { id } });
  }
  const field = (key: keyof typeof empty, label: string, placeholder = "") => (
    <label className="form-label">
      {label}
      <input
        className="field"
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </label>
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Clients</h1>
          <p>Votre portefeuille clients. Cliquez sur un client pour voir ses achats et factures.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <UserPlus />
          Ajouter un client
        </Button>
      </div>
      <div className="search-field max-w-sm mb-6">
        <Search />
        <input
          aria-label="Rechercher un client"
          placeholder="Nom, ville ou secteur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="client-grid">
        {list.map((c) => (
          <Link
            to="/clients/$id"
            params={{ id: c.id }}
            className="client-card block transition hover:border-primary/40"
            key={c.id}
          >
            <div className="flex justify-between items-center">
              <span className="avatar rounded-md w-11 h-11">{c.initials}</span>
              <span className="text-[10px] text-muted-foreground">
                {state.documents.filter((d) => d.clientId === c.id).length} documents
              </span>
            </div>
            <h3>{c.name}</h3>
            <p>{c.sector}</p>
            <p className="flex items-center gap-1 mt-2">
              <MapPin size={12} />
              {c.city}, Algérie
            </p>
            <div className="border-t mt-5 pt-3 flex items-center justify-between">
              <span className="text-[11px]">
                <span className="text-muted-foreground">Dépensé </span>
                <strong>{money(spent(c.id))}</strong>
              </span>
              <span className="text-primary text-[10px] flex items-center gap-1">
                Voir la fiche
                <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        ))}
      </div>
      {!list.length && (
        <div className="empty-state">
          <Building2 size={32} />
          <h3>Aucun client trouvé</h3>
          <p>Essayez un autre nom ou ajoutez un nouveau client.</p>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Nouveau client</DialogTitle>
          <DialogDescription>
            Renseignez les informations du client. Il sera ajouté à votre portefeuille.
          </DialogDescription>
          <form onSubmit={submit} className="grid gap-3">
            {field("name", "Nom de l'entreprise *", "Ex. Hydro Sud")}
            <div className="grid grid-cols-2 gap-3">
              {field("city", "Ville *", "Ex. Ouargla")}
              {field("sector", "Secteur", "Ex. Irrigation")}
            </div>
            {field("address", "Adresse")}
            <div className="grid grid-cols-2 gap-3">
              {field("contact", "Contact")}
              {field("phone", "Téléphone")}
            </div>
            {field("email", "E-mail")}
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer le client</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
