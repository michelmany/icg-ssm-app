import { Controller, useForm } from "react-hook-form";
import { Button, Input, LabelHolder, SelectMenu } from "sd-tnrsm-library";
import { therapistSchema, therapistSchemaValues, TherapistStatus } from "./therapist-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Therapist, User } from "@/lib/api/types";

const statusOptions = [
  {
    name: "Active",
    value: "ACTIVE",
  },
  {
    name: "Inactive",
    value: "INACTIVE",
  },
  {
    name: "Pending",
    value: "PENDING",
  },
];

interface TherapistFormProps {
  therapist?: Therapist;
  users: User[];
  onSubmit: (values: therapistSchemaValues) => Promise<void>;
}

export const TherapistForm = ({
  therapist,
  users,
  onSubmit,
}: TherapistFormProps) => {
  const userOptions = users.map((user) => ({
    name: `${user.firstName} ${user.lastName}`,
    value: user.id,
  }));

  const { register, control, handleSubmit, formState, setError } =
    useForm<therapistSchemaValues>({
      resolver: zodResolver(therapistSchema),
      values: therapist
        ? {
            userId: therapist.userId,
            disciplines: therapist.disciplines || "",
            licenseNumber: therapist.licenseNumber || "",
            medicaidNationalProviderId: therapist.medicaidNationalProviderId,
            socialSecurity: therapist.socialSecurity || "",
            stateMedicaidProviderId: therapist.stateMedicaidProviderId,
            status: therapist.status as TherapistStatus,
          }
        : undefined
    });

  const { errors, isSubmitting } = formState;

  const submit = async (values: therapistSchemaValues) => {
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
    <form className="flex flex-col gap-4 p-2" onSubmit={handleSubmit(submit)}>
      <div className="grid grid-cols-2 gap-8">
        <LabelHolder id="user" label="User" hasError={!!errors?.userId}>
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
            <p className="text-red-600 text-sm mt-2">
              {errors?.userId?.message}
            </p>
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
            <p className="text-red-600 text-sm mt-2">
              {errors?.status?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        <LabelHolder id="disciplines" label="Disciplines" hasError={!!errors?.disciplines}>
          <Input
            id="disciplines"
            placeholder="Speech, Occupational, Physical..."
            {...register("disciplines")}
            hasError={!!errors?.disciplines}
          />
          {errors?.disciplines && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.disciplines?.message}
            </p>
          )}
        </LabelHolder>
        <LabelHolder id="licenseNumber" label="License Number" hasError={!!errors?.licenseNumber}>
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
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        <LabelHolder id="medicaidNationalProviderId" label="Medicaid National Provider ID" hasError={!!errors?.medicaidNationalProviderId}>
          <Input
            id="medicaidNationalProviderId"
            placeholder="Enter Medicaid National Provider ID"
            type="number"
            {...register("medicaidNationalProviderId")}
            hasError={!!errors?.medicaidNationalProviderId}
          />
          {errors?.medicaidNationalProviderId && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.medicaidNationalProviderId?.message}
            </p>
          )}
        </LabelHolder>
        <LabelHolder id="stateMedicaidProviderId" label="State Medicaid Provider ID" hasError={!!errors?.stateMedicaidProviderId}>
          <Input
            id="stateMedicaidProviderId"
            placeholder="Enter State Medicaid Provider ID"
            type="number"
            {...register("stateMedicaidProviderId")}
            hasError={!!errors?.stateMedicaidProviderId}
          />
          {errors?.stateMedicaidProviderId && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.stateMedicaidProviderId?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <LabelHolder id="socialSecurity" label="Social Security Number" hasError={!!errors?.socialSecurity}>
          <Input
            id="socialSecurity"
            placeholder="Enter Social Security number"
            {...register("socialSecurity")}
            hasError={!!errors?.socialSecurity}
          />
          {errors?.socialSecurity && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.socialSecurity?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      
      {errors?.root && (
        <p className="text-red-600 text-sm mt-2 text-center">
          {errors?.root.message}
        </p>
      )}
      <div className="flex justify-end">
        <Button size="xl" type="submit" isLoading={isSubmitting}>
          {therapist ? "Update Therapist" : "Create Therapist"}
        </Button>
      </div>
    </form>
  );
};