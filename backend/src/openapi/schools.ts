import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

import { genericErrorResponses, pagination } from "./common";
import { z } from "zod";
import { Schools } from "../schools";
import { registry } from "./registry";
extendZodWithOpenApi(z);

export const registerSchoolsPaths = () => {
  registry.registerPath({
    method: "get",
    path: "/schools",
    description: "Get a list of schools",
    request: {
      query: Schools.listParams,
    },
    responses: {
      200: {
        description: "Object with data and pagination metadata",
        content: {
          "application/json": {
            schema: z.object({
              data: z.array(Schools.Info.openapi("School")),
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
    path: "/schools/{id}",
    description: "Get a school",
    request: {
      params: Schools.findParams,
    },
    responses: {
      200: {
        description: "Object with data containing school information.",
        content: {
          "application/json": {
            schema: z.object({
              data: Schools.Info.openapi("School"),
            }),
          },
        },
      },
      ...genericErrorResponses,
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/schools/{id}",
    description: "Update a school",
    request: {
      params: Schools.findParams,
      body: {
        content: {
          "application/json": {
            schema: Schools.updateData,
          },
        },
      },
    },
    responses: {
      204: {
        description: "The school has been updated successfully.",
      },
      ...genericErrorResponses,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/schools",
    description: "Create a school",
    request: {
      body: {
        content: {
          "application/json": {
            schema: Schools.createData,
          },
        },
      },
    },
    responses: {
      204: {
        description: "The school has been created successfully.",
      },
      ...genericErrorResponses,
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/schools/{id}",
    description: "Delete a school",
    request: {
      params: Schools.findParams,
    },
    responses: {
      204: {
        description: "The school has been deleted successfully.",
      },
      ...genericErrorResponses,
    },
  });
};
