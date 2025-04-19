import createClient from "openapi-fetch";
import type { paths } from "./schema";
import { API_URL } from "@/config/api";
import { cookies } from "next/headers";

export const apiClient = createClient<paths>({
  baseUrl: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.use({
  onRequest: async ({ request }) => {
    const requestCookies = await cookies();
    const token = requestCookies.get("authjs.session-token")?.value;
    request.headers.set("Authorization", `Bearer ${token}`);
  },
});

export class ApiError extends Error {}
