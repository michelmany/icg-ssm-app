"use client";

import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { StudentForm } from "@/components/forms/student-form/student-form";
import { studentSchemaValues } from "@/components/forms/student-form/student-schema";
import { createStudent } from "@/lib/actions/students/create-student";
import { School, User } from "@/lib/api/types";
import { useRouter } from "next/navigation";

interface StudentsAddDrawerProps {
  schools: School[];
  parents: User[];
}

export const StudentsAddDrawer = ({
  schools,
  parents,
}: StudentsAddDrawerProps) => {
  const router = useRouter();

  const handleCreateStudent = async (values: studentSchemaValues) => {
    const { success, message } = await createStudent(values);
    if (success) {
      router.back();
    } else {
      throw new Error(message);
    }
  };

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="Create a new student"
      headerSubtext="Fill out the student details."
      width="wide"
    >
      <StudentForm
        schools={schools}
        parents={parents}
        onSubmit={handleCreateStudent}
      />
    </RoutedDrawer>
  );
};
