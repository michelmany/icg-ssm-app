"use client";

import { twMerge } from "tailwind-merge";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Button, Input, SelectMenu, TablePagination } from "sd-tnrsm-library";
import { useSetSearchParams } from "@/lib/hooks/use-set-search-params";

export interface TableState<T> {
  sortBy: keyof T;
  sortOrder: "asc" | "desc";
  pages: number;
  total: number;
  page: number;
  perPage: number;
  filters: {
    [K in keyof T]: T[K];
  };
}

interface FilterOption {
  value: string;
  name: string;
}

export interface ColumnDefinition<T, V> {
  id: string;
  title?: string;
  cell: (data: T) => React.ReactNode;
  sort?: {
    field: keyof V;
  };
  filter?:
    | {
        field: keyof V;
        type: "input";
      }
    | { field: keyof V; type: "select"; options: FilterOption[] };
}

interface Row {
  id: string;
}

interface DataTableProps<T extends Row, V> {
  data: T[];
  columns: ColumnDefinition<T, V>[];
  state: TableState<V>;
}

const linesPerPageOptions = [
  {
    value: "10",
    name: "10",
  },
  {
    value: "20",
    name: "20",
  },
  {
    value: "50",
    name: "50",
  },
  {
    value: "100",
    name: "100",
  },
];

export const DataTable = <T extends Row, V>({
  data,
  columns,
  state,
}: DataTableProps<T, V>) => {
  const setSearchParams = useSetSearchParams();
  const { page, perPage, total } = state;

  const onPageChange = (page: number) => {
    setSearchParams({ page: page.toString() });
  };

  const onLinesPerPageChange = (perPage: string) => {
    setSearchParams({ perPage });
  };

  const onSort = (sort: Pick<TableState<V>, "sortBy" | "sortOrder">) => {
    setSearchParams(sort as Record<string, string>);
  };

  const onFilter = (filter: TableState<V>["filters"]) => {
    setSearchParams(filter as Record<string, string>);
  };

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                  >
                    <ColumnHeader
                      column={column}
                      state={state}
                      onSort={onSort}
                      onFilter={onFilter}
                    />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {data.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center">
                    No results found.
                  </td>
                </tr>
              )}
              {data.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0"
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <TablePagination
            currentPage={page}
            totalResults={total}
            numSelected={0}
            linesPerPage={perPage.toString()}
            linesPerPageOptions={linesPerPageOptions}
            showLinesPerPage={true}
            onPageChange={onPageChange}
            onLinesPerPageChange={onLinesPerPageChange}
          />
        </div>
      </div>
    </div>
  );
};

interface ColumnHeaderProps<T, V> {
  column: ColumnDefinition<T, V>;
  state: TableState<V>;
  onSort: (sort: Pick<TableState<V>, "sortBy" | "sortOrder">) => void;
  onFilter: (filter: TableState<V>["filters"]) => void;
}

const ColumnHeader = <T, V>({
  column,
  state,
  onSort,
  onFilter,
}: ColumnHeaderProps<T, V>) => {
  return (
    <>
      <ColumnSort column={column} state={state} onSort={onSort}>
        {column.title}
      </ColumnSort>
      <ColumnFilter column={column} state={state} onFilter={onFilter} />
    </>
  );
};

const ColumnSort = <T, V>({
  column,
  state,
  onSort,
  children,
}: React.PropsWithChildren<Omit<ColumnHeaderProps<T, V>, "onFilter">>) => {
  if (!column.sort) {
    return <div>{children}</div>;
  }

  const { sortBy, sortOrder } = state;

  const sorted = sortBy === column.sort.field;

  const sort = () => {
    if (!column.sort) {
      return;
    }

    if (sorted) {
      onSort({
        sortBy,
        sortOrder: sortOrder === "asc" ? "desc" : "asc",
      });
    } else {
      onSort({
        sortBy: column.sort.field,
        sortOrder: "asc",
      });
    }
  };

  return (
    <Button className="group inline-flex" onClick={sort}>
      {children}
      <span
        className={twMerge(
          "ml-2 flex-none rounded",
          sorted
            ? "rounded bg-gray-100 text-gray-900 group-hover:bg-gray-200"
            : "invisible text-gray-400 group-hover:visible group-focus:visible"
        )}
      >
        <ChevronDownIcon
          aria-hidden="true"
          className={twMerge(
            "size-5",
            sorted && sortOrder === "desc" ? "rotate-180" : ""
          )}
        />
      </span>
    </Button>
  );
};

interface ColumnHeaderProps<T, V> {
  column: ColumnDefinition<T, V>;
  state: TableState<V>;
  onSort: (sort: Pick<TableState<V>, "sortBy" | "sortOrder">) => void;
  onFilter: (filter: TableState<V>["filters"]) => void;
}

const ColumnFilter = <T, V>({
  column,
  state,
  onFilter,
}: Omit<ColumnHeaderProps<T, V>, "onSort">) => {
  if (!column.filter) {
    return null;
  }

  const { type, field } = column.filter;

  const filter = (value: V[keyof V] | undefined) => {
    if (!column.filter) {
      return;
    }

    onFilter({
      ...state.filters,
      [field]: value,
    });
  };

  if (type === "input") {
    return (
      <Input
        leadingIcon="HiMagnifyingGlass"
        className="w-72"
        value={`${state.filters[column.filter.field] ?? ""}`}
        onChange={(e) => filter(e.target.value as unknown as V[typeof field])}
      />
    );
  }

  if (type === "select") {
    const { options } = column.filter;

    return (
      <SelectMenu
        variant="primary"
        value={`${state.filters[column.filter.field] ?? ""}`}
        options={options}
        onChange={(value) => filter(value as unknown as V[typeof field])}
      />
    );
  }

  return null;
};
