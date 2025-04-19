import { Permission, UserWithPermissions } from "./api/types";
import { auth } from "./auth";

export const hasRole = async (role: UserWithPermissions["role"]["name"]) => {
  const session = await auth();

  return session ? session.user.role.name === role : false;
};

export const getRole = async () => {
  const session = await auth();
  return session?.user.role.name;
};

export const hasPermission = async (permission: Permission) => {
  const session = await auth();

  return session ? session.user.permissions.includes(permission) : false;
};
