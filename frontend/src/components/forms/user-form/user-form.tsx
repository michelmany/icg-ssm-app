import { Controller, useForm } from "react-hook-form";
import { Button, Input, LabelHolder, SelectMenu } from "sd-tnrsm-library";
import { userSchema, userSchemaValues } from "./user-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Role, School, User } from "@/lib/api/types";
import { SecurityLevel, Status } from "@/types/users";

const securityLevelOptions = [
  {
    name: "Limited",
    value: "LIMITED",
  },
  {
    name: "Full Access",
    value: "FULL_ACCESS",
  },
  {
    name: "Read Only",
    value: "READ_ONLY",
  },
];

const statusOptions = [
  {
    name: "Active",
    value: "ACTIVE",
  },
  {
    name: "Inactive",
    value: "INACTIVE",
  },
];

interface UserFormProps {
  user?: User;
  schools: School[];
  roles: Role[];
  onSubmit: (values: userSchemaValues) => Promise<void>;
}

export const UserForm = ({ user, onSubmit, schools, roles }: UserFormProps) => {
  const schoolOptions = schools.map((school) => ({
    name: school.name,
    value: school.id,
  }));

  const roleOptions = roles.map((role) => ({
    name: role.name,
    value: role.id,
  }));

  const { register, control, handleSubmit, formState, setError } =
    useForm<userSchemaValues>({
      resolver: zodResolver(userSchema),
      values: user
        ? {
            ...user,
            status: user.status as Status,
            securityLevel: user.securityLevel as SecurityLevel,
            roleId: user.role.id,
            schoolId: user.school.id,
          }
        : undefined,
    });

  const { errors, isSubmitting } = formState;

  const submit = async (values: userSchemaValues) => {
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
        <LabelHolder
          id="firstName"
          label="First Name"
          hasError={!!errors?.firstName}
        >
          <Input
            id="firstName"
            placeholder="Enter first name"
            {...register("firstName")}
            hasError={!!errors?.firstName}
          />
          {errors?.firstName && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.firstName?.message}
            </p>
          )}
        </LabelHolder>
        <LabelHolder
          id="lastName"
          label="Last Name"
          hasError={!!errors?.lastName}
        >
          <Input
            id="lastName"
            placeholder="Enter last name"
            {...register("lastName")}
            hasError={!!errors?.lastName}
          />
          {errors?.lastName && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.lastName?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <LabelHolder id="email" label="Email" hasError={!!errors?.email}>
          <Input
            id="email"
            placeholder="Enter email"
            autoComplete="email"
            {...register("email")}
            hasError={!!errors?.email}
          />
          {errors?.email && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.email?.message}
            </p>
          )}
        </LabelHolder>
        <LabelHolder
          id="phoneNumber"
          label="Phone number"
          hasError={!!errors?.phoneNumber}
        >
          <Input
            id="phoneNumber"
            placeholder="Enter phone number"
            {...register("phoneNumber")}
            hasError={!!errors?.phoneNumber}
          />
          {errors?.phoneNumber && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.phoneNumber?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <LabelHolder
          id="securityLevel"
          label="Security Level"
          hasError={!!errors?.securityLevel}
        >
          <Controller
            control={control}
            name="securityLevel"
            render={({ field: { onChange, value } }) => (
              <SelectMenu
                value={value}
                onChange={onChange}
                variant="primary"
                options={securityLevelOptions}
              />
            )}
          />
          {errors?.securityLevel && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.securityLevel?.message}
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
        <LabelHolder id="school" label="School" hasError={!!errors?.schoolId}>
          <Controller
            control={control}
            name="schoolId"
            render={({ field: { onChange, value } }) => (
              <SelectMenu
                value={value}
                onChange={onChange}
                variant="primary"
                options={schoolOptions}
              />
            )}
          />
          {errors?.schoolId && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.schoolId?.message}
            </p>
          )}
        </LabelHolder>
        <LabelHolder id="role" label="Role" hasError={!!errors?.roleId}>
          <Controller
            control={control}
            name="roleId"
            render={({ field: { onChange, value } }) => (
              <SelectMenu
                value={value}
                onChange={onChange}
                variant="primary"
                options={roleOptions}
              />
            )}
          />
          {errors?.roleId && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.roleId?.message}
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
          {user ? "Update user" : "Create user"}
        </Button>
      </div>
    </form>
  );
};
