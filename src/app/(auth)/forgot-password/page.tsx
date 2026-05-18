import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/forgot-password-form";
import { getCurrentAuthAccessContext, getPostAuthRedirectPath } from "@/modules/auth/access-state";

export default async function ForgotPasswordPage() {
  const access = await getCurrentAuthAccessContext();
  if (access.state !== "unauthenticated") {
    redirect(getPostAuthRedirectPath(access));
  }

  return <ForgotPasswordForm />;
}

