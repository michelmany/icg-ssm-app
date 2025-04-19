import {extendZodWithOpenApi} from "@asteasolutions/zod-to-openapi";

import {genericErrorResponses, pagination} from "./common";
import {z} from "zod";
import {Providers} from "../providers";
import {registry} from "./registry";

extendZodWithOpenApi(z);

export const registerProvidersPaths = () => {
    registry.registerPath({
        method: "get",
        path: "/providers",
        description: "Get a list of providers",
        request: {
            query: Providers.listParams,
        },
        responses: {
            200: {
                description: "Object with data and pagination metadata",
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.array(Providers.Info.openapi("Provider")),
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
        path: "/providers/{id}",
        description: "Get a provider",
        request: {
            params: Providers.findParams,
        },
        responses: {
            200: {
                description: "Object with data containing provider information.",
                content: {
                    "application/json": {
                        schema: z.object({
                            data: Providers.Info.openapi("Provider"),
                        }),
                    },
                },
            },
            ...genericErrorResponses,
        },
    });

    registry.registerPath({
        method: "patch",
        path: "/providers/{id}",
        description: "Update a provider",
        request: {
            params: Providers.findParams,
            body: {
                content: {
                    "application/json": {
                        schema: Providers.updateData,
                    },
                },
            },
        },
        responses: {
            204: {
                description: "The provider has been updated successfully.",
            },
            ...genericErrorResponses,
        },
    });

    registry.registerPath({
        method: "post",
        path: "/providers",
        description: "Create a provider",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: Providers.createData,
                    },
                },
            },
        },
        responses: {
            204: {
                description: "The provider has been created successfully.",
            },
            ...genericErrorResponses,
        },
    });

    registry.registerPath({
        method: "delete",
        path: "/providers/{id}",
        description: "Delete a provider",
        request: {
            params: Providers.findParams,
        },
        responses: {
            204: {
                description: "The provider has been deleted successfully.",
            },
            ...genericErrorResponses,
        },
    });
};
