import { z } from "zod";
import { ServiceType, DeliveryMode, Status } from "@/types/therapy-services";
import { dateSchema } from "@/lib/validation/date";

export const therapyServicesSchema = z.object({
  studentId: z.string().uuid("Please select a student."),
  providerId: z.string().uuid("Please select a provider."),
  serviceType: z.nativeEnum(ServiceType, {
    errorMap: () => ({ message: "Please select a service type." }),
  }),
  deliveryMode: z.nativeEnum(DeliveryMode, {
    errorMap: () => ({ message: "Please select a delivery mode." }),
  }),
  status: z.nativeEnum(Status, {
    errorMap: () => ({ message: "Please select a status." }),
  }),
  serviceBeginDate: dateSchema({
    allowFuture: true,
    errorMessage: "Please enter a valid service begin date."
  }),
  sessionDate: dateSchema({
    allowFuture: true,
    errorMessage: "Please enter a valid session date."
  }),
  sessionNotes: z.string().nonempty("Please enter session notes."),
  nextMeetingDate: dateSchema({
    allowFuture: true,
    errorMessage: "Please enter a valid next meeting date."
  }).optional(),
  goalTracking: z.string().optional(),
  ieps: z.string().optional(),
});

export type therapyServicesSchemaValues = z.infer<typeof therapyServicesSchema>;