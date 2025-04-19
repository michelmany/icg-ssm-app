import { z } from "zod";
import { genericErrorResponses, pagination } from "./common";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { Users } from "../users";
import { Roles } from "../roles";
import { registry } from "./registry";
extendZodWithOpenApi(z);

export const registerUsersPaths = () => {
  registry.registerPath({
    method: "get",
    path: "/users",
    description: "Get list of users",
    request: {
      query: Users.listParams,
    },
    responses: {
      200: {
        description: "Object with data and pagination metadata",
        content: {
          "application/json": {
            schema: z.object({
              data: z.array(Users.Info.openapi("User")),
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
    path: "/users/{id}",
    description: "Get a user",
    request: {
      params: Users.findParams,
    },
    responses: {
      200: {
        description: "Object with data containing user information.",
        content: {
          "application/json": {
            schema: z.object({
              data: Users.Info.openapi("User"),
            }),
          },
        },
      },
      ...genericErrorResponses,
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/users/{id}",
    description: "Update a user",
    request: {
      params: Users.findParams,
      body: {
        content: {
          "application/json": {
            schema: Users.updateData,
          },
        },
      },
    },
    responses: {
      204: {
        description: "The user has been updated successfully.",
      },
      ...genericErrorResponses,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/users",
    description: "Create a user",
    request: {
      query: Users.createParams,
      body: {
        content: {
          "application/json": {
            schema: Users.createData,
          },
        },
      },
    },
    responses: {
      204: {
        description:
          "The user has been created (and invited, if chosen) successfully.",
      },
      ...genericErrorResponses,
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/users/{id}",
    description: "Delete a user",
    request: {
      params: Users.findParams,
    },
    responses: {
      204: {
        description: "The user has been deleted successfully.",
      },
      ...genericErrorResponses,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/roles",
    description: "Get a list of roles",
    request: {
      query: Roles.listParams,
    },
    responses: {
      200: {
        description: "Object with data and pagination metadata",
        content: {
          "application/json": {
            schema: z.object({
              data: z.array(Roles.Info.openapi("Role")),
              pagination,
            }),
          },
        },
      },
      ...genericErrorResponses,
    },
  });
};
