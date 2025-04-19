import express, {NextFunction, Request, Response} from "express";
import {TherapyServices} from "../therapy-services";
import {PermissionsMiddleware} from "./role";
import {Users} from "../users";

export namespace TherapyServicesApi {
    export const route = express
        .Router()
        .get(
            "/",
            PermissionsMiddleware.middleware(Users.Permission.ASSIGN_STUDENTS),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const filter = TherapyServices.listParams.parse(req.query);

                    const {data, pagination} = await TherapyServices.list(filter);

                    res.status(200).json({data, pagination});
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
                    const params = TherapyServices.findParams.parse(req.params);

                    const data = await TherapyServices.find(params);

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
                    const params = TherapyServices.findParams.parse(req.params);
                    const data = TherapyServices.updateData.parse(req.body);

                    await TherapyServices.update({...params, ...data}, req.context);

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
                    const params = TherapyServices.findParams.parse(req.params);

                    await TherapyServices.remove(params, req.context);

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
                    const data = TherapyServices.createData.parse(req.body);

                    await TherapyServices.create(data, req.context);

                    res.status(204).json();
                } catch (e) {
                    return next(e);
                }
            },
        );
}
