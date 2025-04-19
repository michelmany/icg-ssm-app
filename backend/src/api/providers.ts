import express, {NextFunction, Request, Response} from "express";
import {Providers} from "../providers";
import {PermissionsMiddleware} from "./role";
import {Users} from "../users";

export namespace ProvidersApi {
    export const route = express
        .Router()
        .get(
            "/",
            PermissionsMiddleware.middleware(Users.Permission.MANAGE_USERS),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const filter = Providers.listParams.parse(req.query);

                    const {data, pagination} = await Providers.list(filter);

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
                    const params = Providers.findParams.parse(req.params);

                    const data = await Providers.find(params);

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
                    const params = Providers.findParams.parse(req.params);
                    const data = Providers.updateData.parse(req.body);

                    await Providers.update({...params, ...data}, req.context);

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
                    const params = Providers.findParams.parse(req.params);

                    await Providers.remove(params, req.context);

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
                    const data = Providers.createData.parse(req.body);

                    await Providers.create(data, req.context);

                    res.status(204).json();
                } catch (e) {
                    return next(e);
                }
            },
        )
        .post(
            "/:id/documents",
            PermissionsMiddleware.middleware(Users.Permission.MANAGE_USERS),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const params = Providers.findParams.parse(req.params);
                    const { documentIds } = req.body;
                    await Providers.addDocuments(params.id, documentIds);
                    res.status(200).json({ success: true });
                } catch (e) {
                    return next(e);
                }
            }
        )
        .delete(
            "/:id/documents",
            PermissionsMiddleware.middleware(Users.Permission.MANAGE_USERS),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const params = Providers.findParams.parse(req.params);
                    const { documentIds } = req.body;
                    await Providers.removeDocuments(params.id, documentIds);
                    res.status(200).json({ success: true });
                } catch (e) {
                    return next(e);
                }
            }
        )
        .post(
            "/:id/contracts",
            PermissionsMiddleware.middleware(Users.Permission.MANAGE_USERS),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const params = Providers.findParams.parse(req.params);
                    const { contractIds } = req.body;
                    await Providers.addContracts(params.id, contractIds);
                    res.status(200).json({ success: true });
                } catch (e) {
                    return next(e);
                }
            }
        )
        .delete(
            "/:id/contracts",
            PermissionsMiddleware.middleware(Users.Permission.MANAGE_USERS),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const params = Providers.findParams.parse(req.params);
                    const { contractIds } = req.body;
                    await Providers.removeContracts(params.id, contractIds);
                    res.status(200).json({ success: true });
                } catch (e) {
                    return next(e);
                }
            }
        )
        .post(
            "/:id/contacts",
            PermissionsMiddleware.middleware(Users.Permission.MANAGE_USERS),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const params = Providers.findParams.parse(req.params);
                    const { contactIds } = req.body;
                    await Providers.addContacts(params.id, contactIds);
                    res.status(200).json({ success: true });
                } catch (e) {
                    return next(e);
                }
            }
        )
        .delete(
            "/:id/contacts",
            PermissionsMiddleware.middleware(Users.Permission.MANAGE_USERS),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const params = Providers.findParams.parse(req.params);
                    const { contactIds } = req.body;
                    await Providers.removeContacts(params.id, contactIds);
                    res.status(200).json({ success: true });
                } catch (e) {
                    return next(e);
                }
            }
        );
}
