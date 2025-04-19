import { SchoolsViewDrawer } from "@/components/templates/schools/schools-view-drawer";
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

  const [schoolResponse] = await Promise.all([
    apiClient.GET("/schools/{id}", {
      params: { path: { id } },
    }),
  ]);

  const school = schoolResponse.data?.data;

  if (!school) {
    return null;
  }

  return <SchoolsViewDrawer school={school} open={true} />;
}
