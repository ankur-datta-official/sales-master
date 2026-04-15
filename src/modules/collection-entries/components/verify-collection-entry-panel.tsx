"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { verifyCollectionEntryAction } from "@/modules/collection-entries/actions";
import type { VerifyCollectionEntryInput } from "@/modules/collection-entries/schemas";

type Props = {
  collectionEntryId: string;
};

export function VerifyCollectionEntryPanel({ collectionEntryId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(status: VerifyCollectionEntryInput["verification_status"]) {
    setError(null);
    startTransition(async () => {
      const result = await verifyCollectionEntryAction({
        collectionEntryId,
        verification_status: status,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl border-amber-500/30">
      <CardHeader>
        <CardTitle>Verification</CardTitle>
        <CardDescription>
          Confirm or reject this collection entry. This action is available while the row is
          unverified.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          disabled={isPending}
          onClick={() => submit("verified")}
        >
          {isPending ? "Working..." : "Mark verified"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={() => submit("rejected")}
        >
          Reject
        </Button>
      </CardFooter>
    </Card>
  );
}
