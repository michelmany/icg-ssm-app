import { ProvidersEditDrawer } from "@/components/templates/providers/providers-edit-drawer";
import { apiClient } from "@/lib/api/client";

interface PageProps {
  params: Promise<{ path?: string[] }>;
}

export default async function Page({ params }: PageProps) {
  const { path } = await params;

  if (!path || !path[0] || !path[1] || path[0] !== "edit") {
    return null;
  }

  const id = path[1];

  const [providerResponse, usersResponse] = await Promise.all([
    apiClient.GET("/providers/{id}", {
      params: { path: { id } },
    }),
    apiClient.GET("/users", {
      params: { query: { perPage: 300, role: "PROVIDER" } },
    }),
  ]);

  const provider = providerResponse.data?.data;
  const users = usersResponse.data?.data ?? [];

  if (!provider) {
    return null;
  }

  return <ProvidersEditDrawer provider={provider} users={users} />;
}
