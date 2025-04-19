import { TherapyServicesViewDrawer } from "@/components/templates/therapy-services/therapy-services-view-drawer";
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

  const [therapyServiceResponse] = await Promise.all([
    apiClient.GET("/therapy-services/{id}", {
      params: { path: { id } },
    }),
  ]);

  const therapyService = therapyServiceResponse.data?.data;

  if (!therapyService) {
    return null;
  }

  return <TherapyServicesViewDrawer therapyService={therapyService} open={true} />;
}