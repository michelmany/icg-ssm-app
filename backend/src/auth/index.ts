import { encode, decode } from "@auth/core/jwt";
import { AuthConfig } from "../config/auth";
import { Users } from "../users";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Errors } from "../errors";
import { Emails } from "../emails";
import { Activity } from "../activity";
import { prisma } from "../db";

export namespace Auth {
  export const authenticate = async (token: string) => {
    const decoded = await decode({
      token,
      secret: AuthConfig.AUTH_SECRET,
      salt: "authjs.session-token",
    });

    const email = decoded?.email;

    if (!email) {
      throw new Errors.TNError("Unauthenticated.", {
        code: "UNAUTHENTICATED",
      });
    }

    const user = await Users.getWithPermissions(email);

    if (!user) {
      throw new Errors.TNError("Unauthenticated.", {
        code: "UNAUTHENTICATED",
      });
    }

    return user;
  };

  export const loginData = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  export const login = async ({
    email,
    password,
  }: z.infer<typeof loginData>) => {
    const passwordHash = await Users.getUserPasswordHash(email);

    if (!passwordHash) {
      throw new Errors.TNError("Invalid credentials.", {
        code: "INVALID_CREDENTIALS",
      });
    }

    const match = await bcrypt.compare(password, passwordHash);

    if (!match) {
      throw new Errors.TNError("Invalid credentials.", {
        code: "INVALID_CREDENTIALS",
      });
    }

    Activity.log({
      context: { email },
      action: Activity.Action.LOGIN,
    });

    const user = await Users.getWithPermissions(email);

    if (!user) {
      throw new Errors.TNError("Inactive account.", {
        code: "INACTIVE_ACCOUNT",
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate token
    const token = await encode({
      token: {
        email,
        sub: email,
        user: {
          email,
          permissions: user.permissions,
        },
      },
      secret: AuthConfig.AUTH_SECRET,
      salt: "authjs.session-token",
      maxAge: 3600,
    });

    return { token, user };
  };

  export const startPasswordResetData = z.object({
    email: z.string().email(),
  });

  export const startPasswordReset = async ({
    email,
  }: z.infer<typeof startPasswordResetData>) => {
    try {
      const token = crypto.randomBytes(50).toString("base64");
      const tokenExpiry = new Date(
        new Date().getTime() + AuthConfig.PASSWORD_RESET_TOKEN_MAX_AGE * 1000,
      );

      await Users.setPasswordResetToken({ email, token, tokenExpiry });

      await Emails.sendPasswordResetEmail({
        to: email,
        token,
      });
    } catch (e) {
      if (e instanceof Errors.TNError && e.code === "USER_NOT_FOUND") {
        return;
      }

      throw e;
    }
  };

  export const resetPasswordData = z.object({
    email: z.string().email(),
    token: z.string(),
    newPassword: z.string(),
  });

  export const resetPassword = async ({
    email,
    token,
    newPassword,
  }: z.infer<typeof resetPasswordData>) => {
    const passwordHash = await bcrypt.hash(
      newPassword,
      AuthConfig.BCRYPT_ROUNDS,
    );

    await Users.setPassword({
      email,
      token,
      passwordHash,
      type: Users.UserTokenType.PASSWORD_RESET,
    });

    Activity.log({
      context: { email },
      action: Activity.Action.RESET_PASSWORD,
    });
  };

  export const acceptInviteData = z.object({
    email: z.string().email(),
    token: z.string(),
    newPassword: z.string(),
  });

  export const acceptInvite = async ({
    email,
    token,
    newPassword,
  }: z.infer<typeof resetPasswordData>) => {
    const passwordHash = await bcrypt.hash(
      newPassword,
      AuthConfig.BCRYPT_ROUNDS,
    );

    await Users.setPassword({
      email,
      token,
      passwordHash,
      type: Users.UserTokenType.INVITATION,
      setActive: true,
    });

    Activity.log({
      context: { email },
      action: Activity.Action.ACCEPT_INVITE,
    });
  };
}
