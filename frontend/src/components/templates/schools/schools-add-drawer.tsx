"use client";

import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { SchoolForm } from "@/components/forms/school-form/school-form";
import { schoolSchemaValues } from "@/components/forms/school-form/school-schema";
import { createSchool } from "@/lib/actions/schools/create-school";
import { useRouter } from "next/navigation";

export const SchoolsAddDrawer = () => {
  const router = useRouter();

  const handleCreateSchool = async (values: schoolSchemaValues) => {
    const { success, message } = await createSchool(values);
    if (success) {
      router.back();
    } else {
      throw new Error(message);
    }
  };

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="Create a new school"
      headerSubtext="Fill out the school details."
      width="wide"
    >
      <SchoolForm onSubmit={handleCreateSchool} />
    </RoutedDrawer>
  );
};
