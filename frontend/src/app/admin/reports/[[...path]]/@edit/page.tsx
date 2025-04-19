import { ReportsEditDrawer } from "@/components/templates/reports/reports-edit-drawer";
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

  const [reportResponse, schoolsResponse, studentsResponse, therapyServicesResponse] = await Promise.all([
    apiClient.GET("/reports/{id}", {
      params: { path: { id } },
    }),
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

  const report = reportResponse.data?.data;
  const schools = schoolsResponse.data?.data ?? [];
  const students = studentsResponse.data?.data ?? [];
  const therapyServices = therapyServicesResponse.data?.data ?? [];

  if (!report) {
    return null;
  }

  return (
    <ReportsEditDrawer 
      report={report} 
      schools={schools} 
      students={students} 
      therapyServices={therapyServices} 
    />
  );
}