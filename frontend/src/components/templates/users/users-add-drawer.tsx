"use client";

import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { UserForm } from "@/components/forms/user-form/user-form";
import { userSchemaValues } from "@/components/forms/user-form/user-schema";
import { createUser } from "@/lib/actions/users/create-user";
import { Role, School } from "@/lib/api/types";
import { useRouter } from "next/navigation";

interface UsersAddDrawerProps {
  roles: Role[];
  schools: School[];
}

export const UsersAddDrawer = ({ roles, schools }: UsersAddDrawerProps) => {
  const router = useRouter();

  const handleCreateUser = async (values: userSchemaValues) => {
    const { success, message } = await createUser(values);
    if (success) {
      router.back();
    } else {
      throw new Error(message);
    }
  };

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="Create a new user"
      headerSubtext="Fill out the user details."
      width="wide"
    >
      <UserForm onSubmit={handleCreateUser} roles={roles} schools={schools} />
    </RoutedDrawer>
  );
};
