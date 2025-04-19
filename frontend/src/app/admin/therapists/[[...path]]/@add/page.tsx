import { TherapistsAddDrawer } from "@/components/templates/therapists/therapists-add-drawer";
import { apiClient } from "@/lib/api/client";

interface PageProps {
  params: Promise<{ path?: string[] }>;
}

export default async function Page({ params }: PageProps) {
  const { path } = await params;

  const open = !!path && path[0] === "add";

  if (!open) {
    return null;
  }

  const usersResponse = await apiClient.GET("/users", {
    params: { 
      query: { 
        perPage: 300,
        role: "THERAPIST"
      } 
    },
  });

  const users = usersResponse.data?.data ?? [];

  return <TherapistsAddDrawer users={users} />;
}