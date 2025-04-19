import { SecurityLevel, Status } from "@/types/users";
import { z } from "zod";
import validator from "validator";

export const userSchema = z.object({
  firstName: z.string().nonempty("Please enter a first name."),
  lastName: z.string().nonempty("Please enter a last name."),
  email: z.string().email("Please enter a valid email."),
  securityLevel: z.nativeEnum(SecurityLevel),
  schoolId: z.string().uuid(),
  roleId: z.string().uuid(),
  phoneNumber: z
    .string()
    .refine(validator.isMobilePhone, "Please enter a valid phone number.")
    .nullable(),
  status: z.nativeEnum(Status),
});

export type userSchemaValues = z.infer<typeof userSchema>;
