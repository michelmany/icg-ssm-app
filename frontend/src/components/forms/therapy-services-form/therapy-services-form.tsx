import { Controller, useForm } from "react-hook-form";
import { Button, Input, LabelHolder, SelectMenu } from "sd-tnrsm-library";
import { therapyServicesSchema, therapyServicesSchemaValues } from "./therapy-services-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { TherapyService, Student, Provider } from "@/lib/api/types";
import { ServiceType, DeliveryMode, Status } from "@/types/therapy-services";

const serviceTypeOptions = [
  {
    name: "Speech",
    value: "SPEECH",
  },
  {
    name: "Occupational",
    value: "OCCUPATIONAL",
  },
  {
    name: "Physical",
    value: "PHYSICAL",
  },
];

const deliveryModeOptions = [
  {
    name: "In Person",
    value: "IN_PERSON",
  },
  {
    name: "Virtual",
    value: "VIRTUAL",
  }
];

const statusOptions = [
  {
    name: "Scheduled",
    value: "SCHEDULED",
  },
  {
    name: "Completed",
    value: "COMPLETED",
  },
  {
    name: "Missed",
    value: "MISSED",
  },
];

interface TherapyServicesFormProps {
  therapyService?: TherapyService;
  students: Student[];
  providers: Provider[];
  onSubmit: (values: therapyServicesSchemaValues) => Promise<void>;
}

export const TherapyServicesForm = ({
  therapyService,
  students,
  providers,
  onSubmit,
}: TherapyServicesFormProps) => {
  const studentOptions = students.map((student) => ({
    name: `${student.firstName} ${student.lastName}`,
    value: student.id,
  }));

  const providerOptions = providers.map((provider) => ({
    name: `${provider.user.firstName} ${provider.user.lastName}`,
    value: provider.id,
  }));

  const { register, control, handleSubmit, formState, setError } =
    useForm<therapyServicesSchemaValues>({
      resolver: zodResolver(therapyServicesSchema),
      values: therapyService
        ? {
            ...therapyService,
            serviceType: therapyService.serviceType as ServiceType,
            deliveryMode: therapyService.deliveryMode as DeliveryMode,
            status: therapyService.status as Status,
            studentId: therapyService.student?.id || "",
            providerId: therapyService.provider?.id || "",
            serviceBeginDate: therapyService.serviceBeginDate
              ? new Date(therapyService.serviceBeginDate).toISOString().split("T")[0]
              : "",
            sessionDate: therapyService.sessionDate
              ? new Date(therapyService.sessionDate).toISOString().split("T")[0]
              : "",
            nextMeetingDate: therapyService.nextMeetingDate
              ? new Date(therapyService.nextMeetingDate).toISOString().split("T")[0]
              : undefined,
            sessionNotes: therapyService.sessionNotes || "",
            goalTracking:
              typeof therapyService.goalTracking === "object" && therapyService.goalTracking !== null
                ? JSON.stringify(therapyService.goalTracking)
                : (therapyService.goalTracking as string | undefined),
            ieps:
              typeof therapyService.ieps === "object" && therapyService.ieps !== null
                ? JSON.stringify(therapyService.ieps)
                : (therapyService.ieps as string | undefined),
          }
        : undefined
    });

  const { errors, isSubmitting } = formState;

  const submit = async (values: therapyServicesSchemaValues) => {
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
        <LabelHolder id="provider" label="Provider" hasError={!!errors?.providerId}>
          <Controller
            control={control}
            name="providerId"
            render={({ field: { onChange, value } }) => (
              <SelectMenu
                value={value}
                onChange={onChange}
                variant="primary"
                options={providerOptions}
              />
            )}
          />
          {errors?.providerId && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.providerId?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        <LabelHolder id="serviceType" label="Service Type" hasError={!!errors?.serviceType}>
          <Controller
            control={control}
            name="serviceType"
            render={({ field: { onChange, value } }) => (
              <SelectMenu
                value={value}
                onChange={onChange}
                variant="primary"
                options={serviceTypeOptions}
              />
            )}
          />
          {errors?.serviceType && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.serviceType?.message}
            </p>
          )}
        </LabelHolder>
        <LabelHolder id="deliveryMode" label="Delivery Mode" hasError={!!errors?.deliveryMode}>
          <Controller
            control={control}
            name="deliveryMode"
            render={({ field: { onChange, value } }) => (
              <SelectMenu
                value={value}
                onChange={onChange}
                variant="primary"
                options={deliveryModeOptions}
              />
            )}
          />
          {errors?.deliveryMode && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.deliveryMode?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
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
        <LabelHolder id="serviceBeginDate" label="Service Begin Date" hasError={!!errors?.serviceBeginDate}>
          <Input
            id="serviceBeginDate"
            type="date"
            {...register("serviceBeginDate")}
            hasError={!!errors?.serviceBeginDate}
          />
          {errors?.serviceBeginDate && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.serviceBeginDate?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        <LabelHolder id="sessionDate" label="Session Date" hasError={!!errors?.sessionDate}>
          <Input
            id="sessionDate"
            type="date"
            {...register("sessionDate")}
            hasError={!!errors?.sessionDate}
          />
          {errors?.sessionDate && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.sessionDate?.message}
            </p>
          )}
        </LabelHolder>
        <LabelHolder id="nextMeetingDate" label="Next Meeting Date" hasError={!!errors?.nextMeetingDate}>
          <Input
            id="nextMeetingDate"
            type="date"
            {...register("nextMeetingDate")}
            hasError={!!errors?.nextMeetingDate}
          />
          {errors?.nextMeetingDate && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.nextMeetingDate?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      
      <div className="col-span-2">
        <LabelHolder
          id="sessionNotes"
          label="Session Notes"
          hasError={!!errors?.sessionNotes}
        >
          <Input
            id="sessionNotes"
            placeholder="Enter session notes..."
            {...register("sessionNotes")}
            hasError={!!errors?.sessionNotes}
          />
          {errors?.sessionNotes && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.sessionNotes?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      
      <div className="col-span-2">
        <LabelHolder
          id="goalTracking"
          label="Goal Tracking"
          hasError={!!errors?.goalTracking}
        >
          <Input
            id="goalTracking"
            placeholder='{"goals":[{"goal":"Improve speech clarity","progress":75}]}'
            {...register("goalTracking")}
            hasError={!!errors?.goalTracking}
          />
          {errors?.goalTracking && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.goalTracking?.message}
            </p>
          )}
        </LabelHolder>
      </div>
      
      <div className="col-span-2">
        <LabelHolder
          id="ieps"
          label="IEPs"
          hasError={!!errors?.ieps}
        >
          <Input
            id="ieps"
            placeholder='{"planDate":"2023-08-15","objectives":["Improve fine motor skills","Enhance communication"]}'
            {...register("ieps")}
            hasError={!!errors?.ieps}
          />
          {errors?.ieps && (
            <p className="text-red-600 text-sm mt-2">
              {errors?.ieps?.message}
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
          {therapyService ? "Update Therapy Service" : "Create Therapy Service"}
        </Button>
      </div>
    </form>
  );
};