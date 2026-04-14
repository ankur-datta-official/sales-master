import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PartyWithAssignee } from "@/modules/parties/types";

type Props = { party: PartyWithAssignee };

export function PartyReadonlySummary({ party }: Props) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Party details</CardTitle>
        <CardDescription>Read-only based on role and hierarchy visibility.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,150px)_1fr] sm:gap-x-4">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="font-medium">{party.name}</dd>
          <dt className="text-muted-foreground">Code</dt>
          <dd>{party.code ?? "—"}</dd>
          <dt className="text-muted-foreground">Assigned user</dt>
          <dd>{party.assignee_name ?? party.assignee_email ?? "Unassigned"}</dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-mono text-xs">{party.status}</dd>
          <dt className="text-muted-foreground">Contact person</dt>
          <dd>{party.contact_person ?? "—"}</dd>
          <dt className="text-muted-foreground">Phone</dt>
          <dd>{party.phone ?? "—"}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd>{party.email ?? "—"}</dd>
          <dt className="text-muted-foreground">Address</dt>
          <dd>{party.address ?? "—"}</dd>
          <dt className="text-muted-foreground">Notes</dt>
          <dd>{party.notes ?? "—"}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}
