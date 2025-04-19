import { TherapistsTable } from "@/components/templates/therapists/therapists-table";
import { apiClient } from "@/lib/api/client";
import { Suspense } from "react";
import { z } from "zod";

const searchParamsSchema = z.object({
  name: z.string().optional(),
  disciplines: z.string().optional(),
  licenseNumber: z.string().optional(),
  medicaidNationalProviderId: z.number({ coerce: true }).optional(),
  stateMedicaidProviderId: z.number({ coerce: true }).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),

  sortBy: z
    .enum([
      "name",
      "disciplines",
      "licenseNumber",
      "medicaidNationalProviderId",
      "stateMedicaidProviderId",
      "status"
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

  const therapistsResponse = await apiClient.GET("/therapists", {
    params: {
      query,
    },
  });

  const therapists = therapistsResponse.data?.data ?? [];

  const { page, perPage, sortBy, sortOrder, ...filters } = query;
  const { pages, total } = therapistsResponse.data?.pagination ?? {
    pages: 1,
    total: 0,
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div>Loading...</div>}>
        <TherapistsTable
          therapists={therapists}
          state={{ page, perPage, pages, total, sortBy, sortOrder, filters }}
        />
      </Suspense>
    </div>
  );
}