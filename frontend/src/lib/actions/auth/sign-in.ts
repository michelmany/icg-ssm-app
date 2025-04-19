"use server";

import { signInSchemaValues } from "@/components/forms/sign-in-form/sign-in-schema";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { ActionResult } from "../types";
import { TNError } from "@/lib/errors";

export default async function signInAction({
  email,
  password,
}: signInSchemaValues): Promise<ActionResult> {
  try {
    await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    return { success: true };
  } catch (e) {
    if (e instanceof AuthError && e.cause instanceof TNError) {
      return { success: false, message: e.cause.message };
    }

    return { success: false, message: "An internal error occured." };
  }
}
