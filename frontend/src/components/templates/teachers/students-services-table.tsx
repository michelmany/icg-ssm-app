"use client";

import {Student, StudentListParams} from "@/lib/api/types";
import {TableHeader} from "sd-tnrsm-library";
import {
    ColumnDefinition,
    DataTable,
    TableState,
} from "@/components/tables/data-table";
import Link from "next/link";

interface StudentsTableProps {
    students: Student[];
    state: TableState<StudentListParams>;
}

const columns: ColumnDefinition<Student, StudentListParams>[] = [
    {
        id: "name",
        title: "Student",
        cell: (student) => (
            <Link href={`/dashboard/teacher/students/services/${student.id}`}>
                {student.firstName} {student.lastName}
            </Link>
        ),
        sort: {
            field: "name",
        },
        filter: {
            field: "name",
            type: "input",
        },
    },
    {
        id: "school",
        title: "School",
        cell: (student) => `${student.school.name}`,
        sort: {
            field: "school",
        },
        filter: {
            field: "school",
            type: "input",
        },
    },
    {
        id: "gradeLevel",
        title: "Grade",
        cell: (student) => student.gradeLevel,
        sort: {
            field: "gradeLevel",
        },
        filter: {
            field: "gradeLevel",
            type: "input",
        },
    },
    {
        id: "studentCode",
        title: "Code",
        cell: (student) => student.studentCode,
        sort: {
            field: "studentCode",
        },
        filter: {
            field: "gradeLevel",
            type: "input",
        },
    },
    {
        id: "status",
        title: "Status",
        cell: (student) => student.status,
        sort: {
            field: "status",
        },
        filter: {
            field: "status",
            type: "select",
            options: [
                {name: "Active", value: "ACTIVE"},
                {name: "Inactive", value: "INACTIVE"},
            ],
        },
    },
];

export function StudentsTable({students, state}: StudentsTableProps) {
    return (
        <div>
            <TableHeader
                title="Students Services"
                actions={[]}
            />
            <DataTable data={students} columns={columns} state={state}/>
        </div>
    );
}
