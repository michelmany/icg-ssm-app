"use client";

import { Provider } from "@/lib/api/types";
import {
  IdentificationIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/20/solid";
import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { useRouter } from "next/navigation";

interface ProvidersViewDrawerProps {
  provider: Provider;
  open: boolean;
}

export const ProvidersViewDrawer = ({ provider }: ProvidersViewDrawerProps) => {
  const router = useRouter();

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="View Provider"
      headerSubtext="Glance over the provider's details."
      width="extraWide"
    >
      <div className="p-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl sm:tracking-tight">
            {provider.user.firstName} {provider.user.lastName}
          </h2>
          <p className="text-sm text-gray-500">Provider ID: {provider.id}</p>

          <div className="mt-3 flex flex-wrap gap-4">
            {provider.licenseNumber && (
              <div className="flex items-center text-sm text-gray-500">
                <IdentificationIcon className="mr-1.5 h-5 w-5 text-gray-400" />
                {provider.licenseNumber}
              </div>
            )}

            {provider.credentials && (
              <div className="flex items-center text-sm text-gray-500">
                <CheckBadgeIcon className="mr-1.5 h-5 w-5 text-gray-400" />
                <span className="font-medium">Credentials: </span>
                {String(provider.credentials)}
              </div>
            )}

            {provider.serviceFeeStructure && (
              <div className="flex items-center text-sm text-gray-500">
                <CurrencyDollarIcon className="mr-1.5 h-5 w-5 text-gray-400" />
                <span className="font-medium">SFS: </span>
                {String(provider.serviceFeeStructure)}
              </div>
            )}

            {typeof provider.nssEnabled !== "undefined" && (
              <div className="flex items-center text-sm text-gray-500">
                <CheckCircleIcon className="mr-1.5 h-5 w-5 text-gray-400" />
                <span className="font-medium">NSS Enabled: </span>
                {provider.nssEnabled ? "Enabled" : "Disabled"}
              </div>
            )}

            {provider.reviewNotes && (
              <div className="flex items-center text-sm text-gray-500">
                <ChatBubbleBottomCenterTextIcon className="mr-1.5 h-5 w-5 text-gray-400" />
                <span className="font-medium">Notes: </span>
                {provider.reviewNotes.notes}
              </div>
            )}

            {provider.status && (
              <div className="flex items-center text-sm text-gray-500">
                <ShieldCheckIcon className="mr-1.5 h-5 w-5 text-gray-400" />
                {provider.status}
              </div>
            )}
          </div>
        </div>
      </div>
    </RoutedDrawer>
  );
};
