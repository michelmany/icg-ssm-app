import express, { Request, Response, NextFunction } from "express";
import { Users } from "../users";
import { Roles } from "../roles";
import { Errors } from "../errors";

export namespace PermissionsMiddleware {
  export const middleware = (requirePermission: Users.Permission) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!Users.hasPermission(req.user, requirePermission)) {
          throw new Errors.TNError("Unauthorized.", {
            code: "UNAUTHORIZED",
            status: 403,
          });
        }

        next();
      } catch (e) {
        next(e);
      }
    };
  };

  export const route = express
    .Router()
    .get(
      "/",
      PermissionsMiddleware.middleware(Users.Permission.MANAGE_USERS),
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const filter = Roles.listParams.parse(req.query);

          const { data, pagination } = await Roles.list(filter);

          res.status(200).json({ data, pagination });
        } catch (e) {
          return next(e);
        }
      },
    );
}

