import { AdminLayout } from "@/components/layouts/admin";
import { hasRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

import { UserRole } from "@/lib/api/types";

export default async function Layout({ children }: React.PropsWithChildren) {
  const authorized = await hasRole(UserRole.ADMIN);

  if (!authorized) {
    redirect("/");
  }

  return <AdminLayout>{children}</AdminLayout>;
}
