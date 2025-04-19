"use client";

import { Provider, ProviderListParams } from "@/lib/api/types";
import { Button, TableHeader, TableHeaderActionProps } from "sd-tnrsm-library";
import {
  ColumnDefinition,
  DataTable,
  TableState,
} from "@/components/tables/data-table";
import Link from "next/link";

interface ProvidersTableProps {
  providers: Provider[];
  state: TableState<ProviderListParams>;
}

const columns: ColumnDefinition<Provider, ProviderListParams>[] = [
  {
    id: "provider",
    title: "Provider",
    cell: (provider) => (
      <Link href={`/admin/providers/view/${provider.id}`}>
        {provider.user.firstName} {provider.user.lastName}
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
    id: "licenseNumber",
    title: "License #",
    cell: (provider) => provider.licenseNumber,
    sort: {
      field: "licenseNumber",
    },
    filter: {
      field: "licenseNumber",
      type: "input",
    },
  },
  {
    id: "credentials",
    title: "Credentials",
    cell: (provider) => provider.credentials,
    sort: {
      field: "credentials",
    },
    filter: {
      field: "credentials",
      type: "input",
    },
  },
  {
    id: "serviceFeeStructure",
    title: "Service Fee Structure",
    cell: (provider) => provider.serviceFeeStructure,
    sort: {
      field: "serviceFeeStructure",
    },
    filter: {
      field: "serviceFeeStructure",
      type: "select",
      options: [
        { name: "Hourly", value: "HOURLY" },
        { name: "Flat Rate", value: "FLAT_RATE" },
        { name: "Per Diem", value: "PER_DIEM" },
      ],
    },
  },
  {
    id: "status",
    title: "Status",
    cell: (provider) => provider.status,
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
        { name: "Suspended", value: "SUSPENDED" },
      ],
    },
  },
  {
    id: "nssEnabled",
    title: "NSS Enabled",
    cell: (provider) => (provider.nssEnabled ? "Yes" : "No"),
    sort: {
      field: "nssEnabled",
    },
    filter: {
      field: "nssEnabled",
      type: "select",
      options: [
        { name: "Yes", value: "true" },
        { name: "No", value: "false" },
      ],
    },
  },
  {
    id: "actions",
    cell: (provider) => (
      <Button size="xs">
        <Link href={`/admin/providers/edit/${provider.id}`}>Edit</Link>
      </Button>
    ),
  },
];

export function ProvidersTable({ providers, state }: ProvidersTableProps) {
  return (
    <div>
      <TableHeader
        title="Providers Management"
        actions={[{
          variant: "primary",
          size: "xs",
          icon: "PlusIcon",
          href: "/admin/providers/add",
          children: "Add Provider",
        } as TableHeaderActionProps]}
      />
      <DataTable data={providers} columns={columns} state={state} />
    </div>
  );
}
