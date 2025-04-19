import { ProvidersViewDrawer } from "@/components/templates/providers/providers-view-drawer";
import { apiClient } from "@/lib/api/client";

interface PageProps {
  params: Promise<{ path?: string[] }>;
}

export default async function Page({ params }: PageProps) {
  const { path } = await params;

  if (!path || !path[0] || !path[1] || path[0] !== "view") {
    return null;
  }

  const id = path[1];

  const [providerResponse] = await Promise.all([
    apiClient.GET("/providers/{id}", {
      params: { path: { id } },
    }),
  ]);

  const provider = providerResponse.data?.data;

  if (!provider) {
    return null;
  }

  return <ProvidersViewDrawer provider={provider} open={true} />;
}
