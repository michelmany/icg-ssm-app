"use client";

import { School } from "@/lib/api/types";
import {
  BuildingOfficeIcon,
  EnvelopeIcon,
  MapPinIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { useRouter } from "next/navigation";

interface SchoolsViewDrawerProps {
  school: School;
  open: boolean;
}

export const SchoolsViewDrawer = ({ school }: SchoolsViewDrawerProps) => {
  const router = useRouter();

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="View School"
      headerSubtext="Glance over the school's details."
      width="extraWide"
    >
      <div className="p-2">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex gap-2 mb-2 items-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl sm:tracking-tight">
                {school.name}
              </h2>
            </div>
            <p className="text-sm text-gray-500">ID: {school.id}</p>

            <div className="mt-3 flex flex-wrap gap-4">
              {school.district && (
                <div className="flex items-center text-sm text-gray-500">
                  <BuildingOfficeIcon className="mr-1.5 size-5 text-gray-400" />
                  {school.district}
                </div>
              )}

              {school.state && (
                <div className="flex items-center text-sm text-gray-500">
                  <MapPinIcon className="mr-1.5 size-5 text-gray-400" />
                  {school.state}
                </div>
              )}

              {school.contactEmail && (
                <div className="flex items-center text-sm text-gray-500">
                  <EnvelopeIcon className="mr-1.5 size-5 text-gray-400" />
                  {school.contactEmail}
                </div>
              )}

              {typeof school.maxTravelDistance !== "undefined" && (
                <div className="flex items-center text-sm text-gray-500">
                  <MapPinIcon className="mr-1.5 size-5 text-gray-400" />
                  {`Max travel distance: ${school.maxTravelDistance}`}
                </div>
              )}

              {typeof school.maxStudentsPerTest !== "undefined" && (
                <div className="flex items-center text-sm text-gray-500">
                  <UsersIcon className="mr-1.5 size-5 text-gray-400" />
                  {`Max students per test: ${school.maxStudentsPerTest}`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoutedDrawer>
  );
};
