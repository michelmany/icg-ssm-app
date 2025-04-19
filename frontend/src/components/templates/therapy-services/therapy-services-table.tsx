"use client";

import { TherapyService, TherapyServiceListParams } from "@/lib/api/types";
import { TableHeader, Button, TableHeaderActionProps } from "sd-tnrsm-library";
import {
  ColumnDefinition,
  DataTable,
  TableState,
} from "@/components/tables/data-table";
import Link from "next/link";

interface TherapyServicesTableProps {
  therapyServices: TherapyService[];
  state: TableState<TherapyServiceListParams>;
}

const columns: ColumnDefinition<TherapyService, TherapyServiceListParams>[] = [
  {
    id: "sessionDate",
    title: "Session Date",
    cell: (service) => (
      <Link href={`/admin/therapy-services/view/${service.id}`}>
        {new Date(service.sessionDate).toLocaleDateString()}
      </Link>
    ),
    sort: {
      field: "sessionDate",
    },
  },
  {
    id: "nextMeetingDate",
    title: "Next Meeting Date",
    cell: (service) => service.nextMeetingDate ? new Date(service.nextMeetingDate).toLocaleDateString() : "—",
    sort: {
      field: "nextMeetingDate",
    },
  },
  {
    id: "student",
    title: "Student",
    cell: (service) => `${service.student.firstName} ${service.student.lastName}`,
    sort: {
      field: "student",
    },
    filter: {
      field: "student",
      type: "input",
    },
  },
  {
    id: "provider",
    title: "Provider",
    cell: (service) => `${service.provider.user.firstName} ${service.provider.user.lastName}`,
    sort: {
      field: "provider",
    },
    filter: {
      field: "provider",
      type: "input",
    },
  },
  {
    id: "serviceType",
    title: "Service Type",
    cell: (service) => service.serviceType,
    sort: {
      field: "serviceType",
    },
    filter: {
      field: "serviceType",
      type: "select",
      options: [
        { name: "Speech", value: "SPEECH" },
        { name: "Occupational", value: "OCCUPATIONAL" },
        { name: "Physical", value: "PHYSICAL" },
      ],
    },
  },
  {
    id: "deliveryMode",
    title: "Delivery Mode",
    cell: (service) => service.deliveryMode,
    sort: {
      field: "deliveryMode",
    },
    filter: {
      field: "deliveryMode",
      type: "select",
      options: [
        { name: "Virtual", value: "VIRTUAL" },
        { name: "In Person", value: "IN_PERSON" },
      ],
    },
  },
  {
    id: "status",
    title: "Status",
    cell: (service) => service.status,
    sort: {
      field: "status",
    },
    filter: {
      field: "status",
      type: "select",
      options: [
        { name: "Scheduled", value: "SCHEDULED" },
        { name: "Completed", value: "COMPLETED" },
        { name: "Missed", value: "MISSED" },
      ],
    },
  },
  {
    id: "actions",
    cell: (service) => (
      <Button size="xs">
        <Link href={`/admin/therapy-services/edit/${service.id}`}>Edit</Link>
      </Button>
    ),
  },
];

export function TherapyServicesTable({ therapyServices, state }: TherapyServicesTableProps) {
  return (
    <div>
      <TableHeader
        title="Therapy Services Management"
        actions={[
          {
            variant: "primary",
            size: "xs",
            icon: "PlusIcon",
            href: "/admin/therapy-services/add",
            children: "Add Therapy Service",
          } as TableHeaderActionProps,
        ]}
      />
      <DataTable data={therapyServices} columns={columns} state={state} />
    </div>
  );
}