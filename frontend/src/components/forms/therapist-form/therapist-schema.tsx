import { z } from "zod";

export enum TherapistStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING"
}

export const therapistSchema = z.object({
  userId: z.string().uuid("Please select a user."),
  disciplines: z.string().min(1, "Please enter disciplines."),
  licenseNumber: z.string().min(1, "Please enter a license number."),
  medicaidNationalProviderId: z.coerce.number({
    required_error: "Please enter a Medicaid National Provider ID.",
    invalid_type_error: "Medicaid National Provider ID must be a number."
  }),
  socialSecurity: z.string().min(1, "Please enter a Social Security number."),
  stateMedicaidProviderId: z.coerce.number({
    required_error: "Please enter a State Medicaid Provider ID.",
    invalid_type_error: "State Medicaid Provider ID must be a number."
  }),
  status: z.nativeEnum(TherapistStatus, {
    errorMap: () => ({ message: "Please select a status." }),
  })
});

export type therapistSchemaValues = z.infer<typeof therapistSchema>;