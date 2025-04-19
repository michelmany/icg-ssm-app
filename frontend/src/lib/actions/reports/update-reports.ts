"use server";

import { apiClient } from "@/lib/api/client";
import { ActionResult } from "../types";
import { revalidatePath } from "next/cache";
import { reportSchemaValues } from "@/components/forms/report-form/report-schema";

export async function updateReport(
  id: string,
  data: Partial<reportSchemaValues>,
): Promise<ActionResult> {
  try {
    const { error } = await apiClient.PATCH("/reports/{id}", {
      params: {
        path: { id },
      },
      body: data,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/admin/reports");
    revalidatePath("/dashboard/reports");

    return { success: true };
  } catch {
    return {
      success: false,
      message: "An error occurred while updating the report.",
    };
  }
}