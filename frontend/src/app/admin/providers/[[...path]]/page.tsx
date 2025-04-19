import { ProvidersTable } from "@/components/templates/providers/providers-table";
import { apiClient } from "@/lib/api/client";
import { Suspense } from "react";
import { z } from "zod";

const searchParamsSchema = z.object({
  name: z.string().optional(),
  licenseNumber: z.string().optional(),
  credentials: z.string().optional(),
  nssEnabled: z.preprocess(
    (val) => (val === "true" ? true : val === "false" ? false : val),
    z.boolean().optional()
  ),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"]).optional(),
  serviceFeeStructure: z.enum(["HOURLY", "FLAT_RATE", "PER_DIEM"]).optional(),

  sortBy: z
    .enum([
      "name",
      "licenseNumber",
      "credentials",
      "nssEnabled",
      "serviceFeeStructure",
      "status",
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

  const providersResponse = await apiClient.GET("/providers", {
    params: { query },
  });

  const providers = providersResponse.data?.data ?? [];

  const { page, perPage, sortBy, sortOrder, ...filters } = query;
  const { pages, total } = providersResponse.data?.pagination ?? {
    pages: 1,
    total: 0,
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div>Loading...</div>}>
        <ProvidersTable
          providers={providers}
          state={{ page, perPage, pages, total, sortBy, sortOrder, filters }}
        />
      </Suspense>
    </div>
  );
}
