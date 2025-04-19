import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

import { genericErrorResponses, pagination } from "./common";
import { z } from "zod";
import { Students } from "../students";
import { registry } from "./registry";
extendZodWithOpenApi(z);

export const registerStudentsPaths = () => {
  registry.registerPath({
    method: "get",
    path: "/students",
    description: "Get a list of students",
    request: {
      query: Students.listParams,
    },
    responses: {
      200: {
        description: "Object with data and pagination metadata",
        content: {
          "application/json": {
            schema: z.object({
              data: z.array(Students.Info.openapi("Student")),
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
    path: "/students/{id}",
    description: "Get a student",
    request: {
      params: Students.findParams,
    },
    responses: {
      200: {
        description: "Object with data containing student information.",
        content: {
          "application/json": {
            schema: z.object({
              data: Students.Info.openapi("Student"),
            }),
          },
        },
      },
      ...genericErrorResponses,
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/students/{id}",
    description: "Update a student",
    request: {
      params: Students.findParams,
      body: {
        content: {
          "application/json": {
            schema: Students.updateData,
          },
        },
      },
    },
    responses: {
      204: {
        description: "The student has been updated successfully.",
      },
      ...genericErrorResponses,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/students",
    description: "Create a student",
    request: {
      body: {
        content: {
          "application/json": {
            schema: Students.createData,
          },
        },
      },
    },
    responses: {
      204: {
        description: "The student has been created successfully.",
      },
      ...genericErrorResponses,
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/students/{id}",
    description: "Delete a student",
    request: {
      params: Students.findParams,
    },
    responses: {
      204: {
        description: "The student has been deleted successfully.",
      },
      ...genericErrorResponses,
    },
  });
};
