import { TherapistsEditDrawer } from "@/components/templates/therapists/therapists-edit-drawer";
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

  const [therapistResponse, usersResponse] = await Promise.all([
    apiClient.GET("/therapists/{id}", {
      params: { path: { id } },
    }),
    apiClient.GET("/users", {
      params: { 
        query: { 
          perPage: 300,
          role: "THERAPIST"
        } 
      },
    }),
  ]);

  const therapist = therapistResponse.data?.data;
  const users = usersResponse.data?.data ?? [];

  if (!therapist) {
    return null;
  }

  return <TherapistsEditDrawer therapist={therapist} users={users} />;
}