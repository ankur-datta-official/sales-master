import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserProfile } from "@/types/profile";

type UserReadonlySummaryProps = {
  profile: UserProfile;
  managerLabel: string | null;
};

export function UserReadonlySummary({ profile, managerLabel }: UserReadonlySummaryProps) {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>User details</CardTitle>
        <CardDescription>Read-only view based on your visibility in the hierarchy.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-x-4">
          <dt className="text-muted-foreground">Full name</dt>
          <dd className="font-medium">{profile.full_name ?? "—"}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="break-all font-mono text-xs">{profile.email ?? "—"}</dd>
          <dt className="text-muted-foreground">Role</dt>
          <dd className="font-mono text-xs">{profile.role ?? "—"}</dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-mono text-xs">{profile.status ?? "—"}</dd>
          <dt className="text-muted-foreground">Reporting manager</dt>
          <dd>{managerLabel ?? "—"}</dd>
          <dt className="text-muted-foreground">Phone</dt>
          <dd>{profile.phone ?? "—"}</dd>
          <dt className="text-muted-foreground">Employee code</dt>
          <dd>{profile.employee_code ?? "—"}</dd>
          <dt className="text-muted-foreground">Designation</dt>
          <dd>{profile.designation ?? "—"}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}
