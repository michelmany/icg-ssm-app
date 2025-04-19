import express, { NextFunction, Request, Response } from "express";
import { Schools } from "../schools";
import { PermissionsMiddleware } from "./role";
import { Users } from "../users";

export namespace SchoolsApi {
  export const route = express
    .Router()
    .get(
      "/",
      PermissionsMiddleware.middleware(Users.Permission.MANAGE_USERS),
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const filter = Schools.listParams.parse(req.query);

          const { data, pagination } = await Schools.list(filter);

          res.status(200).json({ data, pagination });
        } catch (e) {
          return next(e);
        }
      },
    )
    .get(
      "/:id",
      PermissionsMiddleware.middleware(Users.Permission.MANAGE_USERS),
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const params = Schools.findParams.parse(req.params);

          const data = await Schools.find(params);

          res.status(200).json({
            data,
          });
        } catch (e) {
          return next(e);
        }
      },
    )
    .patch(
      "/:id",
      PermissionsMiddleware.middleware(Users.Permission.MANAGE_USERS),
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const params = Schools.findParams.parse(req.params);
          const data = Schools.updateData.parse(req.body);

          await Schools.update({ ...params, ...data }, req.context);

          res.status(204).json();
        } catch (e) {
          return next(e);
        }
      },
    )
    .delete(
      "/:id",
      PermissionsMiddleware.middleware(Users.Permission.MANAGE_USERS),
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const params = Schools.findParams.parse(req.params);

          await Schools.remove(params, req.context);

          res.status(204).json();
        } catch (e) {
          return next(e);
        }
      },
    )
    .post(
      "/",
      PermissionsMiddleware.middleware(Users.Permission.MANAGE_USERS),
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const data = Schools.createData.parse(req.body);

          await Schools.create(data, req.context);

          res.status(204).json();
        } catch (e) {
          return next(e);
        }
      },
    );
}
