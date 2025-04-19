"use client";

import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { TherapistForm } from "@/components/forms/therapist-form/therapist-form";
import { therapistSchemaValues } from "@/components/forms/therapist-form/therapist-schema";
import { updateTherapist } from "@/lib/actions/therapists/update-therapist";
import { Therapist, User } from "@/lib/api/types";
import { useRouter } from "next/navigation";

interface TherapistsEditDrawerProps {
  therapist: Therapist;
  users: User[];
}

export const TherapistsEditDrawer = ({
  therapist,
  users,
}: TherapistsEditDrawerProps) => {
  const router = useRouter();

  const handleUpdateTherapist = async (values: therapistSchemaValues) => {
    const { success, message } = await updateTherapist(therapist.id, values);
    if (success) {
      router.back();
    } else {
      throw new Error(message);
    }
  };

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="Edit therapist"
      headerSubtext="Update the therapist details."
      width="wide"
    >
      <TherapistForm
        therapist={therapist}
        users={users}
        onSubmit={handleUpdateTherapist}
      />
    </RoutedDrawer>
  );
};