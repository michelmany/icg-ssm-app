import { useSession } from "next-auth/react";

export const useUser = () => {
  const { data: session } = useSession();

  if (!session?.user) {
    return undefined;
  }

  return {
    ...session.user,
    name: `${session.user.firstName} ${session.user.lastName}`,
    role: session.user.role,
  };
};
