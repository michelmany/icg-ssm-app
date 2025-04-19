"use client";

import { User } from "@/lib/api/types";

import {
  BriefcaseIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/20/solid";

import { RoutedDrawer } from "@/components/drawers/routed-drawer";

import Image from "next/image";

import { useRouter } from "next/navigation";

interface UsersViewDrawerProps {
  user: User;
  open: boolean;
}

export const UsersViewDrawer = ({ user }: UsersViewDrawerProps) => {
  const router = useRouter();

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="View User"
      headerSubtext="Glance over the user's details."
      width="extraWide"
    >
      <div className="p-2">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex gap-2 mb-2 items-center">
              <div className="size-11 shrink-0">
                <Image
                  alt=""
                  src="/avatar.jpg"
                  width={44}
                  height={44}
                  className="size-11 rounded-full"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl sm:tracking-tight">
                {user.firstName} {user.lastName}
              </h2>
            </div>
            <p className="text-sm text-gray-500">ID: {user.id}</p>

            <div className="mt-3 flex flex-wrap gap-4">
              {/* Role */}
              {user.role?.name && (
                <div className="flex items-center text-sm text-gray-500">
                  <BriefcaseIcon className="mr-1.5 size-5 text-gray-400" />
                  {user.role.name}
                </div>
              )}

              {/* Security Level */}
              <div className="flex items-center text-sm text-gray-500">
                <ShieldCheckIcon className="mr-1.5 size-5 text-gray-400" />
                {user.securityLevel.replace("_", " ")}
              </div>

              {/* Status */}
              <div className="flex items-center text-sm text-gray-500">
                <UserIcon className="mr-1.5 size-5 text-gray-400" />
                {user.status}
              </div>

              {/* Email */}
              <div className="flex items-center text-sm text-gray-500">
                <EnvelopeIcon className="mr-1.5 size-5 text-gray-400" />
                {user.email}
              </div>

              {/* Phone Number */}
              {user.phoneNumber && (
                <div className="flex items-center text-sm text-gray-500">
                  <PhoneIcon className="mr-1.5 size-5 text-gray-400" />
                  {user.phoneNumber}
                </div>
              )}

              {/* School */}
              {user.school?.name && (
                <div className="flex items-center text-sm text-gray-500">
                  <BuildingOfficeIcon className="mr-1.5 size-5 text-gray-400" />
                  {user.school.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoutedDrawer>
  );
};
