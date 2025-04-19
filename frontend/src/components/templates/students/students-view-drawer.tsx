"use client";

import { Student } from "@/lib/api/types";
import {
  BriefcaseIcon,
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  CalendarIcon,
} from "@heroicons/react/20/solid";
import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { useRouter } from "next/navigation";

interface StudentsViewDrawerProps {
  student: Student;
  open: boolean;
}

export const StudentsViewDrawer = ({ student }: StudentsViewDrawerProps) => {
  const router = useRouter();

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="View Student"
      headerSubtext="Glance over the student's details."
      width="extraWide"
    >
      <div className="p-2">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex gap-2 mb-2 items-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl sm:tracking-tight">
                {student.firstName} {student.lastName}
              </h2>
            </div>
            <p className="text-sm text-gray-500">ID: {student.id}</p>

            <div className="mt-3 flex flex-wrap gap-4">
              {student.studentCode && (
                <div className="flex items-center text-sm text-gray-500">
                  <ShieldCheckIcon className="mr-1.5 size-5 text-gray-400" />
                  {student.studentCode}
                </div>
              )}

              {student.gradeLevel && (
                <div className="flex items-center text-sm text-gray-500">
                  <BriefcaseIcon className="mr-1.5 size-5 text-gray-400" />
                  Grade {student.gradeLevel}
                </div>
              )}

              {student.dob && (
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="mr-1.5 size-5 text-gray-400" />
                  DOB: {student.dob}
                </div>
              )}

              {student.confirmationStatus && (
                <div className="flex items-center text-sm text-gray-500">
                  <ShieldCheckIcon className="mr-1.5 size-5 text-gray-400" />
                  {student.confirmationStatus}
                </div>
              )}

              <div className="flex items-center text-sm text-gray-500">
                <UserIcon className="mr-1.5 size-5 text-gray-400" />
                {student.status}
              </div>

              {student.school?.name && (
                <div className="flex items-center text-sm text-gray-500">
                  <BuildingOfficeIcon className="mr-1.5 size-5 text-gray-400" />
                  {student.school.name}
                </div>
              )}

              {student.parent?.firstName && (
                <div className="flex items-center text-sm text-gray-500">
                  <UserIcon className="mr-1.5 size-5 text-gray-400" />
                  Parent: {student.parent.firstName} {student.parent.lastName}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoutedDrawer>
  );
};
