"use server";

import { resetPasswordSchemaValues } from "@/components/forms/reset-password-form/reset-password-schema";
import { apiClient } from "@/lib/api/client";
import { ActionResult } from "../types";

export default async function startPasswordResetAction({
  email,
}: resetPasswordSchemaValues): Promise<ActionResult> {
  try {
    await apiClient.POST("/auth/start-password-reset", {
      body: { email },
    });

    return { success: true };
  } catch {
    return { success: false, message: "An internal error occured." };
  }
}
