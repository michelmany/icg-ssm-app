import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { Auth } from "../auth";
import { Users } from "../users";
import { registry } from "./registry";
import { genericErrorResponses } from "./common";
extendZodWithOpenApi(z);

export const registerAuthPaths = () => {
  registry.registerPath({
    method: "post",
    path: "/auth/login",
    description: "Authenticate with email and password.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: Auth.loginData,
          },
        },
      },
    },
    responses: {
      200: {
        description: "User with permissions object.",
        content: {
          "application/json": {
            schema: z.object({
              data: Users.InfoWithPermissions.openapi("UserWithPermissions"),
            }),
          },
        },
      },
      ...genericErrorResponses,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/start-password-reset",
    description: "Request a password reset token that will be sent over email.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: Auth.startPasswordResetData,
          },
        },
      },
    },
    responses: {
      204: {
        description:
          "The password reset email will be sent if the user exists.",
      },
      ...genericErrorResponses,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/reset-password",
    description: "Reset a user's password.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: Auth.resetPasswordData,
          },
        },
      },
    },
    responses: {
      204: {
        description: "The password has been reset successfully.",
      },
      ...genericErrorResponses,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/accept-invite",
    description: "Accept an invite and set the account's password.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: Auth.acceptInviteData,
          },
        },
      },
    },
    responses: {
      204: {
        description: "The password has been set successfully.",
      },
      ...genericErrorResponses,
    },
  });
};
