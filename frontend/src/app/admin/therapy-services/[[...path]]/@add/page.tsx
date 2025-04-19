import { TherapyServicesAddDrawer } from "@/components/templates/therapy-services/therapy-services-add-drawer";
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

  const [studentsResponse, providersResponse] = await Promise.all([
    apiClient.GET("/students", {
      params: { query: { perPage: 100 } },
    }),
    apiClient.GET("/providers", {
      params: { query: { perPage: 100 } },
    }),
  ]);

  const students = studentsResponse.data?.data ?? [];
  const providers = providersResponse.data?.data ?? [];

  return (
    <TherapyServicesAddDrawer 
      students={students} 
      providers={providers} 
    />
  );
}