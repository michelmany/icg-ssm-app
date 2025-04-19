import {extendZodWithOpenApi} from "@asteasolutions/zod-to-openapi";

import {genericErrorResponses, pagination} from "./common";
import {z} from "zod";
import {Reports} from "../reports";
import {registry} from "./registry";

extendZodWithOpenApi(z);

export const registerReportsPaths = () => {
    registry.registerPath({
        method: "get",
        path: "/reports",
        description: "Get a list of reports",
        request: {
            query: Reports.listParams,
        },
        responses: {
            200: {
                description: "Object with data and pagination metadata",
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.array(Reports.Info.openapi("Report")),
                            pagination,
                        }),
                    },
                },
            },
            ...genericErrorResponses,
        },
    });

    registry.registerPath({
        method: "get",
        path: "/reports/{id}",
        description: "Get a report",
        request: {
            params: Reports.findParams,
        },
        responses: {
            200: {
                description: "Object with data containing report information.",
                content: {
                    "application/json": {
                        schema: z.object({
                            data: Reports.Info.openapi("Report"),
                        }),
                    },
                },
            },
            ...genericErrorResponses,
        },
    });

    registry.registerPath({
        method: "patch",
        path: "/reports/{id}",
        description: "Update a report",
        request: {
            params: Reports.findParams,
            body: {
                content: {
                    "application/json": {
                        schema: Reports.updateData,
                    },
                },
            },
        },
        responses: {
            204: {
                description: "The report has been updated successfully.",
            },
            ...genericErrorResponses,
        },
    });

    registry.registerPath({
        method: "post",
        path: "/reports",
        description: "Create a report",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: Reports.createData,
                    },
                },
            },
        },
        responses: {
            201: {
                description: "The report has been created successfully.",
                content: {
                    "application/json": {
                        schema: z.object({
                            id: z.string().uuid(),
                        }),
                    },
                },
            },
            ...genericErrorResponses,
        },
    });

    registry.registerPath({
        method: "delete",
        path: "/reports/{id}",
        description: "Delete a report",
        request: {
            params: Reports.findParams,
        },
        responses: {
            204: {
                description: "The report has been deleted successfully.",
            },
            ...genericErrorResponses,
        },
    });
};
