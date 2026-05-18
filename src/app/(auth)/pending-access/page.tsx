import Link from "next/link";
import { redirect } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { getCurrentAuthAccessContext, getPostAuthRedirectPath } from "@/modules/auth/access-state";
import { cn } from "@/lib/utils";

export default async function PendingAccessPage() {
  const access = await getCurrentAuthAccessContext();

  if (access.state === "unauthenticated") {
    redirect(ROUTES.login);
  }

  if (access.state === "active") {
    redirect(getPostAuthRedirectPath(access));
  }

  const joinRequest = access.latestJoinRequest;
  const isRejected = access.reason === "rejected_request";
  const isBlocked = access.reason === "inactive_profile" || access.reason === "suspended_profile";

  const title = isRejected
    ? "Access request not approved"
    : isBlocked
      ? "Workspace access is currently blocked"
      : "Workspace access is pending";

  const description = isRejected
    ? "An administrator reviewed your request and did not approve it yet."
    : isBlocked
      ? "Your account needs attention from a workspace administrator before app access can resume."
      : "Your sign-in is active, but the workspace team still needs to approve and assign your role.";

  return (
    <Card className="w-full rounded-[1.75rem] border border-white/85 bg-card/90 py-0 shadow-[var(--shadow-lg)] backdrop-blur-sm dark:border-white/10">
      <CardHeader className="gap-2 px-6 pb-0 pt-5 sm:px-7 sm:pt-6">
        <div className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.75 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          Access status
        </div>
        <div className="space-y-2">
          <CardTitle className="text-[1.7rem] font-semibold tracking-[-0.03em] text-foreground">
            {title}
          </CardTitle>
          <CardDescription className="max-w-sm text-sm leading-6 text-muted-foreground">
            {description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-6 pb-0 pt-4 sm:px-7">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatusItem label="Email" value={access.user?.email ?? "Unknown"} />
          <StatusItem
            label="Workspace"
            value={joinRequest?.organization_name ?? joinRequest?.organization_slug ?? "Pending assignment"}
          />
          <StatusItem
            label="Join request"
            value={joinRequest ? joinRequest.status : "Waiting for admin review"}
          />
          <StatusItem
            label="Reviewed at"
            value={joinRequest?.reviewed_at?.slice(0, 10) ?? "Not reviewed yet"}
          />
        </div>

        {joinRequest?.note ? (
          <div className="rounded-[1.1rem] border border-border/80 bg-muted/45 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Your note
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{joinRequest.note}</p>
          </div>
        ) : null}

        {joinRequest?.review_note ? (
          <div className="rounded-[1.1rem] border border-border/80 bg-muted/45 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Admin note
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{joinRequest.review_note}</p>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 border-0 bg-transparent px-6 pb-5 pt-5 sm:px-7 sm:pb-6">
        <Link
          href={ROUTES.login}
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex h-10 items-center justify-center px-4")}
        >
          Back to sign in
        </Link>
        <form action={async () => {
          "use server";
          const supabase = await (await import("@/lib/supabase/server")).createClient();
          await supabase.auth.signOut();
        }}>
          <Button type="submit" variant="ghost" className="h-10 px-4">
            Sign out
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-border/80 bg-background/55 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
