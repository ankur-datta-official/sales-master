"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { toSafeActionError } from "@/lib/errors/safe-action-error";
import { createClient } from "@/lib/supabase/server";
import { canMutateProducts } from "@/lib/users/actor-permissions";
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/modules/products/schemas";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function createProductAction(
  input: CreateProductInput
): Promise<ActionResult<{ productId: string }>> {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canMutateProducts(role)) {
    return { ok: false, error: "You do not have permission to create products." };
  }
  if (
    !profile?.organization_id ||
    parsed.data.organization_id !== profile.organization_id
  ) {
    return { ok: false, error: "Invalid organization." };
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      organization_id: parsed.data.organization_id,
      product_name: parsed.data.product_name.trim(),
      item_code: parsed.data.item_code.trim(),
      unit: parsed.data.unit.trim(),
      base_price: parsed.data.base_price,
      category: parsed.data.category?.trim() || null,
      description: parsed.data.description?.trim() || null,
      status: parsed.data.status,
      created_by_user_id: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: toSafeActionError(error, "Could not create product.", "products.createProductAction"),
    };
  }

  revalidatePath(ROUTES.products);
  revalidatePath(`${ROUTES.products}/${data.id}`);
  return { ok: true, data: { productId: data.id } };
}

export async function updateProductAction(
  input: UpdateProductInput
): Promise<ActionResult> {
  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canMutateProducts(role)) {
    return { ok: false, error: "You do not have permission to update products." };
  }
  if (!profile?.organization_id) {
    return { ok: false, error: "Your profile is missing an organization." };
  }

  const { data: target } = await supabase
    .from("products")
    .select("organization_id")
    .eq("id", parsed.data.productId)
    .maybeSingle();
  if (!target || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Product not found in your organization." };
  }

  const { error } = await supabase
    .from("products")
    .update({
      product_name: parsed.data.product_name.trim(),
      item_code: parsed.data.item_code.trim(),
      unit: parsed.data.unit.trim(),
      base_price: parsed.data.base_price,
      category: parsed.data.category?.trim() || null,
      description: parsed.data.description?.trim() || null,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.productId);

  if (error) {
    return {
      ok: false,
      error: toSafeActionError(error, "Could not update product.", "products.updateProductAction"),
    };
  }

  revalidatePath(ROUTES.products);
  revalidatePath(`${ROUTES.products}/${parsed.data.productId}`);
  return { ok: true };
}
