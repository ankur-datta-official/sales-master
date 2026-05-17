import { redirect } from "next/navigation";

import { ROUTES } from "@/config/routes";

export default function LegacyCrmRedirectPage() {
  redirect(ROUTES.dashboard);
}
