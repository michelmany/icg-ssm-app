import { UsersTable } from "@/components/templates/users/users-table";
import { apiClient } from "@/lib/api/client";
import { Role, Status } from "@/types/users";
import { Suspense } from "react";
import { z } from "zod";

const searchParamsSchema = z.object({
  name: z.string().optional(),
  school: z.string().optional(),

  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(Status).optional(),

  sortBy: z
    .enum(["name", "school", "role", "status"])
    .optional()
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),

  perPage: z.number({ coerce: true }).gte(10).lte(100).default(20),
  page: z.number({ coerce: true }).gte(1).default(1),
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, unknown>>;
}) {
  const query = searchParamsSchema.parse(await searchParams);

  const usersResponse = await apiClient.GET("/users", {
    params: {
      query,
    },
  });

  const users = usersResponse.data?.data ?? [];

  const { page, perPage, sortBy, sortOrder, ...filters } = query;
  const { pages, total } = usersResponse.data?.pagination ?? {
    pages: 1,
    total: 0,
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div>Loading...</div>}>
        <UsersTable
          users={users}
          state={{ page, perPage, pages, total, sortBy, sortOrder, filters }}
        />
      </Suspense>
    </div>
  );
}
