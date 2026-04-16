import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/filter-bar";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmptyRow,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  DataTableTable,
} from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { ListPageHeader, ListPageShell, ListSummaryRow } from "@/components/ui/list-page";
import { NativeSelect } from "@/components/ui/native-select";
import { RowActionLink } from "@/components/ui/row-action-link";
import { StatusBadge } from "@/components/ui/status-badge";
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
    <ListPageShell>
      <ListPageHeader
        title="Products"
        description={
          canEdit
            ? "Manage product catalog for your organization."
            : "Read-only product catalog view."
        }
        actions={
          canEdit ? (
            <Link
              href={ROUTES.productsNew}
              className={cn(buttonVariants(), "inline-flex h-9 items-center justify-center px-4")}
            >
              New product
            </Link>
          ) : null
        }
      />

      <ListSummaryRow
        left={products.length === 1 ? "1 product" : `${products.length} products`}
      />

      <form>
        <FilterBar
          actions={
            <button
              type="submit"
              className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
            >
              Apply filters
            </button>
          }
        >
          <div className="grid gap-2 sm:grid-cols-[1fr_200px_200px] lg:grid-cols-[1fr_240px_200px_200px]">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search by product name or item code"
            />
            <Input name="category" defaultValue={category} placeholder="Category" />
            <NativeSelect name="status" defaultValue={status}>
              <option value="">All statuses</option>
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </div>
        </FilterBar>
      </form>

      <DataTable label="Products table">
        <DataTableTable className="min-w-[840px]">
          <DataTableHead>
            <tr>
              <DataTableHeaderCell>Product</DataTableHeaderCell>
              <DataTableHeaderCell>Item code</DataTableHeaderCell>
              <DataTableHeaderCell>Unit</DataTableHeaderCell>
              <DataTableHeaderCell align="right">Base price</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              <DataTableHeaderCell className="w-24" />
            </tr>
          </DataTableHead>
          <DataTableBody>
            {products.length === 0 ? (
              <DataTableEmptyRow colSpan={6}>No products found.</DataTableEmptyRow>
            ) : (
              products.map((p) => (
                <DataTableRow key={p.id}>
                  <DataTableCell className="font-medium">
                    {p.product_name}
                    {p.description ? (
                      <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {p.description}
                      </div>
                    ) : null}
                  </DataTableCell>
                  <DataTableCell className="font-mono text-xs text-muted-foreground">
                    {p.item_code}
                  </DataTableCell>
                  <DataTableCell>{p.unit}</DataTableCell>
                  <DataTableCell align="right" className="font-mono text-xs">
                    {Number(p.base_price).toFixed(2)}
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge tone="neutral" size="sm" className="font-mono">
                      {p.status}
                    </StatusBadge>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <RowActionLink href={`${ROUTES.products}/${p.id}`} />
                  </DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTableTable>
      </DataTable>
    </ListPageShell>
  );
}
