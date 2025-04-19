import { NextFunction, Request, Response } from "express";
import { Errors } from "../errors";
import { ZodError } from "zod";

export namespace Api {
  export const errorHandler = async (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (res.headersSent) {
      return next(err);
    }

    if (err instanceof Errors.TNError) {
      res.status(err.status).json({
        code: err.code,
        message: err.message,
        errors: err.errors,
      });
    } else if (err instanceof ZodError) {
      res.status(400).json({
        code: "INVALID_REQUEST",
        message: "Invalid request.",
        errors: err.errors.map(
          (error) => `${error.path.join("_")}: ${error.message}`,
        ),
      });
    } else {
      console.warn("An unhandled error occured: ", err);
      res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "An internal error occured.",
      });
    }
  };
}
