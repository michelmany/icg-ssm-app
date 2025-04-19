"use client";

import { Therapist, TherapistListParams } from "@/lib/api/types";
import { TableHeader, Button, TableHeaderActionProps } from "sd-tnrsm-library";
import {
  ColumnDefinition,
  DataTable,
  TableState,
} from "@/components/tables/data-table";
import Link from "next/link";

interface TherapistsTableProps {
  therapists: Therapist[];
  state: TableState<TherapistListParams>;
}

const columns: ColumnDefinition<Therapist, TherapistListParams>[] = [
  {
    id: "name",
    title: "Name",
    cell: (therapist) => (
      <Link href={`/admin/therapists/view/${therapist.id}`}>
        {therapist.name}
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
    id: "disciplines",
    title: "Disciplines",
    cell: (therapist) => therapist.disciplines,
    sort: {
      field: "disciplines",
    },
    filter: {
      field: "disciplines",
      type: "input",
    },
  },
  {
    id: "licenseNumber",
    title: "License Number",
    cell: (therapist) => therapist.licenseNumber,
    sort: {
      field: "licenseNumber",
    },
    filter: {
      field: "licenseNumber",
      type: "input",
    },
  },
  {
    id: "medicaidNationalProviderId",
    title: "MNP ID",
    cell: (therapist) => therapist.medicaidNationalProviderId,
    sort: {
      field: "medicaidNationalProviderId",
    },
    filter: {
      field: "medicaidNationalProviderId",
      type: "input",
    },
  },
  {
    id: "stateMedicaidProviderId",
    title: "SMP ID",
    cell: (therapist) => therapist.stateMedicaidProviderId,
    sort: {
      field: "stateMedicaidProviderId",
    },
    filter: {
      field: "stateMedicaidProviderId",
      type: "input",
    },
  },
  {
    id: "status",
    title: "Status",
    cell: (therapist) => therapist.status,
    sort: {
      field: "status",
    },
    filter: {
      field: "status",
      type: "select",
      options: [
        { name: "Active", value: "ACTIVE" },
        { name: "Inactive", value: "INACTIVE" },
        { name: "Pending", value: "PENDING" },
      ],
    },
  },
  {
    id: "actions",
    cell: (therapist) => (
      <Button size="xs">
        <Link href={`/admin/therapists/edit/${therapist.id}`}>Edit</Link>
      </Button>
    ),
  },
];

export function TherapistsTable({ therapists, state }: TherapistsTableProps) {
  return (
    <div>
      <TableHeader
        title="Therapists Management"
        actions={[
          {
            variant: "primary",
            size: "xs",
            icon: "PlusIcon",
            href: "/admin/therapists/add",
            children: "Add Therapist",
          } as TableHeaderActionProps,
        ]}
      />
      <DataTable data={therapists} columns={columns} state={state} />
    </div>
  );
}