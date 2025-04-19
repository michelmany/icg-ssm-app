import {extendZodWithOpenApi} from "@asteasolutions/zod-to-openapi";

import {genericErrorResponses, pagination} from "./common";
import {z} from "zod";
import {TherapyServices} from "../therapy-services";
import {registry} from "./registry";

extendZodWithOpenApi(z);

export const registerTherapyServicesPaths = () => {
    registry.registerPath({
        method: "get",
        path: "/therapy-services",
        description: "Get a list of therapy services",
        request: {
            query: TherapyServices.listParams,
        },
        responses: {
            200: {
                description: "Object with data and pagination metadata",
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.array(TherapyServices.Info.openapi("TherapyService")),
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
        path: "/therapy-services/{id}",
        description: "Get a therapy service",
        request: {
            params: TherapyServices.findParams,
        },
        responses: {
            200: {
                description: "Object with data containing therapy service information.",
                content: {
                    "application/json": {
                        schema: z.object({
                            data: TherapyServices.Info.openapi("TherapyService"),
                        }),
                    },
                },
            },
            ...genericErrorResponses,
        },
    });

    registry.registerPath({
        method: "patch",
        path: "/therapy-services/{id}",
        description: "Update a therapy service",
        request: {
            params: TherapyServices.findParams,
            body: {
                content: {
                    "application/json": {
                        schema: TherapyServices.updateData,
                    },
                },
            },
        },
        responses: {
            204: {
                description: "The therapy service has been updated successfully.",
            },
            ...genericErrorResponses,
        },
    });

    registry.registerPath({
        method: "post",
        path: "/therapy-services",
        description: "Create a therapy service",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: TherapyServices.createData,
                    },
                },
            },
        },
        responses: {
            204: {
                description: "The therapy service has been created successfully.",
            },
            ...genericErrorResponses,
        },
    });

    registry.registerPath({
        method: "delete",
        path: "/therapy-services/{id}",
        description: "Delete a therapy service",
        request: {
            params: TherapyServices.findParams,
        },
        responses: {
            204: {
                description: "The therapy service has been deleted successfully.",
            },
            ...genericErrorResponses,
        },
    });
};
