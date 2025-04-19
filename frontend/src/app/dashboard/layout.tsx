import { DashboardLayout } from "@/components/layouts/dashboard";
import { getRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function Layout({ children }: React.PropsWithChildren) {
  const role = await getRole();

  if (!role) {
    redirect("/");
  } else if (role === "ADMIN") {
    redirect("/admin");
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
