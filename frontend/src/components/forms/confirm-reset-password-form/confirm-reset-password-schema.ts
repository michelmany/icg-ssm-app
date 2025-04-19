import { z } from "zod";

export const confirmResetPasswordSchema = z
  .object({
    email: z.string().email("Please enter a valid email address."),
    newPassword: z
      .string()
      .min(8, "Your password must be at least 8 characters long."), // TODO: add more validation
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "The passwords don't match.",
    path: ["confirmNewPassword"],
  });

export type confirmResetPasswordSchemaValues = z.infer<
  typeof confirmResetPasswordSchema
>;
