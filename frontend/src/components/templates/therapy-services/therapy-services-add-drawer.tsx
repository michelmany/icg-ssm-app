"use client";

import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { TherapyServicesForm } from "@/components/forms/therapy-services-form/therapy-services-form";
import { therapyServicesSchemaValues } from "@/components/forms/therapy-services-form/therapy-services-schema";
import { createTherapyService } from "@/lib/actions/therapy-services/create-therapy-services";
import { Student, Provider } from "@/lib/api/types";
import { useRouter } from "next/navigation";

interface TherapyServicesAddDrawerProps {
  students: Student[];
  providers: Provider[];
}

export const TherapyServicesAddDrawer = ({
  students,
  providers,
}: TherapyServicesAddDrawerProps) => {
  const router = useRouter();

  const handleCreateTherapyService = async (values: therapyServicesSchemaValues) => {
    const { success, message } = await createTherapyService(values);
    if (success) {
      router.back();
    } else {
      throw new Error(message);
    }
  };

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="Create a new therapy service"
      headerSubtext="Fill out the therapy service details."
      width="wide"
    >
      <TherapyServicesForm
        students={students}
        providers={providers}
        onSubmit={handleCreateTherapyService}
      />
    </RoutedDrawer>
  );
};