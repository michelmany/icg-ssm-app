import { useForm } from "react-hook-form";
import { Button, Input, LabelHolder } from "sd-tnrsm-library";
import { schoolSchema, schoolSchemaValues } from "./school-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { School } from "@/lib/api/types";

interface SchoolFormProps {
  school?: School;
  onSubmit: (values: schoolSchemaValues) => Promise<void>;
}

export const SchoolForm = ({ school, onSubmit }: SchoolFormProps) => {
  const { register, handleSubmit, formState, setError } =
    useForm<schoolSchemaValues>({
      resolver: zodResolver(schoolSchema),
      values: school,
    });

  const { errors, isSubmitting } = formState;

  const submit = async (values: schoolSchemaValues) => {
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
      <div className="grid grid-cols-2 gap-8">
        <LabelHolder id="name" label="Name" hasError={!!errors?.name}>
          <Input
            id="name"
            placeholder="Enter name"
            {...register("name")}
            hasError={!!errors?.name}
          />
          {errors?.name && (
            <p className="text-red-600 text-sm mt-2">{errors?.name?.message}</p>
          )}
        </LabelHolder>
        <LabelHolder
          id="contactEmail"
          label="Contact Email"
          hasError={!!errors?.contactEmail}
        >
          <Input
            id="contactEmail"
            placeholder="Enter a contact email"
            {...register("contactEmail")}
            hasError={!!errors?.contactEmail}
          />
          {errors?.contactEmail && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.contactEmail?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <LabelHolder
          id="district"
          label="District"
          hasError={!!errors?.district}
        >
          <Input
            id="district"
            placeholder="Enter district"
            {...register("district")}
            hasError={!!errors?.district}
          />
          {errors?.district && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.district?.message}
            </p>
          )}
        </LabelHolder>
        <LabelHolder id="state" label="State" hasError={!!errors?.state}>
          <Input
            id="state"
            placeholder="Enter state"
            {...register("state")}
            hasError={!!errors?.state}
          />
          {errors?.state && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.state?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <LabelHolder
          id="maxTravelDistance"
          label="Max Travel Distance"
          hasError={!!errors?.maxTravelDistance}
        >
          <Input
            id="maxTravelDistance"
            inputMode="numeric"
            placeholder="Enter maximum travel distance"
            {...register("maxTravelDistance")}
            hasError={!!errors?.maxTravelDistance}
          />
          {errors?.maxTravelDistance && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.maxTravelDistance?.message}
            </p>
          )}
        </LabelHolder>
        <LabelHolder
          id="maxStudentsPerTest"
          label="Max Students per Test"
          hasError={!!errors?.maxStudentsPerTest}
        >
          <Input
            id="maxStudentsPerTest"
            inputMode="numeric"
            placeholder="Enter maximum students per test"
            {...register("maxStudentsPerTest")}
            hasError={!!errors?.maxStudentsPerTest}
          />
          {errors?.maxStudentsPerTest && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.maxStudentsPerTest?.message}
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
          {school ? "Update school" : "Create school"}
        </Button>
      </div>
    </form>
  );
};
