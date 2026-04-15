import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { PRODUCT_STATUSES } from "@/constants/statuses";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canMutateProducts } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import type { Product } from "@/modules/products/types";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    category?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const { q = "", status = "", category = "" } = await searchParams;

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const canEdit = canMutateProducts(role);

  let query = supabase
    .from("products")
    .select(
      "id, organization_id, product_name, item_code, unit, base_price, category, description, status, created_by_user_id, created_at, updated_at"
    )
    .order("product_name", { ascending: true });

  if (q.trim()) {
    const safe = q.replace(/[%_]/g, "").trim();
    query = query.or(`product_name.ilike.%${safe}%,item_code.ilike.%${safe}%`);
  }
  if (category.trim()) {
    const safeCategory = category.replace(/[%_]/g, "").trim();
    query = query.ilike("category", `%${safeCategory}%`);
  }
  if (status && PRODUCT_STATUSES.includes(status as (typeof PRODUCT_STATUSES)[number])) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="text-destructive text-sm">Could not load products right now.</p>
      </div>
    );
  }

  const products = ((data ?? []) as Product[]).map((p) => ({
    ...p,
    base_price: Number(p.base_price ?? 0),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm">
            {canEdit
              ? "Manage product catalog for your organization."
              : "Read-only product catalog view."}
          </p>
        </div>
        {canEdit && (
          <Link
            href={ROUTES.productsNew}
            className={cn(buttonVariants(), "inline-flex h-9 items-center justify-center px-4")}
          >
            New product
          </Link>
        )}
      </div>

      <form className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_180px_180px_auto]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by product name or item code"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        />
        <input
          name="category"
          defaultValue={category}
          placeholder="Category"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        >
          <option value="">All statuses</option>
          {PRODUCT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
        >
          Apply
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Item code</th>
              <th className="px-3 py-2 font-medium">Unit</th>
              <th className="px-3 py-2 font-medium">Base price</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium w-24" />
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-3 py-8 text-center">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{p.product_name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.item_code}</td>
                  <td className="px-3 py-2">{p.unit}</td>
                  <td className="px-3 py-2">{Number(p.base_price).toFixed(2)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.status}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`${ROUTES.products}/${p.id}`}
                      className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
