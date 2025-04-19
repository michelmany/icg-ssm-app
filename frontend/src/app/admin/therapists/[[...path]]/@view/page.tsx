import { TherapistsViewDrawer } from "@/components/templates/therapists/therapists-view-drawer";
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

  const [therapistResponse] = await Promise.all([
    apiClient.GET("/therapists/{id}", {
      params: { path: { id } },
    }),
  ]);

  const therapist = therapistResponse.data?.data;

  if (!therapist) {
    return null;
  }

  return <TherapistsViewDrawer therapist={therapist} open={true} />;
}