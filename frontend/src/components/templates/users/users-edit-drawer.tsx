"use client";

import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { UserForm } from "@/components/forms/user-form/user-form";
import { userSchemaValues } from "@/components/forms/user-form/user-schema";
import { updateUser } from "@/lib/actions/users/update-user";
import { Role, School, User } from "@/lib/api/types";
import { useRouter } from "next/navigation";

interface UsersEditDrawerProps {
  user: User;
  roles: Role[];
  schools: School[];
}

export const UsersEditDrawer = ({
  roles,
  schools,
  user,
}: UsersEditDrawerProps) => {
  const router = useRouter();

  const handleUpdateUser = async (values: userSchemaValues) => {
    const { success, message } = await updateUser(user.id, values);
    if (success) {
      router.back();
    } else {
      throw new Error(message);
    }
  };

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="Edit user"
      headerSubtext="Fill out the user details."
      width="wide"
    >
      <UserForm
        user={user}
        onSubmit={handleUpdateUser}
        roles={roles}
        schools={schools}
      />
    </RoutedDrawer>
  );
};
