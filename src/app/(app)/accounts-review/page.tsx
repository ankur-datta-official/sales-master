import { redirect } from "next/navigation";

import { ROUTES } from "@/config/routes";

export default function AccountsReviewQueuePage() {
  redirect(`${ROUTES.approvals}?queue=accounts_review`);
}
