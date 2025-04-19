import { UsersEditDrawer } from "@/components/templates/users/users-edit-drawer";
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

  const [userResponse, rolesResponse, schoolsResponse] = await Promise.all([
    apiClient.GET("/users/{id}", {
      params: { path: { id } },
    }),
    apiClient.GET("/roles", {
      params: { query: { perPage: 100 } },
    }),
    apiClient.GET("/schools", {
      params: { query: { perPage: 100 } },
    }),
  ]);

  const user = userResponse.data?.data;
  const roles = rolesResponse.data?.data ?? [];
  const schools = schoolsResponse.data?.data ?? [];

  if (!user) {
    return null;
  }

  return <UsersEditDrawer user={user} roles={roles} schools={schools} />;
}
