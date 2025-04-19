"use client";

import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { ProviderForm } from "@/components/forms/provider-form/provider-form";
import { providerSchemaValues } from "@/components/forms/provider-form/provider-schema";
import { updateProvider } from "@/lib/actions/providers/update-provider";
import { Provider, User } from "@/lib/api/types";
import { useRouter } from "next/navigation";

interface ProvidersEditDrawerProps {
  provider: Provider;
  users?: User[];
}

export const ProvidersEditDrawer = ({ provider, users }: ProvidersEditDrawerProps) => {
  const router = useRouter();

  const handleUpdateProvider = async (values: providerSchemaValues) => {
    const { success, message } = await updateProvider(provider.id, values);
    if (success) {
      router.back();
    } else {
      throw new Error(message);
    }
  };

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="Edit provider"
      headerSubtext="Fill out the provider details."
      width="wide"
    >
      <ProviderForm provider={provider} users={users} onSubmit={handleUpdateProvider} />
    </RoutedDrawer>
  );
};
