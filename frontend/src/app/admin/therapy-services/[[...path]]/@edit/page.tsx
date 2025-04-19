import { TherapyServicesEditDrawer } from "@/components/templates/therapy-services/therapy-services-edit-drawer";
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

  const [therapyServiceResponse, studentsResponse, providersResponse] = await Promise.all([
    apiClient.GET("/therapy-services/{id}", {
      params: { path: { id } },
    }),
    apiClient.GET("/students", {
      params: { query: { perPage: 100 } },
    }),
    apiClient.GET("/providers", {
      params: { query: { perPage: 100 } },
    }),
  ]);

  const therapyService = therapyServiceResponse.data?.data;
  const students = studentsResponse.data?.data ?? [];
  const providers = providersResponse.data?.data ?? [];

  if (!therapyService) {
    return null;
  }

  return (
    <TherapyServicesEditDrawer 
      therapyService={therapyService} 
      students={students} 
      providers={providers} 
    />
  );
}