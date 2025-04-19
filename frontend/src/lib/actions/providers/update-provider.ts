"use server";

import { apiClient } from "@/lib/api/client";
import { ActionResult } from "../types";
import { revalidatePath } from "next/cache";
import { providerSchemaValues } from "@/components/forms/provider-form/provider-schema";

export async function updateProvider(
  id: string,
  data: Partial<providerSchemaValues>,
): Promise<ActionResult> {
  try {
    const { error } = await apiClient.PATCH("/providers/{id}", {
      params: {
        path: { id },
      },
      body: data,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/admin/providers");
    revalidatePath("/dashboard/providers");

    return { success: true };
  } catch {
    return {
      success: false,
      message: "An error occurred while updating the provider.",
    };
  }
}
