"use client";

import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { StudentForm } from "@/components/forms/student-form/student-form";
import { studentSchemaValues } from "@/components/forms/student-form/student-schema";
import { updateStudent } from "@/lib/actions/students/update-student";
import { School, Student, User } from "@/lib/api/types";
import { useRouter } from "next/navigation";

interface StudentsEditDrawerProps {
  student: Student;
  schools: School[];
  parents: User[];
}

export const StudentsEditDrawer = ({
  student,
  schools,
  parents,
}: StudentsEditDrawerProps) => {
  const router = useRouter();

  const handleUpdateStudent = async (values: studentSchemaValues) => {
    const { success, message } = await updateStudent(student.id, values);
    if (success) {
      router.back();
    } else {
      throw new Error(message);
    }
  };

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="Edit student"
      headerSubtext="Fill out the student details."
      width="wide"
    >
      <StudentForm
        student={student}
        schools={schools}
        parents={parents}
        onSubmit={handleUpdateStudent}
      />
    </RoutedDrawer>
  );
};
