import express, {NextFunction, Request, Response} from "express";
import {Reports} from "../reports";
import {PermissionsMiddleware} from "./role";
import {Users} from "../users";

export namespace ReportsApi {
    export const route = express
        .Router()
        .get(
            "/",
            PermissionsMiddleware.middleware(Users.Permission.VIEW_REPORTS),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const filter = Reports.listParams.parse(req.query);

                    const {data, pagination} = await Reports.list(filter);

                    res.status(200).json({data, pagination});
                } catch (e) {
                    return next(e);
                }
            },
        )
        .get(
            "/:id",
            PermissionsMiddleware.middleware(Users.Permission.VIEW_REPORTS),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const params = Reports.findParams.parse(req.params);

                    const data = await Reports.find(params);

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
            PermissionsMiddleware.middleware(Users.Permission.VIEW_REPORTS),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const params = Reports.findParams.parse(req.params);
                    const data = Reports.updateData.parse(req.body);

                    await Reports.update({...params, ...data}, req.context);

                    res.status(204).json();
                } catch (e) {
                    return next(e);
                }
            },
        )
        .delete(
            "/:id",
            PermissionsMiddleware.middleware(Users.Permission.VIEW_REPORTS),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const params = Reports.findParams.parse(req.params);

                    await Reports.remove(params, req.context);

                    res.status(204).json();
                } catch (e) {
                    return next(e);
                }
            },
        )
        .post(
            "/",
            PermissionsMiddleware.middleware(Users.Permission.VIEW_REPORTS),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const data = Reports.createData.parse(req.body);

                    const id = await Reports.create(data, req.context);

                    res.status(201).json({id});
                } catch (e) {
                    return next(e);
                }
            },
        );
}
