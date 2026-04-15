import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canCreateDemandOrders, isOrgAdminRole } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { CreateDemandOrderForm } from "@/modules/demand-orders/components/create-demand-order-form";

function toPrice(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export default async function NewDemandOrderPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canCreateDemandOrders(role)) {
    redirect(ROUTES.demandOrders);
  }

  const orgId = profile?.organization_id;
  if (!orgId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">New demand order</h1>
        <p className="text-muted-foreground text-sm">
          Your profile must have an organization assigned first.
        </p>
        <Link
          href={ROUTES.demandOrders}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex h-9 items-center justify-center px-4"
          )}
        >
          Back to demand orders
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const isAdmin = isOrgAdminRole(role);

  const { data: parties } = await supabase
    .from("parties")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: productsRaw } = await supabase
    .from("products")
    .select("id, product_name, base_price")
    .eq("status", "active")
    .order("product_name", { ascending: true });

  const products = (productsRaw ?? []).map((p) => ({
    id: p.id,
    product_name: p.product_name,
    base_price: toPrice(p.base_price),
  }));

  const { data: assignableProfiles } = isAdmin
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("organization_id", orgId)
        .order("full_name", { ascending: true })
    : { data: null };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New demand order</h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin
            ? "Create a draft order for any user in your organization."
            : "Create a draft order for your accounts."}
        </p>
      </div>
      <CreateDemandOrderForm
        organizationId={orgId}
        isAdmin={isAdmin}
        parties={parties ?? []}
        assignableProfiles={assignableProfiles ?? []}
        products={products}
      />
    </div>
  );
}
