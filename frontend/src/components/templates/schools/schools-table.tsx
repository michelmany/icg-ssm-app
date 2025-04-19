"use client";

import { School, SchoolListParams } from "@/lib/api/types";
import { Button, TableHeaderActionProps, Table } from "sd-tnrsm-library";
import {
  ColumnDefinition,
  TableState,
} from "sd-tnrsm-library";
import Link from "next/link";
import { useSetSearchParams } from '@/lib/hooks/use-set-search-params';

interface SchoolsTableProps {
  schools: School[];
  state: TableState<SchoolListParams>;
}

const columns: ColumnDefinition<School, SchoolListParams>[] = [
  {
    id: "name",
    title: "School",
    cell: (school) => (
      <Link href={`/admin/schools/view/${school.id}`}>
        {school.name}
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
    id: "district",
    title: "District",
    cell: (school) => school.district,
    sort: {
      field: "district",
    },
    filter: {
      field: "district",
      type: "input",
    },
  },
  {
    id: "state",
    title: "State",
    cell: (school) => school.state,
    sort: {
      field: "state",
    },
    filter: {
      field: "state",
      type: "input",
    },
  },
  {
    id: "contactEmail",
    title: "Contact Email",
    cell: (school) => school.contactEmail,
    sort: {
      field: "contactEmail",
    },
    filter: {
      field: "contactEmail",
      type: "input",
    },
  },
  {
    id: "actions",
    cell: (school) => (
      <Button size="xs">
        <Link href={`/admin/schools/edit/${school.id}`}>Edit</Link>
      </Button>
    ),
  },
];

export function SchoolsTable({ schools, state }: SchoolsTableProps) {
      const setSearchParams = useSetSearchParams();
      return (
      <div>
        <Table
          data={schools}
          columns={columns}
          state={state}
          onChange={setSearchParams}
          useHeader={true}
          headerTitle={"Schools Management"}
          headerActions={[
            {
              variant: "primary",
              size: "xs",
              icon: "PlusIcon",
              href: "/admin/schools/add",
              children: "Add School",
            } as TableHeaderActionProps,
          ]}
        />
    </div>
  );
}
