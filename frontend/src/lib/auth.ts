import NextAuth, { AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { apiClient } from "./api/client";
import { AdapterUser } from "next-auth/adapters";
import { UserWithPermissions } from "./api/types";
import { TNError } from "./errors";

declare module "next-auth" {
  interface Session {
    user: UserWithPermissions;
    accessToken?: string; // Add this to make the token available in the session
  }
}

const credentialsProvider = Credentials({
  credentials: {
    email: {},
    password: {},
  },
  authorize: async ({ email, password }) => {
    const { data, error } = await apiClient.POST("/auth/login", {
      body: { email: email as string, password: password as string },
    });

    if (error) {
      throw new AuthError("", { cause: new TNError(error) });
    }

    const user = data?.data;
    return user;
  },
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [credentialsProvider],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET, // Make sure this matches the backend AUTH_SECRET
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        // Store the complete user in the token
        token.user = user;
        // You may also want to store a raw token if your backend provides one
        // token.accessToken = user.accessToken;
      }
      return token;
    },
    session: ({ session, token }) => {
      const user = token.user as AdapterUser & UserWithPermissions;
      session.user = {
        ...user,
      };

      // Make the raw JWT token available to your frontend
      session.accessToken = token.sub;

      return session;
    },
  },
});
