import { redirect } from "next/navigation";

import { SignUpForm } from "@/app/(auth)/sign-up/sign-up-form";
import { getCurrentAuthAccessContext, getPostAuthRedirectPath } from "@/modules/auth/access-state";

export default async function SignUpPage() {
  const access = await getCurrentAuthAccessContext();
  if (access.state !== "unauthenticated") {
    redirect(getPostAuthRedirectPath(access));
  }

  return <SignUpForm />;
}

