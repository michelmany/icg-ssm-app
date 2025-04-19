import { z } from "zod";
import { prisma } from "../db";
import { Users } from "../users";

export namespace Activity {
  export interface Context {
    user?: Users.UserWithPermissions | null;
    email?: string | null;
  }

  export enum Action {
    CREATE_USER = "CREATE_USER",
    UPDATE_USER = "UPDATE_USER",
    DELETE_USER = "DELETE_USER",
    INVITE_USER = "INVITE_USER",

    CREATE_SCHOOL = "CREATE_SCHOOL",
    UPDATE_SCHOOL = "UPDATE_SCHOOL",
    DELETE_SCHOOL = "DELETE_SCHOOL",

    CREATE_STUDENT = "CREATE_STUDENT",
    UPDATE_STUDENT = "UPDATE_STUDENT",
    DELETE_STUDENT = "DELETE_STUDENT",

    ACCEPT_INVITE = "ACCEPT_INVITE",
    LOGIN = "LOGIN",
    RESET_PASSWORD = "RESET_PASSWORD",

    CREATE_PROVIDER = "CREATE_PROVIDER",
    UPDATE_PROVIDER = "UPDATE_PROVIDER",
    DELETE_PROVIDER = "DELETE_PROVIDER",

    CREATE_THERAPIST = "CREATE_THERAPIST",
    UPDATE_THERAPIST = "UPDATE_THERAPIST",
    DELETE_THERAPIST = "DELETE_THERAPIST",

    CREATE_THERAPY_SERVICE = "CREATE_THERAPY_SERVICE",
    UPDATE_THERAPY_SERVICE = "UPDATE_THERAPY_SERVICE",
    DELETE_THERAPY_SERVICE = "DELETE_THERAPY_SERVICE",

    CREATE_REPORT = "CREATE_REPORT",
    UPDATE_REPORT = "UPDATE_REPORT",
    DELETE_REPORT = "DELETE_REPORT",

    CREATE_INVOICE = "CREATE_INVOICE",
    UPDATE_INVOICE = "UPDATE_INVOICE",
    DELETE_INVOICE = "DELETE_INVOICE",
  }

  interface LogOptions {
    context?: Context;
    subjectId?: string;
    action: Action;
  }

  export const log = async ({ context, subjectId, action }: LogOptions) => {
    if (!context) {
      return;
    }

    try {
      const userId = await userIdFromContext(context);

      if (!userId) {
        return;
      }

      await prisma.activityLog.create({
        data: {
          userId,
          subjectId,
          action,
        },
      });
    } catch (e) {
      console.warn("An error occured while logging activity:", e);
    }
  };

  export const userIdFromContext = async (context: Context) => {
    if (context.user) {
      return context.user.id;
    }

    if (context.email) {
      const user = await Users.findByEmail({ email: context.email });
      return user.id;
    }

    return undefined;
  };
}
