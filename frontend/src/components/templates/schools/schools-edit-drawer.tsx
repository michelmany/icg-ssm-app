"use client";

import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { SchoolForm } from "@/components/forms/school-form/school-form";
import { schoolSchemaValues } from "@/components/forms/school-form/school-schema";
import { updateSchool } from "@/lib/actions/schools/update-school";
import { School } from "@/lib/api/types";
import { useRouter } from "next/navigation";

interface SchoolsEditDrawerProps {
  school: School;
}

export const SchoolsEditDrawer = ({ school }: SchoolsEditDrawerProps) => {
  const router = useRouter();

  const handleUpdateSchool = async (values: schoolSchemaValues) => {
    const { success, message } = await updateSchool(school.id, values);
    if (success) {
      router.back();
    } else {
      throw new Error(message);
    }
  };

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="Edit school"
      headerSubtext="Fill out the school details."
      width="wide"
    >
      <SchoolForm school={school} onSubmit={handleUpdateSchool} />
    </RoutedDrawer>
  );
};
