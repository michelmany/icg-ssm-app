"use client";

import { User, UserListParams, UserRole } from "@/lib/api/types";
import { Button, TableHeaderActionProps, Table } from "sd-tnrsm-library";
import {
  ColumnDefinition,
  TableState,
} from "sd-tnrsm-library";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { Status } from "@/types/users";
import Link from "next/link";
import { updateUser } from "@/lib/actions/users/update-user";
import { useSetSearchParams } from '@/lib/hooks/use-set-search-params';

interface UsersTableProps {
  users: User[];
  state: TableState<UserListParams>;
}

const toggleUserStatus = (user: User) => async () => {
  updateUser(user.id, {
    status: user.status === "ACTIVE" ? Status.INACTIVE : Status.ACTIVE,
  });
};

const columns: ColumnDefinition<User, UserListParams>[] = [
  {
    id: "user",
    title: "User",
    cell: (user) => (
      <div className="flex items-center">
        <div className="size-11 shrink-0">
          <Image
            alt=""
            src="/avatar.jpg"
            width={44}
            height={44}
            className="size-11 rounded-full"
          />
        </div>
        <div className="ml-4">
          <div className="font-medium text-gray-900">
            <Link href={`/admin/users/view/${user.id}`}>
              {user.firstName} {user.lastName}
            </Link>
          </div>
          <div className="mt-1 text-gray-500">{user.email}</div>
        </div>
      </div>
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
    cell: (user) => `${user.school.name}`,
    sort: {
      field: "school",
    },
    filter: {
      field: "school",
      type: "input",
    },
  },
  {
    id: "role",
    title: "Role",
    cell: (user) => `${user.role.name}`,
    sort: {
      field: "role",
    },
    filter: {
      field: "role",
      type: "select",
      options: [
        { value: UserRole.ADMIN, name: "Admin" },
        { value: UserRole.TEACHER, name: "Teacher" },
        { value: UserRole.THERAPIST, name: "Therapist" },
        { value: UserRole.PROVIDER, name: "Provider" },
        { value: UserRole.SUPERVISOR, name: "Supervisor" },
      ],
    },
  },
  {
    id: "status",
    title: "Status",
    cell: (user) => (
      <Button
        onClick={toggleUserStatus(user)}
        variant="soft"
        size="xs"
        className={twMerge(
          "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
          user.status === Status.ACTIVE
            ? "bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100"
            : "bg-red-50 text-red-700 ring-red-600/20 hover:bg-red-100"
        )}
      >
        {user.status}
      </Button>
    ),
    sort: {
      field: "status",
    },
    filter: {
      field: "status",
      type: "select",
      options: [
        { value: "ACTIVE", name: "Active" },
        { value: "INACTIVE", name: "Inactive" },
      ],
    },
  },
  {
    id: "actions",
    cell: (user) => (
      <Button size="xs" link={`/admin/users/edit/${user.id}`}>
        Edit
      </Button>
    ),
  },
];

export function UsersTable({ users, state }: UsersTableProps) {
  const setSearchParams = useSetSearchParams();
  return (
    <div>
      <Table
        data={users}
        columns={columns}
        state={state}
        onChange={setSearchParams}
        useHeader={true}
        headerTitle={"User Management"}
        headerActions={[
          {
            variant: "primary",
            size: "xs",
            icon: "PlusIcon",
            href: "/admin/users/add",
            children: "Add User",
          } as TableHeaderActionProps,
        ]}
      />
    </div>
  );
}
