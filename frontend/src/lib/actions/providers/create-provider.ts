"use server";

import { apiClient } from "@/lib/api/client";
import { ActionResult } from "../types";
import { revalidatePath } from "next/cache";
import { providerSchemaValues } from "@/components/forms/provider-form/provider-schema";

export async function createProvider(
  data: providerSchemaValues,
): Promise<ActionResult> {
  try {
    console.log(data, "provider data - create-provider");
    const { error } = await apiClient.POST("/providers", {
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
      message: "An error occurred while creating the provider.",
    };
  }
}
