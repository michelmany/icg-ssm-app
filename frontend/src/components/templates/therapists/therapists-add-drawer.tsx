"use client";

import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { TherapistForm } from "@/components/forms/therapist-form/therapist-form";
import { therapistSchemaValues } from "@/components/forms/therapist-form/therapist-schema";
import { createTherapist } from "@/lib/actions/therapists/create-therapist";
import { User } from "@/lib/api/types";
import { useRouter } from "next/navigation";

interface TherapistsAddDrawerProps {
  users: User[];
}

export const TherapistsAddDrawer = ({
  users,
}: TherapistsAddDrawerProps) => {
  const router = useRouter();

  const handleCreateTherapist = async (values: therapistSchemaValues) => {
    const { success, message } = await createTherapist(values);
    if (success) {
      router.back();
    } else {
      throw new Error(message);
    }
  };

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="Create a new therapist"
      headerSubtext="Fill out the therapist details."
      width="wide"
    >
      <TherapistForm
        users={users}
        onSubmit={handleCreateTherapist}
      />
    </RoutedDrawer>
  );
};