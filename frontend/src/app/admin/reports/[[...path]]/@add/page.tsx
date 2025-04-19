import { ReportsAddDrawer } from "@/components/templates/reports/reports-add-drawer";
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

  const [schoolsResponse, studentsResponse, therapyServicesResponse] = await Promise.all([
    apiClient.GET("/schools", {
      params: { query: { perPage: 100 } },
    }),
    apiClient.GET("/students", {
      params: { query: { perPage: 100 } },
    }),
    apiClient.GET("/therapy-services", {
      params: { query: { perPage: 100 } },
    }),
  ]);

  const schools = schoolsResponse.data?.data ?? [];
  const students = studentsResponse.data?.data ?? [];
  const therapyServices = therapyServicesResponse.data?.data ?? [];

  return (
    <ReportsAddDrawer 
      schools={schools} 
      students={students} 
      therapyServices={therapyServices} 
    />
  );
}