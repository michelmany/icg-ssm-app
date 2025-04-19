"use server";

import { apiClient } from "@/lib/api/client";
import { ActionResult } from "../types";
import { revalidatePath } from "next/cache";
import { therapistSchemaValues } from "@/components/forms/therapist-form/therapist-schema";

export async function updateTherapist(
  id: string,
  data: Partial<therapistSchemaValues>,
): Promise<ActionResult> {
  try {
    const { error } = await apiClient.PATCH("/therapists/{id}", {
      params: {
        path: { id },
      },
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
      message: "An error occurred while updating the therapist.",
    };
  }
}