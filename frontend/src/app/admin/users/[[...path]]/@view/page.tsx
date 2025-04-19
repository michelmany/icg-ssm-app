import { UsersViewDrawer } from "@/components/templates/users/users-view-drawer";
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

  const [userResponse] = await Promise.all([
    apiClient.GET("/users/{id}", {
      params: { path: { id } },
    }),
  ]);

  const user = userResponse.data?.data;

  if (!user) {
    return null;
  }

  return <UsersViewDrawer user={user} open={true} />;
}
