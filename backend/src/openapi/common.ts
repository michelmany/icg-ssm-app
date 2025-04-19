import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registry } from "./registry";

extendZodWithOpenApi(z);

export const pagination = z
  .object({
    pages: z.number(),
    total: z.number(),
  })
  .openapi("Pagination");

export const errorResponse = registry.registerComponent(
  "responses",
  "GenericErrorResponse",
  {
    description: "The request failed.",
    content: {
      "application/json": {
        schema: {
          properties: {
            message: {
              type: "string",
            },
            code: {
              type: "string",
            },
            errors: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
      },
    },
  },
);

export const genericErrorResponses = {
  400: errorResponse.ref,
  404: errorResponse.ref,
  401: errorResponse.ref,
  403: errorResponse.ref,
  500: errorResponse.ref,
};
