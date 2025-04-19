import {extendZodWithOpenApi} from "@asteasolutions/zod-to-openapi";

import {genericErrorResponses, pagination} from "./common";
import {z} from "zod";
import {Therapists} from "../therapists";
import {registry} from "./registry";

extendZodWithOpenApi(z);

export const registerTherapistsPaths = () => {
    registry.registerPath({
        method: "get",
        path: "/therapists",
        description: "Get a list of therapists",
        request: {
            query: Therapists.listParams,
        },
        responses: {
            200: {
                description: "Object with data and pagination metadata",
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.array(Therapists.Info.openapi("Therapist")),
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
        path: "/therapists/{id}",
        description: "Get a therapist",
        request: {
            params: Therapists.findParams,
        },
        responses: {
            200: {
                description: "Object with data containing therapist information.",
                content: {
                    "application/json": {
                        schema: z.object({
                            data: Therapists.Info.openapi("Therapist"),
                        }),
                    },
                },
            },
            ...genericErrorResponses,
        },
    });

    registry.registerPath({
        method: "patch",
        path: "/therapists/{id}",
        description: "Update a therapist",
        request: {
            params: Therapists.findParams,
            body: {
                content: {
                    "application/json": {
                        schema: Therapists.updateData,
                    },
                },
            },
        },
        responses: {
            204: {
                description: "The therapist has been updated successfully.",
            },
            ...genericErrorResponses,
        },
    });

    registry.registerPath({
        method: "post",
        path: "/therapists",
        description: "Create a therapist",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: Therapists.createData,
                    },
                },
            },
        },
        responses: {
            204: {
                description: "The therapist has been created successfully.",
            },
            ...genericErrorResponses,
        },
    });

    registry.registerPath({
        method: "delete",
        path: "/therapists/{id}",
        description: "Delete a therapist",
        request: {
            params: Therapists.findParams,
        },
        responses: {
            204: {
                description: "The therapist has been deleted successfully.",
            },
            ...genericErrorResponses,
        },
    });
};
