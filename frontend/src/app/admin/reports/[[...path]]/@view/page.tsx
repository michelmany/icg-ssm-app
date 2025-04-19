import { ReportsViewDrawer } from "@/components/templates/reports/reports-view-drawer";
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

  const [reportResponse] = await Promise.all([
    apiClient.GET("/reports/{id}", {
      params: { path: { id } },
    }),
  ]);

  const report = reportResponse.data?.data;

  if (!report) {
    return null;
  }

  return <ReportsViewDrawer report={report} open={true} />;
}