import { Activity } from "../../activity";
import { Users } from "../../users";
import * as express from "express";

declare global {
  namespace Express {
    export interface Request {
      user: Users.UserWithPermissions;
      context?: Activity.Context;
    }
  }
}
