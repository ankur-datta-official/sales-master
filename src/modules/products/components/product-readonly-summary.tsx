import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Product } from "@/modules/products/types";

type Props = { product: Product };

export function ProductReadonlySummary({ product }: Props) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Product details</CardTitle>
        <CardDescription>Read-only access for non-admin roles.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,150px)_1fr] sm:gap-x-4">
          <dt className="text-muted-foreground">Product name</dt>
          <dd className="font-medium">{product.product_name}</dd>
          <dt className="text-muted-foreground">Item code</dt>
          <dd className="font-mono text-xs">{product.item_code}</dd>
          <dt className="text-muted-foreground">Unit</dt>
          <dd>{product.unit}</dd>
          <dt className="text-muted-foreground">Base price</dt>
          <dd>{product.base_price.toFixed(2)}</dd>
          <dt className="text-muted-foreground">Category</dt>
          <dd>{product.category ?? "—"}</dd>
          <dt className="text-muted-foreground">Description</dt>
          <dd>{product.description ?? "—"}</dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-mono text-xs">{product.status}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}
