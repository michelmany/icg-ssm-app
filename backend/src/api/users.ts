import express, { NextFunction, Request, Response } from "express";
import { Users } from "../users";
import { PermissionsMiddleware } from "./role";

export namespace UserApi {
  export const route = express
    .Router()
    .get(
      "/",
      PermissionsMiddleware.middleware(Users.Permission.MANAGE_USERS),
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const filter = Users.listParams.parse(req.query);

          const { data, pagination } = await Users.list(filter);

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
          const params = Users.findParams.parse(req.params);

          const data = await Users.find(params);

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
          const params = Users.findParams.parse(req.params);
          const data = Users.updateData.parse(req.body);

          await Users.update({ ...params, ...data }, req.context);

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
          const params = Users.findParams.parse(req.params);

          await Users.remove(params, req.context);

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
          const params = Users.createParams.parse(req.query);
          const data = Users.createData.parse(req.body);

          await Users.create({ ...params, ...data }, req.context);

          res.status(204).json();
        } catch (e) {
          return next(e);
        }
      },
    );
}
