"use server";

import { apiClient } from "@/lib/api/client";
import { ActionResult } from "../types";
import { revalidatePath } from "next/cache";
import { schoolSchemaValues } from "@/components/forms/school-form/school-schema";

export async function createSchool(
  data: schoolSchemaValues,
): Promise<ActionResult> {
  try {
    const { error } = await apiClient.POST("/schools", {
      body: data,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/admin/schools");
    revalidatePath("/dashboard/schools");

    return { success: true };
  } catch {
    return {
      success: false,
      message: "An error occured while creating the school.",
    };
  }
}
