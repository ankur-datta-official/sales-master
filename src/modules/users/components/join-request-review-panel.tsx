"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { reviewJoinRequestAction } from "@/modules/auth/actions";
import type { OrganizationJoinRequest } from "@/modules/auth/types";

type RoleOption = { id: string; name: string; slug: string; level: number };
type BranchOption = { id: string; name: string; code: string };

type JoinRequestReviewPanelProps = {
  requests: OrganizationJoinRequest[];
  roles: RoleOption[];
  branches: BranchOption[];
};

export function JoinRequestReviewPanel({
  requests,
  roles,
  branches,
}: JoinRequestReviewPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selection, setSelection] = useState<
    Record<string, { roleId: string; branchId: string }>
  >(
    Object.fromEntries(
      requests.map((request) => [
        request.id,
        {
          roleId: roles[0]?.id ?? "",
          branchId: "",
        },
      ])
    )
  );

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending workspace requests</CardTitle>
        <CardDescription>
          Review new join requests and assign role access before approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {requests.map((request) => {
          const current = selection[request.id] ?? {
            roleId: roles[0]?.id ?? "",
            branchId: "",
          };

          return (
            <div
              key={request.id}
              className="space-y-3 rounded-2xl border border-border/80 bg-background/45 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{request.full_name}</p>
                  <p className="text-sm text-muted-foreground">{request.email}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Workspace: {request.organization_name ?? request.organization_slug ?? "Unknown"}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{request.created_at.slice(0, 10)}</p>
                  <p>Status: {request.status}</p>
                </div>
              </div>

              {request.note ? (
                <p className="rounded-xl bg-muted/45 px-3 py-2 text-sm text-muted-foreground">
                  {request.note}
                </p>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Assign role
                  </label>
                  <NativeSelect
                    value={current.roleId}
                    onChange={(event) =>
                      setSelection((state) => ({
                        ...state,
                        [request.id]: {
                          ...current,
                          roleId: event.target.value,
                        },
                      }))
                    }
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} ({role.slug})
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Assign branch
                  </label>
                  <NativeSelect
                    value={current.branchId}
                    onChange={(event) =>
                      setSelection((state) => ({
                        ...state,
                        [request.id]: {
                          ...current,
                          branchId: event.target.value,
                        },
                      }))
                    }
                  >
                    <option value="">No branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result = await reviewJoinRequestAction({
                        requestId: request.id,
                        decision: "approve",
                        role_id: current.roleId,
                        branch_id: current.branchId || null,
                      });

                      if (!result.ok) {
                        setError(result.error);
                        return;
                      }

                      router.refresh();
                    });
                  }}
                >
                  Approve request
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result = await reviewJoinRequestAction({
                        requestId: request.id,
                        decision: "reject",
                      });

                      if (!result.ok) {
                        setError(result.error);
                        return;
                      }

                      router.refresh();
                    });
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
