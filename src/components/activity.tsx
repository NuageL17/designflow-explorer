import { Link } from "@tanstack/react-router";
import { Check, Pencil, Plus, Archive, ArrowRight } from "lucide-react";
import { shortDate, type DemoEvent } from "@/lib/demo-data";
export function ActivityList({
  events,
  detailed = false,
}: {
  events: DemoEvent[];
  detailed?: boolean;
}) {
  if (!events.length)
    return (
      <p className="text-xs text-muted-foreground py-8">Aucune activité pour cette sélection.</p>
    );
  return (
    <div className="activity-list">
      {events.map((event) => (
        <div className="activity-item" key={event.id}>
          <span
            className={`activity-icon ${event.action.toLowerCase().includes("finalis") ? "text-success" : ""}`}
          >
            {event.action.toLowerCase().includes("finalis") ? (
              <Check />
            ) : event.action.toLowerCase().includes("archiv") ? (
              <Archive />
            ) : event.action.includes("modifié") ? (
              <Pencil />
            ) : event.action.includes("État") ? (
              <ArrowRight />
            ) : (
              <Plus />
            )}
          </span>
          <div className="activity-text">
            <Link
              to="/documents/$id"
              params={{ id: event.documentId }}
              className="font-medium hover:text-primary"
            >
              {event.reference}
            </Link>
            <span className="text-muted-foreground"> · {event.action}</span>
            <p>Administrateur{detailed ? " · Session de démonstration" : ""}</p>
          </div>
          <time className="activity-time">
            {shortDate(event.date)}
            {detailed &&
              ` · ${new Date(event.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
          </time>
        </div>
      ))}
    </div>
  );
}
