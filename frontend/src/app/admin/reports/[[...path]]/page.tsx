import { ReportsTable } from "@/components/templates/reports/reports-table";
import { apiClient } from "@/lib/api/client";
import { Suspense } from "react";
import { z } from "zod";

const searchParamsSchema = z.object({
  reportType: z.enum(["PROGRESS", "ATTENDANCE", "BILLING", "ELIGIBILITY"]).optional(),
  schoolName: z.string().optional(),
  studentName: z.string().optional(),
  therapyServiceType: z.enum(["SPEECH", "OCCUPATIONAL", "PHYSICAL"]).optional(),
  content: z.string().optional(),

  sortBy: z
    .enum([
      "reportType",
      "schoolName",
      "studentName",
      "therapyServiceType",
      "createdAt"
    ])
    .optional()
    .default("studentName"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),

  perPage: z.number({ coerce: true }).gte(1).default(20),
  page: z.number({ coerce: true }).gte(1).default(1),
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, unknown>>;
}) {
  const query = searchParamsSchema.parse(await searchParams);

  const reportsResponse = await apiClient.GET("/reports", {
    params: {
      query,
    },
  });

  const reports = reportsResponse.data?.data ?? [];

  const { page, perPage, sortBy, sortOrder, ...filters } = query;
  const { pages, total } = reportsResponse.data?.pagination ?? {
    pages: 1,
    total: 0,
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div>Loading...</div>}>
        <ReportsTable
          reports={reports}
          state={{ page, perPage, pages, total, sortBy, sortOrder, filters }}
        />
      </Suspense>
    </div>
  );
}