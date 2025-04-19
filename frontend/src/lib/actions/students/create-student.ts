"use server";

import { apiClient } from "@/lib/api/client";
import { ActionResult } from "../types";
import { revalidatePath } from "next/cache";
import { studentSchemaValues } from "@/components/forms/student-form/student-schema";

export async function createStudent(
  data: studentSchemaValues,
): Promise<ActionResult> {
  try {
    const { error } = await apiClient.POST("/students", {
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
      message: "An error occured while creating the student.",
    };
  }
}
