import { StudentsTable } from "@/components/templates/students/students-table";
import { apiClient } from "@/lib/api/client";
import { ConfirmationStatus, Status } from "@/types/students";
import { Suspense } from "react";
import { z } from "zod";

const searchParamsSchema = z.object({
  name: z.string().optional(),
  gradeLevel: z.number({ coerce: true }).optional(),
  school: z.string().optional(),
  parent: z.string().optional(),
  studentCode: z.string().optional(),
  status: z.nativeEnum(Status).optional(),
  confirmationStatus: z.nativeEnum(ConfirmationStatus).optional(),

  sortBy: z
    .enum([
      "name",
      "dob",
      "gradeLevel",
      "school",
      "parent",
      "studentCode",
      "status",
      "confirmationStatus",
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

  const studentsResponse = await apiClient.GET("/students", {
    params: {
      query,
    },
  });

  const students = studentsResponse.data?.data ?? [];

  const { page, perPage, sortBy, sortOrder, ...filters } = query;
  const { pages, total } = studentsResponse.data?.pagination ?? {
    pages: 1,
    total: 0,
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div>Loading...</div>}>
        <StudentsTable
          students={students}
          state={{ page, perPage, pages, total, sortBy, sortOrder, filters }}
        />
      </Suspense>
    </div>
  );
}
