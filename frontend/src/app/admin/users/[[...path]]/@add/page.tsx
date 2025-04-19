import { UsersAddDrawer } from "@/components/templates/users/users-add-drawer";
import { apiClient } from "@/lib/api/client";

interface PageProps {
  params: Promise<{ path?: string[] }>;
}

export default async function Page({ params }: PageProps) {
  const { path } = await params;

  const open = !!path && path[0] === "add";

  const [rolesResponse, schoolsResponse] = await Promise.all([
    apiClient.GET("/roles", {
      params: { query: { perPage: 100 } },
    }),
    apiClient.GET("/schools", {
      params: { query: { perPage: 100 } },
    }),
  ]);

  const roles = rolesResponse.data?.data ?? [];
  const schools = schoolsResponse.data?.data ?? [];

  if (!open) {
    return null;
  }

  return <UsersAddDrawer roles={roles} schools={schools} />;
}
