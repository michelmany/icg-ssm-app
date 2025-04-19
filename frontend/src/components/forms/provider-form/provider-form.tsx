import { Controller, useForm } from "react-hook-form";
import { Button, Input, LabelHolder, SelectMenu } from "sd-tnrsm-library";
import { providerSchema, providerSchemaValues } from "./provider-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Provider, User } from "@/lib/api/types";

interface ProviderFormProps {
  provider?: Provider;
  users?: User[];
  onSubmit: (values: providerSchemaValues) => Promise<void>;
}

export const ProviderForm = ({ provider, users, onSubmit }: ProviderFormProps) => {
  const userOptions = users
    ? users.map((user) => ({
        name: `${user.firstName} ${user.lastName}`,
        value: user.id,
      }))
    : [];

  const feeStructureOptions = [
    { name: "Hourly", value: "HOURLY" },
    { name: "Flat Rate", value: "FLAT_RATE" },
    { name: "Per Diem", value: "PER_DIEM" },
  ];
  
  const statusOptions = [
    { name: "Active", value: "ACTIVE" },
    { name: "Inactive", value: "INACTIVE" },
    { name: "Pending", value: "PENDING" },
    { name: "Suspended", value: "SUSPENDED" },
  ];
    
  const { register, control, handleSubmit, formState, setError } =
  useForm<providerSchemaValues>({
    resolver: zodResolver(providerSchema),
    values: provider
      ? {
          ...provider,
          licenseNumber: provider.licenseNumber ?? '',
          userId: provider.userId ?? '',
          reviewNotes: { notes: provider.reviewNotes.notes }
        }
      : undefined,
  });

  const { errors, isSubmitting } = formState;

  const submit = async (values: providerSchemaValues) => {
    try {
      await onSubmit(values);
    } catch (e) {
      if (e instanceof Error && e.message) {
        setError("root", {
          message: e.message,
        });
      }
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
      {users ? (
        <LabelHolder id="userId" label="User" hasError={!!errors?.userId}>
          <Controller
            control={control}
            name="userId"
            render={({ field: { onChange, value } }) => (
              <SelectMenu
                value={value}
                onChange={onChange}
                variant="primary"
                options={userOptions}
              />
            )}
          />
          {errors?.userId && (
            <p className="text-red-600 text-sm mt-2">{errors?.userId?.message}</p>
          )}
        </LabelHolder>
      ) : (
        <LabelHolder id="userId" label="User ID" hasError={!!errors?.userId}>
          <Input
            id="userId"
            placeholder="Enter user ID"
            {...register("userId")}
            hasError={!!errors?.userId}
          />
          {errors?.userId && (
            <p className="text-red-600 text-sm mt-2">{errors?.userId?.message}</p>
          )}
        </LabelHolder>
      )}
      <div className="grid grid-cols-2 gap-8">
        <LabelHolder
          id="licenseNumber"
          label="License Number"
          hasError={!!errors?.licenseNumber}
        >
          <Input
            id="licenseNumber"
            placeholder="Enter license number"
            {...register("licenseNumber")}
            hasError={!!errors?.licenseNumber}
          />
          {errors?.licenseNumber && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.licenseNumber?.message}
            </p>
          )}
        </LabelHolder>
        <LabelHolder
          id="credentials"
          label="Credentials"
          hasError={!!errors?.credentials}
        >
          <Input
            id="credentials"
            placeholder="Enter credentials"
            {...register("credentials")}
            hasError={!!errors?.credentials}
          />
          {errors?.credentials && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.credentials?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <LabelHolder id="signature" label="Signature" hasError={!!errors?.signature}>
          <Input
            id="signature"
            placeholder="Enter signature"
            {...register("signature")}
            hasError={!!errors?.signature}
          />
          {errors?.signature && (
            <p className="text-red-600 text-sm mt-2">{errors?.signature?.message}</p>
          )}
        </LabelHolder>
        <LabelHolder
          id="serviceFeeStructure"
          label="Service Fee Structure"
          hasError={!!errors?.serviceFeeStructure}
        >
          <Controller
            control={control}
            name="serviceFeeStructure"
            render={({ field: { onChange, value } }) => (
              <SelectMenu
                value={value}
                onChange={onChange}
                variant="primary"
                options={feeStructureOptions}
              />
            )}
          />
          {errors?.serviceFeeStructure && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.serviceFeeStructure?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      <div className="grid grid-cols-2 gap-8">
      <LabelHolder id="nssEnabled" label="NSS Enabled" hasError={!!errors?.nssEnabled}>
        <Controller
          control={control}
          name="nssEnabled"
          render={({ field: { onChange, value } }) => (
            <SelectMenu
              value={value === true ? "yes" : value === false ? "no" : ""}
              onChange={(val) => {
                if (val === "yes") onChange(true);
                else if (val === "no") onChange(false);
                else onChange(undefined);
              }}
              variant="primary"
              options={[
                { name: "Yes", value: "yes" },
                { name: "No", value: "no" },
              ]}
            />
          )}
        />
        {errors?.nssEnabled && (
          <p className="text-red-600 text-sm mt-2">{errors?.nssEnabled?.message}</p>
        )}
      </LabelHolder>

        <LabelHolder id="status" label="Status" hasError={!!errors?.status}>
          <Controller
            control={control}
            name="status"
            render={({ field: { onChange, value } }) => (
              <SelectMenu
                value={value}
                onChange={onChange}
                variant="primary"
                options={statusOptions}
              />
            )}
          />
          {errors?.status && (
            <p className="text-red-600 text-sm mt-2">{errors?.status?.message}</p>
          )}
        </LabelHolder>
      </div>
      <LabelHolder id="reviewNotes" label="Review Notes" hasError={!!errors?.reviewNotes?.notes}>
        <Input
          id="reviewNotes"
          placeholder="Enter review notes"
          {...register("reviewNotes.notes")}
          hasError={!!errors?.reviewNotes?.notes}
        />
        {errors?.reviewNotes?.notes && (
          <p className="text-red-600 text-sm mt-2">{errors?.reviewNotes?.notes?.message}</p>
        )}
      </LabelHolder>
      {errors?.root && (
        <p className="text-red-600 text-sm mt-2 text-center">
          {errors?.root?.message}
        </p>
      )}
      <div className="flex justify-end">
        <Button size="xl" type="submit" isLoading={isSubmitting}>
          {provider ? "Update provider" : "Create provider"}
        </Button>
      </div>
    </form>
  );
};
