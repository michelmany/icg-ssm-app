import {extendZodWithOpenApi} from "@asteasolutions/zod-to-openapi";

import {genericErrorResponses, pagination} from "./common";
import {z} from "zod";
import {Invoices} from "../invoices";
import {registry} from "./registry";

extendZodWithOpenApi(z);

export const registerInvoicesPaths = () => {
    registry.registerPath({
        method: "get",
        path: "/invoices",
        description: "Get a list of invoices",
        request: {
            query: Invoices.listParams,
        },
        responses: {
            200: {
                description: "Object with data and pagination metadata",
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.array(Invoices.Info.openapi("Invoice")),
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
        path: "/invoices/{id}",
        description: "Get an invoice",
        request: {
            params: Invoices.findParams,
        },
        responses: {
            200: {
                description: "Object with data containing invoice information.",
                content: {
                    "application/json": {
                        schema: z.object({
                            data: Invoices.Info.openapi("Invoice"),
                        }),
                    },
                },
            },
            ...genericErrorResponses,
        },
    });

    registry.registerPath({
        method: "patch",
        path: "/invoices/{id}",
        description: "Update an invoice",
        request: {
            params: Invoices.findParams,
            body: {
                content: {
                    "application/json": {
                        schema: Invoices.updateData,
                    },
                },
            },
        },
        responses: {
            204: {
                description: "The invoice has been updated successfully.",
            },
            ...genericErrorResponses,
        },
    });

    registry.registerPath({
        method: "post",
        path: "/invoices",
        description: "Create an invoice",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: Invoices.createData,
                    },
                },
            },
        },
        responses: {
            201: {
                description: "The invoice has been created successfully.",
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
        path: "/invoices/{id}",
        description: "Delete an invoice",
        request: {
            params: Invoices.findParams,
        },
        responses: {
            204: {
                description: "The invoice has been deleted successfully.",
            },
            ...genericErrorResponses,
        },
    });
};
