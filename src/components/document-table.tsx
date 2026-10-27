import { Link } from "@tanstack/react-router";
import {
  FileText,
  Receipt,
  Truck,
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  Pencil,
  Copy,
  Archive,
  CircleCheck,
  ArrowRight,
  Clock,
  FileX2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useDemo } from "@/components/demo-provider";
import {
  statuses,
  clientName,
  money,
  shortDate,
  totals,
  type CommercialDocument,
  type Status,
} from "@/lib/demo-data";
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`badge ${status === "Finalisé" ? "badge-final" : status === "En cours" ? "badge-progress" : status === "À valider" ? "badge-validation" : ""}`}
    >
      {status}
    </span>
  );
}
export function TypeIcon({ type }: { type: string }) {
  return type === "Facture" ? <Receipt /> : type === "Bon de livraison" ? <Truck /> : <FileText />;
}
export function DocumentActions({ doc }: { doc: CommercialDocument }) {
  const { setEditor, duplicate, changeStatus, setArchiveId } = useDemo();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          aria-label={`Actions ${doc.reference}`}
          title="Actions du document"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link to="/documents/$id" params={{ id: doc.id }}>
            <Eye />
            Ouvrir le document
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setEditor(doc)}>
          <Pencil />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => duplicate(doc)}>
          <Copy />
          Dupliquer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {statuses
          .filter((s) => s !== doc.status && s !== "Archivé")
          .map((s) => (
            <DropdownMenuItem key={s} onSelect={() => changeStatus(doc.id, s)}>
              {s === "Finalisé" ? <CircleCheck /> : s === "En cours" ? <ArrowRight /> : <Clock />}
              {s}
            </DropdownMenuItem>
          ))}
        {doc.status !== "Archivé" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setArchiveId(doc.id)}>
              <Archive />
              Archiver
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function DocumentTable({
  documents,
  detailed = false,
  sort,
  onSort,
}: {
  documents: CommercialDocument[];
  detailed?: boolean;
  sort?: string;
  onSort?: (column: string) => void;
}) {
  const { create } = useDemo();
  if (!documents.length)
    return (
      <div className="empty-state">
        <FileX2 size={34} strokeWidth={1.4} />
        <h3>Aucun document trouvé</h3>
        <p>Modifiez les filtres ou créez un nouveau document.</p>
        <Button size="sm" onClick={() => create()}>
          Créer un devis
        </Button>
      </div>
    );
  const heading = (label: string, key: string) =>
    onSort ? (
      <Button
        variant="ghost"
        className="h-auto p-0 text-[10px] text-muted-foreground font-normal"
        onClick={() => onSort(key)}
      >
        {label}
        <ArrowUpDown className={`!size-3 ${sort === key ? "text-primary" : ""}`} />
      </Button>
    ) : (
      label
    );
  return (
    <div className="table-scroll">
      <table className="document-table">
        <thead>
          <tr>
            <th>{heading("Référence", "reference")}</th>
            <th>Type</th>
            <th>{heading("Client", "client")}</th>
            <th>{heading("Date", "date")}</th>
            <th>{heading("Montant TTC", "amount")}</th>
            <th>État</th>
            {detailed && <th>{heading("Dernière modification", "modified")}</th>}
            <th />
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td>
                <div className="document-ref">
                  <TypeIcon type={doc.type} />
                  <Link to="/documents/$id" params={{ id: doc.id }}>
                    {doc.reference}
                  </Link>
                </div>
              </td>
              <td className="text-muted-foreground">{doc.type}</td>
              <td>{clientName(doc.clientId)}</td>
              <td className="text-muted-foreground">{shortDate(doc.date)}</td>
              <td className="font-medium tabular-nums">{money(totals(doc.lines).total)}</td>
              <td>
                <StatusBadge status={doc.status} />
              </td>
              {detailed && <td className="text-muted-foreground">{shortDate(doc.modified)}</td>}
              <td>
                <DocumentActions doc={doc} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
