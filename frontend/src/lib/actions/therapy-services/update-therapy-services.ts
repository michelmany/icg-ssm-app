"use server";

import { apiClient } from "@/lib/api/client";
import { ActionResult } from "../types";
import { revalidatePath } from "next/cache";
import { therapyServicesSchemaValues } from "@/components/forms/therapy-services-form/therapy-services-schema";

export async function updateTherapyService(
  id: string,
  data: Partial<therapyServicesSchemaValues>,
): Promise<ActionResult> {
  try {
    const { error } = await apiClient.PATCH("/therapy-services/{id}", {
      params: {
        path: { id },
      },
      body: data,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/admin/therapy-services");
    revalidatePath("/dashboard/therapy-services");

    return { success: true };
  } catch {
    return {
      success: false,
      message: "An error occurred while updating the therapy service.",
    };
  }
}