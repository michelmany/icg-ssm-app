import {StudentServicesTable} from "@/components/templates/teachers/services-table";
import {apiClient} from "@/lib/api/client";
import {auth} from "@/lib/auth";
import {Suspense} from "react";

interface PageProps {
    params: Promise<{ studentId: string }>;
}

export default async function Page({params}: PageProps) {
    const {studentId} = await params;
    const session = await auth();
    const teacherId = session?.user?.id;

    if (!teacherId) {
        throw new Error("User not authenticated or teacher ID not found");
    }

    // Fetch student details
    const studentResponse = await apiClient.GET("/students/{id}", {
        params: {path: {id: studentId}},
    });

    const student = studentResponse.data?.data;

    const therapyServicesResponse = await apiClient.GET("/therapy-services", {
        params: {
            query: {
                studentId,
            }
        },
    });

    const therapyServices = therapyServicesResponse.data?.data || [];

    if (!student) {
        return <div>Student not found</div>;
    }

    const {pages, total} = therapyServicesResponse.data?.pagination ?? {
        pages: 1,
        total: 0,
    };

    const sortBy = "sessionDate";
    const sortOrder = "desc";
    const filters = {
        student: studentId,
        teacherId
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <p
                className={`
                    inline-flex 
                    items-center 
                    rounded-md mb-2
                    px-2
                    py-1
                    text-xs
                    font-medium
                    ring-1
                    ring-inset 
                    bg-green-50 
                    text-green-700 
                    ring-green-600/20 
                    hover:bg-green-100
                `}>
                {student.status}
            </p>
            <h1 className="text-2xl font-black mb-2">
                {student.firstName} {student.lastName}
            </h1>
            <div className={"mb-6"}>
                <p className={"text-xs font-medium leading-tight text-gray-500"}>
                    Grade <span className={"text-black mr-5"}>{student.gradeLevel}</span>
                    Student ID# <span className={"text-black mr-5"}>{student.id}</span>
                    {/*Enrollment Date <span className={"text-black mr-5"}>{}</span>*/}
                </p>
            </div>
            <Suspense fallback={<div>Loading therapy services...</div>}>
                <StudentServicesTable
                    therapyServices={therapyServices}
                    state={{page: 1, perPage: 10, pages, total, sortBy, sortOrder, filters}}
                />
            </Suspense>
        </div>
    );
}
