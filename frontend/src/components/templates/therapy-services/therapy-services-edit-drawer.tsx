"use client";

import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { TherapyServicesForm } from "@/components/forms/therapy-services-form/therapy-services-form";
import { therapyServicesSchemaValues } from "@/components/forms/therapy-services-form/therapy-services-schema";
import { updateTherapyService } from "@/lib/actions/therapy-services/update-therapy-services";
import { TherapyService, Student, Provider } from "@/lib/api/types";
import { useRouter } from "next/navigation";

interface TherapyServicesEditDrawerProps {
  therapyService: TherapyService;
  students: Student[];
  providers: Provider[];
}

export const TherapyServicesEditDrawer = ({
  therapyService,
  students,
  providers,
}: TherapyServicesEditDrawerProps) => {
  const router = useRouter();

  const handleUpdateTherapyService = async (values: therapyServicesSchemaValues) => {
    const { success, message } = await updateTherapyService(therapyService.id, values);
    if (success) {
      router.back();
    } else {
      throw new Error(message);
    }
  };

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="Edit therapy service"
      headerSubtext="Update the therapy service details."
      width="wide"
    >
      <TherapyServicesForm
        therapyService={therapyService}
        students={students}
        providers={providers}
        onSubmit={handleUpdateTherapyService}
      />
    </RoutedDrawer>
  );
};