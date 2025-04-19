"use client";

import { Therapist } from "@/lib/api/types";
import {
  IdentificationIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  FingerPrintIcon,
  DocumentTextIcon,
} from "@heroicons/react/20/solid";
import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { useRouter } from "next/navigation";

interface TherapistsViewDrawerProps {
  therapist: Therapist;
  open: boolean;
}

export const TherapistsViewDrawer = ({ therapist }: TherapistsViewDrawerProps) => {
  const router = useRouter();

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="View Therapist"
      headerSubtext="Glance over the therapist's details."
      width="extraWide"
    >
      <div className="p-2">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex gap-2 mb-2 items-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl sm:tracking-tight">
                {therapist.name}
              </h2>
            </div>
            <p className="text-sm text-gray-500">ID: {therapist.id}</p>

            <div className="mt-3 flex flex-wrap gap-4">
              {therapist.disciplines && (
                <div className="flex items-center text-sm text-gray-500">
                  <AcademicCapIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Disciplines: </span>
                  {therapist.disciplines}
                </div>
              )}

              {therapist.licenseNumber && (
                <div className="flex items-center text-sm text-gray-500">
                  <IdentificationIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">License Number: </span>
                  {therapist.licenseNumber}
                </div>
              )}

              {therapist.medicaidNationalProviderId && (
                <div className="flex items-center text-sm text-gray-500">
                  <DocumentTextIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Medicaid National Provider ID: </span>
                  {therapist.medicaidNationalProviderId}
                </div>
              )}

              {therapist.socialSecurity && (
                <div className="flex items-center text-sm text-gray-500">
                  <FingerPrintIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Social Security: </span>
                  {therapist.socialSecurity}
                </div>
              )}

              {therapist.stateMedicaidProviderId && (
                <div className="flex items-center text-sm text-gray-500">
                  <DocumentTextIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">State Medicaid Provider ID: </span>
                  {therapist.stateMedicaidProviderId}
                </div>
              )}

              {therapist.status && (
                <div className="flex items-center text-sm text-gray-500">
                  <ShieldCheckIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Status: </span>
                  {therapist.status}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoutedDrawer>
  );
};