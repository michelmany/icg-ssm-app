"use client";

import {TherapyService, TherapyServiceListParams} from "@/lib/api/types";
import {Button, Table, TextCell, TableState, ColumnDefinition} from "sd-tnrsm-library";
import {useSetSearchParams} from '@/lib/hooks/use-set-search-params';
import {twMerge} from "tailwind-merge";
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
            <TextCell title={service.sessionDate ? new Date(service.sessionDate).toLocaleDateString('en-US') : "—"}/>
        ),
        canHide: true,
        sort: {field: "sessionDate"},
    },
    {
        id: "nextMeetingDate",
        title: "Next Meeting Date",
        cell: (service) => (
            <TextCell title={service.nextMeetingDate ? new Date(service.nextMeetingDate).toLocaleDateString('en-US') : "—"}/>
        ),
        canHide: true,
        sort: {field: "nextMeetingDate"},
    },
    {
        id: "provider",
        title: "Provider",
        cell: (service) => (
            <TextCell title={`${service.provider.user.firstName} ${service.provider.user.lastName}`}/>
        ),
        canHide: true,
        sort: {field: "provider"},
    },
    {
        id: "serviceType",
        title: "Service Type",
        cell: (service) => (
            <TextCell title={service.serviceType}/>
        ),
        canHide: true,
        sort: {field: "serviceType"},
    },
    {
        id: "deliveryMode",
        title: "Delivery Mode",
        cell: (service) => (
            <TextCell title={service.deliveryMode}/>
        ),
        canHide: true,
        sort: {field: "deliveryMode"},
    },
    {
        id: "status",
        title: "Status",
        cell: (service) => (
            <Button
                variant="soft"
                size="xs"
                className={twMerge(
                    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                    service.status !== "SCHEDULED"
                        ? "bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100"
                        : "bg-red-50 text-red-700 ring-red-600/20 hover:bg-red-100",
                )}
            >
                {service.status}
            </Button>
        ),
        canHide: true,
        sort: {
            field: "status",
        },
    },
    {
        id: "actions",
        cell: (service) => (
            <Button size="xs" variant={"soft"}>
                <Link href={`/dashboard/teachers/students/services/edit/${service.id}`}>Edit</Link>
            </Button>
        ),
    },
];

export function StudentServicesTable({therapyServices, state}: TherapyServicesTableProps) {
    const setSearchParams = useSetSearchParams();

    return (
        <Table
            data={therapyServices}
            columns={columns}
            state={state}
            stickyNumber={0}
            stickySide="left"
            hasCheckbox={false}
            useHeader
            headerTitle={"Services"}
            useFilters
            onChange={setSearchParams}
        />
    );
}
