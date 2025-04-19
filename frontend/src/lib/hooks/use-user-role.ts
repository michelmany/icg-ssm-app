import { useSession } from "next-auth/react";

export const useUserRole = () => {
  const { data: session } = useSession();
  return session?.user.role.name;
};
