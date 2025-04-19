import express, {NextFunction, Request, Response} from "express";
import {Invoices} from "../invoices";
import {PermissionsMiddleware} from "./role";
import {Users} from "../users";

export namespace InvoicesApi {
    export const route = express
        .Router()
        .get(
            "/",
            PermissionsMiddleware.middleware(Users.Permission.VIEW_INVOICES),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const filter = Invoices.listParams.parse(req.query);

                    const {data, pagination} = await Invoices.list(filter);

                    res.status(200).json({data, pagination});
                } catch (e) {
                    return next(e);
                }
            },
        )
        .get(
            "/:id",
            PermissionsMiddleware.middleware(Users.Permission.VIEW_INVOICES),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const params = Invoices.findParams.parse(req.params);

                    const data = await Invoices.find(params);

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
            PermissionsMiddleware.middleware(Users.Permission.VIEW_INVOICES),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const params = Invoices.findParams.parse(req.params);
                    const data = Invoices.updateData.parse(req.body);

                    await Invoices.update({...params, ...data}, req.context);

                    res.status(204).json();
                } catch (e) {
                    return next(e);
                }
            },
        )
        .delete(
            "/:id",
            PermissionsMiddleware.middleware(Users.Permission.VIEW_INVOICES),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const params = Invoices.findParams.parse(req.params);

                    await Invoices.remove(params, req.context);

                    res.status(204).json();
                } catch (e) {
                    return next(e);
                }
            },
        )
        .post(
            "/",
            PermissionsMiddleware.middleware(Users.Permission.VIEW_INVOICES),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const data = Invoices.createData.parse(req.body);

                    const id = await Invoices.create(data, req.context);

                    res.status(201).json({id});
                } catch (e) {
                    return next(e);
                }
            },
        );
}
