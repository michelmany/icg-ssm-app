import { ProvidersAddDrawer } from "@/components/templates/providers/providers-add-drawer";
import { apiClient } from "@/lib/api/client";

interface PageProps {
  params: Promise<{ path?: string[] }>;
}

export default async function Page({ params }: PageProps) {
  const { path } = await params;
  const open = !!path && path[0] === "add";
  if (!open) return null;

  const usersResponse = await apiClient.GET("/users", {
    params: { query: { perPage: 300, role: "PROVIDER", status: "ACTIVE" } },
  });
  const users = usersResponse.data?.data ?? [];

  return <ProvidersAddDrawer users={users} />;
}
