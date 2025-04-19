"use server";

import { apiClient } from "@/lib/api/client";
import { ActionResult } from "../types";
import { revalidatePath } from "next/cache";
import { studentSchemaValues } from "@/components/forms/student-form/student-schema";

export async function updateStudent(
  id: string,
  data: Partial<studentSchemaValues>,
): Promise<ActionResult> {
  try {
    const { error } = await apiClient.PATCH("/students/{id}", {
      params: {
        path: { id },
      },
      body: data,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/admin/students");
    revalidatePath("/dashboard/students");

    return { success: true };
  } catch {
    return {
      success: false,
      message: "An error occured while updating the student.",
    };
  }
}
