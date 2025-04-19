import { Controller, useForm } from "react-hook-form";
import { Button, Input, LabelHolder, SelectMenu } from "sd-tnrsm-library";
import { studentSchema, studentSchemaValues } from "./student-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { School, Student, User } from "@/lib/api/types";
import { ConfirmationStatus, Status } from "@/types/students";

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

const confirmationStatusOptions = [
  {
    name: "Pending",
    value: "PENDING",
  },
  {
    name: "Confirmed",
    value: "CONFIRMED",
  },
  {
    name: "Declined",
    value: "DECLINED",
  },
];

interface StudentFormProps {
  student?: Student;
  schools: School[];
  parents: User[];
  onSubmit: (values: studentSchemaValues) => Promise<void>;
}

export const StudentForm = ({
  student,
  schools,
  parents,
  onSubmit,
}: StudentFormProps) => {
  const schoolOptions = schools.map((school) => ({
    name: school.name,
    value: school.id,
  }));

  const parentOptions = parents.map((parent) => ({
    name: `${parent.firstName} ${parent.lastName}`,
    value: parent.id,
  }));

  const { register, control, handleSubmit, formState, setError } =
    useForm<studentSchemaValues>({
      resolver: zodResolver(studentSchema),
      values: student
        ? {
            ...student,
            status: student.status as Status,
            confirmationStatus:
              student.confirmationStatus as ConfirmationStatus,
            schoolId: student.school.id,
            parentId: student.parent.id,
          }
        : undefined,
    });

  const { errors, isSubmitting } = formState;

  const submit = async (values: studentSchemaValues) => {
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
        <LabelHolder id="dob" label="Date of Birth" hasError={!!errors?.dob}>
          <Input
            id="dob"
            type="date"
            {...register("dob")}
            hasError={!!errors?.dob}
          />
          {errors?.dob && (
            <p className="text-red-600 text-sm mt-2">{errors?.dob?.message}</p>
          )}
        </LabelHolder>
        <LabelHolder
          id="gradeLevel"
          label="Grade Level"
          hasError={!!errors?.gradeLevel}
        >
          <Input
            id="gradeLevel"
            inputMode="numeric"
            placeholder="Enter grade level (1-12)"
            {...register("gradeLevel", { valueAsNumber: true })}
            hasError={!!errors?.gradeLevel}
          />
          {errors?.gradeLevel && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.gradeLevel?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <LabelHolder
          id="studentCode"
          label="Student Code"
          hasError={!!errors?.studentCode}
        >
          <Input
            id="studentCode"
            placeholder="Enter student code"
            {...register("studentCode")}
            hasError={!!errors?.studentCode}
          />
          {errors?.studentCode && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.studentCode?.message}
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
        <LabelHolder id="parent" label="Parent" hasError={!!errors?.parentId}>
          <Controller
            control={control}
            name="parentId"
            render={({ field: { onChange, value } }) => (
              <SelectMenu
                value={value}
                onChange={onChange}
                variant="primary"
                options={parentOptions}
              />
            )}
          />
          {errors?.parentId && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.parentId?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <LabelHolder
          id="confirmationStatus"
          label="Confirmation Status"
          hasError={!!errors?.confirmationStatus}
        >
          <Controller
            control={control}
            name="confirmationStatus"
            render={({ field: { onChange, value } }) => (
              <SelectMenu
                value={value}
                onChange={onChange}
                variant="primary"
                options={confirmationStatusOptions}
              />
            )}
          />
          {errors?.confirmationStatus && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.confirmationStatus?.message}
            </p>
          )}
        </LabelHolder>
        <div></div>
      </div>
      {errors?.root && (
        <p className="text-red-600 text-sm mt-2 text-center">
          {errors?.root.message}
        </p>
      )}
      <div className="flex justify-end">
        <Button size="xl" type="submit" isLoading={isSubmitting}>
          {student ? "Update student" : "Create student"}
        </Button>
      </div>
    </form>
  );
};
