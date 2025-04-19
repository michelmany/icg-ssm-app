import express, {NextFunction, Request, Response} from "express";
import {Therapists} from "../therapists";
import {PermissionsMiddleware} from "./role";
import {Users} from "../users";

export namespace TherapistsApi {
    export const route = express
        .Router()
        .get(
            "/",
            PermissionsMiddleware.middleware(Users.Permission.MANAGE_USERS),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const filter = Therapists.listParams.parse(req.query);

                    const {data, pagination} = await Therapists.list(filter);

                    res.status(200).json({data, pagination});
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
                    const params = Therapists.findParams.parse(req.params);

                    const data = await Therapists.find(params);

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
                    const params = Therapists.findParams.parse(req.params);
                    const data = Therapists.updateData.parse(req.body);

                    await Therapists.update({...params, ...data}, req.context);

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
                    const params = Therapists.findParams.parse(req.params);

                    await Therapists.remove(params, req.context);

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
                    const data = Therapists.createData.parse(req.body);

                    const id = await Therapists.create(data, req.context);

                    res.status(201).json({id});
                } catch (e) {
                    return next(e);
                }
            },
        );
}
