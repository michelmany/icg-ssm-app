"use client";

import { Student, StudentListParams } from "@/lib/api/types";
import { Button, TableHeader, TableHeaderActionProps } from "sd-tnrsm-library";
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
      <Link href={`/admin/students/view/${student.id}`}>
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
        { name: "Active", value: "ACTIVE" },
        { name: "Inactive", value: "INACTIVE" },
      ],
    },
  },
  {
    id: "confirmationStatus",
    title: "Confirmation Status",
    cell: (student) => student.confirmationStatus,
    sort: {
      field: "confirmationStatus",
    },
    filter: {
      field: "confirmationStatus",
      type: "select",
      options: [
        { name: "Confirmed", value: "CONFIRMED" },
        { name: "Pending", value: "PENDING" },
        { name: "Rescheduled", value: "RESCHEDULED" },
      ],
    },
  },
  {
    id: "actions",
    cell: (student) => (
      <Button size="xs">
        <Link href={`/admin/students/edit/${student.id}`}>Edit</Link>
      </Button>
    ),
  },
];

export function StudentsTable({ students, state }: StudentsTableProps) {
  return (
    <div>
      <TableHeader
        title="Students Management"
        actions={[
          {
            variant: "primary",
            size: "xs",
            icon: "PlusIcon",
            href: "/admin/students/add",
            children: "Add Student",
          } as TableHeaderActionProps,
        ]}
      />
      <DataTable data={students} columns={columns} state={state} />
    </div>
  );
}
