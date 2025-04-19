import { Controller, useForm } from "react-hook-form";
import { Button, Input, LabelHolder, SelectMenu } from "sd-tnrsm-library";
import { reportSchema, reportSchemaValues } from "./report-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Report, School, Student, TherapyService } from "@/lib/api/types";
import { ReportType } from "@/types/reports";

const reportTypeOptions = [
  {
    name: "Progress",
    value: "PROGRESS",
  },
  {
    name: "Attendance",
    value: "ATTENDANCE",
  },
  {
    name: "Billing",
    value: "BILLING",
  },
  {
    name: "Eligibility",
    value: "ELIGIBILITY",
  },
];

interface ReportFormProps {
  report?: Report;
  schools: School[];
  students: Student[];
  therapyServices: TherapyService[];
  onSubmit: (values: reportSchemaValues) => Promise<void>;
}

export const ReportForm = ({
  report,
  schools,
  students,
  therapyServices,
  onSubmit,
}: ReportFormProps) => {
  const schoolOptions = schools.map((school) => ({
    name: school.name,
    value: school.id,
  }));

  const studentOptions = students.map((student) => ({
    name: `${student.firstName} ${student.lastName}`,
    value: student.id,
  }));

  const therapyServiceOptions = therapyServices.map((service) => ({
    name: service.id,
    value: service.id,
  }));

  const { register, control, handleSubmit, formState, setError } =
    useForm<reportSchemaValues>({
      resolver: zodResolver(reportSchema),
      values: report
        ? {
            ...report,
            reportType: report.reportType as ReportType,
            schoolId: report.school?.id || report.schoolId,
            studentId: report.student?.id || report.studentId,
            therapyServiceId: report.therapyService?.id || report.therapyServiceId,
          }
        : undefined,
    });

  const { errors, isSubmitting } = formState;

  const submit = async (values: reportSchemaValues) => {
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
          id="reportType"
          label="Report Type"
          hasError={!!errors?.reportType}
        >
          <Controller
            control={control}
            name="reportType"
            render={({ field: { onChange, value } }) => (
              <SelectMenu
                value={value}
                onChange={onChange}
                variant="primary"
                options={reportTypeOptions}
              />
            )}
          />
          {errors?.reportType && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.reportType?.message}
            </p>
          )}
        </LabelHolder>
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
      </div>
      <div className="grid grid-cols-2 gap-8">
        <LabelHolder id="student" label="Student" hasError={!!errors?.studentId}>
          <Controller
            control={control}
            name="studentId"
            render={({ field: { onChange, value } }) => (
              <SelectMenu
                value={value}
                onChange={onChange}
                variant="primary"
                options={studentOptions}
              />
            )}
          />
          {errors?.studentId && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.studentId?.message}
            </p>
          )}
        </LabelHolder>
        <LabelHolder
          id="therapyService"
          label="Therapy Service"
          hasError={!!errors?.therapyServiceId}
        >
          <Controller
            control={control}
            name="therapyServiceId"
            render={({ field: { onChange, value } }) => (
              <SelectMenu
                value={value}
                onChange={onChange}
                variant="primary"
                options={therapyServiceOptions}
              />
            )}
          />
          {errors?.therapyServiceId && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.therapyServiceId?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      <div className="col-span-2">
        <LabelHolder
          id="content"
          label="Report Content"
          hasError={!!errors?.content}
        >
          <Input
            id="content"
            placeholder="Enter report details..."
            {...register("content")}
            hasError={!!errors?.content}
          />
          {errors?.content && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.content?.message}
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
          {report ? "Update Report" : "Create Report"}
        </Button>
      </div>
    </form>
  );
};