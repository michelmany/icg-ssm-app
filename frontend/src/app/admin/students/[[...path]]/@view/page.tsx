import { StudentsViewDrawer } from "@/components/templates/students/students-view-drawer";
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

  const [studentResponse] = await Promise.all([
    apiClient.GET("/students/{id}", {
      params: { path: { id } },
    }),
  ]);

  const student = studentResponse.data?.data;

  if (!student) {
    return null;
  }

  return <StudentsViewDrawer student={student} open={true} />;
}
