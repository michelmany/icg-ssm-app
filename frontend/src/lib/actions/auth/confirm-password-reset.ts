"use server";

import { confirmResetPasswordSchemaValues } from "@/components/forms/confirm-reset-password-form/confirm-reset-password-schema";
import { apiClient } from "@/lib/api/client";
import { ActionResult } from "../types";

export default async function confirmPasswordResetAction({
  email,
  newPassword,
  token,
}: confirmResetPasswordSchemaValues & {
  token: string;
}): Promise<ActionResult> {
  try {
    const { error } = await apiClient.POST("/auth/reset-password", {
      body: { email, newPassword, token },
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, message: "An internal error occured." };
  }
}
