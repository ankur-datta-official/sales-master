import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { canMutateProducts } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { CreateProductForm } from "@/modules/products/components/create-product-form";

export default async function NewProductPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canMutateProducts(role)) {
    redirect(ROUTES.products);
  }

  const orgId = profile?.organization_id;
  if (!orgId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">New product</h1>
        <p className="text-muted-foreground text-sm">
          Your profile must have an organization assigned first.
        </p>
        <Link
          href={ROUTES.products}
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex h-9 items-center justify-center px-4")}
        >
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New product</h1>
        <p className="text-muted-foreground text-sm">
          Add a new product to your organization catalog.
        </p>
      </div>
      <CreateProductForm organizationId={orgId} />
    </div>
  );
}
