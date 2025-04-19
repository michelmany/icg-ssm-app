import express, { NextFunction, Request, Response } from "express";
import { Students } from "../students";
import { PermissionsMiddleware } from "./role";
import { Users } from "../users";

export namespace StudentsApi {
  export const route = express
    .Router()
    .get(
      "/",
      PermissionsMiddleware.middleware(Users.Permission.ASSIGN_STUDENTS),
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const filter = Students.listParams.parse(req.query);

          const { data, pagination } = await Students.list(filter);

          res.status(200).json({ data, pagination });
        } catch (e) {
          return next(e);
        }
      },
    )
    .get(
      "/:id",
      PermissionsMiddleware.middleware(Users.Permission.ASSIGN_STUDENTS),
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const params = Students.findParams.parse(req.params);

          const data = await Students.find(params);

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
          const params = Students.findParams.parse(req.params);
          const data = Students.updateData.parse(req.body);

          await Students.update({ ...params, ...data }, req.context);

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
          const params = Students.findParams.parse(req.params);

          await Students.remove(params, req.context);

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
          const data = Students.createData.parse(req.body);

          await Students.create(data, req.context);

          res.status(204).json();
        } catch (e) {
          return next(e);
        }
      },
    );
}
