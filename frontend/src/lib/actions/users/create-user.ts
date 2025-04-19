"use server";

import { apiClient } from "@/lib/api/client";
import { ActionResult } from "../types";
import { revalidatePath } from "next/cache";
import { userSchemaValues } from "@/components/forms/user-form/user-schema";

export async function createUser(
  data: userSchemaValues,
): Promise<ActionResult> {
  try {
    const { error } = await apiClient.POST("/users", {
      body: data,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/admin/users");
    revalidatePath("/dashboard/users");

    return { success: true };
  } catch {
    return {
      success: false,
      message: "An error occured while creating the user.",
    };
  }
}
