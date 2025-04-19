import { SchoolsTable } from "@/components/templates/schools/schools-table";
import { apiClient } from "@/lib/api/client";
import { Suspense } from "react";
import { z } from "zod";

const searchParamsSchema = z.object({
  name: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  contactEmail: z.string().optional(),
  maxTravelDistance: z.number().optional(),
  maxStudentsPerTest: z.number().optional(),

  sortBy: z
    .enum([
      "name",
      "district",
      "state",
      "contactEmail",
      "maxTravelDistance",
      "maxStudentsPerTest",
    ])
    .optional()
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),

  perPage: z.number({ coerce: true }).gte(1).default(20),
  page: z.number({ coerce: true }).gte(1).default(1),
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, unknown>>;
}) {
  const query = searchParamsSchema.parse(await searchParams);

  const schoolsResponse = await apiClient.GET("/schools", {
    params: {
      query,
    },
  });

  const schools = schoolsResponse.data?.data ?? [];

  const { page, perPage, sortBy, sortOrder, ...filters } = query;
  const { pages, total } = schoolsResponse.data?.pagination ?? {
    pages: 1,
    total: 0,
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div>Loading...</div>}>
        <SchoolsTable
          schools={schools}
          state={{ page, perPage, pages, total, sortBy, sortOrder, filters }}
        />
      </Suspense>
    </div>
  );
}
