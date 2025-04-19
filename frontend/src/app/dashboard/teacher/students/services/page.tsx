import {StudentsTable} from "@/components/templates/teachers/students-services-table";
import {apiClient} from "@/lib/api/client";
import {ConfirmationStatus, Status} from "@/types/students";
import {Suspense} from "react";
import {z} from "zod";
import {auth} from "@/lib/auth";

const searchParamsSchema = z.object({
    name: z.string().optional(),
    gradeLevel: z.number({coerce: true}).optional(),
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

    perPage: z.number({coerce: true}).gte(1).default(20),
    page: z.number({coerce: true}).gte(1).default(1),
});

export default async function Page({searchParams}: {
    searchParams: Promise<Record<string, unknown>>;
}) {
    // Get the current user session to identify the teacher
    const session = await auth();
    const teacherId = session?.user?.id;

    if (!teacherId) {
        throw new Error("User not authenticated or teacher ID not found");
    }

    const query = searchParamsSchema.parse(await searchParams);

    const studentsResponse = await apiClient.GET("/students", {
        params: {
            query: {
                ...query,
                teacherId
            }
        },
    });

    const students = studentsResponse.data?.data ?? [];

    const {page, perPage, sortBy, sortOrder, ...filters} = query;
    const {pages, total} = studentsResponse.data?.pagination ?? {
        pages: 1,
        total: 0,
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <Suspense fallback={<div>Loading...</div>}>
                <StudentsTable
                    students={students}
                    state={{page, perPage, pages, total, sortBy, sortOrder, filters}}
                />
            </Suspense>
        </div>
    );
}
