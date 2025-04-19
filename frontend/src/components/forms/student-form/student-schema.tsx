import { ConfirmationStatus, Status } from "@/types/students";
import { z } from "zod";
import { dateSchema } from "@/lib/validation/date";

export const studentSchema = z.object({
  firstName: z.string().nonempty("Please enter a first name."),
  lastName: z.string().nonempty("Please enter a last name."),
  dob: dateSchema({
    maxDate: new Date(),
    allowFuture: false,
    errorMessage: "Please enter a valid date of birth (no future dates)."
  }),
  gradeLevel: z.number().gte(1).lte(12),
  schoolId: z.string().uuid(),
  parentId: z.string().uuid(),
  studentCode: z.string(),
  status: z.nativeEnum(Status),
  confirmationStatus: z.nativeEnum(ConfirmationStatus),
});

export type studentSchemaValues = z.infer<typeof studentSchema>;
