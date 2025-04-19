import express, { NextFunction, Request, Response } from "express";
import { Users } from "../users";
import { Auth } from "../auth";
import { Errors } from "../errors";

export namespace AuthApi {
  export interface AuthenticatedRequest extends Request {
    user: Users.UserWithPermissions;
  }

  export const middleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const token = req.header("Authorization")?.slice(7);

      if (!token) {
        throw new Errors.TNError("Unauthenticated.", {
          code: "UNAUTHENTICATED",
          status: 401,
        });
      }

      req.user = await Auth.authenticate(token);
      req.context = { user: req.user };

      next();
    } catch (e) {
      if (Errors.IsError(e, "UNAUTHENTICATED")) {
        e.status = 401;
      }
      next(e);
    }
  };

  export const route = express
    .Router()
    .post("/login", async (req: Request, res: Response, next: NextFunction) => {
      try {
        const loginData = Auth.loginData.parse(req.body);

        const { token, user } = await Auth.login(loginData);

        res.status(200).json({
          data: user,
          token,
        });
      } catch (e) {
        next(e);
      }
    })
    .post(
      "/start-password-reset",
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const startPasswordResetData = Auth.startPasswordResetData.parse(
            req.body,
          );

          res.status(204).json();

          await Auth.startPasswordReset(startPasswordResetData);
        } catch (e) {
          next(e);
        }
      },
    )
    .post(
      "/reset-password",
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const resetPasswordData = Auth.resetPasswordData.parse(req.body);

          await Auth.resetPassword(resetPasswordData);

          res.status(204).json();
        } catch (e) {
          if (
            Errors.IsError(e, "RESET_TOKEN_EXPIRED") ||
            Errors.IsError(e, "INVALID_RESET_TOKEN")
          ) {
            e.status = 400;
          }

          next(e);
        }
      },
    )
    .post(
      "/accept-invite",
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const acceptInviteData = Auth.acceptInviteData.parse(req.body);

          await Auth.acceptInvite(acceptInviteData);

          res.status(204).json();
        } catch (e) {
          if (
            Errors.IsError(e, "RESET_TOKEN_EXPIRED") ||
            Errors.IsError(e, "INVALID_RESET_TOKEN")
          ) {
            e.status = 400;
          }

          next(e);
        }
      },
    );
}
