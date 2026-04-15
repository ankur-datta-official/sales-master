import type { ApprovalLogWithActors } from "@/modules/approval-logs/types";

type Props = {
  logs: ApprovalLogWithActors[];
  title?: string;
};

export function ApprovalLogTimeline({ logs, title = "Approval timeline" }: Props) {
  const sorted = [...logs].sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>
      {sorted.length === 0 ? (
        <p className="text-muted-foreground text-sm">No approval events yet.</p>
      ) : (
        <ol className="border-muted relative space-y-4 border-s ps-4">
          {sorted.map((log) => (
            <li key={log.id} className="text-sm">
              <div className="absolute -start-1.5 mt-1.5 size-3 rounded-full border border-background bg-muted" />
              <p className="font-mono text-xs text-muted-foreground">{log.created_at}</p>
              <p className="font-medium capitalize">
                {log.action.replaceAll("_", " ")}
                {log.to_name || log.to_email ? (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    → {log.to_name ?? log.to_email ?? log.to_user_id}
                  </span>
                ) : null}
              </p>
              <p className="text-muted-foreground text-xs">
                By {log.actor_name ?? log.actor_email ?? log.acted_by_user_id}
              </p>
              {log.note ? (
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{log.note}</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
