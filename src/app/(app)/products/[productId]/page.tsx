import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canMutateProducts } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { ProductReadonlySummary } from "@/modules/products/components/product-readonly-summary";
import { UpdateProductForm } from "@/modules/products/components/update-product-form";
import type { Product } from "@/modules/products/types";

type PageProps = { params: Promise<{ productId: string }> };

export default async function ProductDetailPage({ params }: PageProps) {
  const { productId } = await params;
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const canEdit = canMutateProducts(role);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, organization_id, product_name, item_code, unit, base_price, category, description, status, created_by_user_id, created_at, updated_at"
    )
    .eq("id", productId)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const product: Product = {
    ...(data as Product),
    base_price: Number((data as Product).base_price ?? 0),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.products}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
        >
          ← Products
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{product.product_name}</h1>
      </div>

      {canEdit ? <UpdateProductForm product={product} /> : <ProductReadonlySummary product={product} />}
    </div>
  );
}
