import { SignInPage } from "@/components/pages/sign-in";
import { getRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

import { UserRole } from "@/lib/api/types";

export default async function Home() {
  const role = await getRole();

  if (role === UserRole.ADMIN) {
    redirect("/admin");
  }

  if (role) {
    redirect("/dashboard");
  }

  return <SignInPage />;
}
