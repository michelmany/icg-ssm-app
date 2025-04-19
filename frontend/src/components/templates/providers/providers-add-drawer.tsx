"use client";

import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { ProviderForm } from "@/components/forms/provider-form/provider-form";
import { providerSchemaValues } from "@/components/forms/provider-form/provider-schema";
import { createProvider } from "@/lib/actions/providers/create-provider";
import { useRouter } from "next/navigation";
import { User } from "@/lib/api/types";

interface ProvidersAddDrawerProps {
  users?: User[];
}

export const ProvidersAddDrawer = ({ users }: ProvidersAddDrawerProps) => {
  const router = useRouter();

  const handleCreateProvider = async (values: providerSchemaValues) => {
    const { success, message } = await createProvider(values);
    if (success) {
      router.back();
    } else {
      throw new Error(message);
    }
  };

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="Create a new provider"
      headerSubtext="Fill out the provider details."
      width="wide"
    >
      <ProviderForm users={users} onSubmit={handleCreateProvider} />
    </RoutedDrawer>
  );
};
