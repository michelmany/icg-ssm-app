import { StudentsAddDrawer } from "@/components/templates/students/students-add-drawer";
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

  const [parentsResponse, schoolsResponse] = await Promise.all([
    apiClient.GET("/users", {
      params: { query: { perPage: 100, role: "PROVIDER" } },
    }),
    apiClient.GET("/schools", {
      params: { query: { perPage: 100 } },
    }),
  ]);

  const parents = parentsResponse.data?.data ?? [];
  const schools = schoolsResponse.data?.data ?? [];

  return <StudentsAddDrawer schools={schools} parents={parents} />;
}
