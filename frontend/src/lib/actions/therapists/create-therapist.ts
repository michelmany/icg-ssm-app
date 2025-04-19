"use server";

import { apiClient } from "@/lib/api/client";
import { ActionResult } from "../types";
import { revalidatePath } from "next/cache";
import { therapistSchemaValues } from "@/components/forms/therapist-form/therapist-schema";

export async function createTherapist(
  data: therapistSchemaValues,
): Promise<ActionResult> {
  try {
    const { error } = await apiClient.POST("/therapists", {
      body: data,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/admin/therapists");
    revalidatePath("/dashboard/therapists");

    return { success: true };
  } catch {
    return {
      success: false,
      message: "An error occurred while creating the therapist.",
    };
  }
}