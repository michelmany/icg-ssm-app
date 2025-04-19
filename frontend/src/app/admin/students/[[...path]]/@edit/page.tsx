import { StudentsEditDrawer } from "@/components/templates/students/students-edit-drawer";
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

  const [studentResponse, parentsResponse, schoolsResponse] = await Promise.all(
    [
      apiClient.GET("/students/{id}", {
        params: { path: { id } },
      }),
      //TODO: Initially with was parents in the TN project
      apiClient.GET("/users", {
        params: { query: { perPage: 100, role: "PROVIDER" } },
      }),
      apiClient.GET("/schools", {
        params: { query: { perPage: 100 } },
      }),
    ],
  );

  const student = studentResponse.data?.data;
  const parents = parentsResponse.data?.data ?? [];
  const schools = schoolsResponse.data?.data ?? [];

  if (!student) {
    return null;
  }

  return (
    <StudentsEditDrawer parents={parents} schools={schools} student={student} />
  );
}
