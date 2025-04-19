import { TherapyServicesTable } from "@/components/templates/therapy-services/therapy-services-table";
import { apiClient } from "@/lib/api/client";
import { Suspense } from "react";
import { z } from "zod";

const searchParamsSchema = z.object({
  student: z.string().optional(),
  provider: z.string().optional(),
  serviceType: z.enum(["SPEECH", "OCCUPATIONAL", "PHYSICAL"]).optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "MISSED"]).optional(),
  sessionDate: z.string().optional(),
  deliveryMode: z.enum(["VIRTUAL", "IN_PERSON"]).optional(),
  nextMeetingDate: z.string().optional(),

  sortBy: z
    .enum([
      "student",
      "provider",
      "serviceType",
      "status",
      "sessionDate", 
      "deliveryMode",
      "nextMeetingDate"
    ])
    .optional()
    .default("sessionDate"),
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

  const therapyServicesResponse = await apiClient.GET("/therapy-services", {
    params: {
      query,
    },
  });

  const therapyServices = therapyServicesResponse.data?.data ?? [];

  const { page, perPage, sortBy, sortOrder, ...filters } = query;
  const { pages, total } = therapyServicesResponse.data?.pagination ?? {
    pages: 1,
    total: 0,
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div>Loading...</div>}>
        <TherapyServicesTable
          therapyServices={therapyServices}
          state={{ page, perPage, pages, total, sortBy, sortOrder, filters }}
        />
      </Suspense>
    </div>
  );
}