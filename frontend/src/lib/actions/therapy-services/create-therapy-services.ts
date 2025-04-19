"use server";

import { apiClient } from "@/lib/api/client";
import { ActionResult } from "../types";
import { revalidatePath } from "next/cache";
import { therapyServicesSchemaValues } from "@/components/forms/therapy-services-form/therapy-services-schema";

export async function createTherapyService(
  data: therapyServicesSchemaValues,
): Promise<ActionResult> {
  try {
    const formattedData = {
      ...data,
      sessionDate: data.sessionDate ?? null,
      nextMeetingDate: data.nextMeetingDate ?? null,
      serviceBeginDate: data.serviceBeginDate ?? null,
      sessionNotes: data.sessionNotes ?? "",
    };

    const { error } = await apiClient.POST("/therapy-services", {
      body: formattedData,
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
      message: "An error occurred while creating the therapy service.",
    };
  }
}