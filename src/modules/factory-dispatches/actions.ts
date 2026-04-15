"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canUpdateFactoryDispatch } from "@/lib/users/actor-permissions";
import {
  updateFactoryDispatchSchema,
  type UpdateFactoryDispatchInput,
} from "@/modules/factory-dispatches/schemas";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateFactoryDispatchAction(
  input: UpdateFactoryDispatchInput
): Promise<ActionResult> {
  const parsed = updateFactoryDispatchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canUpdateFactoryDispatch(role)) {
    return { ok: false, error: "You do not have permission to update factory dispatch records." };
  }
  if (!profile?.organization_id) {
    return { ok: false, error: "Your profile must belong to an organization." };
  }

  const { data: dispatchRow, error: fetchErr } = await supabase
    .from("demand_order_dispatches")
    .select("id, organization_id, demand_order_id")
    .eq("id", parsed.data.dispatchId)
    .maybeSingle();

  if (fetchErr || !dispatchRow) {
    return { ok: false, error: fetchErr?.message ?? "Dispatch record not found." };
  }
  if (dispatchRow.organization_id !== profile.organization_id) {
    return { ok: false, error: "Dispatch record not found in your organization." };
  }

  const { data: orderRow } = await supabase
    .from("demand_orders")
    .select("id, stage, status")
    .eq("id", dispatchRow.demand_order_id)
    .maybeSingle();

  if (!orderRow || orderRow.stage !== "factory_queue" || orderRow.status !== "sent_to_factory") {
    return {
      ok: false,
      error: "This order is no longer in the factory queue; dispatch cannot be updated.",
    };
  }

  const remarks = (parsed.data.remarks ?? "").trim();
  const challan = (parsed.data.challan_no ?? "").trim();
  const memo = (parsed.data.memo_no ?? "").trim();
  const dispatchDateRaw = (parsed.data.dispatch_date ?? "").trim();

  const { error } = await supabase
    .from("demand_order_dispatches")
    .update({
      factory_status: parsed.data.factory_status,
      challan_no: challan.length ? challan : null,
      memo_no: memo.length ? memo : null,
      dispatch_date: dispatchDateRaw.length ? dispatchDateRaw : null,
      remarks,
      updated_by: profile.id,
    })
    .eq("id", parsed.data.dispatchId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(ROUTES.factoryQueue);
  revalidatePath(`${ROUTES.factoryQueue}/${parsed.data.dispatchId}`);
  revalidatePath(`${ROUTES.demandOrders}/${dispatchRow.demand_order_id}`);
  return { ok: true };
}
