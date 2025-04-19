"use client";

import { Report, ReportListParams } from "@/lib/api/types";
import { TableHeader, Button, TableHeaderActionProps } from "sd-tnrsm-library";
import {
  ColumnDefinition,
  DataTable,
  TableState,
} from "@/components/tables/data-table";
import Link from "next/link";

interface ReportsTableProps {
  reports: Report[];
  state: TableState<ReportListParams>;
}

const columns: ColumnDefinition<Report, ReportListParams>[] = [
  {
    id: "createdAt",
    title: "Created Date",
    cell: (report) => (
      <Link href={`/admin/reports/view/${report.id}`}>
        {new Date(report.createdAt).toLocaleDateString()}
      </Link>
    ),
    sort: {
      field: "createdAt",
    },
  },
  {
    id: "student",
    title: "Student",
    cell: (report) => report.student ? `${report.student.firstName} ${report.student.lastName}` : "—",
    sort: {
      field: "studentName",
    },
    filter: {
      field: "studentName",
      type: "input",
    },
  },
  {
    id: "school",
    title: "School",
    cell: (report) => report.school?.name || "—",
    sort: {
      field: "schoolName",
    },
    filter: {
      field: "schoolName",
      type: "input",
    },
  },
  {
    id: "therapyService",
    title: "Service Type",
    cell: (report) => report.therapyService?.serviceType || "—",
    sort: {
      field: "therapyServiceType",
    },
    filter: {
      field: "therapyServiceType",
      type: "select",
      options: [
        { name: "Speech", value: "SPEECH" },
        { name: "Occupational", value: "OCCUPATIONAL" },
        { name: "Physical", value: "PHYSICAL" },
      ],
    },
  },
  {
    id: "reportType",
    title: "Report Type",
    cell: (report) => report.reportType,
    sort: {
      field: "reportType",
    },
    filter: {
      field: "reportType",
      type: "select",
      options: [
        { name: "Progress", value: "PROGRESS" },
        { name: "Attendance", value: "ATTENDANCE" },
        { name: "Billing", value: "BILLING" },
        { name: "Eligibility", value: "ELIGIBILITY" },
      ],
    },
  },
  {
    id: "actions",
    cell: (report) => (
      <Button size="xs">
        <Link href={`/admin/reports/edit/${report.id}`}>Edit</Link>
      </Button>
    ),
  },
];

export function ReportsTable({ reports, state }: ReportsTableProps) {
  return (
    <div>
      <TableHeader
        title="Reports Management"
        actions={[
          {
            variant: "primary",
            size: "xs",
            icon: "PlusIcon",
            href: "/admin/reports/add",
            children: "Add Report",
          } as TableHeaderActionProps,
        ]}
      />
      <DataTable data={reports} columns={columns} state={state} />
    </div>
  );
}